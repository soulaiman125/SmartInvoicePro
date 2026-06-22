import { z } from 'zod';

const lineItem = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().int().nonnegative(),
  taxRateBasisPoints: z.coerce.number().int().min(0).max(100000).default(0),
});

const base = {
  clientId: z.string().uuid(),
  currency: z.string().length(3).toUpperCase(),
  issueDate: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  items: z.array(lineItem).min(1, 'A quotation needs at least one line item'),
};

export const createQuotationSchema = {
  body: z.object(base),
};

export const updateQuotationSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      clientId: z.string().uuid().optional(),
      currency: z.string().length(3).toUpperCase().optional(),
      issueDate: z.coerce.date().optional(),
      validUntil: z.coerce.date().optional(),
      items: z.array(lineItem).min(1).optional(),
    })
    .partial(),
};

export const statusSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['sent', 'accepted', 'declined', 'expired']) }),
};
