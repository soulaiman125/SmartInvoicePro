// Money math for invoices/quotes. All amounts are integers in minor units
// (e.g. cents). Quantities may be fractional. Basis points: 2000 = 20.00%.

const round = (n) => Math.round(n);

/**
 * @param {Array<{quantity:number, unitPrice:number|bigint, taxRateBasisPoints?:number, discountBasisPoints?:number}>} items
 */
export function computeDocumentTotals(items) {
  let subtotal = 0; // sum of gross line amounts (qty * unitPrice)
  let discountTotal = 0;
  let taxTotal = 0;

  const lines = items.map((item, index) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const taxBps = Number(item.taxRateBasisPoints) || 0;
    const discountBps = Number(item.discountBasisPoints) || 0;

    const gross = round(quantity * unitPrice);
    const discount = round((gross * discountBps) / 10000);
    const lineSubtotal = gross - discount;
    const lineTax = round((lineSubtotal * taxBps) / 10000);
    const lineTotal = lineSubtotal + lineTax;

    subtotal += gross;
    discountTotal += discount;
    taxTotal += lineTax;

    return {
      description: item.description,
      productId: item.productId ?? null,
      quantity,
      unitPrice: BigInt(round(unitPrice)),
      taxRateBasisPoints: taxBps,
      discountBasisPoints: discountBps,
      lineSubtotal: BigInt(lineSubtotal),
      lineTax: BigInt(lineTax),
      lineTotal: BigInt(lineTotal),
      position: index,
    };
  });

  const total = subtotal - discountTotal + taxTotal;

  return {
    lines,
    subtotal: BigInt(subtotal),
    discountTotal: BigInt(discountTotal),
    taxTotal: BigInt(taxTotal),
    total: BigInt(total),
  };
}
