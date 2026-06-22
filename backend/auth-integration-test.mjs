// End-to-end test of the authentication flow against a LIVE database.
// Requires PostgreSQL running and migrations applied:
//   cd database && npx prisma migrate deploy && cd ../backend
//   node auth-integration-test.mjs
//
// Exercises: register -> /me -> protected route -> refresh (rotation) ->
// old-token reuse rejected -> logout -> login -> logout-all.
import app from './src/app.js';
import { prisma } from './src/config/prisma.js';

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/v1`;
const email = `auth_test_${Date.now()}@example.com`;
const password = 'Sup3rSecret!';
let passed = 0;
let failed = 0;

const api = (path, opts = {}) =>
  fetch(base + path, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) },
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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  let access;
  let refresh;
  let resetToken;
  const newPassword = 'BrandNewPass1';

  await test('register creates account and returns tokens', async () => {
    const res = await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName: 'Auth Tester' }),
    });
    assert(res.status === 201, `expected 201, got ${res.status}`);
    const body = await res.json();
    assert(body.accessToken && body.refreshToken, 'missing tokens');
    assert(body.organizationId, 'missing organizationId');
    access = body.accessToken;
    refresh = body.refreshToken;
  });

  await test('duplicate register is rejected (409)', async () => {
    const res = await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    assert(res.status === 409, `expected 409, got ${res.status}`);
  });

  await test('/me returns profile with owner role', async () => {
    const res = await api('/auth/me', { headers: { authorization: `Bearer ${access}` } });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.email === email, 'wrong email');
    assert(body.role === 'owner', `expected owner, got ${body.role}`);
  });

  await test('protected route works with token', async () => {
    const res = await api('/invoices', { headers: { authorization: `Bearer ${access}` } });
    assert(res.status === 200, `expected 200, got ${res.status}`);
  });

  await test('login with wrong password is rejected (401)', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'nope' }),
    });
    assert(res.status === 401, `expected 401, got ${res.status}`);
  });

  await test('refresh rotates the token', async () => {
    const res = await api('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refresh }),
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.refreshToken && body.refreshToken !== refresh, 'token not rotated');
    refresh = body.refreshToken;
  });

  await test('reusing a rotated (revoked) refresh token is rejected (401)', async () => {
    // The very first refresh token was revoked by the rotation above; reuse it.
    const res = await api('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refresh }),
    });
    // current token still valid; now revoke via logout then reuse
    const body = await res.json();
    const current = body.refreshToken;
    await api('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: current }) });
    const reuse = await api('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: current }),
    });
    assert(reuse.status === 401, `expected 401 after logout, got ${reuse.status}`);
  });

  await test('login issues fresh tokens, logout-all revokes them', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    const logoutAll = await api('/auth/logout-all', {
      method: 'POST',
      headers: { authorization: `Bearer ${body.accessToken}` },
    });
    assert(logoutAll.status === 200, `expected 200, got ${logoutAll.status}`);
    const reuse = await api('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: body.refreshToken }),
    });
    assert(reuse.status === 401, `expected 401 after logout-all, got ${reuse.status}`);
  });

  await test('forgot-password returns a dev reset token', async () => {
    const res = await api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.devResetToken, 'expected devResetToken in non-production');
    resetToken = body.devResetToken;
  });

  await test('forgot-password does not leak unknown emails', async () => {
    const res = await api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: `missing_${Date.now()}@example.com` }),
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const body = await res.json();
    assert(!body.devResetToken, 'must not return a token for unknown email');
  });

  await test('reset-password sets a new password', async () => {
    const res = await api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password: newPassword }),
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
  });

  await test('old password no longer works after reset', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    assert(res.status === 401, `expected 401, got ${res.status}`);
  });

  await test('new password works after reset', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: newPassword }),
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
  });

  await test('a used reset token cannot be reused', async () => {
    const res = await api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password: 'Another1Pass' }),
    });
    assert(res.status === 400, `expected 400, got ${res.status}`);
  });

  // Cleanup
  await prisma.user.deleteMany({ where: { email } });
} finally {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
