import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, verifyPassword, sha256 } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendWelcome } from './email.service.js';

function buildTokens(user, membership) {
  const claims = {
    sub: user.id,
    email: user.email,
    org: membership.organizationId,
    role: membership.role,
  };
  return {
    accessToken: signAccessToken(claims),
    // jti makes every refresh token unique even when issued in the same second,
    // so rotation never collides on the hashed-token unique index.
    refreshToken: signRefreshToken({ sub: user.id, jti: crypto.randomUUID() }),
  };
}

async function persistRefreshToken(userId, refreshToken) {
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: sha256(refreshToken), expiresAt },
  });
}

function publicUser(user) {
  return { id: user.id, email: user.email, fullName: user.fullName };
}

export async function register({ email, password, fullName, organizationName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  const { user, membership } = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: { email, passwordHash, fullName },
    });

    const organization = await tx.organization.create({
      data: { name: organizationName || `${fullName || email}'s workspace` },
    });

    const createdMembership = await tx.membership.create({
      data: {
        organizationId: organization.id,
        userId: createdUser.id,
        role: 'owner',
        status: 'active',
      },
    });

    return { user: createdUser, membership: createdMembership };
  });

  const tokens = buildTokens(user, membership);
  await persistRefreshToken(user.id, tokens.refreshToken);

  // Best-effort welcome email (never blocks registration).
  try {
    await sendWelcome(membership.organizationId, user.email);
  } catch {
    /* ignore email failures */
  }

  return { user: publicUser(user), organizationId: membership.organizationId, ...tokens };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, status: 'active' },
    orderBy: { createdAt: 'asc' },
  });
  if (!membership) {
    throw ApiError.forbidden('User has no active organization membership');
  }

  const tokens = buildTokens(user, membership);
  await persistRefreshToken(user.id, tokens.refreshToken);

  return { user: publicUser(user), organizationId: membership.organizationId, ...tokens };
}

export async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: sha256(refreshToken) },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, status: 'active' },
    orderBy: { createdAt: 'asc' },
  });
  if (!membership) {
    throw ApiError.forbidden('User has no active organization membership');
  }

  // Rotate: revoke the old token and issue a new one.
  const tokens = buildTokens(user, membership);
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(tokens.refreshToken),
        expiresAt: new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  return { user: publicUser(user), organizationId: membership.organizationId, ...tokens };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Revoke every active refresh token for a user (sign out of all sessions, FR-5).
export async function logoutAll(userId) {
  const result = await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return { revokedSessions: result.count };
}

// Step 1 of password reset. Always succeeds from the caller's perspective to
// avoid leaking which emails are registered (FR-3). Returns the raw token only
// in non-production so the flow is testable without an email provider.
export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { devResetToken: null };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.resetTokenTtlMinutes * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: sha256(rawToken), expiresAt },
  });

  // In a real deployment an email with a reset link is sent here.
  return { devResetToken: env.isProd ? null : rawToken };
}

// Step 2 of password reset. Consumes a valid token, updates the password, and
// revokes all existing sessions.
export async function resetPassword(rawToken, newPassword) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(rawToken) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other outstanding reset tokens for this user.
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    // Force re-login everywhere after a password change.
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { success: true };
}

export async function getProfile(userId, organizationId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');

  const membership = await prisma.membership.findFirst({
    where: { userId, organizationId },
  });

  return {
    ...publicUser(user),
    isEmailVerified: user.isEmailVerified,
    role: membership?.role ?? null,
    organizationId,
  };
}
