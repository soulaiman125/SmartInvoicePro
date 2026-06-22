import { asyncHandler } from '../utils/asyncHandler.js';
import * as notificationService from '../services/notification.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await notificationService.listForUser(req.user.organizationId, req.user.id, req.query));
});

export const unreadCount = asyncHandler(async (req, res) => {
  res.json(await notificationService.unreadCount(req.user.organizationId, req.user.id));
});

export const markRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markRead(req.user.organizationId, req.user.id, req.params.id));
});

export const markAllRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markAllRead(req.user.organizationId, req.user.id));
});
