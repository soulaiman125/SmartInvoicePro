import { asyncHandler } from '../utils/asyncHandler.js';
import * as portalService from '../services/portal.service.js';

// ── Authenticated: link management (mounted under /clients) ───────────────────

export const createLink = asyncHandler(async (req, res) => {
  res.status(201).json(
    await portalService.createPortalLink(req.user.organizationId, req.params.id, { label: req.body?.label }),
  );
});

export const listLinks = asyncHandler(async (req, res) => {
  res.json(await portalService.listPortalLinks(req.user.organizationId, req.params.id));
});

export const revokeLink = asyncHandler(async (req, res) => {
  res.json(await portalService.revokePortalLink(req.user.organizationId, req.params.linkId));
});

// ── Public: token-only access (no authentication) ─────────────────────────────

export const data = asyncHandler(async (req, res) => {
  res.json(await portalService.getPortalData(req.params.token));
});

export const invoicePdf = asyncHandler(async (req, res) => {
  const { doc, name } = await portalService.getPortalInvoicePdf(req.params.token, req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${name}"`);
  doc.pipe(res);
  doc.end();
});

export const quotePdf = asyncHandler(async (req, res) => {
  const { doc, name } = await portalService.getPortalQuotePdf(req.params.token, req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${name}"`);
  doc.pipe(res);
  doc.end();
});
