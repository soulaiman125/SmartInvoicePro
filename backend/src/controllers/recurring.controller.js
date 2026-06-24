import { asyncHandler } from '../utils/asyncHandler.js';
import * as recurringService from '../services/recurring.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await recurringService.listRecurring(req.user.organizationId, req.query));
});

export const get = asyncHandler(async (req, res) => {
  res.json(await recurringService.getRecurring(req.user.organizationId, req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await recurringService.createRecurring(req.user.organizationId, req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await recurringService.updateRecurring(req.user.organizationId, req.params.id, req.body));
});

export const pause = asyncHandler(async (req, res) => {
  res.json(await recurringService.pauseRecurring(req.user.organizationId, req.params.id));
});

export const resume = asyncHandler(async (req, res) => {
  res.json(await recurringService.resumeRecurring(req.user.organizationId, req.params.id));
});

export const remove = asyncHandler(async (req, res) => {
  await recurringService.deleteRecurring(req.user.organizationId, req.params.id);
  res.status(204).send();
});

// Manually process all schedules due for this organization.
export const run = asyncHandler(async (req, res) => {
  res.json(await recurringService.processDueRecurringInvoices(req.user.organizationId));
});
