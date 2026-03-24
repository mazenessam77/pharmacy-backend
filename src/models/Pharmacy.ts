import mongoose, { Schema, Document } from 'mongoose';
import { IPharmacy } from '../types';

export interface PharmacyDocument extends Omit<IPharmacy, '_id'>, Document {}

const pharmacySchema = new Schema<PharmacyDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    pharmacyName: { type: String, required: true, trim: true },
    license: { type: String, required: true },
    licenseImage: { type: String },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    workingHours: {
      open: { type: String },
      close: { type: String },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    governorate: { type: String, required: true, default: 'Giza' },
    isVerified: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: true },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

pharmacySchema.index({ location: '2dsphere' });
pharmacySchema.index({ isVerified: 1, isOpen: 1 });

export const Pharmacy = mongoose.model<PharmacyDocument>('Pharmacy', pharmacySchema);
