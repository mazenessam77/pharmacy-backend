import { z } from 'zod';

export const saveMedicationSchema = z.object({
  medicineId: z.string().min(1, 'medicineId is required'),
  notes: z.string().max(500).optional(),
  reminderFrequency: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
});

export const updateSavedMedicationSchema = z
  .object({
    notes: z.string().max(500).optional(),
    reminderFrequency: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  })
  .refine((d) => d.notes !== undefined || d.reminderFrequency !== undefined, {
    message: 'Provide notes or reminderFrequency to update',
  });
