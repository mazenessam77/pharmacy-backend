import mongoose, { Schema, Document } from 'mongoose';
import { INotification } from '../types';

export interface NotificationDocument extends Omit<INotification, '_id'>, Document {}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['new_offer', 'order_confirmed', 'order_status', 'new_message', 'new_order', 'medicine_available', 'pharmacy_verified', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model<NotificationDocument>('Notification', notificationSchema);
