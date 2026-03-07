import mongoose, { Schema, Document } from 'mongoose';
import { IReview } from '../types';

export interface ReviewDocument extends Omit<IReview, '_id'>, Document {}

const reviewSchema = new Schema<ReviewDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

reviewSchema.index({ pharmacyId: 1, createdAt: -1 });

export const Review = mongoose.model<ReviewDocument>('Review', reviewSchema);
