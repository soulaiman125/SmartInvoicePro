import { z } from 'zod';

const fields = {
  category: z.string().min(1).max(80),
  vendor: z.string().max(160).optional(),
  description: z.string().max(500).optional(),
  amount: z.coerce.number().int().nonnegative(), // minor units (cents)
  taxAmount: z.coerce.number().int().nonnegative().default(0),
  currency: z.string().length(3).toUpperCase().default('USD'),
  date: z.coerce.date(),
  reference: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
};

export const createExpenseSchema = {
  body: z.object(fields),
};

export const updateExpenseSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      category: z.string().min(1).max(80).optional(),
      vendor: z.string().max(160).optional(),
      description: z.string().max(500).optional(),
      amount: z.coerce.number().int().nonnegative().optional(),
      taxAmount: z.coerce.number().int().nonnegative().optional(),
      currency: z.string().length(3).toUpperCase().optional(),
      date: z.coerce.date().optional(),
      reference: z.string().max(120).optional(),
      notes: z.string().max(1000).optional(),
    })
    .partial()
    .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' }),
};
