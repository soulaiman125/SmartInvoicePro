// End-to-end test of PDF generation, Notifications, and Settings.
//   NODE_ENV=test node features-integration-test.mjs
import app from './src/app.js';
import { prisma } from './src/config/prisma.js';

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/v1`;
const email = `features_test_${Date.now()}@example.com`;
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
        body: JSON.stringify({ email, password: 'Sup3rSecret!', fullName: 'Features Tester', organizationName: 'Feature Co' }),
      }),
    )
  ).accessToken;

  // ---- Settings ----
  await test('GET /settings returns the organization', async () => {
    const s = await json(await api('/settings'));
    assert(s.name === 'Feature Co', `name ${s.name}`);
  });

  await test('PUT /settings updates org fields', async () => {
    const s = await json(
      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Feature Co Ltd', baseCurrency: 'EUR', legalTaxId: 'TX-123' }),
      }),
    );
    assert(s.name === 'Feature Co Ltd', `name ${s.name}`);
    assert(s.baseCurrency === 'EUR', `currency ${s.baseCurrency}`);
  });

  // ---- Build an invoice to drive PDFs + notifications ----
  const client = await json(
    await api('/clients', { method: 'POST', body: JSON.stringify({ name: 'PDF Client', email: 'pdf@client.test' }) }),
  );
  const draft = await json(
    await api('/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId: client.id,
        currency: 'USD',
        items: [{ description: 'Design work', quantity: 2, unitPrice: 5000, taxRateBasisPoints: 1000 }],
      }),
    }),
  );
  const invoice = await json(await api(`/invoices/${draft.id}/issue`, { method: 'POST' }));

  // ---- PDF ----
  await test('GET /invoices/:id/pdf returns a valid PDF', async () => {
    const res = await api(`/invoices/${invoice.id}/pdf`);
    assert(res.status === 200, `status ${res.status}`);
    assert((res.headers.get('content-type') || '').includes('application/pdf'), 'wrong content-type');
    const buf = Buffer.from(await res.arrayBuffer());
    assert(buf.subarray(0, 4).toString() === '%PDF', 'not a PDF');
    assert(buf.length > 800, `pdf too small (${buf.length} bytes)`);
  });

  let quote;
  await test('GET /quotations/:id/pdf returns a valid PDF', async () => {
    quote = await json(
      await api('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          clientId: client.id,
          currency: 'USD',
          items: [{ description: 'Estimate', quantity: 1, unitPrice: 25000, taxRateBasisPoints: 0 }],
        }),
      }),
    );
    const res = await api(`/quotations/${quote.id}/pdf`);
    assert(res.status === 200, `status ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    assert(buf.subarray(0, 4).toString() === '%PDF', 'not a PDF');
  });

  // ---- Notifications (invoice_issued already fired) ----
  await test('record payment fires a notification', async () => {
    await api(`/payments/invoice/${invoice.id}`, {
      method: 'POST',
      body: JSON.stringify({ amount: 5000, method: 'bank_transfer' }),
    });
    const list = await json(await api('/notifications'));
    const types = list.data.map((n) => n.type);
    assert(types.includes('invoice_issued'), 'missing invoice_issued');
    assert(types.includes('payment_received'), 'missing payment_received');
  });

  await test('unread count reflects notifications', async () => {
    const { count } = await json(await api('/notifications/unread-count'));
    assert(count >= 2, `expected >=2 unread, got ${count}`);
  });

  await test('mark one notification read decrements unread count', async () => {
    const list = await json(await api('/notifications'));
    const before = (await json(await api('/notifications/unread-count'))).count;
    await api(`/notifications/${list.data[0].id}/read`, { method: 'PATCH' });
    const after = (await json(await api('/notifications/unread-count'))).count;
    assert(after === before - 1, `expected ${before - 1}, got ${after}`);
  });

  await test('mark-all-read clears unread count', async () => {
    await api('/notifications/read-all', { method: 'POST' });
    const { count } = await json(await api('/notifications/unread-count'));
    assert(count === 0, `expected 0, got ${count}`);
  });

  // Cleanup
  const me = await json(await api('/auth/me'));
  await prisma.notification.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.payment.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.invoiceItem.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.quoteItem.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.invoice.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.quote.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.client.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.user.deleteMany({ where: { email } });
} finally {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
