import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildPage } from '../utils/pagination.js';

export async function listProducts(organizationId, query) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.category) where.category = query.category;
  if (query.activeOnly === 'true') where.isActive = true;

  const [data, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.product.count({ where }),
  ]);

  return buildPage({ data, total, page, pageSize });
}

export async function getProduct(organizationId, id) {
  const product = await prisma.product.findFirst({ where: { id, organizationId } });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

// Distinct, non-empty categories used by the org (for filters / suggestions).
export async function listCategories(organizationId) {
  const rows = await prisma.product.findMany({
    where: { organizationId, category: { not: null } },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' },
  });
  return rows.map((r) => r.category).filter(Boolean);
}

export async function createProduct(organizationId, dto) {
  const { unitPrice, ...rest } = dto;
  return prisma.product.create({
    data: { ...rest, organizationId, unitPrice: BigInt(unitPrice ?? 0) },
  });
}

export async function updateProduct(organizationId, id, dto) {
  await getProduct(organizationId, id);
  const data = { ...dto };
  if (dto.unitPrice !== undefined) data.unitPrice = BigInt(dto.unitPrice);
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(organizationId, id) {
  await getProduct(organizationId, id);
  // Soft-disable to preserve historical invoice line references.
  return prisma.product.update({ where: { id }, data: { isActive: false } });
}
