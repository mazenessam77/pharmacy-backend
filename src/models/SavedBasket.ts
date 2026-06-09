import mongoose, { Schema, Document } from 'mongoose';
import { ISavedBasket } from '../types';

export interface SavedBasketDocument extends Omit<ISavedBasket, '_id'>, Document {}

/**
 * SavedBasket — a named, reusable group of medicines a patient can drop into a
 * new request in one click (e.g. "Monthly meds", "Kids first-aid").
 *
 * Items reference the Medicine catalog by id (not free text) so the basket
 * always resolves to real catalog entries and the list view can $lookup full
 * medicine details in a single round-trip. The items array is intentionally
 * small/bounded (one basket = a handful of meds), so embedding it is fine —
 * unlike the saved-medications list, which is a separate collection.
 */
const savedBasketItemSchema = new Schema(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const savedBasketSchema = new Schema<SavedBasketDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    items: { type: [savedBasketItemSchema], default: [] },
  },
  { timestamps: true, collection: 'saved_baskets' }
);

// Hot path: "list MY baskets, newest first". This compound index fully covers
// the filter + sort (no in-memory sort), matching { user, created_at desc }.
savedBasketSchema.index({ patientId: 1, createdAt: -1 });

export const SavedBasket = mongoose.model<SavedBasketDocument>('SavedBasket', savedBasketSchema);
