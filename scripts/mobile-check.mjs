// Mobile layout check over every sitemap page, at a 390px phone viewport.
// Run after `npm run build`. Exits non-zero on:
//   - horizontal overflow: the page is wider than the phone, so it scrolls
//     sideways (Google's mobile usability check flags this);
//   - the answer paragraph (#answer) starting below the first screen.
// Found 19 Oct 2026: /ultimate-shopify-automation-guide/ measured 519px wide
// at 390px because one long URL in prose did not wrap.
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const PORT = Number(process.env.MOBILE_PORT || 4398);
const DIST = 'dist';
const VIEW = { width: 390, height: 844 };
// Pages whose opening data table sits above the answer by design.
const ANSWER_EXEMPT = new Set([
  '/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/',
]);

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

const urls = [...fs.readFileSync(`${DIST}/sitemap-0.xml`, 'utf8')
  .matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''));

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium',
}).catch(() => chromium.launch());
const page = await (await browser.newContext({ viewport: VIEW, isMobile: true, hasTouch: true })).newPage();

const failures = [];
for (const u of urls) {
  await page.goto(`http://localhost:${PORT}${u}`, { waitUntil: 'load' });
  const r = await page.evaluate(() => {
    const vw = innerWidth;
    const sw = document.documentElement.scrollWidth;
    const culprits = [];
    if (sw > vw + 1) {
      for (const e of document.querySelectorAll('body *')) {
        const b = e.getBoundingClientRect();
        if (b.right <= vw + 1 || !b.width) continue;
        let a = e.parentElement, clipped = false;
        while (a) { if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(a).overflowX)) { clipped = true; break; } a = a.parentElement; }
        if (!clipped && getComputedStyle(e).position !== 'fixed') culprits.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} "${(e.innerText || '').slice(0, 30)}"`);
        if (culprits.length >= 3) break;
      }
    }
    const ans = document.getElementById('answer');
    return { sw, vw, culprits, ansTop: ans ? Math.round(ans.getBoundingClientRect().top + scrollY) : null };
  });
  if (r.sw > r.vw + 1) failures.push(`${u}: ${r.sw}px wide at ${r.vw}px (${r.culprits.join('; ')})`);
  if (r.ansTop !== null && r.ansTop > VIEW.height && !ANSWER_EXEMPT.has(u)) failures.push(`${u}: answer paragraph starts at ${r.ansTop}px, below the first screen`);
}
await browser.close();
server.close();

console.log(`\npages checked: ${urls.length}`);
if (failures.length) {
  console.log(`\n===== ${failures.length} MOBILE FAILURE(S) =====`);
  for (const f of failures) console.log('  ' + f);
  process.exit(1);
}
console.log('===== 0 MOBILE FAILURES =====');
