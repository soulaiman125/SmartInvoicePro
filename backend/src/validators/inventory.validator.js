import { z } from 'zod';

export const adjustStockSchema = {
  params: z.object({ productId: z.string().uuid() }),
  body: z.object({
    type: z.enum(['in', 'out', 'adjustment']),
    quantity: z.coerce.number().int(),
    reason: z.string().max(200).optional(),
    reference: z.string().max(120).optional(),
  }),
};

export const productIdParam = {
  params: z.object({ productId: z.string().uuid() }),
};
