import mongoose, { Schema, Document } from 'mongoose';
import { ISavedMedication } from '../types';
import { REMINDER_FREQUENCIES } from '../utils/constants';

export interface SavedMedicationDocument extends Omit<ISavedMedication, '_id'>, Document {}

/**
 * SavedMedication — a patient's favourite / quick-reorder list.
 *
 * Design: a SEPARATE collection (one document per saved item) rather than an
 * embedded array on the User. This avoids an unbounded array (a power user
 * could save thousands of medicines, bloating the User doc and hitting the
 * 16MB BSON limit), keeps writes/deletes atomic per item, and lets us index +
 * paginate the list efficiently.
 */
const savedMedicationSchema = new Schema<SavedMedicationDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    notes: { type: String, maxlength: 500, trim: true },
    reminderFrequency: {
      type: String,
      enum: REMINDER_FREQUENCIES,
      default: 'none',
    },
  },
  { timestamps: true }
);

// Uniqueness: a patient can save a given medicine only ONCE. The unique
// compound index enforces this at the DB level (race-condition safe) — the
// controller catches the E11000 duplicate-key error and returns 409.
savedMedicationSchema.index({ patientId: 1, medicineId: 1 }, { unique: true });

// Query performance: the hot path is "list MY saved meds, newest first".
// This compound index fully covers the filter + sort (no in-memory sort).
savedMedicationSchema.index({ patientId: 1, createdAt: -1 });

export const SavedMedication = mongoose.model<SavedMedicationDocument>(
  'SavedMedication',
  savedMedicationSchema
);
