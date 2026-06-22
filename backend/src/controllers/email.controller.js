import { asyncHandler } from '../utils/asyncHandler.js';
import * as emailService from '../services/email.service.js';

export const history = asyncHandler(async (req, res) => {
  res.json(await emailService.listEmails(req.user.organizationId, req.query));
});

export const retry = asyncHandler(async (req, res) => {
  res.json(await emailService.retryEmail(req.user.organizationId, req.params.id));
});

export const sendInvoice = asyncHandler(async (req, res) => {
  res.status(202).json(
    await emailService.sendInvoiceEmail(req.user.organizationId, req.params.id, { to: req.body?.to }),
  );
});

export const sendInvoiceReminder = asyncHandler(async (req, res) => {
  res.status(202).json(
    await emailService.sendPaymentReminder(req.user.organizationId, req.params.id, { to: req.body?.to }),
  );
});

export const sendQuote = asyncHandler(async (req, res) => {
  res.status(202).json(
    await emailService.sendQuoteEmail(req.user.organizationId, req.params.id, { to: req.body?.to }),
  );
});
