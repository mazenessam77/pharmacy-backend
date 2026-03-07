import mongoose, { Schema, Document } from 'mongoose';
import { IMedicine } from '../types';

export interface MedicineDocument extends Omit<IMedicine, '_id'>, Document {}

const medicineSchema = new Schema<MedicineDocument>(
  {
    name: { type: String, required: true },
    genericName: { type: String },
    category: { type: String },
    requiresPrescription: { type: Boolean, default: false },
    description: { type: String },
    alternatives: [{ type: Schema.Types.ObjectId, ref: 'Medicine' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

medicineSchema.index({ name: 'text', genericName: 'text' });
medicineSchema.index({ name: 1 });

export const Medicine = mongoose.model<MedicineDocument>('Medicine', medicineSchema);
