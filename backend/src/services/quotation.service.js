import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildPage } from '../utils/pagination.js';
import { computeDocumentTotals } from '../utils/totals.js';

const include = { items: { orderBy: { position: 'asc' } }, client: true };

export async function listQuotations(organizationId, query) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId };
  if (query.status) where.status = query.status;
  if (query.clientId) where.clientId = query.clientId;

  const [data, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.quote.count({ where }),
  ]);

  return buildPage({ data, total, page, pageSize });
}

export async function getQuotation(organizationId, id) {
  const quote = await prisma.quote.findFirst({ where: { id, organizationId }, include });
  if (!quote) throw ApiError.notFound('Quotation not found');
  return quote;
}

async function assertClient(organizationId, clientId) {
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId } });
  if (!client) throw ApiError.badRequest('Client does not exist in this organization');
}

// Quote items only carry tax (no per-line discount column in the schema).
const toQuoteItems = (organizationId, totals) =>
  totals.lines.map((l) => ({
    organizationId,
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRateBasisPoints: l.taxRateBasisPoints,
    lineTotal: l.lineTotal,
    position: l.position,
  }));

export async function createQuotation(organizationId, dto) {
  await assertClient(organizationId, dto.clientId);
  const totals = computeDocumentTotals(dto.items);

  return prisma.quote.create({
    data: {
      organizationId,
      clientId: dto.clientId,
      status: 'draft',
      currency: dto.currency,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      items: { create: toQuoteItems(organizationId, totals) },
    },
    include,
  });
}

export async function updateQuotation(organizationId, id, dto) {
  const quote = await getQuotation(organizationId, id);
  if (!['draft', 'sent'].includes(quote.status)) {
    throw ApiError.badRequest('Only draft or sent quotations can be edited');
  }
  if (dto.clientId) await assertClient(organizationId, dto.clientId);

  const data = {
    clientId: dto.clientId ?? quote.clientId,
    currency: dto.currency ?? quote.currency,
    issueDate: dto.issueDate ? new Date(dto.issueDate) : quote.issueDate,
    validUntil: dto.validUntil ? new Date(dto.validUntil) : quote.validUntil,
  };

  if (dto.items) {
    const totals = computeDocumentTotals(dto.items);
    data.subtotal = totals.subtotal;
    data.taxTotal = totals.taxTotal;
    data.total = totals.total;

    return prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      return tx.quote.update({
        where: { id },
        data: { ...data, items: { create: toQuoteItems(organizationId, totals) } },
        include,
      });
    });
  }

  return prisma.quote.update({ where: { id }, data, include });
}

export async function setStatus(organizationId, id, status) {
  const quote = await getQuotation(organizationId, id);

  const data = { status };
  if (status === 'accepted') data.acceptedAt = new Date();
  if (status === 'declined') data.declinedAt = new Date();

  return prisma.quote.update({ where: { id: quote.id }, data, include });
}

// Convert an accepted quotation into a draft invoice.
export async function convertToInvoice(organizationId, id) {
  const quote = await getQuotation(organizationId, id);
  if (quote.status !== 'accepted') {
    throw ApiError.badRequest('Only accepted quotations can be converted to an invoice');
  }

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        organizationId,
        clientId: quote.clientId,
        status: 'draft',
        currency: quote.currency,
        convertedFromQuoteId: quote.id,
        subtotal: quote.subtotal,
        discountTotal: 0n,
        taxTotal: quote.taxTotal,
        total: quote.total,
        amountPaid: 0n,
        balanceDue: quote.total,
        items: {
          create: quote.items.map((item) => ({
            organizationId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRateBasisPoints: item.taxRateBasisPoints,
            discountBasisPoints: 0,
            lineSubtotal: item.unitPrice * BigInt(Math.round(Number(item.quantity))),
            lineTax: 0n,
            lineTotal: item.lineTotal,
            position: item.position,
          })),
        },
      },
      include: { items: true, client: true },
    });

    return invoice;
  });
}

export async function deleteQuotation(organizationId, id) {
  const quote = await getQuotation(organizationId, id);
  if (quote.status === 'accepted') {
    throw ApiError.badRequest('Accepted quotations cannot be deleted');
  }
  await prisma.quote.delete({ where: { id } });
}
