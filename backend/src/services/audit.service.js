import { prisma } from '../config/prisma.js';
import { getPagination, buildPage } from '../utils/pagination.js';

// Records a single audit entry. Best-effort: auditing must never break the
// operation it is observing.
export async function recordAudit({ organizationId, actorUserId, action, entityType, entityId, metadata }) {
  if (!organizationId || !action) return;
  try {
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorUserId: actorUserId ?? null,
        action,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        metadata: metadata ?? undefined,
      },
    });
  } catch {
    /* swallow — never propagate audit failures */
  }
}

export async function listAuditLogs(organizationId, query = {}) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId };
  if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.auditLog.count({ where }),
  ]);

  // Attach the actor's identity for display.
  const ids = [...new Set(rows.map((r) => r.actorUserId).filter(Boolean))];
  const users = ids.length
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, fullName: true } })
    : [];
  const byId = new Map(users.map((u) => [u.id, u]));

  const data = rows.map((r) => ({ ...r, actor: byId.get(r.actorUserId) || null }));
  return buildPage({ data, total, page, pageSize });
}
