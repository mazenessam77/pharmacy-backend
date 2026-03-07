import mongoose, { Schema, Document } from 'mongoose';
import { IInventory } from '../types';

export interface InventoryDocument extends Omit<IInventory, '_id'>, Document {}

const inventorySchema = new Schema<InventoryDocument>(
  {
    pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine' },
    medicineName: { type: String, required: true },
    genericName: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

inventorySchema.index({ pharmacyId: 1, medicineName: 1 }, { unique: true });
inventorySchema.index({ medicineName: 'text' });

export const Inventory = mongoose.model<InventoryDocument>('Inventory', inventorySchema);
