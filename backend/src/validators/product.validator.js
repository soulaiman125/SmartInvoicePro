import { z } from 'zod';

const base = {
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().max(60).optional(),
  imageUrl: z.string().max(2000).optional(),
  unitPrice: z.coerce.number().int().nonnegative().default(0),
  currency: z.string().length(3).toUpperCase(),
  taxRateId: z.string().uuid().optional(),
  unit: z.enum(['unit', 'hour', 'day', 'item']).default('unit'),
  category: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  trackInventory: z.boolean().default(false),
  stockQuantity: z.coerce.number().int().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(0),
};

export const createProductSchema = {
  body: z.object(base),
};

export const updateProductSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object(base).partial(),
};
