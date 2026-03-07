import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('patient'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    phone: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
  z.object({
    role: z.literal('pharmacy'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    phone: z.string().optional(),
    pharmacyName: z.string().min(2, 'Pharmacy name is required'),
    license: z.string().min(2, 'License number is required'),
    address: z.string().min(2, 'Address is required'),
    lat: z.number({ required_error: 'Location is required' }),
    lng: z.number({ required_error: 'Location is required' }),
    workingHoursOpen: z.string().min(1, 'Opening time is required'),
    workingHoursClose: z.string().min(1, 'Closing time is required'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
]);

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
