import { z } from 'zod';

export const scanPrescriptionSchema = z.object({
  imageUrl: z.string().url().optional(),
});

export const verifyPrescriptionSchema = z.object({
  extractedMeds: z
    .array(
      z.object({
        name: z.string().min(1),
        confidence: z.number().min(0).max(1),
      })
    )
    .optional(),
});
