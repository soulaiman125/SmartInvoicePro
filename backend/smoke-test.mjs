// Boots the Express app in-process and probes routing/auth/validation.
// Does NOT require a live database (Prisma connects lazily).
import app from './src/app.js';
import { prisma } from './src/config/prisma.js';

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/v1`;
let failures = 0;

async function check(label, path, opts, expected) {
  const res = await fetch(base + path, opts);
  const ok = res.status === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ->  ${res.status} (expected ${expected})`);
}

try {
  await check('health', '/health', {}, 200);
  await check('protected invoices (no token)', '/invoices', {}, 401);
  await check(
    'login missing body',
    '/auth/login',
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
    400,
  );
  await check(
    'signup bad email',
    '/auth/signup',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
    },
    400,
  );
  await check('unknown route', '/does-not-exist', {}, 404);
} finally {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}

console.log(failures === 0 ? '\nALL SMOKE TESTS PASSED' : `\n${failures} SMOKE TEST(S) FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
