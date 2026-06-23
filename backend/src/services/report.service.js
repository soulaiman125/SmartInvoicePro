import { prisma } from '../config/prisma.js';
import { getSettings } from './settings.service.js';

// Each report returns a uniform shape so a single export layer can render it to
// JSON / CSV / XLSX / PDF:
//   { key, title, currency, columns: [{ key, label, type }], rows: [...], summary: [...] }
// Money values in rows are integer minor units; the export layer formats them.

const num = (v) => Number(v || 0);

function parseRange(query = {}) {
  const to = query.to ? new Date(query.to) : new Date();
  let from;
  if (query.from) {
    from = new Date(query.from);
  } else {
    from = new Date(to);
    from.setMonth(from.getMonth() - 11);
    from.setDate(1);
  }
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

async function currencyFor(organizationId) {
  const org = await getSettings(organizationId);
  return org.baseCurrency || 'USD';
}

// ── Revenue (succeeded payments, monthly) ────────────────────────────────────
export async function revenueReport(organizationId, query) {
  const { from, to } = parseRange(query);
  const currency = await currencyFor(organizationId);

  const payments = await prisma.payment.findMany({
    where: { organizationId, status: 'succeeded', paidAt: { gte: from, lte: to } },
    select: { amount: true, paidAt: true, method: true },
  });

  const buckets = new Map();
  const cursor = new Date(from);
  while (cursor <= to) {
    buckets.set(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`, { revenue: 0, count: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  let total = 0;
  for (const p of payments) {
    const d = new Date(p.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = buckets.get(key);
    if (b) {
      b.revenue += num(p.amount);
      b.count += 1;
    }
    total += num(p.amount);
  }

  const rows = Array.from(buckets, ([month, b]) => ({ month, payments: b.count, revenue: b.revenue }));
  return {
    key: 'revenue',
    title: 'Revenue Report',
    currency,
    columns: [
      { key: 'month', label: 'Month', type: 'text' },
      { key: 'payments', label: 'Payments', type: 'number' },
      { key: 'revenue', label: 'Revenue', type: 'money' },
    ],
    rows,
    summary: [{ month: 'Total', payments: payments.length, revenue: total }],
    meta: { from, to },
  };
}

// ── Client revenue ───────────────────────────────────────────────────────────
export async function clientReport(organizationId) {
  const currency = await currencyFor(organizationId);
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

  const rows = grouped
    .map((g) => ({
      name: nameById.get(g.clientId) || 'Unknown',
      invoices: g._count._all,
      billed: num(g._sum.total),
      paid: num(g._sum.amountPaid),
      outstanding: num(g._sum.balanceDue),
    }))
    .sort((a, b) => b.billed - a.billed);

  const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
  return {
    key: 'clients',
    title: 'Client Report',
    currency,
    columns: [
      { key: 'name', label: 'Client', type: 'text' },
      { key: 'invoices', label: 'Invoices', type: 'number' },
      { key: 'billed', label: 'Billed', type: 'money' },
      { key: 'paid', label: 'Paid', type: 'money' },
      { key: 'outstanding', label: 'Outstanding', type: 'money' },
    ],
    rows,
    summary: [{ name: 'Total', invoices: sum('invoices'), billed: sum('billed'), paid: sum('paid'), outstanding: sum('outstanding') }],
  };
}

// ── Product performance ──────────────────────────────────────────────────────
export async function productReport(organizationId) {
  const currency = await currencyFor(organizationId);
  const grouped = await prisma.invoiceItem.groupBy({
    by: ['productId'],
    where: { organizationId, productId: { not: null } },
    _sum: { lineTotal: true, quantity: true },
    orderBy: { _sum: { lineTotal: 'desc' } },
  });
  const ids = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, sku: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const rows = grouped.map((g) => ({
    name: byId.get(g.productId)?.name || 'Unknown',
    sku: byId.get(g.productId)?.sku || '',
    quantity: num(g._sum.quantity),
    revenue: num(g._sum.lineTotal),
  }));
  return {
    key: 'products',
    title: 'Product Performance',
    currency,
    columns: [
      { key: 'name', label: 'Product', type: 'text' },
      { key: 'sku', label: 'SKU', type: 'text' },
      { key: 'quantity', label: 'Qty sold', type: 'number' },
      { key: 'revenue', label: 'Revenue', type: 'money' },
    ],
    rows,
    summary: [{ name: 'Total', sku: '', quantity: rows.reduce((s, r) => s + r.quantity, 0), revenue: rows.reduce((s, r) => s + r.revenue, 0) }],
  };
}

// ── Outstanding invoices (with aging) ────────────────────────────────────────
export async function outstandingReport(organizationId) {
  const currency = await currencyFor(organizationId);
  const invoices = await prisma.invoice.findMany({
    where: { organizationId, status: { in: ['sent', 'viewed', 'partially_paid', 'overdue'] }, balanceDue: { gt: 0 } },
    include: { client: { select: { name: true } } },
    orderBy: { dueDate: 'asc' },
  });
  const today = new Date();
  const rows = invoices.map((i) => {
    const daysOverdue = i.dueDate ? Math.floor((today - new Date(i.dueDate)) / 86400000) : 0;
    return {
      number: i.number || 'Draft',
      client: i.client?.name || '—',
      issueDate: i.issueDate,
      dueDate: i.dueDate,
      total: num(i.total),
      balanceDue: num(i.balanceDue),
      daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
      status: i.status,
    };
  });
  return {
    key: 'outstanding',
    title: 'Outstanding Invoices',
    currency,
    columns: [
      { key: 'number', label: 'Invoice', type: 'text' },
      { key: 'client', label: 'Client', type: 'text' },
      { key: 'dueDate', label: 'Due date', type: 'date' },
      { key: 'daysOverdue', label: 'Days overdue', type: 'number' },
      { key: 'total', label: 'Total', type: 'money' },
      { key: 'balanceDue', label: 'Balance due', type: 'money' },
      { key: 'status', label: 'Status', type: 'text' },
    ],
    rows,
    summary: [{ number: 'Total', client: '', dueDate: null, daysOverdue: '', total: rows.reduce((s, r) => s + r.total, 0), balanceDue: rows.reduce((s, r) => s + r.balanceDue, 0), status: '' }],
  };
}

// ── Payments ledger ──────────────────────────────────────────────────────────
export async function paymentsReport(organizationId, query) {
  const { from, to } = parseRange(query);
  const currency = await currencyFor(organizationId);
  const payments = await prisma.payment.findMany({
    where: { organizationId, createdAt: { gte: from, lte: to } },
    include: { invoice: { select: { number: true, client: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  const rows = payments.map((p) => ({
    date: p.paidAt || p.createdAt,
    invoice: p.invoice?.number || '—',
    client: p.invoice?.client?.name || '—',
    method: p.method,
    status: p.status,
    amount: num(p.amount),
  }));
  const succeeded = rows.filter((r) => r.status === 'succeeded');
  return {
    key: 'payments',
    title: 'Payments Report',
    currency,
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'invoice', label: 'Invoice', type: 'text' },
      { key: 'client', label: 'Client', type: 'text' },
      { key: 'method', label: 'Method', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'money' },
    ],
    rows,
    summary: [{ date: null, invoice: '', client: '', method: '', status: `${succeeded.length} succeeded`, amount: succeeded.reduce((s, r) => s + r.amount, 0) }],
    meta: { from, to },
  };
}

// ── Financial: revenue vs expenses, profit (monthly) ─────────────────────────
export async function financialReport(organizationId, query) {
  const { from, to } = parseRange(query);
  const currency = await currencyFor(organizationId);

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { organizationId, status: 'succeeded', paidAt: { gte: from, lte: to } },
      select: { amount: true, paidAt: true },
    }),
    prisma.expense.findMany({
      where: { organizationId, date: { gte: from, lte: to } },
      select: { amount: true, taxAmount: true, date: true },
    }),
  ]);

  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const buckets = new Map();
  const cursor = new Date(from);
  while (cursor <= to) {
    buckets.set(key(cursor), { revenue: 0, expenses: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const p of payments) {
    const b = buckets.get(key(new Date(p.paidAt)));
    if (b) b.revenue += num(p.amount);
  }
  for (const e of expenses) {
    const b = buckets.get(key(new Date(e.date)));
    if (b) b.expenses += num(e.amount) + num(e.taxAmount);
  }

  const rows = Array.from(buckets, ([month, b]) => ({
    month,
    revenue: b.revenue,
    expenses: b.expenses,
    profit: b.revenue - b.expenses,
  }));
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalExpenses = rows.reduce((s, r) => s + r.expenses, 0);

  return {
    key: 'financial',
    title: 'Revenue vs Expenses',
    currency,
    columns: [
      { key: 'month', label: 'Month', type: 'text' },
      { key: 'revenue', label: 'Revenue', type: 'money' },
      { key: 'expenses', label: 'Expenses', type: 'money' },
      { key: 'profit', label: 'Profit', type: 'money' },
    ],
    rows,
    summary: [{ month: 'Total', revenue: totalRevenue, expenses: totalExpenses, profit: totalRevenue - totalExpenses }],
    meta: { from, to },
  };
}

export const REPORTS = {
  financial: financialReport,
  revenue: revenueReport,
  clients: clientReport,
  products: productReport,
  outstanding: outstandingReport,
  payments: paymentsReport,
};

export async function runReport(organizationId, key, query) {
  const fn = REPORTS[key];
  if (!fn) return null;
  return fn(organizationId, query);
}
