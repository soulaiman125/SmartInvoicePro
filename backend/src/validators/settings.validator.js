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

export const updateSettingsSchema = {
  body: z
    .object({
      name: z.string().min(1).max(200).optional(),
      legalTaxId: z.string().max(60).optional(),
      countryCode: z.string().length(2).optional(),
      baseCurrency: z.string().length(3).toUpperCase().optional(),
      // Allows either a hosted URL or an embedded base64 data URI (logo upload).
      logoUrl: z.string().max(3_000_000).optional(),
      address: addressSchema.optional(),
      defaultPaymentTermsDays: z.coerce.number().int().min(0).max(365).optional(),
      timezone: z.string().max(60).optional(),
      settings: z.record(z.string(), z.any()).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' }),
};
