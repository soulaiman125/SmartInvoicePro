import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildPage } from '../utils/pagination.js';
import { computeDocumentTotals } from '../utils/totals.js';
import { assignNumber } from './numbering.service.js';
import { consumeForInvoice } from './inventory.service.js';
import { notifyOrg } from './notification.service.js';

const include = { items: { orderBy: { position: 'asc' } }, client: true };

// Invoice line items carry organizationId (tenant scope); attach it to each line.
const toInvoiceItems = (organizationId, totals) =>
  totals.lines.map((line) => ({ ...line, organizationId }));

export async function listInvoices(organizationId, query) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId };
  if (query.status) where.status = query.status;
  if (query.clientId) where.clientId = query.clientId;

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.invoice.count({ where }),
  ]);

  return buildPage({ data, total, page, pageSize });
}

export async function getInvoice(organizationId, id) {
  const invoice = await prisma.invoice.findFirst({ where: { id, organizationId }, include });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  return invoice;
}

async function assertClient(organizationId, clientId) {
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId } });
  if (!client) throw ApiError.badRequest('Client does not exist in this organization');
  return client;
}

export async function createInvoice(organizationId, dto) {
  await assertClient(organizationId, dto.clientId);
  const totals = computeDocumentTotals(dto.items);

  return prisma.invoice.create({
    data: {
      organizationId,
      clientId: dto.clientId,
      status: 'draft',
      currency: dto.currency,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      notes: dto.notes ?? null,
      footer: dto.footer ?? null,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      amountPaid: 0n,
      balanceDue: totals.total,
      items: { create: toInvoiceItems(organizationId, totals) },
    },
    include,
  });
}

export async function updateInvoice(organizationId, id, dto) {
  const invoice = await getInvoice(organizationId, id);
  if (invoice.status !== 'draft') {
    throw ApiError.badRequest('Only draft invoices can be edited (issued invoices are immutable)');
  }

  if (dto.clientId) await assertClient(organizationId, dto.clientId);

  const data = {
    clientId: dto.clientId ?? invoice.clientId,
    currency: dto.currency ?? invoice.currency,
    issueDate: dto.issueDate ? new Date(dto.issueDate) : invoice.issueDate,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : invoice.dueDate,
    notes: dto.notes ?? invoice.notes,
    footer: dto.footer ?? invoice.footer,
  };

  // If items are provided, replace them and recompute totals.
  if (dto.items) {
    const totals = computeDocumentTotals(dto.items);
    data.subtotal = totals.subtotal;
    data.discountTotal = totals.discountTotal;
    data.taxTotal = totals.taxTotal;
    data.total = totals.total;
    data.balanceDue = totals.total - invoice.amountPaid;

    return prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      return tx.invoice.update({
        where: { id },
        data: { ...data, items: { create: toInvoiceItems(organizationId, totals) } },
        include,
      });
    });
  }

  return prisma.invoice.update({ where: { id }, data, include });
}

// Finalize a draft: assign a compliant number, lock it, and decrement stock.
export async function issueInvoice(organizationId, id) {
  const invoice = await getInvoice(organizationId, id);
  if (invoice.status !== 'draft') {
    throw ApiError.badRequest('Invoice has already been issued');
  }

  const issued = await prisma.$transaction(
    async (tx) => {
      const { seriesId, number } = await assignNumber(tx, organizationId, 'invoice');

      await consumeForInvoice(tx, organizationId, invoice.items, number);

      return tx.invoice.update({
        where: { id },
        data: {
          number,
          seriesId,
          status: 'sent',
          issuedAt: new Date(),
          issueDate: invoice.issueDate ?? new Date(),
        },
        include,
      });
    },
    { isolationLevel: 'Serializable' },
  );

  try {
    await notifyOrg(organizationId, 'invoice_issued', {
      invoiceId: id,
      number: issued.number,
    });
  } catch {
    /* ignore notification failures */
  }

  return issued;
}

export async function cancelInvoice(organizationId, id, reason) {
  const invoice = await getInvoice(organizationId, id);
  if (invoice.status === 'draft') {
    throw ApiError.badRequest('Draft invoices can be deleted, not cancelled');
  }
  if (invoice.status === 'cancelled') {
    throw ApiError.badRequest('Invoice is already cancelled');
  }

  return prisma.$transaction(async (tx) => {
    await tx.creditNote.create({
      data: {
        organizationId,
        invoiceId: id,
        reason: reason ?? 'Invoice cancelled',
        total: invoice.total,
      },
    });
    return tx.invoice.update({ where: { id }, data: { status: 'cancelled' }, include });
  });
}

export async function deleteInvoice(organizationId, id) {
  const invoice = await getInvoice(organizationId, id);
  if (invoice.status !== 'draft') {
    throw ApiError.badRequest('Only draft invoices can be deleted; issue a credit note instead');
  }
  await prisma.invoice.delete({ where: { id } });
}
