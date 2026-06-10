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

// ── Async pipeline (presigned S3 upload → SQS → Lambda) ──
export const presignUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export const completeUploadSchema = z.object({
  // Server-generated key returned by /presign; ownership of the
  // prescriptions/<patientId>/ prefix is enforced in the controller.
  s3Key: z.string().min(1).max(300),
  notes: z.string().max(500).optional(),
});
