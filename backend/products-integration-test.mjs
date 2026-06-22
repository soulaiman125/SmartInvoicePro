// End-to-end test of the Products API against a LIVE database.
//   node products-integration-test.mjs   (requires DATABASE_URL + migrations)
import app from './src/app.js';
import { prisma } from './src/config/prisma.js';

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/v1`;
const email = `products_test_${Date.now()}@example.com`;
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
  const reg = await api('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'Sup3rSecret!', fullName: 'Products Tester' }),
  });
  token = (await reg.json()).accessToken;

  let widget;

  await test('create requires a name (400)', async () => {
    const res = await api('/products', {
      method: 'POST',
      body: JSON.stringify({ currency: 'USD', unitPrice: 100 }),
    });
    assert(res.status === 400, `expected 400, got ${res.status}`);
  });

  await test('create product with all requested fields', async () => {
    const res = await api('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Premium Widget',
        sku: 'WID-001',
        category: 'Hardware',
        unitPrice: 1999,
        currency: 'USD',
        description: 'A premium widget',
        imageUrl: 'https://example.com/widget.png',
      }),
    });
    assert(res.status === 201, `expected 201, got ${res.status}`);
    widget = await res.json();
    assert(widget.unitPrice === '1999', `price should serialize as string, got ${widget.unitPrice}`);
    assert(widget.imageUrl === 'https://example.com/widget.png', 'imageUrl not persisted');
    assert(widget.category === 'Hardware', 'category not persisted');
  });

  await test('create a second product in another category', async () => {
    const res = await api('/products', {
      method: 'POST',
      body: JSON.stringify({ name: 'Consulting Hour', category: 'Services', unitPrice: 12000, currency: 'USD', unit: 'hour' }),
    });
    assert(res.status === 201, `expected 201, got ${res.status}`);
  });

  await test('list returns both products', async () => {
    const body = await (await api('/products')).json();
    assert(body.total === 2, `expected 2, got ${body.total}`);
  });

  await test('search by name finds one', async () => {
    const body = await (await api('/products?search=widget')).json();
    assert(body.total === 1, `expected 1, got ${body.total}`);
  });

  await test('search by SKU finds one', async () => {
    const body = await (await api('/products?search=WID-001')).json();
    assert(body.total === 1, `expected 1, got ${body.total}`);
  });

  await test('filter by category', async () => {
    const body = await (await api('/products?category=Services')).json();
    assert(body.total === 1, `expected 1, got ${body.total}`);
    assert(body.data[0].name === 'Consulting Hour', 'wrong category match');
  });

  await test('categories endpoint lists distinct categories', async () => {
    const res = await api('/products/categories');
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const cats = await res.json();
    assert(Array.isArray(cats), 'expected array');
    assert(cats.includes('Hardware') && cats.includes('Services'), `got ${JSON.stringify(cats)}`);
  });

  await test('get a product by id', async () => {
    const res = await api(`/products/${widget.id}`);
    assert(res.status === 200, `expected 200, got ${res.status}`);
  });

  await test('update a product price and category', async () => {
    const res = await api(`/products/${widget.id}`, {
      method: 'PUT',
      body: JSON.stringify({ unitPrice: 2499, category: 'Gadgets' }),
    });
    const body = await res.json();
    assert(res.status === 200, `expected 200, got ${res.status}`);
    assert(body.unitPrice === '2499', `price not updated, got ${body.unitPrice}`);
    assert(body.category === 'Gadgets', 'category not updated');
  });

  await test('delete soft-disables the product', async () => {
    const res = await api(`/products/${widget.id}`, { method: 'DELETE' });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const after = await (await api(`/products/${widget.id}`)).json();
    assert(after.isActive === false, 'product should be inactive after delete');
  });

  // Cleanup
  const me = await (await api('/auth/me')).json();
  await prisma.product.deleteMany({ where: { organizationId: me.organizationId } });
  await prisma.user.deleteMany({ where: { email } });
} finally {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
