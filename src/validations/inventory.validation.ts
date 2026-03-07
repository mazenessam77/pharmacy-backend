import { z } from 'zod';

export const addInventorySchema = z.object({
  medicineName: z.string().min(1).max(200),
  genericName: z.string().max(200).optional(),
  price: z.number().min(0),
  quantity: z.number().int().min(0).default(0),
  medicineId: z.string().optional(),
});

export const updateInventorySchema = z.object({
  price: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
});
