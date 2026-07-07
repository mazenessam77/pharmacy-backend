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
    governorate: { type: String, required: true, default: 'Giza' },
    patientLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [31.2357, 30.0444] },
    },
    status: {
      type: String,
      enum: ['pending', 'offered', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryType: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
    paymentMethod: { type: String, enum: ['cash', 'instapay'], default: 'cash' },
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

// Pharmacy dashboard hot path: orders in a governorate by status, newest first.
// Covers filter + sort (removes the in-memory sort). Name matches the prod index.
orderSchema.index({ governorate: 1, status: 1, createdAt: -1 }, { name: 'gov_status_created' });
// Timeline: ORDER_DELIVERED events are paged on deliveredAt. Partial => only
// delivered orders are indexed (small), and the timeline query is a pure
// index range scan instead of a patient-wide scan + in-memory sort.
orderSchema.index(
  { patientId: 1, deliveredAt: -1 },
  { name: 'patient_delivered', partialFilterExpression: { deliveredAt: { $exists: true } } }
);
// Timeline: ORDER_CANCELLED events are paged on updatedAt, which is stable for
// cancelled orders because 'cancelled' is terminal. Partial => only cancelled.
orderSchema.index(
  { patientId: 1, updatedAt: -1 },
  { name: 'patient_cancelled', partialFilterExpression: { status: 'cancelled' } }
);

export const Order = mongoose.model<OrderDocument>('Order', orderSchema);
