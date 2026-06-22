// End-to-end test of Payments + Analytics against a LIVE database.
//   NODE_ENV=test node payments-analytics-integration-test.mjs
import app from './src/app.js';
import { prisma } from './src/config/prisma.js';

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/v1`;
const email = `pay_test_${Date.now()}@example.com`;
let passed = 0;
let failed = 0;
let token;

const api = (path, opts = {}) =>
  fetch(base + path, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
const json = (res) => res.json();
async function test(name, fn) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
    passed += 1;
  } catch (err) {
    console.log(`FAIL  ${name}\n      ${err.message}`);
    failed += 1;
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

try {
  token = (
    await json(
      await api('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'Sup3rSecret!', fullName: 'Pay Tester' }),
      }),
    )
  ).accessToken;

  const client = await json(
    await api('/clients', { method: 'POST', body: JSON.stringify({ name: 'Pay Client' }) }),
  );

  let invoice;

  await test('create + issue an invoice (total 10000)', async () => {
    const created = await json(
      await api('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          clientId: client.id,
          currency: 'USD',
          items: [{ description: 'Service', quantity: 1, unitPrice: 10000, taxRateBasisPoints: 0 }],
        }),
      }),
    );
    assert(created.total === '10000', `total ${created.total}`);
    const issued = await api(`/invoices/${created.id}/issue`, { method: 'POST' });
    assert(issued.status === 200, `issue status ${issued.status}`);
    invoice = await issued.json();
    assert(invoice.number, 'no invoice number assigned');
    assert(invoice.status === 'sent', `status ${invoice.status}`);
  });

  await test('cannot record payment exceeding balance (400)', async () => {
    const res = await api(`/payments/invoice/${invoice.id}`, {
      method: 'POST',
      body: JSON.stringify({ amount: 99999, method: 'bank_transfer' }),
    });
    assert(res.status === 400, `expected 400, got ${res.status}`);
  });

  let firstPayment;
  await test('partial payment marks invoice partially_paid', async () => {
    const res = await api(`/payments/invoice/${invoice.id}`, {
      method: 'POST',
      body: JSON.stringify({ amount: 4000, method: 'bank_transfer' }),
    });
    assert(res.status === 201, `expected 201, got ${res.status}`);
    const body = await res.json();
    firstPayment = body.payment;
    assert(body.invoice.status === 'partially_paid', `status ${body.invoice.status}`);
    assert(body.invoice.balanceDue === '6000', `balance ${body.invoice.balanceDue}`);
  });

  await test('final payment marks invoice paid', async () => {
    const res = await api(`/payments/invoice/${invoice.id}`, {
      method: 'POST',
      body: JSON.stringify({ amount: 6000, method: 'cash' }),
    });
    const body = await res.json();
    assert(body.invoice.status === 'paid', `status ${body.invoice.status}`);
    assert(body.invoice.balanceDue === '0', `balance ${body.invoice.balanceDue}`);
  });

  await test('invoice payment history lists 2 payments', async () => {
    const list = await json(await api(`/payments/invoice/${invoice.id}`));
    assert(Array.isArray(list) && list.length === 2, `got ${list.length}`);
  });

  await test('refund restores balance and status', async () => {
    const res = await api(`/payments/${firstPayment.id}/refund`, { method: 'POST' });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.invoice.status === 'partially_paid', `status ${body.invoice.status}`);
    assert(body.invoice.balanceDue === '4000', `balance ${body.invoice.balanceDue}`);
  });

  await test('dashboard summary reflects revenue + counts', async () => {
    const d = await json(await api('/analytics/dashboard'));
    // Only the 6000 "cash" payment remains succeeded after the refund.
    assert(d.revenue === 6000, `revenue ${d.revenue}`);
    assert(d.counts.clients >= 1, 'client count');
    assert(d.counts.invoices >= 1, 'invoice count');
    assert(d.invoicesByStatus.partially_paid, 'expected partially_paid bucket');
  });

  await test('monthly revenue returns 12 buckets with current month total', async () => {
    const months = await json(await api('/analytics/revenue/monthly'));
    assert(months.length === 12, `got ${months.length}`);
    assert(months[months.length - 1].revenue === 6000, `current ${months.at(-1).revenue}`);
  });

  await test('revenue report aggregates by method', async () => {
    const r = await json(await api('/analytics/reports/revenue'));
    assert(r.total === 6000, `total ${r.total}`);
    assert(Array.isArray(r.byMethod), 'byMethod missing');
  });

  // Cleanup
  const me = await json(await api('/auth/me'));
  await prisma.payment.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.invoiceItem.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.invoice.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.client.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.user.deleteMany({ where: { email } });
} finally {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
