import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(1).max(120).optional(),
    organizationName: z.string().min(1).max(120).optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(10),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email(),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(10),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
};

export const updateProfileSchema = {
  body: z
    .object({
      fullName: z.string().min(1).max(120).optional(),
      password: z.string().min(8).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' }),
};
