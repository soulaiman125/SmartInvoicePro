import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildPage } from '../utils/pagination.js';

const num = (v) => Number(v || 0);

export async function listExpenses(organizationId, query = {}) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId };

  if (query.category) where.category = query.category;
  if (query.search) {
    where.OR = [
      { category: { contains: query.search, mode: 'insensitive' } },
      { vendor: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(query.from);
    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      where.date.lte = to;
    }
  }

  const [data, total] = await Promise.all([
    prisma.expense.findMany({ where, orderBy: { date: 'desc' }, skip, take }),
    prisma.expense.count({ where }),
  ]);

  return buildPage({ data, total, page, pageSize });
}

export async function getExpense(organizationId, id) {
  const expense = await prisma.expense.findFirst({ where: { id, organizationId } });
  if (!expense) throw ApiError.notFound('Expense not found');
  return expense;
}

export async function createExpense(organizationId, dto) {
  return prisma.expense.create({
    data: {
      organizationId,
      category: dto.category,
      vendor: dto.vendor ?? null,
      description: dto.description ?? null,
      amount: BigInt(dto.amount),
      taxAmount: BigInt(dto.taxAmount ?? 0),
      currency: dto.currency || 'USD',
      date: new Date(dto.date),
      reference: dto.reference ?? null,
      notes: dto.notes ?? null,
    },
  });
}

export async function updateExpense(organizationId, id, dto) {
  await getExpense(organizationId, id);
  const data = { ...dto };
  if (dto.amount !== undefined) data.amount = BigInt(dto.amount);
  if (dto.taxAmount !== undefined) data.taxAmount = BigInt(dto.taxAmount);
  if (dto.date !== undefined) data.date = new Date(dto.date);
  return prisma.expense.update({ where: { id }, data });
}

export async function deleteExpense(organizationId, id) {
  await getExpense(organizationId, id);
  await prisma.expense.delete({ where: { id } });
}

// Distinct categories used by the org (for filters / suggestions).
export async function listCategories(organizationId) {
  const rows = await prisma.expense.findMany({
    where: { organizationId },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' },
  });
  return rows.map((r) => r.category).filter(Boolean);
}

// Totals + breakdown by category (optionally within a date range).
export async function expenseSummary(organizationId, query = {}) {
  const where = { organizationId };
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(query.from);
    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      where.date.lte = to;
    }
  }
  const [agg, byCategory] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amount: true, taxAmount: true }, _count: { _all: true } }),
    prisma.expense.groupBy({ by: ['category'], where, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
  ]);
  return {
    total: num(agg._sum.amount) + num(agg._sum.taxAmount),
    net: num(agg._sum.amount),
    tax: num(agg._sum.taxAmount),
    count: agg._count._all,
    byCategory: byCategory.map((g) => ({ category: g.category, total: num(g._sum.amount) })),
  };
}
