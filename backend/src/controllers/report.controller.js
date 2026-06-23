import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { runReport, REPORTS } from '../services/report.service.js';
import { toCsv, toXlsx, toPdf } from '../services/export.service.js';
import { getSettings } from '../services/settings.service.js';

const AVAILABLE = [
  { key: 'financial', title: 'Revenue vs Expenses', formats: ['json', 'csv', 'xlsx', 'pdf'], dateRange: true },
  { key: 'revenue', title: 'Revenue Report', formats: ['json', 'csv', 'xlsx', 'pdf'], dateRange: true },
  { key: 'clients', title: 'Client Report', formats: ['json', 'csv', 'xlsx', 'pdf'], dateRange: false },
  { key: 'products', title: 'Product Performance', formats: ['json', 'csv', 'xlsx', 'pdf'], dateRange: false },
  { key: 'outstanding', title: 'Outstanding Invoices', formats: ['json', 'csv', 'xlsx', 'pdf'], dateRange: false },
  { key: 'payments', title: 'Payments Report', formats: ['json', 'csv', 'xlsx', 'pdf'], dateRange: true },
];

export const catalog = asyncHandler(async (req, res) => {
  res.json(AVAILABLE);
});

export const report = asyncHandler(async (req, res) => {
  const { key } = req.params;
  if (!REPORTS[key]) throw ApiError.badRequest(`Unknown report: ${key}`);

  const data = await runReport(req.user.organizationId, key, req.query);
  const format = String(req.query.format || 'json').toLowerCase();
  const base = `${key}-report-${new Date().toISOString().slice(0, 10)}`;

  if (format === 'json') return res.json(data);

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${base}.csv"`);
    return res.send(toCsv(data));
  }

  if (format === 'xlsx') {
    const buffer = await toXlsx(data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${base}.xlsx"`);
    return res.send(Buffer.from(buffer));
  }

  if (format === 'pdf') {
    const org = await getSettings(req.user.organizationId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${base}.pdf"`);
    const doc = toPdf(data, org);
    doc.pipe(res);
    return doc.end();
  }

  throw ApiError.badRequest(`Unsupported format: ${format}`);
});
