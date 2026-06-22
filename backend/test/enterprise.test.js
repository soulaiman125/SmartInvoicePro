import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeDocumentTotals } from '../src/utils/totals.js';
import { buildInvoicePdf, buildQuotePdf } from '../src/services/pdf.service.js';
import { toCsv, toXlsx, toPdf } from '../src/services/export.service.js';
import {
  invoiceEmail,
  quoteEmail,
  paymentReminderEmail,
  invoicePaidEmail,
  welcomeEmail,
} from '../src/services/email/templates.js';

// Buffer a PDFKit document the same way the HTTP layer does.
function pdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

const org = {
  name: 'Acme Studio',
  legalTaxId: 'US-99-0001234',
  baseCurrency: 'USD',
  address: { line1: '500 Innovation Way', city: 'Austin', country: 'US' },
  settings: { brandColor: '#4F46E5' },
};

const invoice = {
  number: 'INV-2026-0001',
  status: 'sent',
  currency: 'USD',
  issueDate: new Date('2026-01-10'),
  dueDate: new Date('2026-02-09'),
  subtotal: 100000n,
  discountTotal: 0n,
  taxTotal: 10000n,
  total: 110000n,
  amountPaid: 40000n,
  balanceDue: 70000n,
  notes: 'Thank you for your business.',
  client: { name: 'Nimbus Web Studio', email: 'billing@nimbusweb.io', billingAddress: { line1: '1 Main St', city: 'Austin' } },
  items: [
    { description: 'Website Design', quantity: 1, unitPrice: 100000n, taxRateBasisPoints: 1000, lineTotal: 110000n },
  ],
};

const quote = {
  ...invoice,
  number: 'QUO-2026-0001',
  status: 'sent',
  validUntil: new Date('2026-03-01'),
  total: 110000n,
  taxTotal: 10000n,
  subtotal: 100000n,
};

test('computeDocumentTotals: math with tax + discount', () => {
  const totals = computeDocumentTotals([
    { quantity: 2, unitPrice: 5000, taxRateBasisPoints: 1000, discountBasisPoints: 0 }, // 10000 + 1000 tax
    { quantity: 1, unitPrice: 10000, taxRateBasisPoints: 0, discountBasisPoints: 1000 }, // 10000 - 1000 disc
  ]);
  assert.equal(totals.subtotal, 20000n);
  assert.equal(totals.discountTotal, 1000n);
  assert.equal(totals.taxTotal, 1000n);
  assert.equal(totals.total, 20000n - 1000n + 1000n);
  assert.equal(totals.lines.length, 2);
});

test('buildInvoicePdf: produces a valid PDF (both templates)', async () => {
  for (const template of ['modern', 'classic']) {
    const buf = await pdfBuffer(buildInvoicePdf(invoice, org, { template }));
    assert.equal(buf.subarray(0, 5).toString(), '%PDF-', `${template} should be a PDF`);
    assert.ok(buf.length > 1000);
  }
});

test('buildQuotePdf: produces a valid PDF', async () => {
  const buf = await pdfBuffer(buildQuotePdf(quote, org));
  assert.equal(buf.subarray(0, 5).toString(), '%PDF-');
});

const report = {
  key: 'clients',
  title: 'Client Report',
  currency: 'USD',
  columns: [
    { key: 'name', label: 'Client', type: 'text' },
    { key: 'billed', label: 'Billed', type: 'money' },
    { key: 'due', label: 'Due', type: 'date' },
  ],
  rows: [{ name: 'Nimbus', billed: 150000, due: new Date('2026-02-01') }],
  summary: [{ name: 'Total', billed: 150000, due: null }],
};

test('export toCsv: header + formatted money', () => {
  const csv = toCsv(report);
  const lines = csv.split('\n');
  assert.match(lines[0], /"Client","Billed","Due"/);
  assert.match(lines[1], /"Nimbus","1500.00"/);
  assert.match(csv, /"Total"/);
});

test('export toXlsx: returns an xlsx (zip) buffer', async () => {
  const buf = Buffer.from(await toXlsx(report));
  assert.equal(buf.subarray(0, 2).toString('hex'), '504b'); // PK zip signature
});

test('export toPdf: returns a valid PDF', async () => {
  const buf = await pdfBuffer(toPdf(report, org));
  assert.equal(buf.subarray(0, 5).toString(), '%PDF-');
});

test('email templates: all render a subject + html', () => {
  const cases = [
    invoiceEmail({ org, invoice, client: invoice.client, url: 'http://x/i' }),
    quoteEmail({ org, quote, client: invoice.client, url: 'http://x/q' }),
    paymentReminderEmail({ org, invoice, client: invoice.client, url: 'http://x/i' }),
    invoicePaidEmail({ org, invoice, client: invoice.client, amount: 40000 }),
    welcomeEmail({ org, name: 'Alex', url: 'http://x' }),
  ];
  for (const c of cases) {
    assert.ok(c.subject && c.subject.length > 0);
    assert.match(c.html, /<!doctype html>/i);
    assert.ok(c.text && c.text.length > 0);
  }
});
