// Amounts are stored as integer minor units (cents) and serialized as strings.

export function formatMoney(minor, currency = 'USD') {
  const amount = Number(minor) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// "19.99" -> 1999
export function toMinorUnits(major) {
  const n = parseFloat(String(major).replace(',', '.'));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

// 1999 -> "19.99"
export function toMajorUnits(minor) {
  return (Number(minor) / 100).toFixed(2);
}

// Mirrors the backend total computation for a live preview in the forms.
// `lines` use major-unit price strings and percentage strings.
export function previewTotals(lines) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  for (const l of lines) {
    const qty = Number(l.quantity) || 0;
    const unit = toMinorUnits(l.unitPrice || '0');
    const taxBps = Math.round((Number(l.taxPercent) || 0) * 100);
    const discBps = Math.round((Number(l.discountPercent) || 0) * 100);
    const gross = Math.round(qty * unit);
    const discount = Math.round((gross * discBps) / 10000);
    const lineSub = gross - discount;
    const tax = Math.round((lineSub * taxBps) / 10000);
    subtotal += gross;
    discountTotal += discount;
    taxTotal += tax;
  }

  return {
    subtotal,
    discountTotal,
    taxTotal,
    total: subtotal - discountTotal + taxTotal,
  };
}
