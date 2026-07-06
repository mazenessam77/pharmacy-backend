import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Prescription, PrescriptionDocument } from '../models/Prescription';
import { Order } from '../models/Order';
import { Pharmacy } from '../models/Pharmacy';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { uploadToCloudinary } from '../services/upload.service';
import {
  presignPrescriptionUpload,
  prescriptionObjectExists,
  presignPrescriptionView,
} from '../services/rxPipeline.service';
import { getPagination } from '../utils/helpers';
import { logger } from '../utils/logger';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';

/**
 * Object-level authorization for viewing a single prescription.
 *
 * Patient: only their own. Missing and not-theirs are both a 404 so
 * existence is never revealed.
 *
 * Pharmacy: only when an order carrying this prescription was distributed to
 * them — same governorate while the order is still open (pending/offered),
 * or they are the pharmacy the patient confirmed. Every denial is a uniform
 * 403 (no existence leak) and is logged.
 */
const loadViewablePrescription = async (req: Request): Promise<PrescriptionDocument> => {
  const id = String(req.params.id);
  const requester = req.user!;

  if (requester.role === 'patient') {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Prescription not found.', 404, ERROR_CODES.PRESCRIPTION_NOT_FOUND);
    }
    const prescription = await Prescription.findOne({ _id: id, patientId: requester._id });
    if (!prescription) {
      throw new AppError('Prescription not found.', 404, ERROR_CODES.PRESCRIPTION_NOT_FOUND);
    }
    return prescription;
  }

  const deny = (reason: string): never => {
    logger.warn('Unauthorized prescription access attempt', {
      prescriptionId: id,
      userId: String(requester._id),
      role: requester.role,
      ip: req.ip,
      reason,
    });
    throw new AppError('You do not have access to this prescription.', 403, ERROR_CODES.FORBIDDEN);
  };

  if (!mongoose.isValidObjectId(id)) {
    return deny('invalid id');
  }

  const pharmacy = await Pharmacy.findOne({ userId: requester._id }, { _id: 1, governorate: 1 }).lean();
  if (!pharmacy) {
    return deny('no pharmacy profile');
  }

  const distributed = await Order.exists({
    prescriptionId: id,
    $or: [
      { acceptedPharmacy: pharmacy._id },
      { governorate: pharmacy.governorate, status: { $in: ['pending', 'offered'] } },
    ],
  });
  if (!distributed) {
    return deny('no distributed order');
  }

  // Only what the pharmacy-facing responses expose — never the patient
  // reference, extracted text, or pipeline internals.
  const prescription = await Prescription.findById(id).select('imageUrl s3Key doctorName createdAt');
  if (!prescription) {
    return deny('dangling order reference');
  }
  return prescription;
};

/**
 * POST /api/prescriptions/presign
 * Step 1 of the upload: hand the browser a short-lived S3 PUT URL.
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
 * Step 2: after the browser PUT succeeds, create the Prescription document in
 * REVIEW_REQUIRED — there is no automated analysis; pharmacists review the
 * image manually when the patient attaches it to an order.
 */
export const completeUpload = asyncHandler(async (req: Request, res: Response) => {
  const patientId = String(req.user!._id);
  const s3Key = String(req.body.s3Key);

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
    status: 'REVIEW_REQUIRED',
    extractedText: '',
    extractedMeds: [],
  });

  res.status(201).json({ success: true, data: { prescription } });
});

/**
 * GET /api/prescriptions/:id/image
 * Redirect to a short-lived presigned GET for the private S3 object
 * (legacy Cloudinary prescriptions redirect to their stored URL).
 */
export const getPrescriptionImage = asyncHandler(async (req: Request, res: Response) => {
  const prescription = await loadViewablePrescription(req);

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
  const prescription = await loadViewablePrescription(req);

  // For S3-backed prescriptions, surface a short-lived presigned GET so the
  // browser can render the original image directly (the stored imageUrl is a
  // private s3:// reference). Legacy Cloudinary URLs pass through unchanged.
  const imageUrl = prescription.s3Key
    ? await presignPrescriptionView(prescription.s3Key)
    : prescription.imageUrl;

  // A pharmacist only needs the image and basic display metadata — never the
  // patient reference, S3 key, or pipeline internals.
  if (req.user!.role === 'pharmacy') {
    return res.json({
      success: true,
      data: {
        _id: prescription._id,
        imageUrl,
        doctorName: prescription.doctorName,
        createdAt: prescription.createdAt,
      },
    });
  }

  const data = prescription.toObject() as unknown as Record<string, unknown>;
  data.imageUrl = imageUrl;

  res.json({ success: true, data });
});
