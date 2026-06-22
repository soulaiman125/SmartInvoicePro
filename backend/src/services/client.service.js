import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildPage } from '../utils/pagination.js';

export async function listClients(organizationId, query) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.includeArchived !== 'true') {
    where.archivedAt = null;
  }

  const [data, total] = await Promise.all([
    prisma.client.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.client.count({ where }),
  ]);

  return buildPage({ data, total, page, pageSize });
}

export async function getClient(organizationId, id) {
  const client = await prisma.client.findFirst({ where: { id, organizationId } });
  if (!client) throw ApiError.notFound('Client not found');
  return client;
}

export async function createClient(organizationId, dto) {
  return prisma.client.create({ data: { ...dto, organizationId } });
}

export async function updateClient(organizationId, id, dto) {
  await getClient(organizationId, id);
  return prisma.client.update({ where: { id }, data: dto });
}

// Clients with invoices are archived rather than hard-deleted (BR-7).
export async function deleteClient(organizationId, id) {
  await getClient(organizationId, id);
  const invoiceCount = await prisma.invoice.count({ where: { organizationId, clientId: id } });

  if (invoiceCount > 0) {
    return prisma.client.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  await prisma.client.delete({ where: { id } });
  return null;
}
