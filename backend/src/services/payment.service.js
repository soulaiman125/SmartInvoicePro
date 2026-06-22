import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildPage } from '../utils/pagination.js';
import { notifyOrg } from './notification.service.js';
import { sendInvoicePaid } from './email.service.js';

// Recompute an invoice's paid/balance/status from its succeeded payments.
function deriveStatus(total, amountPaid, currentStatus) {
  if (amountPaid >= total && total > 0n) return 'paid';
  if (amountPaid > 0n) return 'partially_paid';
  return currentStatus === 'paid' || currentStatus === 'partially_paid' ? 'sent' : currentStatus;
}

async function loadInvoice(tx, organizationId, invoiceId) {
  const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, organizationId } });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  return invoice;
}

// Record a manual/offline payment (cash, bank transfer, cheque, …). Supports
// partial payments and keeps the invoice balance + status in sync (BR-4).
export async function recordPayment(organizationId, invoiceId, dto) {
  const result = await prisma.$transaction(async (tx) => {
    const invoice = await loadInvoice(tx, organizationId, invoiceId);

    if (invoice.status === 'draft') {
      throw ApiError.badRequest('Cannot record a payment on a draft invoice; issue it first');
    }
    if (invoice.status === 'cancelled') {
      throw ApiError.badRequest('Cannot record a payment on a cancelled invoice');
    }

    const amount = BigInt(dto.amount);
    if (amount <= 0n) throw ApiError.badRequest('Payment amount must be positive');
    if (amount > invoice.balanceDue) {
      throw ApiError.badRequest('Payment exceeds the outstanding balance');
    }

    const payment = await tx.payment.create({
      data: {
        organizationId,
        invoiceId,
        amount,
        currency: dto.currency || invoice.currency,
        method: dto.method,
        status: 'succeeded',
        gateway: dto.gateway || 'manual',
        gatewayPaymentId: dto.gatewayPaymentId ?? null,
        reference: dto.reference ?? null,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      },
    });

    const amountPaid = invoice.amountPaid + amount;
    const balanceDue = invoice.total - amountPaid;
    const status = deriveStatus(invoice.total, amountPaid, invoice.status);

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: { amountPaid, balanceDue, status },
    });

    return { payment, invoice: updatedInvoice };
  });

  // Best-effort in-app notification (never blocks the payment).
  try {
    await notifyOrg(organizationId, 'payment_received', {
      invoiceId,
      number: result.invoice.number,
      amount: Number(result.payment.amount),
      currency: result.payment.currency,
    });
  } catch {
    /* ignore notification failures */
  }

  // Best-effort payment receipt to the client once fully paid (never blocks).
  if (result.invoice.status === 'paid') {
    try {
      await sendInvoicePaid(organizationId, invoiceId, { amount: Number(result.payment.amount) });
    } catch {
      /* ignore email failures */
    }
  }

  return result;
}

export async function listPayments(organizationId, query) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId };
  if (query.invoiceId) where.invoiceId = query.invoiceId;
  if (query.status) where.status = query.status;

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { invoice: { select: { number: true, clientId: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);

  return buildPage({ data, total, page, pageSize });
}

export async function listInvoicePayments(organizationId, invoiceId) {
  await prisma.invoice.findFirstOrThrow({ where: { id: invoiceId, organizationId } }).catch(() => {
    throw ApiError.notFound('Invoice not found');
  });
  return prisma.payment.findMany({
    where: { organizationId, invoiceId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPayment(organizationId, id) {
  const payment = await prisma.payment.findFirst({ where: { id, organizationId } });
  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
}

// Reverse/refund a recorded payment and restore the invoice balance.
export async function refundPayment(organizationId, id) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({ where: { id, organizationId } });
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.status === 'refunded') throw ApiError.badRequest('Payment already refunded');

    await tx.payment.update({ where: { id }, data: { status: 'refunded' } });

    const invoice = await tx.invoice.findFirst({
      where: { id: payment.invoiceId, organizationId },
    });
    const amountPaid = invoice.amountPaid - payment.amount;
    const balanceDue = invoice.total - amountPaid;
    const status = deriveStatus(invoice.total, amountPaid, invoice.status);

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: { amountPaid, balanceDue, status },
    });

    return { payment: { ...payment, status: 'refunded' }, invoice: updatedInvoice };
  });
}
