import { z } from 'zod';

export const saveMedicationSchema = z
  .object({
    // Save by catalog id (medicine card) OR by name (e.g. from a past order,
    // whose medicines are stored as free-text names).
    medicineId: z.string().min(1).optional(),
    name: z.string().min(1).max(200).optional(),
    notes: z.string().max(500).optional(),
    reminderFrequency: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  })
  .refine((d) => !!d.medicineId || !!d.name, {
    message: 'Provide either medicineId or name',
  });

export const updateSavedMedicationSchema = z
  .object({
    notes: z.string().max(500).optional(),
    reminderFrequency: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  })
  .refine((d) => d.notes !== undefined || d.reminderFrequency !== undefined, {
    message: 'Provide notes or reminderFrequency to update',
  });
