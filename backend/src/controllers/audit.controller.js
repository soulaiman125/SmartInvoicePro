import { asyncHandler } from '../utils/asyncHandler.js';
import * as auditService from '../services/audit.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await auditService.listAuditLogs(req.user.organizationId, req.query));
});
