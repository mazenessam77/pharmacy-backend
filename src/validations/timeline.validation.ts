import { z } from 'zod';

/** GET /timeline query — limit clamped, type whitelisted, cursor opaque
 *  (decoded + strictly validated in the service; bad cursors → 400). */
export const timelineQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(500).optional(),
  type: z.enum(['orders', 'offers', 'prescriptions', 'favorites', 'baskets']).optional(),
});
