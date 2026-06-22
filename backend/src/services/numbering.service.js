// Assigns a gap-free, sequential document number within a transaction.
// Must be called inside a prisma.$transaction to guarantee atomicity (BR-1).
const PREFIXES = {
  invoice: 'INV',
  quote: 'QUO',
  credit_note: 'CN',
};

export async function assignNumber(tx, organizationId, docType, date = new Date()) {
  const fiscalYear = date.getFullYear();

  const series = await tx.numberingSeries.upsert({
    where: {
      organizationId_docType_fiscalYear: { organizationId, docType, fiscalYear },
    },
    create: {
      organizationId,
      docType,
      fiscalYear,
      prefix: `${PREFIXES[docType] || 'DOC'}-${fiscalYear}-`,
      nextNumber: 1n,
      padding: 4,
    },
    update: {},
  });

  const current = series.nextNumber;

  await tx.numberingSeries.update({
    where: { id: series.id },
    data: { nextNumber: current + 1n },
  });

  const padded = current.toString().padStart(series.padding, '0');
  return { seriesId: series.id, number: `${series.prefix}${padded}` };
}
