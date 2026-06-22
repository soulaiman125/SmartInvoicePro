import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'change-me-refresh-secret',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7,
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES) || 60,
  databaseUrl: process.env.DATABASE_URL,

  // Public URL of the SPA, used to build links inside emails / portal.
  appUrl: process.env.APP_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Email delivery. When SMTP_HOST is set, real mail is sent; otherwise a
  // dev/preview transport is used (no credentials needed) and every message is
  // still recorded in the EmailLog table.
  mail: {
    from: process.env.MAIL_FROM || 'SmartInvoice Pro <no-reply@smartinvoice.pro>',
    preview: process.env.EMAIL_PREVIEW || 'json', // 'json' | 'ethereal'
    smtp: {
      host: process.env.SMTP_HOST || null,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || null,
      pass: process.env.SMTP_PASS || null,
    },
  },

  // Days a generated customer-portal link stays valid (0 = never expires).
  portalTokenTtlDays: Number(process.env.PORTAL_TOKEN_TTL_DAYS) || 90,
};

// Production safety check: refuse to boot with insecure default secrets, and
// warn about risky CORS. Called from server startup. No-op outside production.
export function validateProductionEnv() {
  if (!env.isProd) return;
  const insecure = [];
  if (!env.jwtSecret || env.jwtSecret === 'change-me-in-production') insecure.push('JWT_SECRET');
  if (!env.refreshSecret || env.refreshSecret === 'change-me-refresh-secret') insecure.push('REFRESH_TOKEN_SECRET');
  if (insecure.length) {
    throw new Error(
      `Refusing to start: set strong values for ${insecure.join(', ')} in production.`,
    );
  }
  if (!env.databaseUrl) throw new Error('Refusing to start: DATABASE_URL is required in production.');
  if (!process.env.CLIENT_ORIGIN || env.clientOrigin === '*') {
    // eslint-disable-next-line no-console
    console.warn('[warn] CLIENT_ORIGIN is not restricted — set it to your frontend URL for safe CORS.');
  }
}
