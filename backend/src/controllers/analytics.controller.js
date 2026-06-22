import { asyncHandler } from '../utils/asyncHandler.js';
import * as analytics from '../services/analytics.service.js';

export const dashboard = asyncHandler(async (req, res) => {
  res.json(await analytics.getDashboardSummary(req.user.organizationId));
});

export const monthlyRevenue = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, Number(req.query.months) || 12));
  res.json(await analytics.getMonthlyRevenue(req.user.organizationId, months));
});

export const productPerformance = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));
  res.json(await analytics.getProductPerformance(req.user.organizationId, limit));
});

export const revenueReport = asyncHandler(async (req, res) => {
  res.json(await analytics.revenueReport(req.user.organizationId, req.query));
});

function toCsv(rows, columns) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => escape(r[c.key])).join(',')).join('\n');
  return `${header}\n${body}`;
}

export const clientReport = asyncHandler(async (req, res) => {
  const rows = await analytics.clientReport(req.user.organizationId);
  if (req.query.format === 'csv') {
    const csv = toCsv(rows, [
      { key: 'name', label: 'Client' },
      { key: 'invoices', label: 'Invoices' },
      { key: 'billed', label: 'Billed (minor units)' },
      { key: 'paid', label: 'Paid (minor units)' },
      { key: 'outstanding', label: 'Outstanding (minor units)' },
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="client-report.csv"');
    return res.send(csv);
  }
  return res.json(rows);
});

export const inventoryReport = asyncHandler(async (req, res) => {
  res.json(await analytics.inventoryReport(req.user.organizationId));
});
