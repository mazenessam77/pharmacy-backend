import { z } from 'zod';

export const createOrderSchema = z.object({
  medicines: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().int().min(1).default(1),
        medicineId: z.string().optional(),
      })
    )
    .min(1),
  prescriptionId: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  deliveryType: z.enum(['delivery', 'pickup']).default('delivery'),
  notes: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  cancelReason: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['preparing', 'out_for_delivery', 'delivered']),
});

export const createOrderResponseSchema = z.object({
  availableMeds: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        inStock: z.boolean().default(true),
      })
    )
    .min(1),
  alternatives: z
    .array(
      z.object({
        originalName: z.string(),
        alternativeName: z.string(),
        alternativePrice: z.number().min(0),
      })
    )
    .optional()
    .default([]),
  totalPrice: z.number().min(0),
  deliveryFee: z.number().min(0).default(0),
  estimatedTime: z.string().optional(),
});
