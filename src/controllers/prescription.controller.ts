import { Request, Response } from 'express';
import { Prescription } from '../models/Prescription';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { uploadToCloudinary } from '../services/upload.service';
import { processPrescriptionImage, processImageFromUrl } from '../services/ocr.service';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';

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
    _id: req.params.id,
    patientId: req.user!._id,
  });

  if (!prescription) {
    throw new AppError('Prescription not found.', 404, ERROR_CODES.PRESCRIPTION_NOT_FOUND);
  }

  res.json({
    success: true,
    data: prescription,
  });
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
