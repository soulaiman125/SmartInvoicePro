// Unit tests for the authentication core that need no database:
// password hashing, JWT signing/verification, refresh-token hashing, and RBAC.
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { hashPassword, verifyPassword, sha256 } from './src/utils/password.js';
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './src/utils/jwt.js';
import { authorize } from './src/middleware/rbac.middleware.js';
import { env } from './src/config/env.js';

let passed = 0;
let failed = 0;

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

// --- Password hashing ---
await test('password hash verifies correct password', async () => {
  const hash = await hashPassword('Sup3rSecret!');
  assert.notEqual(hash, 'Sup3rSecret!');
  assert.equal(await verifyPassword('Sup3rSecret!', hash), true);
});

await test('password hash rejects wrong password', async () => {
  const hash = await hashPassword('Sup3rSecret!');
  assert.equal(await verifyPassword('wrong', hash), false);
});

// --- Refresh-token hashing ---
await test('sha256 is deterministic and non-reversible-looking', () => {
  const token = 'a.refresh.token';
  assert.equal(sha256(token), sha256(token));
  assert.notEqual(sha256(token), token);
  assert.equal(sha256(token).length, 64);
});

// --- Access token round-trip with claims ---
await test('access token carries org + role claims', () => {
  const token = signAccessToken({ sub: 'u1', email: 'a@b.co', org: 'org1', role: 'admin' });
  const decoded = verifyAccessToken(token);
  assert.equal(decoded.sub, 'u1');
  assert.equal(decoded.org, 'org1');
  assert.equal(decoded.role, 'admin');
});

// --- Refresh token round-trip ---
await test('refresh token verifies with refresh secret', () => {
  const token = signRefreshToken({ sub: 'u1' });
  const decoded = verifyRefreshToken(token);
  assert.equal(decoded.sub, 'u1');
});

// --- Token isolation: access secret cannot verify refresh token ---
await test('access and refresh secrets are isolated', () => {
  const refreshToken = signRefreshToken({ sub: 'u1' });
  assert.throws(() => verifyAccessToken(refreshToken));
});

// --- Expired token is rejected ---
await test('expired access token is rejected', () => {
  const token = jwt.sign({ sub: 'u1' }, env.jwtSecret, { expiresIn: -10 });
  assert.throws(() => verifyAccessToken(token), /jwt expired/);
});

// --- RBAC middleware ---
function runAuthorize(roles, userRole) {
  const req = { user: userRole ? { role: userRole } : null };
  let nextErr = 'NOT_CALLED';
  authorize(...roles)(req, {}, (err) => {
    nextErr = err || null;
  });
  return nextErr;
}

await test('RBAC allows a permitted role', () => {
  assert.equal(runAuthorize(['owner', 'admin'], 'admin'), null);
});

await test('RBAC forbids a disallowed role (403)', () => {
  const err = runAuthorize(['owner', 'admin'], 'viewer');
  assert.ok(err);
  assert.equal(err.status, 403);
});

await test('RBAC rejects unauthenticated request (401)', () => {
  const err = runAuthorize(['owner'], null);
  assert.ok(err);
  assert.equal(err.status, 401);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
