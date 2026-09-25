/**
 * consent-check.mjs — the consent banner and GA4 gating, in a real browser,
 * against the built site.
 *
 * tests/analytics-tracker.test.js checks the same logic in a vm, where the
 * only route to Google is a <script> the code injects. This checks the thing
 * that actually matters under PECR: the network and the cookie jar.
 *
 *   1. Fresh visit: no request to googletagmanager.com or
 *      google-analytics.com, no _ga cookie, banner shown, no layout shift.
 *   2. Accept: gtag.js is requested and a /g/collect hit is attempted.
 *      Collect hits are aborted after they are recorded, so running this does
 *      not send test traffic into the real GA4 property. Needs internet for
 *      gtag.js itself.
 *   3. Reject, then reload: still nothing sent to Google, banner stays gone.
 *
 * Usage:  npm run build && node scripts/consent-check.mjs [path]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const PORT = Number(process.env.CONSENT_PORT || 4398);
const DIST = 'dist';
const PAGE = process.argv[2] || '/';
const GOOGLE = /(^|\.)(googletagmanager\.com|google-analytics\.com)$/;

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = path.join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch { /* 404 below */ }
  fs.readFile(p, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium',
}).catch(() => chromium.launch());

const failures = [];
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'}  ${msg}`); if (!ok) failures.push(msg); };

async function visit() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const hits = [];
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (GOOGLE.test(u.hostname)) {
      hits.push(u.hostname + u.pathname);
      if (/\/g\/collect/.test(u.pathname)) return route.abort();
    }
    return route.continue();
  });
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const url = `http://localhost:${PORT}${PAGE}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  const gaCookies = async () => (await context.cookies()).filter((c) => /^_ga/.test(c.name)).map((c) => c.name);
  return { context, page, hits, url, gaCookies };
}

// 1. Before consent
{
  const { context, page, hits, gaCookies } = await visit();
  check(hits.length === 0, `before consent: no request to Google (${hits.length ? hits.join(', ') : 'none'})`);
  check((await gaCookies()).length === 0, 'before consent: no _ga cookie');
  check(await page.isVisible('#sa-consent'), 'banner is visible');
  const pos = await page.$eval('#sa-consent', (el) => getComputedStyle(el).position);
  check(pos === 'fixed', `banner is overlaid (position: ${pos})`);
  const buttons = await page.$$eval('#sa-consent button', (bs) => bs.map((b) => ({
    text: b.textContent.trim(), cls: b.className, tab: b.tabIndex,
  })));
  check(buttons.length === 2 && buttons[0].cls === buttons[1].cls,
    `Accept and Reject share one style (${buttons.map((b) => b.text).join(' / ')})`);
  check(buttons.every((b) => b.tab >= 0), 'both buttons are in the tab order');
  const cls = await page.evaluate(() => window.__cls);
  check(cls < 0.1, `cumulative layout shift ${cls.toFixed(4)}`);

  // 2. Accept, by keyboard
  await page.focus('#sa-consent button[data-consent="granted"]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4000);
  check(hits.some((h) => /gtag\/js/.test(h)), 'after Accept: gtag.js requested');
  check(hits.some((h) => /\/g\/collect/.test(h)), 'after Accept: a collect hit was attempted (aborted by this check)');
  check(!(await page.isVisible('#sa-consent')), 'banner hidden after Accept');
  console.log(`      _ga cookies after Accept: ${(await gaCookies()).join(', ') || 'none'}`);
  await context.close();
}

// 3. Reject
{
  const { context, page, hits } = await visit();
  await page.click('#sa-consent button[data-consent="denied"]');
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  check(hits.length === 0, `after Reject and reload: no request to Google (${hits.length ? hits.join(', ') : 'none'})`);
  check(!(await page.isVisible('#sa-consent')), 'banner does not return after Reject');
  await context.close();
}

await browser.close();
server.close();
if (failures.length) { console.error(`\n${failures.length} consent check(s) failed`); process.exit(1); }
console.log('\nconsent checks passed');
