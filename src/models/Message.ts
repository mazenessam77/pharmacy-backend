import mongoose, { Schema, Document } from 'mongoose';
import { IMessage } from '../types';

export interface MessageDocument extends Omit<IMessage, '_id'>, Document {}

const messageSchema = new Schema<MessageDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['patient', 'pharmacy'], required: true },
    content: { type: String },
    messageType: { type: String, enum: ['text', 'image', 'alternative'], default: 'text' },
    imageUrl: { type: String },
    alternativeData: {
      originalMedicine: { type: String },
      suggestedMedicine: { type: String },
      suggestedPrice: { type: Number },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ orderId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

export const Message = mongoose.model<MessageDocument>('Message', messageSchema);
