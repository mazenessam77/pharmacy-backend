import { z } from 'zod';

// A single line in a basket: a catalog medicine id + how many.
const basketItemSchema = z.object({
  medicineId: z.string().min(1, 'medicineId is required'),
  quantity: z.number().int().min(1).max(99).optional(),
});

export const createBasketSchema = z.object({
  name: z.string().min(1, 'name is required').max(100),
  items: z.array(basketItemSchema).min(1, 'A basket needs at least one item').max(50),
});

export const updateBasketSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    items: z.array(basketItemSchema).min(1).max(50).optional(),
  })
  .refine((d) => d.name !== undefined || d.items !== undefined, {
    message: 'Provide name or items to update',
  });
