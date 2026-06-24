import { asyncHandler } from '../utils/asyncHandler.js';
import * as invoiceService from '../services/invoice.service.js';
import * as settingsService from '../services/settings.service.js';
import { buildInvoicePdf } from '../services/pdf.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await invoiceService.listInvoices(req.user.organizationId, req.query));
});

export const get = asyncHandler(async (req, res) => {
  res.json(await invoiceService.getInvoice(req.user.organizationId, req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await invoiceService.createInvoice(req.user.organizationId, req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await invoiceService.updateInvoice(req.user.organizationId, req.params.id, req.body));
});

export const issue = asyncHandler(async (req, res) => {
  res.json(await invoiceService.issueInvoice(req.user.organizationId, req.params.id));
});

export const cancel = asyncHandler(async (req, res) => {
  res.json(
    await invoiceService.cancelInvoice(req.user.organizationId, req.params.id, req.body?.reason),
  );
});

export const remove = asyncHandler(async (req, res) => {
  await invoiceService.deleteInvoice(req.user.organizationId, req.params.id);
  res.status(204).send();
});

export const processOverdue = asyncHandler(async (req, res) => {
  res.json(await invoiceService.processOverdueInvoices(req.user.organizationId));
});

export const pdf = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoice(req.user.organizationId, req.params.id);
  const org = await settingsService.getSettings(req.user.organizationId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="invoice-${invoice.number || invoice.id}.pdf"`,
  );
  const doc = buildInvoicePdf(invoice, org, { template: req.query.template });
  doc.pipe(res);
  doc.end();
});
