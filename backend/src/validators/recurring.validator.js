import { z } from 'zod';

const lineItem = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().int().nonnegative(),
  taxRateBasisPoints: z.coerce.number().int().min(0).max(100000).default(0),
  discountBasisPoints: z.coerce.number().int().min(0).max(10000).default(0),
});

const FREQUENCY = z.enum(['weekly', 'monthly', 'quarterly', 'yearly']);

const base = {
  clientId: z.string().uuid(),
  frequency: FREQUENCY,
  currency: z.string().length(3).toUpperCase().default('USD'),
  items: z.array(lineItem).min(1, 'Add at least one line item'),
  notes: z.string().max(2000).optional(),
  footer: z.string().max(2000).optional(),
  dueInDays: z.coerce.number().int().min(0).max(365).default(30),
  autoIssue: z.coerce.boolean().default(true),
  startDate: z.coerce.date(),
};

export const createRecurringSchema = {
  body: z.object(base),
};

export const updateRecurringSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      clientId: z.string().uuid().optional(),
      frequency: FREQUENCY.optional(),
      currency: z.string().length(3).toUpperCase().optional(),
      items: z.array(lineItem).min(1).optional(),
      notes: z.string().max(2000).optional(),
      footer: z.string().max(2000).optional(),
      dueInDays: z.coerce.number().int().min(0).max(365).optional(),
      autoIssue: z.coerce.boolean().optional(),
      startDate: z.coerce.date().optional(),
    })
    .partial()
    .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' }),
};
