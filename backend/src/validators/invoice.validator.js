import { z } from 'zod';

const lineItem = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().int().nonnegative(),
  taxRateBasisPoints: z.coerce.number().int().min(0).max(100000).default(0),
  discountBasisPoints: z.coerce.number().int().min(0).max(10000).default(0),
});

const base = {
  clientId: z.string().uuid(),
  currency: z.string().length(3).toUpperCase(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  footer: z.string().max(2000).optional(),
  items: z.array(lineItem).min(1, 'An invoice needs at least one line item'),
};

export const createInvoiceSchema = {
  body: z.object(base),
};

export const updateInvoiceSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      clientId: z.string().uuid().optional(),
      currency: z.string().length(3).toUpperCase().optional(),
      issueDate: z.coerce.date().optional(),
      dueDate: z.coerce.date().optional(),
      notes: z.string().max(2000).optional(),
      footer: z.string().max(2000).optional(),
      items: z.array(lineItem).min(1).optional(),
    })
    .partial(),
};

export const cancelInvoiceSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ reason: z.string().max(500).optional() }).optional(),
};
