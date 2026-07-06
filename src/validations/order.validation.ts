import { z } from 'zod';

export const createOrderSchema = z
  .object({
    medicines: z
      .array(
        z.object({
          name: z.string().min(1),
          quantity: z.number().int().min(1).default(1),
          medicineId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid medicine id').optional(),
        })
      )
      .default([]),
    prescriptionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid prescription id').optional(),
    governorate: z.string().min(2),
    deliveryType: z.enum(['delivery', 'pickup']).default('delivery'),
    paymentMethod: z.enum(['cash', 'instapay']),
    notes: z.string().max(500).optional(),
    patientLocation: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  })
  // A prescription-only order is valid — pharmacists read the image and
  // compose the offer themselves. An order with neither is not.
  .refine((data) => data.medicines.length > 0 || !!data.prescriptionId, {
    message: 'Add at least one medicine or attach a prescription.',
    path: ['medicines'],
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
