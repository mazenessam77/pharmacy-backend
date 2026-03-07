import mongoose, { Schema, Document } from 'mongoose';
import { IOrder } from '../types';

export interface OrderDocument extends Omit<IOrder, '_id'>, Document {}

const orderSchema = new Schema<OrderDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medicines: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine' },
      },
    ],
    prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
    patientLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'offered', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryType: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
    acceptedPharmacy: { type: Schema.Types.ObjectId, ref: 'Pharmacy' },
    acceptedResponse: { type: Schema.Types.ObjectId, ref: 'OrderResponse' },
    notes: { type: String },
    cancelReason: { type: String },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ patientId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ patientLocation: '2dsphere' });

export const Order = mongoose.model<OrderDocument>('Order', orderSchema);
