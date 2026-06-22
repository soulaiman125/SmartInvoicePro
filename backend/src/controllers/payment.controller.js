import { asyncHandler } from '../utils/asyncHandler.js';
import * as paymentService from '../services/payment.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await paymentService.listPayments(req.user.organizationId, req.query));
});

export const listForInvoice = asyncHandler(async (req, res) => {
  res.json(await paymentService.listInvoicePayments(req.user.organizationId, req.params.invoiceId));
});

export const record = asyncHandler(async (req, res) => {
  const result = await paymentService.recordPayment(
    req.user.organizationId,
    req.params.invoiceId,
    req.body,
  );
  res.status(201).json(result);
});

export const get = asyncHandler(async (req, res) => {
  res.json(await paymentService.getPayment(req.user.organizationId, req.params.id));
});

export const refund = asyncHandler(async (req, res) => {
  res.json(await paymentService.refundPayment(req.user.organizationId, req.params.id));
});
