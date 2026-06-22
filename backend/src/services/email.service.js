import nodemailer from 'nodemailer';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildPage } from '../utils/pagination.js';
import { buildInvoicePdf, buildQuotePdf } from './pdf.service.js';
import { getSettings } from './settings.service.js';
import {
  invoiceEmail,
  quoteEmail,
  paymentReminderEmail,
  invoicePaidEmail,
  welcomeEmail,
} from './email/templates.js';

// ── Transport ────────────────────────────────────────────────────────────────
// Resolved once and reused. SMTP when configured, otherwise a dev/preview
// transport that needs no credentials. Ethereal gives clickable previews when
// EMAIL_PREVIEW=ethereal and the network is reachable; jsonTransport is the
// fully offline default.

let transportPromise = null;

async function resolveTransport() {
  const { smtp, preview } = env.mail;
  if (smtp.host) {
    return {
      provider: 'smtp',
      transport: nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
      }),
    };
  }
  if (preview === 'ethereal') {
    try {
      const acct = await nodemailer.createTestAccount();
      return {
        provider: 'preview',
        ethereal: true,
        transport: nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: acct.user, pass: acct.pass },
        }),
      };
    } catch {
      /* fall through to json transport when offline */
    }
  }
  // Offline-safe default: serialise the message without sending.
  return { provider: 'preview', transport: nodemailer.createTransport({ jsonTransport: true }) };
}

function getTransport() {
  if (!transportPromise) transportPromise = resolveTransport();
  return transportPromise;
}

// Buffer a PDFKit document (the builders return an un-ended doc).
function pdfToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

// ── Core delivery ────────────────────────────────────────────────────────────

// Performs the actual send and records the outcome against an EmailLog row.
async function deliver(logId, message) {
  const { provider, transport, ethereal } = await getTransport();
  try {
    const info = await transport.sendMail({
      from: env.mail.from,
      to: message.toName ? `${message.toName} <${message.to}>` : message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments,
    });
    const previewUrl = ethereal ? nodemailer.getTestMessageUrl(info) || null : null;
    return prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: 'sent',
        provider,
        messageId: info.messageId || null,
        previewUrl,
        error: null,
        sentAt: new Date(),
        lastAttemptAt: new Date(),
        attempts: { increment: 1 },
      },
    });
  } catch (err) {
    return prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: 'failed',
        provider,
        error: String(err?.message || err).slice(0, 500),
        lastAttemptAt: new Date(),
        attempts: { increment: 1 },
      },
    });
  }
}

// Creates the log row then delivers. Returns the updated log.
async function dispatch(organizationId, meta, content, attachments) {
  const log = await prisma.emailLog.create({
    data: {
      organizationId,
      type: meta.type,
      toEmail: meta.to,
      toName: meta.toName || null,
      subject: content.subject,
      entityType: meta.entityType || null,
      entityId: meta.entityId || null,
      status: 'queued',
    },
  });
  return deliver(log.id, {
    to: meta.to,
    toName: meta.toName,
    subject: content.subject,
    html: content.html,
    text: content.text,
    attachments,
  });
}

// ── Content builders (shared by initial send + retry) ────────────────────────

async function loadInvoice(organizationId, id) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId },
    include: { items: { orderBy: { position: 'asc' } }, client: true },
  });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  return invoice;
}

async function loadQuote(organizationId, id) {
  const quote = await prisma.quote.findFirst({
    where: { id, organizationId },
    include: { items: { orderBy: { position: 'asc' } }, client: true },
  });
  if (!quote) throw ApiError.notFound('Quote not found');
  return quote;
}

const invoiceUrl = (org, id) => `${env.appUrl}/invoices/${id}`;

// Returns { meta, content, attachments } for a given email type + entity.
async function buildPayload(organizationId, { type, entityId, to, amount }) {
  const org = await getSettings(organizationId);

  if (type === 'invoice' || type === 'payment_reminder' || type === 'invoice_paid') {
    const invoice = await loadInvoice(organizationId, entityId);
    const recipient = to || invoice.client?.email;
    if (!recipient) throw ApiError.badRequest('The client has no email address on file');

    if (type === 'invoice_paid') {
      return {
        meta: { type, to: recipient, toName: invoice.client?.name, entityType: 'invoice', entityId: invoice.id },
        content: invoicePaidEmail({ org, invoice, client: invoice.client, amount }),
        attachments: [],
      };
    }

    const pdf = await pdfToBuffer(buildInvoicePdf(invoice, org));
    const fn = type === 'invoice' ? invoiceEmail : paymentReminderEmail;
    return {
      meta: { type, to: recipient, toName: invoice.client?.name, entityType: 'invoice', entityId: invoice.id },
      content: fn({ org, invoice, client: invoice.client, url: invoiceUrl(org, invoice.id) }),
      attachments: [{ filename: `invoice-${invoice.number || invoice.id}.pdf`, content: pdf }],
    };
  }

  if (type === 'quote') {
    const quote = await loadQuote(organizationId, entityId);
    const recipient = to || quote.client?.email;
    if (!recipient) throw ApiError.badRequest('The client has no email address on file');
    const pdf = await pdfToBuffer(buildQuotePdf(quote, org));
    return {
      meta: { type, to: recipient, toName: quote.client?.name, entityType: 'quote', entityId: quote.id },
      content: quoteEmail({ org, quote, client: quote.client, url: `${env.appUrl}/quotes/${quote.id}` }),
      attachments: [{ filename: `quote-${quote.number || quote.id}.pdf`, content: pdf }],
    };
  }

  if (type === 'welcome') {
    if (!to) throw ApiError.badRequest('A recipient email is required');
    return {
      meta: { type, to, entityType: 'organization', entityId: organizationId },
      content: welcomeEmail({ org, name: org?.name, url: env.appUrl }),
      attachments: [],
    };
  }

  throw ApiError.badRequest(`Unsupported email type: ${type}`);
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function sendInvoiceEmail(organizationId, invoiceId, { to } = {}) {
  const { meta, content, attachments } = await buildPayload(organizationId, { type: 'invoice', entityId: invoiceId, to });
  return dispatch(organizationId, meta, content, attachments);
}

export async function sendQuoteEmail(organizationId, quoteId, { to } = {}) {
  const { meta, content, attachments } = await buildPayload(organizationId, { type: 'quote', entityId: quoteId, to });
  return dispatch(organizationId, meta, content, attachments);
}

export async function sendPaymentReminder(organizationId, invoiceId, { to } = {}) {
  const { meta, content, attachments } = await buildPayload(organizationId, { type: 'payment_reminder', entityId: invoiceId, to });
  return dispatch(organizationId, meta, content, attachments);
}

export async function sendInvoicePaid(organizationId, invoiceId, { to, amount } = {}) {
  const { meta, content, attachments } = await buildPayload(organizationId, { type: 'invoice_paid', entityId: invoiceId, to, amount });
  return dispatch(organizationId, meta, content, attachments);
}

export async function sendWelcome(organizationId, to) {
  const { meta, content, attachments } = await buildPayload(organizationId, { type: 'welcome', to });
  return dispatch(organizationId, meta, content, attachments);
}

// Email history, optionally scoped to one entity.
export async function listEmails(organizationId, query = {}) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId };
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;
  if (query.status) where.status = query.status;

  const [data, total] = await Promise.all([
    prisma.emailLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.emailLog.count({ where }),
  ]);
  return buildPage({ data, total, page, pageSize });
}

// Re-send a previously failed (or any) email by rebuilding it from its entity.
export async function retryEmail(organizationId, id) {
  const log = await prisma.emailLog.findFirst({ where: { id, organizationId } });
  if (!log) throw ApiError.notFound('Email not found');

  const { content, attachments } = await buildPayload(organizationId, {
    type: log.type,
    entityId: log.entityId,
    to: log.toEmail,
  });

  await prisma.emailLog.update({ where: { id: log.id }, data: { status: 'queued', subject: content.subject } });
  return deliver(log.id, {
    to: log.toEmail,
    toName: log.toName,
    subject: content.subject,
    html: content.html,
    text: content.text,
    attachments,
  });
}
