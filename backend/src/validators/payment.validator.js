import { z } from 'zod';

export const recordPaymentSchema = {
  params: z.object({ invoiceId: z.string().uuid() }),
  body: z.object({
    amount: z.coerce.number().int().positive(),
    method: z.enum(['card', 'paypal', 'bank_transfer', 'cash', 'cheque', 'other']),
    currency: z.string().length(3).toUpperCase().optional(),
    gateway: z.enum(['stripe', 'paypal', 'manual']).optional(),
    gatewayPaymentId: z.string().max(200).optional(),
    reference: z.string().max(200).optional(),
    paidAt: z.coerce.date().optional(),
  }),
};

export const listPaymentsSchema = {
  query: z.object({
    invoiceId: z.string().uuid().optional(),
    status: z.enum(['pending', 'succeeded', 'failed', 'refunded']).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
  }),
};
