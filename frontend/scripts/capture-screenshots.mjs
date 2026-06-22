/*
 * Regenerates the real product screenshots used on the marketing landing page.
 * Captures the live dashboard (logged in as the demo user, against seeded data)
 * in light + dark mode and writes PNGs to public/screenshots/.
 *
 * Usage:
 *   1. Ensure the app is seeded + both dev servers are running (frontend :5173, backend :4000)
 *   2. npm i -D playwright && npx playwright install chromium
 *   3. node scripts/capture-screenshots.mjs
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const OUT = 'public/screenshots';
const VIEW = { width: 1440, height: 900 };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: VIEW,
  deviceScaleFactor: 2,
});
// Skip the one-time splash animation for clean captures.
await ctx.addInitScript(() => {
  try { sessionStorage.setItem('sip-splash-shown', '1'); } catch {}
});
const page = await ctx.newPage();

async function settle(ms = 1400) { await page.waitForTimeout(ms); }

// Login
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'demo@smartinvoice.pro');
await page.fill('input[type=password]', 'Demo1234!');
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard', { timeout: 15000 });
await settle(1800);

const shots = [
  ['/dashboard', 'dashboard'],
  ['/invoices', 'invoices'],
  ['/reports', 'reports'],
  ['/clients', 'clients'],
];

async function isDark() { return page.evaluate(() => document.documentElement.classList.contains('dark')); }
async function setTheme(dark) {
  const cur = await isDark();
  if (cur !== dark) { await page.click('button[aria-label="Toggle theme"]'); await settle(700); }
}

// Light mode captures
await setTheme(false);
for (const [path, name] of shots) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await settle();
  await page.screenshot({ path: `${OUT}/${name}-light.png` });
  console.log(`captured ${name}-light.png`);
}

// Dark mode captures (dashboard + invoices for variety)
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
await setTheme(true);
for (const [path, name] of [['/dashboard','dashboard'],['/invoices','invoices'],['/reports','reports']]) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await settle();
  await page.screenshot({ path: `${OUT}/${name}-dark.png` });
  console.log(`captured ${name}-dark.png`);
}

await browser.close();
console.log('done');
