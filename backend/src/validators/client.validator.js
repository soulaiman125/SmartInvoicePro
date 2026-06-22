import { z } from 'zod';

const addressSchema = z
  .object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    countryCode: z.string().length(2).optional(),
  })
  .partial();

const base = {
  type: z.enum(['individual', 'company']).default('company'),
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  taxId: z.string().max(60).optional(),
  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),
  preferredCurrency: z.string().length(3).toUpperCase().optional(),
  preferredLanguage: z.string().max(10).optional(),
  notes: z.string().max(2000).optional(),
};

export const createClientSchema = {
  body: z.object(base),
};

export const updateClientSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object(base).partial(),
};
