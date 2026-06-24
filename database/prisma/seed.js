import { PrismaClient } from '@prisma/client';
import { CLIENTS, PRODUCTS, mulberry32 } from './seed-data.js';

const prisma = new PrismaClient();

// Fixed IDs so re-seeding is idempotent and the demo login is stable.
const ORG_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-0000000000a1';
const DEMO_EMAIL = 'demo@smartinvoice.pro';
// bcrypt hash of "Demo1234!" (10 rounds).
const DEMO_PASSWORD_HASH = '$2a$10$2A8Nmvpo16ZUMlERF51rPu9xhnJ/Y1i/iQcOuEoZPS.ydwlugTGbu';

const rand = mulberry32(20260622);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randint = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

// A date `monthsBack` months ago, on `day`, at `hour` local time.
function dateMonthsAgo(monthsBack, day = 15, hour = 10) {
  const d = new Date();
  d.setHours(hour, randint(0, 59), 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsBack);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}
const addDays = (date, days) => new Date(date.getTime() + days * 86400000);

// Mirror of backend/src/utils/totals.js, in cents.
function computeTotals(items) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  const lines = items.map((item, index) => {
    const gross = Math.round(item.quantity * item.unitPrice);
    const discount = Math.round((gross * (item.discountBps || 0)) / 10000);
    const lineSubtotal = gross - discount;
    const lineTax = Math.round((lineSubtotal * (item.taxBps || 0)) / 10000);
    const lineTotal = lineSubtotal + lineTax;
    subtotal += gross;
    discountTotal += discount;
    taxTotal += lineTax;
    return {
      organizationId: ORG_ID,
      productId: item.productId ?? null,
      description: item.description,
      quantity: item.quantity,
      unitPrice: BigInt(Math.round(item.unitPrice)),
      taxRateBasisPoints: item.taxBps || 0,
      discountBasisPoints: item.discountBps || 0,
      lineSubtotal: BigInt(lineSubtotal),
      lineTax: BigInt(lineTax),
      lineTotal: BigInt(lineTotal),
      position: index,
    };
  });
  return {
    lines,
    subtotal: BigInt(subtotal),
    discountTotal: BigInt(discountTotal),
    taxTotal: BigInt(taxTotal),
    total: BigInt(subtotal - discountTotal + taxTotal),
  };
}

// Remove any previously-seeded demo data for this org so the script is re-runnable.
async function cleanOrg() {
  const org = { organizationId: ORG_ID };
  await prisma.notification.deleteMany({ where: org });
  await prisma.auditLog.deleteMany({ where: org });
  await prisma.stockMovement.deleteMany({ where: org });
  await prisma.payment.deleteMany({ where: org });
  await prisma.creditNote.deleteMany({ where: org });
  await prisma.invoiceItem.deleteMany({ where: org });
  await prisma.invoice.deleteMany({ where: org });
  await prisma.quoteItem.deleteMany({ where: org });
  await prisma.quote.deleteMany({ where: org });
  await prisma.product.deleteMany({ where: org });
  await prisma.taxRate.deleteMany({ where: org });
  await prisma.numberingSeries.deleteMany({ where: org });
  await prisma.client.deleteMany({ where: org });
  await prisma.subscription.deleteMany({ where: org });
  await prisma.expense.deleteMany({ where: org });
  await prisma.recurringInvoice.deleteMany({ where: org });
}

async function main() {
  // ---- Subscription plans (global) ----
  const plans = [
    { code: 'free', name: 'Free', priceMinor: 0n, limits: { invoicesPerMonth: 5, users: 1, storageMb: 100 }, features: { recurring: false, multiCurrency: false } },
    { code: 'pro', name: 'Pro', priceMinor: 1500n, limits: { invoicesPerMonth: 200, users: 5, storageMb: 5000 }, features: { recurring: true, multiCurrency: true } },
    { code: 'business', name: 'Business', priceMinor: 4900n, limits: { invoicesPerMonth: -1, users: 25, storageMb: 50000 }, features: { recurring: true, multiCurrency: true, api: true } },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({ where: { code: plan.code }, update: plan, create: plan });
  }

  // ---- Organization + owner user + membership ----
  const org = await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: { name: 'Acme Studio', baseCurrency: 'USD', countryCode: 'US', defaultPaymentTermsDays: 30 },
    create: {
      id: ORG_ID,
      name: 'Acme Studio',
      legalTaxId: 'US-99-0001234',
      baseCurrency: 'USD',
      countryCode: 'US',
      defaultPaymentTermsDays: 30,
      timezone: 'America/New_York',
    },
  });

  await cleanOrg();

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash: DEMO_PASSWORD_HASH, fullName: 'Alex Morgan', isEmailVerified: true },
    create: {
      id: USER_ID,
      email: DEMO_EMAIL,
      passwordHash: DEMO_PASSWORD_HASH,
      fullName: 'Alex Morgan',
      isEmailVerified: true,
    },
  });

  await prisma.membership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: { role: 'owner', status: 'active' },
    create: { organizationId: org.id, userId: user.id, role: 'owner', status: 'active' },
  });

  const proPlan = await prisma.plan.findUnique({ where: { code: 'pro' } });
  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      planId: proPlan.id,
      status: 'active',
      currentPeriodEnd: addDays(new Date(), 21),
    },
  });

  // ---- Tax rates ----
  const taxStandard = await prisma.taxRate.create({
    data: { organizationId: org.id, name: 'Sales Tax 10%', rateBasisPoints: 1000, countryCode: 'US' },
  });
  await prisma.taxRate.create({
    data: { organizationId: org.id, name: 'Tax Exempt', rateBasisPoints: 0, countryCode: 'US' },
  });

  // ---- Clients ----
  const clientRecords = [];
  for (let i = 0; i < CLIENTS.length; i += 1) {
    const c = CLIENTS[i];
    const created = await prisma.client.create({
      data: {
        organizationId: org.id,
        type: c.type,
        name: c.name,
        email: c.email,
        taxId: c.taxId,
        preferredCurrency: 'USD',
        preferredLanguage: 'en',
        billingAddress: {
          line1: `${randint(100, 9000)} ${pick(['Market', 'Main', 'Oak', 'Pine', 'Commerce', 'Lake'])} St`,
          city: c.city,
          state: c.state,
          postalCode: String(randint(10000, 99999)),
          country: 'US',
        },
        createdAt: dateMonthsAgo(randint(6, 13), randint(1, 28)),
      },
    });
    clientRecords.push(created);
  }

  // ---- Products + initial inventory ----
  const productRecords = [];
  const stockState = new Map(); // productId -> { received, threshold, movements: [] }
  for (const p of PRODUCTS) {
    const tracked = Boolean(p.track);
    const created = await prisma.product.create({
      data: {
        organizationId: org.id,
        name: p.name,
        description: `${p.name} — ${p.category}`,
        sku: p.sku,
        unitPrice: BigInt(p.price),
        currency: 'USD',
        taxRateId: p.taxBps > 0 ? taxStandard.id : null,
        unit: p.unit,
        category: p.category,
        isActive: true,
        trackInventory: tracked,
        stockQuantity: tracked ? p.received : 0,
        lowStockThreshold: tracked ? p.threshold : 0,
        createdAt: dateMonthsAgo(randint(10, 13), randint(1, 28)),
      },
    });
    created._meta = p;
    productRecords.push(created);
    if (tracked) {
      const receivedDate = dateMonthsAgo(12, randint(1, 10), 9);
      stockState.set(created.id, {
        received: p.received,
        threshold: p.threshold,
        movements: [
          { type: 'in', qty: p.received, date: receivedDate, reason: 'Initial stock received', reference: 'PO-OPENING' },
        ],
      });
    }
  }
  const trackedProducts = productRecords.filter((p) => p._meta.track);
  const serviceProducts = productRecords.filter((p) => !p._meta.track);

  // ---- Invoices ----
  // Explicit (status, monthsBack) specs: 10 paid, 3 partially_paid, 2 overdue,
  // 2 viewed, 4 sent, 3 draft, 1 cancelled = 25. The paid + partially_paid set
  // spans all 12 months so the revenue trend chart has no empty buckets.
  const INVOICE_SPECS = [
    { status: 'paid', monthsBack: 11 },
    { status: 'paid', monthsBack: 10 },
    { status: 'paid', monthsBack: 9 },
    { status: 'cancelled', monthsBack: 9 },
    { status: 'paid', monthsBack: 8 },
    { status: 'paid', monthsBack: 7 },
    { status: 'partially_paid', monthsBack: 6 },
    { status: 'paid', monthsBack: 6 },
    { status: 'overdue', monthsBack: 5 },
    { status: 'paid', monthsBack: 5 },
    { status: 'paid', monthsBack: 4 },
    { status: 'overdue', monthsBack: 3 },
    { status: 'partially_paid', monthsBack: 3 },
    { status: 'paid', monthsBack: 3 },
    { status: 'paid', monthsBack: 2 },
    { status: 'sent', monthsBack: 2 },
    { status: 'paid', monthsBack: 1 },
    { status: 'viewed', monthsBack: 1 },
    { status: 'sent', monthsBack: 1 },
    { status: 'partially_paid', monthsBack: 0 },
    { status: 'sent', monthsBack: 0 },
    { status: 'viewed', monthsBack: 0 },
    { status: 'sent', monthsBack: 0 },
    { status: 'draft', monthsBack: 0 },
    { status: 'draft', monthsBack: 1 },
  ];
  const INVOICE_COUNT = INVOICE_SPECS.length;

  let invSeq2025 = 0;
  let invSeq2026 = 0;
  const invoiceNumber = (date) => {
    const y = date.getFullYear();
    const n = y === 2026 ? (invSeq2026 += 1) : (invSeq2025 += 1);
    return `INV-${y}-${String(n).padStart(4, '0')}`;
  };

  const payments = [];
  const notifications = [];
  const auditLogs = [];

  const buildLineItems = () => {
    const lineCount = randint(1, 4);
    const items = [];
    const used = new Set();
    for (let l = 0; l < lineCount; l += 1) {
      // Bias slightly toward services for higher invoice values.
      const pool = rand() < 0.55 ? serviceProducts : trackedProducts;
      const prod = pick(pool);
      if (used.has(prod.id)) continue;
      used.add(prod.id);
      const qty = prod._meta.track
        ? randint(1, 12)
        : ['hour', 'page', 'day'].includes(prod._meta.unit)
          ? randint(2, 40)
          : randint(1, 3);
      items.push({
        productId: prod.id,
        description: prod.name,
        quantity: qty,
        unitPrice: prod._meta.price,
        taxBps: prod._meta.taxBps,
        discountBps: rand() < 0.2 ? pick([500, 1000]) : 0,
      });
    }
    return items;
  };

  for (let i = 0; i < INVOICE_COUNT; i += 1) {
    const { status, monthsBack } = INVOICE_SPECS[i];
    const client = clientRecords[i % clientRecords.length];
    const issueDate = dateMonthsAgo(monthsBack, randint(2, 26));
    const totals = computeTotals(buildLineItems());
    const total = Number(totals.total);
    const isDraft = status === 'draft';
    const dueDate = addDays(issueDate, 30);

    // Determine paid amount per status.
    let amountPaid = 0;
    if (status === 'paid') amountPaid = total;
    else if (status === 'partially_paid') amountPaid = Math.round(total * (randint(35, 65) / 100));
    const balanceDue = total - amountPaid;

    const number = isDraft ? null : invoiceNumber(issueDate);

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: client.id,
        number,
        status,
        issueDate: isDraft ? null : issueDate,
        dueDate: isDraft ? null : dueDate,
        currency: 'USD',
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        amountPaid: BigInt(amountPaid),
        balanceDue: BigInt(balanceDue),
        notes: pick(['Thank you for your business.', 'Net 30 terms apply.', 'Please reference the invoice number on payment.', null]),
        footer: 'Acme Studio · 500 Innovation Way · Austin, TX',
        issuedAt: isDraft ? null : issueDate,
        createdAt: issueDate,
        updatedAt: issueDate,
        items: { create: totals.lines },
      },
      include: { items: true },
    });

    // Stock consumption for issued (non-draft) invoices with tracked products.
    if (!isDraft) {
      for (const item of invoice.items) {
        if (!item.productId) continue;
        const st = stockState.get(item.productId);
        if (!st) continue;
        st.movements.push({
          type: 'out',
          qty: -Math.abs(Number(item.quantity)),
          date: issueDate,
          reason: 'Invoice issued',
          reference: number,
        });
      }
    }

    // Audit + activity for issued invoices.
    if (!isDraft) {
      auditLogs.push({ organizationId: org.id, actorUserId: user.id, action: 'invoice.issued', entityType: 'invoice', entityId: invoice.id, metadata: { number }, createdAt: issueDate });
      notifications.push({ organizationId: org.id, userId: user.id, type: 'invoice_issued', payload: { invoiceId: invoice.id, number }, createdAt: issueDate, readAt: monthsBack > 1 ? addDays(issueDate, 1) : null });
    }

    // Payments.
    const methods = ['card', 'bank_transfer', 'paypal', 'cheque', 'cash'];
    if (status === 'paid') {
      // ~40% of paid invoices are split into two installments.
      if (rand() < 0.4 && total > 20000) {
        const first = Math.round(total * 0.6);
        const p1 = addDays(issueDate, randint(3, 12));
        const p2 = addDays(issueDate, randint(15, 28));
        payments.push(mkPayment(org.id, invoice, first, pick(methods), p1));
        payments.push(mkPayment(org.id, invoice, total - first, pick(methods), p2));
        pushPaymentActivity(notifications, auditLogs, org.id, user.id, invoice, number, total - first, p2);
      } else {
        const pd = addDays(issueDate, randint(2, 20));
        payments.push(mkPayment(org.id, invoice, total, pick(methods), pd));
        pushPaymentActivity(notifications, auditLogs, org.id, user.id, invoice, number, total, pd);
      }
    } else if (status === 'partially_paid') {
      const pd = addDays(issueDate, randint(5, 20));
      payments.push(mkPayment(org.id, invoice, amountPaid, pick(methods), pd));
      pushPaymentActivity(notifications, auditLogs, org.id, user.id, invoice, number, amountPaid, pd);
    } else if (status === 'cancelled') {
      await prisma.creditNote.create({
        data: { organizationId: org.id, invoiceId: invoice.id, number: `CN-${issueDate.getFullYear()}-0001`, reason: 'Order cancelled by client', total: totals.total, issuedAt: addDays(issueDate, 5) },
      });
    }
  }

  // Non-succeeded payments on outstanding invoices for realistic reporting,
  // topping the payment ledger up to exactly 20 records.
  const TARGET_PAYMENTS = 20;
  const needExtra = Math.max(0, TARGET_PAYMENTS - payments.length);
  const outstandingInvoices = await prisma.invoice.findMany({
    where: { organizationId: org.id, status: { in: ['sent', 'viewed', 'overdue'] } },
    take: needExtra,
  });
  const extraStatuses = ['pending', 'failed', 'refunded'];
  outstandingInvoices.forEach((inv, idx) => {
    const when = addDays(inv.issueDate || new Date(), randint(1, 6));
    payments.push({
      organizationId: org.id,
      invoiceId: inv.id,
      amount: inv.total,
      currency: 'USD',
      method: pick(['card', 'paypal', 'bank_transfer']),
      status: extraStatuses[idx % extraStatuses.length],
      gateway: 'stripe',
      paidAt: extraStatuses[idx % extraStatuses.length] === 'refunded' ? when : null,
      reference: `TXN-${randint(100000, 999999)}`,
      createdAt: when,
      updatedAt: when,
    });
  });

  // Persist all payments.
  for (const pmt of payments) {
    await prisma.payment.create({ data: pmt });
  }

  // ---- Quotes (10) ----
  // 1 draft, 3 sent, 3 accepted, 2 declined, 1 expired.
  const QUOTE_SCHEDULE = ['accepted', 'accepted', 'accepted', 'declined', 'declined', 'expired', 'sent', 'sent', 'sent', 'draft'];
  let quoteSeq2025 = 0;
  let quoteSeq2026 = 0;
  for (let i = 0; i < QUOTE_SCHEDULE.length; i += 1) {
    const status = QUOTE_SCHEDULE[i];
    const monthsBack = Math.max(0, 10 - i);
    const issueDate = dateMonthsAgo(monthsBack, randint(2, 26));
    const client = clientRecords[(i + 3) % clientRecords.length];
    const items = buildLineItems();
    const totals = computeTotals(items);
    const isDraft = status === 'draft';
    const y = issueDate.getFullYear();
    const n = y === 2026 ? (quoteSeq2026 += 1) : (quoteSeq2025 += 1);
    const number = isDraft ? null : `QUO-${y}-${String(n).padStart(4, '0')}`;

    await prisma.quote.create({
      data: {
        organizationId: org.id,
        clientId: client.id,
        number,
        status,
        issueDate: isDraft ? null : issueDate,
        validUntil: addDays(issueDate, 30),
        currency: 'USD',
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        acceptedAt: status === 'accepted' ? addDays(issueDate, randint(2, 14)) : null,
        declinedAt: status === 'declined' ? addDays(issueDate, randint(2, 14)) : null,
        createdAt: issueDate,
        updatedAt: issueDate,
        items: {
          create: totals.lines.map((l) => ({
            organizationId: org.id,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRateBasisPoints: l.taxRateBasisPoints,
            lineTotal: l.lineTotal,
            position: l.position,
          })),
        },
      },
    });
  }

  // ---- Inventory: adjustments + persist stock movements, reconcile final stock ----
  // Force a few products below their threshold via a stock-count correction so the
  // dashboard shows meaningful low-stock alerts.
  const lowStockTargets = trackedProducts.slice(0, 4);
  for (const prod of trackedProducts) {
    const st = stockState.get(prod.id);
    // Run movements chronologically to compute resulting stock at each step.
    st.movements.sort((a, b) => a.date - b.date);
    let running = 0;
    for (const mv of st.movements) {
      running += mv.qty;
    }
    // Occasional adjustment for realism / forced low stock.
    const forceLow = lowStockTargets.includes(prod);
    if (forceLow || rand() < 0.25) {
      const target = forceLow ? Math.max(0, st.threshold - randint(1, 3)) : Math.max(0, running - randint(1, 8));
      const delta = target - running;
      if (delta !== 0) {
        st.movements.push({
          type: 'adjustment',
          qty: delta,
          date: dateMonthsAgo(randint(0, 1), randint(1, 26)),
          reason: forceLow ? 'Cycle count correction' : 'Damaged goods write-off',
          reference: 'ADJ',
        });
        running = target;
      }
    }

    // Re-sort with the adjustment included and compute running resultingStock.
    st.movements.sort((a, b) => a.date - b.date);
    let stock = 0;
    for (const mv of st.movements) {
      stock += mv.qty;
      await prisma.stockMovement.create({
        data: {
          organizationId: org.id,
          productId: prod.id,
          type: mv.type,
          quantity: mv.qty,
          resultingStock: stock,
          reason: mv.reason,
          reference: mv.reference,
          createdAt: mv.date,
        },
      });
    }
    await prisma.product.update({ where: { id: prod.id }, data: { stockQuantity: Math.max(0, stock) } });
  }

  // Low-stock notifications for products at/below threshold.
  const lowNow = await prisma.product.findMany({
    where: { organizationId: org.id, trackInventory: true },
  });
  for (const p of lowNow.filter((p) => p.stockQuantity <= p.lowStockThreshold)) {
    notifications.push({
      organizationId: org.id,
      userId: user.id,
      type: 'low_stock',
      payload: { productId: p.id, name: p.name, stock: p.stockQuantity, threshold: p.lowStockThreshold },
      createdAt: dateMonthsAgo(0, randint(1, 20)),
      readAt: null,
    });
  }

  // A couple of client.created audit entries.
  for (const c of clientRecords.slice(0, 5)) {
    auditLogs.push({ organizationId: org.id, actorUserId: user.id, action: 'client.created', entityType: 'client', entityId: c.id, metadata: { name: c.name }, createdAt: c.createdAt });
  }

  // ---- Expenses (so profit analytics & financial reports have real data) ----
  const EXPENSE_CATEGORIES = [
    { category: 'Software', vendors: ['Figma', 'GitHub', 'Vercel', 'AWS'], min: 2900, max: 49900 },
    { category: 'Office', vendors: ['WeWork', 'Staples'], min: 5000, max: 180000 },
    { category: 'Marketing', vendors: ['Google Ads', 'Meta', 'Mailchimp'], min: 10000, max: 250000 },
    { category: 'Payroll', vendors: ['Gusto'], min: 400000, max: 900000 },
    { category: 'Travel', vendors: ['Delta', 'Uber', 'Marriott'], min: 8000, max: 220000 },
    { category: 'Utilities', vendors: ['Comcast', 'PG&E'], min: 6000, max: 40000 },
    { category: 'Equipment', vendors: ['Apple', 'Dell'], min: 50000, max: 350000 },
    { category: 'Professional fees', vendors: ['Baker Legal', 'Ernst Accounting'], min: 30000, max: 200000 },
  ];
  const expenseRows = [];
  // 2–4 expenses per month across the last 12 months.
  for (let m = 11; m >= 0; m -= 1) {
    const count = randint(2, 4);
    for (let i = 0; i < count; i += 1) {
      const cat = pick(EXPENSE_CATEGORIES);
      const amount = randint(cat.min, cat.max);
      const date = dateMonthsAgo(m, randint(1, 27));
      expenseRows.push({
        organizationId: org.id,
        category: cat.category,
        vendor: pick(cat.vendors),
        description: `${cat.category} — ${pick(['monthly', 'one-off', 'quarterly', 'recurring'])}`,
        amount: BigInt(amount),
        taxAmount: BigInt(Math.round(amount * 0.1)),
        currency: 'USD',
        date,
        createdAt: date,
        updatedAt: date,
      });
    }
  }
  await prisma.expense.createMany({ data: expenseRows });

  // ---- Recurring invoice schedules ----
  // nextRunAt is set in the future so they appear as upcoming on the Recurring
  // page without auto-generating invoices on seed.
  const dayMs = 86400000;
  const RECURRING = [
    { clientIdx: 7, frequency: 'monthly', dueInDays: 30, status: 'active', nextInDays: 8, occurrences: 6, items: [{ description: 'Monthly marketing retainer', quantity: 1, unitPrice: 200000, taxRateBasisPoints: 1000, discountBasisPoints: 0 }] },
    { clientIdx: 0, frequency: 'weekly', dueInDays: 14, status: 'active', nextInDays: 3, occurrences: 18, items: [{ description: 'Managed support (5 hrs/week)', quantity: 5, unitPrice: 11000, taxRateBasisPoints: 0, discountBasisPoints: 0 }] },
    { clientIdx: 5, frequency: 'quarterly', dueInDays: 30, status: 'active', nextInDays: 26, occurrences: 3, items: [{ description: 'Cloud hosting (quarterly)', quantity: 3, unitPrice: 9900, taxRateBasisPoints: 1000, discountBasisPoints: 0 }, { description: 'Priority SLA', quantity: 1, unitPrice: 45000, taxRateBasisPoints: 1000, discountBasisPoints: 0 }] },
    { clientIdx: 12, frequency: 'yearly', dueInDays: 45, status: 'paused', nextInDays: 120, occurrences: 1, items: [{ description: 'Annual maintenance & licensing', quantity: 1, unitPrice: 600000, taxRateBasisPoints: 1000, discountBasisPoints: 0 }] },
  ];
  for (const r of RECURRING) {
    const nextRunAt = new Date(Date.now() + r.nextInDays * dayMs);
    nextRunAt.setHours(0, 0, 0, 0);
    const startDate = dateMonthsAgo(r.occurrences + 1, 1, 0);
    await prisma.recurringInvoice.create({
      data: {
        organizationId: org.id,
        clientId: clientRecords[r.clientIdx].id,
        frequency: r.frequency,
        status: r.status,
        currency: 'USD',
        items: r.items,
        dueInDays: r.dueInDays,
        autoIssue: true,
        startDate,
        nextRunAt,
        lastRunAt: r.occurrences > 0 ? new Date(Date.now() - r.nextInDays * dayMs) : null,
        occurrences: r.occurrences,
      },
    });
  }

  // ---- Persist notifications + audit logs ----
  await prisma.notification.createMany({ data: notifications });
  await prisma.auditLog.createMany({ data: auditLogs });

  // ---- Advance numbering series so the app continues without collisions ----
  const seriesPlan = [
    { docType: 'invoice', year: 2025, next: invSeq2025 + 1, prefix: 'INV-2025-' },
    { docType: 'invoice', year: 2026, next: invSeq2026 + 1, prefix: 'INV-2026-' },
    { docType: 'quote', year: 2025, next: quoteSeq2025 + 1, prefix: 'QUO-2025-' },
    { docType: 'quote', year: 2026, next: quoteSeq2026 + 1, prefix: 'QUO-2026-' },
  ];
  for (const s of seriesPlan) {
    if (s.next <= 1) continue;
    await prisma.numberingSeries.create({
      data: { organizationId: org.id, docType: s.docType, fiscalYear: s.year, prefix: s.prefix, nextNumber: BigInt(s.next), padding: 4 },
    });
  }

  // ---- Summary ----
  const [clients, products, invoices, quotes, paid, lowStock] = await Promise.all([
    prisma.client.count({ where: { organizationId: org.id } }),
    prisma.product.count({ where: { organizationId: org.id } }),
    prisma.invoice.count({ where: { organizationId: org.id } }),
    prisma.quote.count({ where: { organizationId: org.id } }),
    prisma.payment.count({ where: { organizationId: org.id, status: 'succeeded' } }),
    lowNow.filter((p) => p.stockQuantity <= p.lowStockThreshold).length,
  ]);
  const revenue = await prisma.payment.aggregate({ where: { organizationId: org.id, status: 'succeeded' }, _sum: { amount: true } });

  /* eslint-disable no-console */
  console.log('\n  SmartInvoice Pro — demo data seeded');
  console.log('  ──────────────────────────────────');
  console.log(`  Login:        ${DEMO_EMAIL} / Demo1234!`);
  console.log(`  Clients:      ${clients}`);
  console.log(`  Products:     ${products}`);
  console.log(`  Invoices:     ${invoices}`);
  console.log(`  Quotes:       ${quotes}`);
  console.log(`  Payments:     ${payments.length} (${paid} succeeded)`);
  console.log(`  Low-stock:    ${lowStock} products`);
  console.log(`  Revenue:      $${(Number(revenue._sum.amount || 0) / 100).toLocaleString()}`);
  console.log('  ──────────────────────────────────\n');
  /* eslint-enable no-console */
}

// Helpers ---------------------------------------------------------------

function mkPayment(organizationId, invoice, amount, method, paidAt) {
  return {
    organizationId,
    invoiceId: invoice.id,
    amount: BigInt(amount),
    currency: 'USD',
    method,
    status: 'succeeded',
    gateway: method === 'card' || method === 'paypal' ? 'stripe' : 'manual',
    gatewayPaymentId: method === 'card' || method === 'paypal' ? `pi_${Math.random().toString(36).slice(2, 12)}` : null,
    paidAt,
    reference: `PMT-${Math.floor(100000 + Math.random() * 899999)}`,
    createdAt: paidAt,
    updatedAt: paidAt,
  };
}

function pushPaymentActivity(notifications, auditLogs, organizationId, userId, invoice, number, amount, when) {
  notifications.push({
    organizationId,
    userId,
    type: 'payment_received',
    payload: { invoiceId: invoice.id, number, amount, currency: 'USD' },
    createdAt: when,
    readAt: null,
  });
  auditLogs.push({
    organizationId,
    actorUserId: userId,
    action: 'payment.recorded',
    entityType: 'payment',
    entityId: invoice.id,
    metadata: { number, amount },
    createdAt: when,
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
