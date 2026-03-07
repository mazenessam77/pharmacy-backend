import { z } from 'zod';

export const sendMessageSchema = z.object({
  orderId: z.string().min(1),
  receiverId: z.string().min(1),
  content: z.string().max(2000).optional(),
  messageType: z.enum(['text', 'image', 'alternative']).default('text'),
  imageUrl: z.string().url().optional(),
  alternativeData: z
    .object({
      originalMedicine: z.string(),
      suggestedMedicine: z.string(),
      suggestedPrice: z.number().min(0),
    })
    .optional(),
}).refine(
  (data) => {
    if (data.messageType === 'text' && !data.content) return false;
    if (data.messageType === 'image' && !data.imageUrl) return false;
    if (data.messageType === 'alternative' && !data.alternativeData) return false;
    return true;
  },
  { message: 'Content must match messageType.' }
);
