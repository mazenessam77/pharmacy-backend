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
    // Async pipeline fields (absent on legacy Cloudinary uploads).
    s3Key: { type: String },
    status: {
      type: String,
      enum: ['UPLOADED', 'QUEUED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REVIEW_REQUIRED'],
    },
    queuedAt: { type: Date },
    processingStartedAt: { type: Date },
    processedAt: { type: Date },
    failedAt: { type: Date },
    errorDetails: { type: String, maxlength: 1000 },
    processingNotes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patientId: 1, createdAt: -1 });
// The Lambda consumer resolves documents by s3Key; sparse because legacy
// (Cloudinary) prescriptions don't have one.
prescriptionSchema.index({ s3Key: 1 }, { sparse: true });

export const Prescription = mongoose.model<PrescriptionDocument>('Prescription', prescriptionSchema);
