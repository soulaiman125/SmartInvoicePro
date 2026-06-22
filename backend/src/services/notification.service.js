import { prisma } from '../config/prisma.js';
import { getPagination, buildPage } from '../utils/pagination.js';

// Fan a notification out to every active member of the organization.
// Best-effort: callers wrap this so a failure never breaks the main operation.
export async function notifyOrg(organizationId, type, payload) {
  const members = await prisma.membership.findMany({
    where: { organizationId, status: 'active', userId: { not: null } },
    select: { userId: true },
  });
  if (members.length === 0) return;
  await prisma.notification.createMany({
    data: members.map((m) => ({ organizationId, userId: m.userId, type, payload })),
  });
}

export async function listForUser(organizationId, userId, query) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId, userId };
  if (query.unread === 'true') where.readAt = null;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.notification.count({ where }),
  ]);
  return buildPage({ data, total, page, pageSize });
}

export async function unreadCount(organizationId, userId) {
  const count = await prisma.notification.count({
    where: { organizationId, userId, readAt: null },
  });
  return { count };
}

export async function markRead(organizationId, userId, id) {
  await prisma.notification.updateMany({
    where: { id, organizationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { success: true };
}

export async function markAllRead(organizationId, userId) {
  const res = await prisma.notification.updateMany({
    where: { organizationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: res.count };
}
