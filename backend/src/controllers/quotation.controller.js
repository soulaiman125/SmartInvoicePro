import { asyncHandler } from '../utils/asyncHandler.js';
import * as quotationService from '../services/quotation.service.js';
import * as settingsService from '../services/settings.service.js';
import { buildQuotePdf } from '../services/pdf.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await quotationService.listQuotations(req.user.organizationId, req.query));
});

export const get = asyncHandler(async (req, res) => {
  res.json(await quotationService.getQuotation(req.user.organizationId, req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await quotationService.createQuotation(req.user.organizationId, req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await quotationService.updateQuotation(req.user.organizationId, req.params.id, req.body));
});

export const changeStatus = asyncHandler(async (req, res) => {
  res.json(
    await quotationService.setStatus(req.user.organizationId, req.params.id, req.body.status),
  );
});

export const convert = asyncHandler(async (req, res) => {
  res.status(201).json(
    await quotationService.convertToInvoice(req.user.organizationId, req.params.id),
  );
});

export const remove = asyncHandler(async (req, res) => {
  await quotationService.deleteQuotation(req.user.organizationId, req.params.id);
  res.status(204).send();
});

export const pdf = asyncHandler(async (req, res) => {
  const quote = await quotationService.getQuotation(req.user.organizationId, req.params.id);
  const org = await settingsService.getSettings(req.user.organizationId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="quote-${quote.number || quote.id}.pdf"`);
  const doc = buildQuotePdf(quote, org, { template: req.query.template });
  doc.pipe(res);
  doc.end();
});
