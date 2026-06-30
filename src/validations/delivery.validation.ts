import { z } from 'zod';
import { objectIdSchema } from '../utils/objectId';

/** `:orderId` route param — must be a valid ObjectId before any query. */
export const orderIdParamSchema = z.object({
  orderId: objectIdSchema,
});

export const assignDriverSchema = z.object({
  driverId: objectIdSchema,
});

/** A single GPS fix. Ranges reject obviously bogus / spoofed values. */
export const gpsFixSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).max(120).optional(), // m/s — generous upper bound
  accuracy: z.number().min(0).optional(),
  recordedAt: z.coerce.date().optional(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['picked_up', 'in_transit', 'nearby', 'delivered', 'cancelled']),
  reason: z.string().max(500).optional(),
});

export type GpsFixInput = z.infer<typeof gpsFixSchema>;
