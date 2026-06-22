import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sha256 } from '../utils/password.js';
import { getSettings } from './settings.service.js';
import { buildInvoicePdf, buildQuotePdf } from './pdf.service.js';

// ── Link management (authenticated) ──────────────────────────────────────────

// Issues a new secure portal link for a client. The raw token is returned ONCE;
// only its SHA-256 hash is stored, so a DB leak cannot reconstruct a live link.
export async function createPortalLink(organizationId, clientId, { label } = {}) {
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId } });
  if (!client) throw ApiError.notFound('Client not found');

  const raw = crypto.randomBytes(32).toString('hex');
  const expiresAt = env.portalTokenTtlDays > 0
    ? new Date(Date.now() + env.portalTokenTtlDays * 86400000)
    : null;

  const token = await prisma.portalToken.create({
    data: { organizationId, clientId, tokenHash: sha256(raw), label: label || null, expiresAt },
  });

  return { id: token.id, url: `${env.appUrl}/portal/${raw}`, token: raw, expiresAt, createdAt: token.createdAt };
}

export async function listPortalLinks(organizationId, clientId) {
  const links = await prisma.portalToken.findMany({
    where: { organizationId, clientId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, label: true, expiresAt: true, lastAccessedAt: true, revokedAt: true, createdAt: true },
  });
  return links.map((l) => ({ ...l, active: !l.revokedAt && (!l.expiresAt || l.expiresAt > new Date()) }));
}

export async function revokePortalLink(organizationId, id) {
  const link = await prisma.portalToken.findFirst({ where: { id, organizationId } });
  if (!link) throw ApiError.notFound('Portal link not found');
  await prisma.portalToken.update({ where: { id }, data: { revokedAt: new Date() } });
  return { revoked: true };
}

// ── Public access (token only) ───────────────────────────────────────────────

// Validates a raw token and returns the live PortalToken row. Touches
// lastAccessedAt as a best-effort audit trail.
async function resolveToken(rawToken) {
  if (!rawToken || rawToken.length < 32) throw ApiError.unauthorized('Invalid portal link');
  const record = await prisma.portalToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
  if (!record || record.revokedAt || (record.expiresAt && record.expiresAt < new Date())) {
    throw ApiError.unauthorized('This portal link is invalid or has expired');
  }
  prisma.portalToken
    .update({ where: { id: record.id }, data: { lastAccessedAt: new Date() } })
    .catch(() => {});
  return record;
}

// Everything a customer is allowed to see: their issued invoices, quotes and
// payment history, plus the organization's branding.
export async function getPortalData(rawToken) {
  const { organizationId, clientId } = await resolveToken(rawToken);

  const [org, client, invoices, quotes, payments] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, logoUrl: true, baseCurrency: true, settings: true },
    }),
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true, email: true } }),
    prisma.invoice.findMany({
      where: { organizationId, clientId, status: { not: 'draft' } },
      select: {
        id: true, number: true, status: true, issueDate: true, dueDate: true,
        currency: true, total: true, amountPaid: true, balanceDue: true,
      },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.quote.findMany({
      where: { organizationId, clientId, status: { not: 'draft' } },
      select: { id: true, number: true, status: true, issueDate: true, validUntil: true, currency: true, total: true },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.payment.findMany({
      where: { organizationId, status: 'succeeded', invoice: { clientId } },
      select: { id: true, amount: true, currency: true, method: true, paidAt: true, invoice: { select: { number: true } } },
      orderBy: { paidAt: 'desc' },
    }),
  ]);

  const totalBilled = invoices.reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.amountPaid), 0);
  const outstanding = invoices.reduce((s, i) => s + Number(i.balanceDue), 0);

  return {
    organization: {
      name: org?.name || 'SmartInvoice Pro',
      logoUrl: org?.logoUrl || null,
      currency: org?.baseCurrency || 'USD',
      brandColor: org?.settings?.brandColor || null,
    },
    client,
    invoices,
    quotes,
    payments,
    summary: { totalBilled, totalPaid, outstanding, invoiceCount: invoices.length, quoteCount: quotes.length },
  };
}

async function loadOrgAndDoc(rawToken, kind, id) {
  const { organizationId, clientId } = await resolveToken(rawToken);
  const org = await getSettings(organizationId);
  if (kind === 'invoice') {
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId, clientId, status: { not: 'draft' } },
      include: { items: { orderBy: { position: 'asc' } }, client: true },
    });
    if (!invoice) throw ApiError.notFound('Invoice not found');
    return { org, doc: buildInvoicePdf(invoice, org), name: `invoice-${invoice.number || invoice.id}.pdf` };
  }
  const quote = await prisma.quote.findFirst({
    where: { id, organizationId, clientId, status: { not: 'draft' } },
    include: { items: { orderBy: { position: 'asc' } }, client: true },
  });
  if (!quote) throw ApiError.notFound('Quote not found');
  return { org, doc: buildQuotePdf(quote, org), name: `quote-${quote.number || quote.id}.pdf` };
}

export const getPortalInvoicePdf = (rawToken, id) => loadOrgAndDoc(rawToken, 'invoice', id);
export const getPortalQuotePdf = (rawToken, id) => loadOrgAndDoc(rawToken, 'quote', id);
