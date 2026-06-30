import mongoose, { Schema, Document } from 'mongoose';
import { IDriver } from '../types';

export interface DriverDocument extends Omit<IDriver, '_id'>, Document {}

const driverSchema = new Schema<DriverDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    photoUrl: { type: String },
    vehicleType: { type: String, required: true },
    vehiclePlate: { type: String, required: true },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    status: {
      type: String,
      enum: ['online', 'offline', 'on_delivery'],
      default: 'offline',
    },
  },
  { timestamps: true }
);

driverSchema.index({ userId: 1 });
driverSchema.index({ status: 1 });

export const Driver = mongoose.model<DriverDocument>('Driver', driverSchema);
