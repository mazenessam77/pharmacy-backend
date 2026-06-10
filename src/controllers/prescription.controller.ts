import { Request, Response } from 'express';
import { Prescription } from '../models/Prescription';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { uploadToCloudinary } from '../services/upload.service';
import { processPrescriptionImage, processImageFromUrl } from '../services/ocr.service';
import {
  presignPrescriptionUpload,
  prescriptionObjectExists,
  presignPrescriptionView,
  enqueuePrescriptionProcessing,
} from '../services/rxPipeline.service';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';

/**
 * POST /api/prescriptions/presign
 * Step 1 of the async upload: hand the browser a short-lived S3 PUT URL.
 * The key is server-generated under prescriptions/<patientId>/ — the client
 * never chooses where it writes.
 */
export const presignUpload = asyncHandler(async (req: Request, res: Response) => {
  const { contentType } = req.body;
  const { uploadUrl, s3Key } = await presignPrescriptionUpload(
    String(req.user!._id),
    String(contentType)
  );
  res.json({ success: true, data: { uploadUrl, s3Key } });
});

/**
 * POST /api/prescriptions/complete
 * Step 2: after the browser PUT succeeds, create the Prescription document
 * (status UPLOADED) and enqueue the processing job for the Lambda consumer.
 */
export const completeUpload = asyncHandler(async (req: Request, res: Response) => {
  const patientId = String(req.user!._id);
  const s3Key = String(req.body.s3Key);
  const notes = req.body.notes === undefined ? undefined : String(req.body.notes);

  // Ownership: a patient can only register keys under their own prefix.
  if (!s3Key.startsWith(`prescriptions/${patientId}/`)) {
    throw new AppError('Invalid s3Key.', 403, ERROR_CODES.FORBIDDEN);
  }

  // The object must actually exist (the browser really finished its PUT).
  if (!(await prescriptionObjectExists(s3Key))) {
    throw new AppError('Upload not found — PUT the file first.', 404, ERROR_CODES.PRESCRIPTION_NOT_FOUND);
  }

  const prescription = await Prescription.create({
    patientId: req.user!._id,
    imageUrl: `s3://${s3Key}`, // private object; viewing goes through /:id/image
    s3Key,
    status: 'UPLOADED',
    extractedText: '',
    extractedMeds: [],
  });

  try {
    await enqueuePrescriptionProcessing({ patientId, s3Key, notes });
  } catch (err) {
    // Without the queue message the doc would sit UPLOADED forever — undo and
    // let the client retry the whole complete step.
    await Prescription.deleteOne({ _id: prescription._id });
    throw new AppError('Could not queue prescription for processing — please retry.', 503, ERROR_CODES.VALIDATION_ERROR);
  }

  // Reflect that it's now waiting in the queue (the consumer moves it on to
  // PROCESSING/PROCESSED). Best-effort — the doc is already created and queued.
  prescription.status = 'QUEUED';
  prescription.queuedAt = new Date();
  await prescription.save();

  res.status(201).json({ success: true, data: { prescription } });
});

/**
 * POST /api/prescriptions/:id/resubmit
 * Re-queue a FAILED prescription for processing (same S3 object, no re-upload).
 */
export const resubmitPrescription = asyncHandler(async (req: Request, res: Response) => {
  const prescription = await Prescription.findOne({
    _id: String(req.params.id),
    patientId: req.user!._id,
  });

  if (!prescription) {
    throw new AppError('Prescription not found.', 404, ERROR_CODES.PRESCRIPTION_NOT_FOUND);
  }
  if (!prescription.s3Key) {
    throw new AppError('This prescription cannot be reprocessed.', 400, ERROR_CODES.VALIDATION_ERROR);
  }
  if (prescription.status !== 'FAILED') {
    throw new AppError('Only failed prescriptions can be resubmitted.', 409, ERROR_CODES.VALIDATION_ERROR);
  }

  await enqueuePrescriptionProcessing({
    patientId: String(req.user!._id),
    s3Key: prescription.s3Key,
    notes: prescription.processingNotes,
  });

  // Reset to a fresh processing cycle.
  prescription.status = 'QUEUED';
  prescription.queuedAt = new Date();
  prescription.errorDetails = undefined;
  prescription.failedAt = undefined;
  prescription.processingStartedAt = undefined;
  await prescription.save();

  res.json({ success: true, data: { prescription } });
});

/**
 * GET /api/prescriptions/:id/image
 * Redirect to a short-lived presigned GET for the private S3 object
 * (legacy Cloudinary prescriptions redirect to their stored URL).
 */
export const getPrescriptionImage = asyncHandler(async (req: Request, res: Response) => {
  const prescription = await Prescription.findOne({
    _id: String(req.params.id),
    patientId: req.user!._id,
  });

  if (!prescription) {
    throw new AppError('Prescription not found.', 404, ERROR_CODES.PRESCRIPTION_NOT_FOUND);
  }

  const url = prescription.s3Key
    ? await presignPrescriptionView(prescription.s3Key)
    : prescription.imageUrl;
  res.redirect(url);
});

export const uploadPrescription = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No image file provided.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const result = await uploadToCloudinary(req.file.buffer, 'pharmacy-app/prescriptions');

  const prescription = await Prescription.create({
    patientId: req.user!._id,
    imageUrl: result.url,
    extractedText: '',
    extractedMeds: [],
  });

  res.status(201).json({
    success: true,
    data: { prescription },
  });
});

export const scanPrescription = asyncHandler(async (req: Request, res: Response) => {
  let ocrResult;

  if (req.file) {
    // Process uploaded image
    ocrResult = await processPrescriptionImage(req.file.buffer);
  } else if (req.body.imageUrl) {
    // Process from URL
    ocrResult = await processImageFromUrl(req.body.imageUrl);
  } else {
    throw new AppError('Provide an image file or imageUrl.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Save prescription
  const imageUrl = req.body.imageUrl || (req.file ? (await uploadToCloudinary(req.file.buffer, 'pharmacy-app/prescriptions')).url : '');

  const prescription = await Prescription.create({
    patientId: req.user!._id,
    imageUrl,
    extractedText: ocrResult.extractedText,
    extractedMeds: ocrResult.extractedMeds,
  });

  res.status(201).json({
    success: true,
    data: prescription,
  });
});

export const getPrescriptions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [prescriptions, total] = await Promise.all([
    Prescription.find({ patientId: req.user!._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments({ patientId: req.user!._id }),
  ]);

  res.json({
    success: true,
    data: prescriptions,
    pagination: getPagination(page, limit, total),
  });
});

export const getPrescriptionById = asyncHandler(async (req: Request, res: Response) => {
  const prescription = await Prescription.findOne({
    _id: String(req.params.id),
    patientId: req.user!._id,
  });

  if (!prescription) {
    throw new AppError('Prescription not found.', 404, ERROR_CODES.PRESCRIPTION_NOT_FOUND);
  }

  // For S3-backed prescriptions, surface a short-lived presigned GET so the
  // browser can render the original image directly (the stored imageUrl is a
  // private s3:// reference). Legacy Cloudinary URLs pass through unchanged.
  const data = prescription.toObject() as unknown as Record<string, unknown>;
  if (prescription.s3Key) {
    data.imageUrl = await presignPrescriptionView(prescription.s3Key);
  }

  res.json({ success: true, data });
});

export const verifyPrescription = asyncHandler(async (req: Request, res: Response) => {
  const prescription = await Prescription.findOne({
    _id: req.params.id,
    patientId: req.user!._id,
  });

  if (!prescription) {
    throw new AppError('Prescription not found.', 404, ERROR_CODES.PRESCRIPTION_NOT_FOUND);
  }

  // Update with patient-confirmed meds if provided
  if (req.body.extractedMeds) {
    prescription.extractedMeds = req.body.extractedMeds;
  }

  prescription.isVerified = true;
  await prescription.save();

  res.json({
    success: true,
    data: prescription,
  });
});
