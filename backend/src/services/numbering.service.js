// Assigns a gap-free, sequential document number within a transaction.
// Must be called inside a prisma.$transaction to guarantee atomicity (BR-1).
const PREFIXES = {
  invoice: 'INV',
  quote: 'QUO',
  credit_note: 'CN',
};

// Maps a document type to its organization-settings prefix override key.
const PREFIX_SETTING = { invoice: 'invoicePrefix', quote: 'quotePrefix' };

export async function assignNumber(tx, organizationId, docType, date = new Date()) {
  const fiscalYear = date.getFullYear();

  // Allow the organization to override the document prefix (Settings → Branding).
  // Only applies when a new series is created — already-issued documents keep
  // their original prefix for numbering continuity.
  let prefixBase = PREFIXES[docType] || 'DOC';
  const settingKey = PREFIX_SETTING[docType];
  if (settingKey) {
    const org = await tx.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });
    const custom = org?.settings?.[settingKey];
    if (typeof custom === 'string' && custom.trim()) {
      prefixBase = custom.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase() || prefixBase;
    }
  }

  const series = await tx.numberingSeries.upsert({
    where: {
      organizationId_docType_fiscalYear: { organizationId, docType, fiscalYear },
    },
    create: {
      organizationId,
      docType,
      fiscalYear,
      prefix: `${prefixBase}-${fiscalYear}-`,
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
