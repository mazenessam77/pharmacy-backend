import mongoose, { Schema, Document } from 'mongoose';
import { IDriverLocation } from '../types';

export interface DriverLocationDocument extends Omit<IDriverLocation, '_id'>, Document {}

/**
 * Sampled GPS history for the "tracking history" feature and analytics.
 * NOT written on every ping — the service samples at GPS_SAMPLE_INTERVAL_MS.
 * A TTL index auto-expires fixes so this high-churn collection stays bounded.
 */
const driverLocationSchema = new Schema<DriverLocationDocument>(
  {
    deliveryId: { type: Schema.Types.ObjectId, ref: 'Delivery', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    point: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    heading: { type: Number },
    speed: { type: Number },
    accuracy: { type: Number },
    recordedAt: { type: Date, required: true },
  },
  { timestamps: false }
);

driverLocationSchema.index({ deliveryId: 1, recordedAt: 1 });
// Auto-expire raw fixes after 24h — history is for live/recent tracking only.
driverLocationSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 86_400 });

export const DriverLocation = mongoose.model<DriverLocationDocument>(
  'DriverLocation',
  driverLocationSchema
);
