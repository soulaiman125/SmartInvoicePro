import { PrismaClient } from '@prisma/client';

// A single shared Prisma client instance for the whole app.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'warn', 'error'],
});

export default prisma;
