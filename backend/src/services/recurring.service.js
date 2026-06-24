import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildPage } from '../utils/pagination.js';
import { createInvoice, issueInvoice } from './invoice.service.js';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const addDays = (date, days) => new Date(date.getTime() + days * 86400000);

// Advance a date by one billing period.
function nextDate(date, frequency) {
  const d = new Date(date);
  if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (frequency === 'quarterly') d.setMonth(d.getMonth() + 3);
  else if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d;
}

async function assertClient(organizationId, clientId) {
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId } });
  if (!client) throw ApiError.badRequest('Client does not exist in this organization');
  return client;
}

export async function listRecurring(organizationId, query = {}) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId };
  if (query.status) where.status = query.status;

  const [data, total] = await Promise.all([
    prisma.recurringInvoice.findMany({
      where,
      include: { client: { select: { name: true } } },
      orderBy: { nextRunAt: 'asc' },
      skip,
      take,
    }),
    prisma.recurringInvoice.count({ where }),
  ]);
  return buildPage({ data, total, page, pageSize });
}

export async function getRecurring(organizationId, id) {
  const rec = await prisma.recurringInvoice.findFirst({
    where: { id, organizationId },
    include: { client: { select: { name: true, email: true } } },
  });
  if (!rec) throw ApiError.notFound('Recurring invoice not found');
  return rec;
}

export async function createRecurring(organizationId, dto) {
  await assertClient(organizationId, dto.clientId);
  const start = startOfDay(dto.startDate);
  return prisma.recurringInvoice.create({
    data: {
      organizationId,
      clientId: dto.clientId,
      frequency: dto.frequency,
      currency: dto.currency,
      items: dto.items,
      notes: dto.notes ?? null,
      footer: dto.footer ?? null,
      dueInDays: dto.dueInDays,
      autoIssue: dto.autoIssue,
      startDate: start,
      nextRunAt: start,
    },
    include: { client: { select: { name: true } } },
  });
}

export async function updateRecurring(organizationId, id, dto) {
  const rec = await getRecurring(organizationId, id);
  if (dto.clientId) await assertClient(organizationId, dto.clientId);
  const data = { ...dto };
  // Re-anchor the schedule if the start date moves before it has ever run.
  if (dto.startDate) {
    data.startDate = startOfDay(dto.startDate);
    if (rec.occurrences === 0) data.nextRunAt = startOfDay(dto.startDate);
  }
  return prisma.recurringInvoice.update({
    where: { id },
    data,
    include: { client: { select: { name: true } } },
  });
}

export async function setStatus(organizationId, id, status) {
  await getRecurring(organizationId, id);
  return prisma.recurringInvoice.update({
    where: { id },
    data: { status },
    include: { client: { select: { name: true } } },
  });
}

export const pauseRecurring = (organizationId, id) => setStatus(organizationId, id, 'paused');
export const resumeRecurring = (organizationId, id) => setStatus(organizationId, id, 'active');

export async function deleteRecurring(organizationId, id) {
  await getRecurring(organizationId, id);
  await prisma.recurringInvoice.delete({ where: { id } });
}

// Generates one invoice from a recurring template using the existing invoice
// workflow (create draft → optionally issue), then advances the schedule.
async function generateFor(rec) {
  const issueDate = startOfDay(new Date());
  const dueDate = addDays(issueDate, rec.dueInDays);
  const draft = await createInvoice(rec.organizationId, {
    clientId: rec.clientId,
    currency: rec.currency,
    issueDate,
    dueDate,
    notes: rec.notes ?? undefined,
    footer: rec.footer ?? undefined,
    items: rec.items,
  });
  const invoice = rec.autoIssue ? await issueInvoice(rec.organizationId, draft.id) : draft;

  await prisma.recurringInvoice.update({
    where: { id: rec.id },
    data: {
      lastRunAt: new Date(),
      nextRunAt: nextDate(rec.nextRunAt, rec.frequency),
      occurrences: { increment: 1 },
    },
  });
  return invoice;
}

// Processes every active schedule that is due (nextRunAt <= today). Generates at
// most one invoice per schedule per run; multi-period catch-up happens on later
// runs. `organizationId` optional — omit to process all tenants (scheduler).
export async function processDueRecurringInvoices(organizationId = null) {
  const where = { status: 'active', nextRunAt: { lte: endOfDay(new Date()) } };
  if (organizationId) where.organizationId = organizationId;

  const due = await prisma.recurringInvoice.findMany({ where });
  let generated = 0;
  const errors = [];
  for (const rec of due) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await generateFor(rec);
      generated += 1;
    } catch (err) {
      errors.push({ id: rec.id, message: String(err?.message || err) });
    }
  }
  return { processed: due.length, generated, errors };
}
