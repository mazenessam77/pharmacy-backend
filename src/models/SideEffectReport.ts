import mongoose, { Schema, Document } from 'mongoose';
import { ISideEffectReport } from '../types';

export interface SideEffectReportDocument extends Omit<ISideEffectReport, '_id'>, Document {}

const sideEffectReportSchema = new Schema<SideEffectReportDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medicineName: { type: String, required: true },
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine' },
    condition: { type: String },
    sideEffects: [{ type: String, required: true }],
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'moderate',
    },
    notes: { type: String },
    aiRecommendation: {
      alternatives: [
        {
          name: { type: String, required: true },
          genericName: { type: String },
          reason: { type: String, required: true },
          avoidedSideEffect: { type: String, required: true },
          requiresPrescription: { type: Boolean, default: false },
        },
      ],
      summary: { type: String },
      disclaimer: { type: String },
      generatedAt: { type: Date },
      model: { type: String },
    },
    status: {
      type: String,
      enum: ['pending_ai', 'pending_review', 'approved', 'rejected'],
      default: 'pending_ai',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    doctorNotes: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

sideEffectReportSchema.index({ patientId: 1, createdAt: -1 });
sideEffectReportSchema.index({ status: 1, createdAt: -1 });

export const SideEffectReport = mongoose.model<SideEffectReportDocument>(
  'SideEffectReport',
  sideEffectReportSchema
);
