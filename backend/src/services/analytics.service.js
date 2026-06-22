import { prisma } from '../config/prisma.js';

const num = (v) => Number(v ?? 0);

// Sum a BigInt money column with a Prisma aggregate result.
const sumOf = (agg, field) => num(agg._sum?.[field]);

// High-level KPIs for the dashboard.
export async function getDashboardSummary(organizationId) {
  const [
    revenueAgg,
    outstandingAgg,
    clients,
    products,
    quotes,
    invoiceGroups,
    lowStock,
    recentInvoices,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { organizationId, status: 'succeeded' },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { organizationId, status: { in: ['sent', 'partially_paid', 'overdue', 'viewed'] } },
      _sum: { balanceDue: true },
    }),
    prisma.client.count({ where: { organizationId, archivedAt: null } }),
    prisma.product.count({ where: { organizationId, isActive: true } }),
    prisma.quote.count({ where: { organizationId } }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.product.findMany({
      where: { organizationId, trackInventory: true },
      select: { id: true, name: true, stockQuantity: true, lowStockThreshold: true },
    }),
    prisma.invoice.findMany({
      where: { organizationId, status: { not: 'draft' } },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const invoicesByStatus = invoiceGroups.reduce((acc, g) => {
    acc[g.status] = { count: g._count._all, total: num(g._sum.total) };
    return acc;
  }, {});
  const invoiceCount = invoiceGroups.reduce((n, g) => n + g._count._all, 0);
  const lowStockItems = lowStock.filter((p) => p.stockQuantity <= p.lowStockThreshold);

  return {
    revenue: sumOf(revenueAgg, 'amount'),
    outstanding: sumOf(outstandingAgg, 'balanceDue'),
    counts: {
      clients,
      products,
      invoices: invoiceCount,
      quotes,
      lowStockAlerts: lowStockItems.length,
    },
    invoicesByStatus,
    lowStockItems,
    recentInvoices,
  };
}

// Revenue per month for the last N months (from succeeded payments).
export async function getMonthlyRevenue(organizationId, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: { organizationId, status: 'succeeded', paidAt: { gte: since } },
    select: { amount: true, paidAt: true },
  });

  // Seed all buckets so the chart has no gaps.
  const buckets = new Map();
  for (let i = 0; i < months; i += 1) {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
  }
  for (const p of payments) {
    const d = new Date(p.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + num(p.amount));
  }

  return Array.from(buckets, ([month, revenue]) => ({ month, revenue }));
}

// Top products by invoiced value (from issued invoices' line items).
export async function getProductPerformance(organizationId, limit = 5) {
  const grouped = await prisma.invoiceItem.groupBy({
    by: ['productId'],
    where: { organizationId, productId: { not: null } },
    _sum: { lineTotal: true, quantity: true },
    orderBy: { _sum: { lineTotal: 'desc' } },
    take: limit,
  });

  const ids = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  return grouped.map((g) => ({
    productId: g.productId,
    name: nameById.get(g.productId) || 'Unknown',
    revenue: num(g._sum.lineTotal),
    quantity: num(g._sum.quantity),
  }));
}

// ---- Reports (JSON; the frontend renders/export these) ----

export async function revenueReport(organizationId, { from, to } = {}) {
  const where = { organizationId, status: 'succeeded' };
  if (from || to) {
    where.paidAt = {};
    if (from) where.paidAt.gte = new Date(from);
    if (to) where.paidAt.lte = new Date(to);
  }
  const [agg, byMethod] = await Promise.all([
    prisma.payment.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.payment.groupBy({ by: ['method'], where, _sum: { amount: true } }),
  ]);
  return {
    total: sumOf(agg, 'amount'),
    count: agg._count._all,
    byMethod: byMethod.map((m) => ({ method: m.method, total: num(m._sum.amount) })),
  };
}

export async function clientReport(organizationId) {
  const grouped = await prisma.invoice.groupBy({
    by: ['clientId'],
    where: { organizationId, status: { not: 'draft' } },
    _sum: { total: true, amountPaid: true, balanceDue: true },
    _count: { _all: true },
  });
  const clients = await prisma.client.findMany({
    where: { organizationId },
    select: { id: true, name: true },
  });
  const nameById = new Map(clients.map((c) => [c.id, c.name]));
  return grouped
    .map((g) => ({
      clientId: g.clientId,
      name: nameById.get(g.clientId) || 'Unknown',
      invoices: g._count._all,
      billed: num(g._sum.total),
      paid: num(g._sum.amountPaid),
      outstanding: num(g._sum.balanceDue),
    }))
    .sort((a, b) => b.billed - a.billed);
}

export async function inventoryReport(organizationId) {
  const products = await prisma.product.findMany({
    where: { organizationId, trackInventory: true },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      lowStockThreshold: true,
      unitPrice: true,
      currency: true,
    },
    orderBy: { stockQuantity: 'asc' },
  });
  return products.map((p) => ({
    ...p,
    unitPrice: num(p.unitPrice),
    lowStock: p.stockQuantity <= p.lowStockThreshold,
  }));
}
