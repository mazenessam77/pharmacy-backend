import mongoose, { Schema, Document } from 'mongoose';
import { IPrescription } from '../types';

export interface PrescriptionDocument extends Omit<IPrescription, '_id'>, Document {}

const prescriptionSchema = new Schema<PrescriptionDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    extractedText: { type: String },
    extractedMeds: [
      {
        name: { type: String },
        confidence: { type: Number, min: 0, max: 1 },
      },
    ],
    isVerified: { type: Boolean, default: false },
    doctorName: { type: String },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patientId: 1, createdAt: -1 });

export const Prescription = mongoose.model<PrescriptionDocument>('Prescription', prescriptionSchema);
