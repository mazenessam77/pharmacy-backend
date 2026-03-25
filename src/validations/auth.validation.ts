import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  phone: z.string().optional(),
  role: z.enum(['patient', 'pharmacy']),
  // Pharmacy-specific fields
  pharmacyName: z.string().min(2).max(200).optional(),
  license: z.string().optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  address: z.string().optional(),
  workingHours: z
    .object({
      open: z.string().optional(),
      close: z.string().optional(),
    })
    .optional(),
}).refine(
  (data) => {
    if (data.role === 'pharmacy') {
      return !!data.pharmacyName;
    }
    return true;
  },
  { message: 'Pharmacy registration requires pharmacyName.' }
);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(100),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
