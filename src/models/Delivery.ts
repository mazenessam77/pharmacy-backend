import mongoose, { Schema, Document } from 'mongoose';
import { IDelivery } from '../types';
import { DELIVERY_STATUSES } from '../utils/constants';

export interface DeliveryDocument extends Omit<IDelivery, '_id'>, Document {}

const pointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false }
);

const deliverySchema = new Schema<DeliveryDocument>(
  {
    // One delivery per order — unique guards against double-assignment races.
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    status: {
      type: String,
      enum: DELIVERY_STATUSES as unknown as string[],
      default: 'assigned',
    },
    pickup: {
      point: { type: pointSchema, required: true },
      address: { type: String },
    },
    dropoff: {
      point: { type: pointSchema, required: true },
      address: { type: String },
    },
    // Route is fetched once and cached (it doesn't change unless we re-route).
    route: {
      polyline: { type: String },
      distanceM: { type: Number },
      durationS: { type: Number },
      fetchedAt: { type: Date },
    },
    // Latest computed ETA — refreshed on a throttle, not per GPS ping.
    eta: {
      seconds: { type: Number },
      distanceM: { type: Number },
      updatedAt: { type: Date },
    },
    // Denormalized latest fix so a snapshot read is a single document.
    lastLocation: {
      lng: { type: Number },
      lat: { type: Number },
      heading: { type: Number },
      speed: { type: Number },
      accuracy: { type: Number },
      recordedAt: { type: Date },
    },
    // Bounded, embedded timeline (~8 entries) — avoids a separate collection/join.
    timeline: [
      {
        _id: false,
        status: { type: String, enum: DELIVERY_STATUSES as unknown as string[] },
        at: { type: Date, default: Date.now },
      },
    ],
    cancelReason: { type: String },
    assignedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

deliverySchema.index({ patientId: 1, createdAt: -1 });
deliverySchema.index({ driverId: 1, status: 1 });

export const Delivery = mongoose.model<DeliveryDocument>('Delivery', deliverySchema);
