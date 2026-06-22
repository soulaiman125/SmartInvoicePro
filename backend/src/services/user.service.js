import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';
import { getPagination, buildPage } from '../utils/pagination.js';

const membershipView = (m) => ({
  membershipId: m.id,
  role: m.role,
  status: m.status,
  invitedEmail: m.invitedEmail,
  user: m.user
    ? { id: m.user.id, email: m.user.email, fullName: m.user.fullName }
    : null,
  createdAt: m.createdAt,
});

// List members (users) of an organization.
export async function listMembers(organizationId, query) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId };

  const [rows, total] = await Promise.all([
    prisma.membership.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    }),
    prisma.membership.count({ where }),
  ]);

  return buildPage({ data: rows.map(membershipView), total, page, pageSize });
}

export async function getMember(organizationId, membershipId) {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId },
    include: { user: true },
  });
  if (!membership) throw ApiError.notFound('Member not found');
  return membershipView(membership);
}

// Invite a user by email. If the user already exists they are linked,
// otherwise a pending (invited) membership is created.
export async function inviteMember(organizationId, { email, role }) {
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const existing = await prisma.membership.findFirst({
      where: { organizationId, userId: user.id },
    });
    if (existing) throw ApiError.conflict('User is already a member of this organization');
  }

  const membership = await prisma.membership.create({
    data: {
      organizationId,
      userId: user?.id ?? null,
      role: role ?? 'member',
      status: user ? 'active' : 'invited',
      invitedEmail: user ? null : email,
    },
    include: { user: true },
  });

  return membershipView(membership);
}

// Change a member's role (RBAC management).
export async function updateMemberRole(organizationId, membershipId, role) {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId },
  });
  if (!membership) throw ApiError.notFound('Member not found');

  if (membership.role === 'owner' && role !== 'owner') {
    const owners = await prisma.membership.count({
      where: { organizationId, role: 'owner', status: 'active' },
    });
    if (owners <= 1) throw ApiError.badRequest('An organization must keep at least one owner');
  }

  const updated = await prisma.membership.update({
    where: { id: membership.id },
    data: { role },
    include: { user: true },
  });
  return membershipView(updated);
}

export async function removeMember(organizationId, membershipId, requestingUserId) {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId },
  });
  if (!membership) throw ApiError.notFound('Member not found');
  if (membership.userId === requestingUserId) {
    throw ApiError.badRequest('You cannot remove yourself');
  }
  if (membership.role === 'owner') {
    const owners = await prisma.membership.count({
      where: { organizationId, role: 'owner', status: 'active' },
    });
    if (owners <= 1) throw ApiError.badRequest('Cannot remove the last owner');
  }

  await prisma.membership.delete({ where: { id: membership.id } });
}

// Self-service profile update.
export async function updateProfile(userId, { fullName, password }) {
  const data = {};
  if (fullName !== undefined) data.fullName = fullName;
  if (password) data.passwordHash = await hashPassword(password);

  const user = await prisma.user.update({ where: { id: userId }, data });
  return { id: user.id, email: user.email, fullName: user.fullName };
}
