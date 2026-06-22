// End-to-end test of the Clients API against a LIVE database.
//   node clients-integration-test.mjs   (requires DATABASE_URL + migrations)
import app from './src/app.js';
import { prisma } from './src/config/prisma.js';

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/v1`;
const email = `clients_test_${Date.now()}@example.com`;
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
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

try {
  // Bootstrap an authenticated org.
  const reg = await api('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'Sup3rSecret!', fullName: 'Clients Tester' }),
  });
  token = (await reg.json()).accessToken;

  let acme;
  let globex;

  await test('create requires a name (400)', async () => {
    const res = await api('/clients', { method: 'POST', body: JSON.stringify({ type: 'company' }) });
    assert(res.status === 400, `expected 400, got ${res.status}`);
  });

  await test('create client', async () => {
    const res = await api('/clients', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme Corp', type: 'company', email: 'billing@acme.test' }),
    });
    assert(res.status === 201, `expected 201, got ${res.status}`);
    acme = await res.json();
    assert(acme.id && acme.name === 'Acme Corp', 'unexpected body');
  });

  await test('create a second client', async () => {
    const res = await api('/clients', {
      method: 'POST',
      body: JSON.stringify({ name: 'Globex LLC', type: 'company' }),
    });
    globex = await res.json();
    assert(res.status === 201, `expected 201, got ${res.status}`);
  });

  await test('list returns both clients', async () => {
    const res = await api('/clients');
    const body = await res.json();
    assert(res.status === 200, `expected 200, got ${res.status}`);
    assert(body.total === 2, `expected total 2, got ${body.total}`);
  });

  await test('search by name (case-insensitive) finds one', async () => {
    const res = await api('/clients?search=acme');
    const body = await res.json();
    assert(body.total === 1, `expected 1, got ${body.total}`);
    assert(body.data[0].name === 'Acme Corp', 'wrong match');
  });

  await test('search by email finds one', async () => {
    const res = await api('/clients?search=billing@acme');
    const body = await res.json();
    assert(body.total === 1, `expected 1, got ${body.total}`);
  });

  await test('search with no match returns empty', async () => {
    const res = await api('/clients?search=zzz-nope');
    const body = await res.json();
    assert(body.total === 0, `expected 0, got ${body.total}`);
  });

  await test('get a single client', async () => {
    const res = await api(`/clients/${acme.id}`);
    assert(res.status === 200, `expected 200, got ${res.status}`);
  });

  await test('update a client', async () => {
    const res = await api(`/clients/${acme.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Acme Corporation', notes: 'VIP' }),
    });
    const body = await res.json();
    assert(res.status === 200, `expected 200, got ${res.status}`);
    assert(body.name === 'Acme Corporation', 'name not updated');
  });

  await test('delete (no invoices) hard-deletes', async () => {
    const res = await api(`/clients/${globex.id}`, { method: 'DELETE' });
    assert(res.status === 204, `expected 204, got ${res.status}`);
    const after = await api('/clients');
    assert((await after.json()).total === 1, 'client not removed');
  });

  await test('get a deleted client returns 404', async () => {
    const res = await api(`/clients/${globex.id}`);
    assert(res.status === 404, `expected 404, got ${res.status}`);
  });

  await test('create with billing address round-trips', async () => {
    const res = await api('/clients', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Addressed Co',
        type: 'company',
        billingAddress: { line1: '1 Main St', city: 'Austin', postalCode: '73301', countryCode: 'US' },
      }),
    });
    assert(res.status === 201, `expected 201, got ${res.status}`);
    const body = await res.json();
    assert(body.billingAddress?.city === 'Austin', 'billing address not persisted');
    assert(body.billingAddress?.countryCode === 'US', 'country not persisted');
  });

  // Cleanup: remove org + user created for this run.
  const me = await (await api('/auth/me')).json();
  await prisma.client.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.user.deleteMany({ where: { email } });
} finally {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
