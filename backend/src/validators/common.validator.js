import { z } from 'zod';

export const idParam = {
  params: z.object({ id: z.string().uuid('Invalid id') }),
};

export const roleEnum = z.enum(['owner', 'admin', 'member', 'viewer']);

export const currency = z.string().length(3).toUpperCase();

// A monetary amount in minor units (integer, e.g. cents).
export const minorAmount = z.coerce.number().int().nonnegative();
