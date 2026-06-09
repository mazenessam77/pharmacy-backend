import { Request, Response } from 'express';
import { SavedMedication } from '../models/SavedMedication';
import { Medicine } from '../models/Medicine';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../utils/constants';

// Medicine fields surfaced to the patient on the saved list.
// NB: the Medicine model has no price/image — price is pharmacy-specific
// (Inventory / pharmacy offers), so it is resolved at order time, not here.
const MEDICINE_FIELDS = 'name genericName category requiresPrescription description isActive';

/**
 * POST /api/medications/saved
 * Save a medication to the logged-in patient's list.
 */
export const saveMedication = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.user!._id;
  const { medicineId, notes, reminderFrequency } = req.body;

  // The medicine must exist (and we surface a clean 404 instead of a cast error).
  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    throw new AppError('Medicine not found.', 404, ERROR_CODES.MEDICINE_NOT_FOUND);
  }

  try {
    const saved = await SavedMedication.create({ patientId, medicineId, notes, reminderFrequency });
    await saved.populate('medicineId', MEDICINE_FIELDS);
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    // Unique index (patientId + medicineId) violated => already saved.
    if (err?.code === 11000) {
      throw new AppError(
        'This medication is already in your saved list.',
        409,
        ERROR_CODES.SAVED_MEDICATION_EXISTS
      );
    }
    throw err;
  }
});

/**
 * GET /api/medications/saved
 * List the logged-in patient's saved medications with full medicine details
 * populated in a single query (covered by the {patientId, createdAt} index).
 */
export const getSavedMedications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit as string) || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = (page - 1) * limit;
  const patientId = req.user!._id;

  const [items, total] = await Promise.all([
    SavedMedication.find({ patientId })
      .populate('medicineId', MEDICINE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SavedMedication.countDocuments({ patientId }),
  ]);

  // Defensive: drop any entries whose referenced medicine was deleted.
  const data = items.filter((item) => item.medicineId);

  res.json({ success: true, data, pagination: getPagination(page, limit, total) });
});

/**
 * PATCH /api/medications/saved/:id
 * Update notes / reminder cadence on a saved item (ownership enforced).
 */
export const updateSavedMedication = asyncHandler(async (req: Request, res: Response) => {
  const { notes, reminderFrequency } = req.body;
  const update: Record<string, unknown> = {};
  if (notes !== undefined) update.notes = notes;
  if (reminderFrequency !== undefined) update.reminderFrequency = reminderFrequency;

  const saved = await SavedMedication.findOneAndUpdate(
    { _id: req.params.id, patientId: req.user!._id }, // ownership: only the owner's doc matches
    update,
    { new: true, runValidators: true }
  ).populate('medicineId', MEDICINE_FIELDS);

  if (!saved) {
    throw new AppError('Saved medication not found.', 404, ERROR_CODES.SAVED_MEDICATION_NOT_FOUND);
  }

  res.json({ success: true, data: saved });
});

/**
 * DELETE /api/medications/saved/:id
 * Remove a saved item. Ownership is enforced by scoping the query to the
 * authenticated patient — another user's id simply won't match (404).
 */
export const deleteSavedMedication = asyncHandler(async (req: Request, res: Response) => {
  const saved = await SavedMedication.findOneAndDelete({
    _id: req.params.id,
    patientId: req.user!._id,
  });

  if (!saved) {
    throw new AppError('Saved medication not found.', 404, ERROR_CODES.SAVED_MEDICATION_NOT_FOUND);
  }

  res.json({ success: true, data: { _id: saved._id } });
});
