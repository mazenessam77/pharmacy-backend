import mongoose, { Schema, Document } from 'mongoose';
import { IOrderResponse } from '../types';

export interface OrderResponseDocument extends Omit<IOrderResponse, '_id'>, Document {}

const orderResponseSchema = new Schema<OrderResponseDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    availableMeds: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 1, min: 1 },
        price: { type: Number, required: true },
        inStock: { type: Boolean, default: true },
      },
    ],
    alternatives: [
      {
        originalName: { type: String },
        alternativeName: { type: String },
        alternativePrice: { type: Number },
      },
    ],
    totalPrice: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    distanceKm: { type: Number },
    estimatedTime: { type: String },
    notes: { type: String, maxlength: 500 },
    // Derived from the per-medicine inStock flags when the pharmacy doesn't
    // set it explicitly (see submitResponse). Legacy offers default to 'full'.
    availability: { type: String, enum: ['full', 'partial', 'none'], default: 'full' },
    status: {
      type: String,
      enum: ['offered', 'accepted', 'rejected', 'expired'],
      default: 'offered',
    },
  },
  { timestamps: true }
);

orderResponseSchema.index({ orderId: 1, pharmacyId: 1 }, { unique: true });

export const OrderResponse = mongoose.model<OrderResponseDocument>('OrderResponse', orderResponseSchema);
