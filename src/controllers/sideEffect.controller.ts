import { Request, Response } from 'express';
import { SideEffectReport } from '../models/SideEffectReport';
import { Medicine } from '../models/Medicine';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getPagination } from '../utils/helpers';
import {
  ERROR_CODES,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
} from '../utils/constants';
import { generateAlternativeRecommendation } from '../services/medicine-ai.service';
import { createNotification } from '../services/notification.service';

export const createSideEffectReport = asyncHandler(async (req: Request, res: Response) => {
  const { medicineName, medicineId, condition, sideEffects, severity, notes } = req.body;
  const patientId = req.user!._id;

  if (!medicineName || !Array.isArray(sideEffects) || sideEffects.length === 0) {
    throw new AppError(
      'medicineName and at least one side effect are required.',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const report = await SideEffectReport.create({
    patientId,
    medicineName,
    medicineId,
    condition,
    sideEffects,
    severity: severity || 'moderate',
    notes,
    status: 'pending_ai',
  });

  // Fetch known medicines from DB to bias the AI toward what we actually carry
  const knownMedicines = await Medicine.find({ isActive: true })
    .select('name')
    .limit(100)
    .lean();

  try {
    const recommendation = await generateAlternativeRecommendation({
      medicineName,
      sideEffects,
      severity: severity || 'moderate',
      condition,
      notes,
      knownMedicines: knownMedicines.map((m) => m.name),
    });

    report.aiRecommendation = recommendation;
    report.status = 'pending_review';
    await report.save();
  } catch (err) {
    report.status = 'pending_review';
    report.doctorNotes = `AI recommendation failed: ${(err as Error).message}`;
    await report.save();
  }

  res.status(201).json({
    success: true,
    data: report,
  });
});

export const getMySideEffectReports = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const filter = { patientId: req.user!._id };

  const [reports, total] = await Promise.all([
    SideEffectReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SideEffectReport.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: reports,
    pagination: getPagination(page, limit, total),
  });
});

export const getSideEffectReportById = asyncHandler(async (req: Request, res: Response) => {
  const report = await SideEffectReport.findById(req.params.id)
    .populate('patientId', 'name email phone')
    .populate('reviewedBy', 'name email');

  if (!report) {
    throw new AppError(
      'Side effect report not found.',
      404,
      ERROR_CODES.SIDE_EFFECT_REPORT_NOT_FOUND
    );
  }

  // Patients can only see their own reports
  if (
    req.user!.role === 'patient' &&
    report.patientId._id.toString() !== req.user!._id.toString()
  ) {
    throw new AppError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }

  res.json({ success: true, data: report });
});

export const listPendingReports = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin' && req.user!.role !== 'pharmacy') {
    throw new AppError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }

  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const status = (req.query.status as string) || 'pending_review';
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (status !== 'all') filter.status = status;

  const [reports, total] = await Promise.all([
    SideEffectReport.find(filter)
      .populate('patientId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SideEffectReport.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: reports,
    pagination: getPagination(page, limit, total),
  });
});

export const reviewSideEffectReport = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin' && req.user!.role !== 'pharmacy') {
    throw new AppError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }

  const { decision, doctorNotes } = req.body;
  if (decision !== 'approved' && decision !== 'rejected') {
    throw new AppError(
      'decision must be "approved" or "rejected".',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const report = await SideEffectReport.findById(req.params.id);
  if (!report) {
    throw new AppError(
      'Side effect report not found.',
      404,
      ERROR_CODES.SIDE_EFFECT_REPORT_NOT_FOUND
    );
  }

  report.status = decision;
  report.reviewedBy = req.user!._id;
  report.reviewedAt = new Date();
  if (doctorNotes) report.doctorNotes = doctorNotes;
  await report.save();

  await createNotification({
    userId: report.patientId,
    type: 'system',
    title:
      decision === 'approved'
        ? 'Alternative medicine suggestion approved'
        : 'Side effect report reviewed',
    body:
      decision === 'approved'
        ? 'A pharmacist reviewed your report and approved the suggested alternatives.'
        : 'A pharmacist reviewed your report. Please check the notes.',
    data: { reportId: report._id.toString() },
  });

  res.json({ success: true, data: report });
});

export const regenerateAIRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const report = await SideEffectReport.findById(req.params.id);
  if (!report) {
    throw new AppError(
      'Side effect report not found.',
      404,
      ERROR_CODES.SIDE_EFFECT_REPORT_NOT_FOUND
    );
  }

  if (
    req.user!.role === 'patient' &&
    report.patientId.toString() !== req.user!._id.toString()
  ) {
    throw new AppError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }

  const knownMedicines = await Medicine.find({ isActive: true })
    .select('name')
    .limit(100)
    .lean();

  try {
    const recommendation = await generateAlternativeRecommendation({
      medicineName: report.medicineName,
      sideEffects: report.sideEffects,
      severity: report.severity,
      condition: report.condition,
      notes: report.notes,
      knownMedicines: knownMedicines.map((m) => m.name),
    });

    report.aiRecommendation = recommendation;
    report.status = 'pending_review';
    await report.save();
  } catch (err) {
    throw new AppError(
      `AI recommendation failed: ${(err as Error).message}`,
      500,
      ERROR_CODES.AI_RECOMMENDATION_FAILED
    );
  }

  res.json({ success: true, data: report });
});
