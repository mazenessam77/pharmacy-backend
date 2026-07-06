import { z } from 'zod';

// ── Presigned S3 upload (presign → browser PUT → complete) ──
export const presignUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export const completeUploadSchema = z.object({
  // Server-generated key returned by /presign; ownership of the
  // prescriptions/<patientId>/ prefix is enforced in the controller.
  s3Key: z.string().min(1).max(300),
});
