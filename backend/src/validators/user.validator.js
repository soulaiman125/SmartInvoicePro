import { z } from 'zod';
import { roleEnum } from './common.validator.js';

export const inviteSchema = {
  body: z.object({
    email: z.string().email(),
    role: roleEnum.default('member'),
    fullName: z.string().min(1).max(120).optional(),
  }),
};

export const updateRoleSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ role: roleEnum }),
};
