import { asyncHandler } from '../utils/asyncHandler.js';
import * as settingsService from '../services/settings.service.js';

export const get = asyncHandler(async (req, res) => {
  res.json(await settingsService.getSettings(req.user.organizationId));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await settingsService.updateSettings(req.user.organizationId, req.body));
});
