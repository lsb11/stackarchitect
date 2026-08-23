/**
 * a11y-contrast.mjs — WCAG AA contrast guard for the built site.
 *
 * Two checks, both run against dist/ over a local static server:
 *
 *   1. TEXT     every text node ≥25 chars, composited properly through
 *               semi-transparent ancestors AND gradient fills, measured
 *               against the 4.5:1 body / 3:1 large-text floors.
 *   2. CONTROLS every <a>/<button> that renders text, flagged under 3:1.
 *               This is the one that matters commercially: on 23 Aug 2026 it
 *               found seven /go/* affiliate CTAs rendering at 1.0–1.96:1,
 *               i.e. invisible, because page-scoped `a { color: inherit }`
 *               rules were repainting filled buttons with body-text ink.
 *
 * Why the compositing matters: an earlier version of this check treated
 * semi-transparent backgrounds as opaque and returned impossible 1:1 ratios on
 * a dark page. Any auditor that reads only `backgroundColor` will also report
 * every gradient button as a failure. Both are handled below.
 *
 * Usage:  npm run build && npm run a11y
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const PORT = Number(process.env.A11Y_PORT || 4399);
const DIST = 'dist';

// ── static server: mirrors Cloudflare Pages' directory-index behaviour ──────
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png',
  '.jpg':'image/jpeg', '.webp':'image/webp', '.avif':'image/avif', '.woff2':'font/woff2' };
const server = http.createServer((req, res) => {
  let p = path.join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch { /* 404 below */ }
  fs.readFile(p, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  });
});
await new Promise(r => server.listen(PORT, r));

const urls = [...fs.readFileSync(`${DIST}/sitemap-0.xml`, 'utf8')
  .matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/^https?:\/\/[^/]+/, ''));

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium',
}).catch(() => chromium.launch());
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

// Everything below runs in the page. Kept in one evaluate() so the compositing
// helpers are shared between the text pass and the control pass.
const PROBE = () => {
  const rgba = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const q = m[1].split(',').map(Number); return [q[0], q[1], q[2], q.length > 3 ? q[3] : 1]; };
  const over = (f, g) => [0, 1, 2].map(i => f[i] * f[3] + g[i] * (1 - f[3]));
  // A gradient is a background. Take its darkest stop: worst case for light
  // ink, best case for the dark ink a filled accent button uses.
  const gradStops = s => [...String(s).matchAll(/rgba?\(([^)]+)\)/g)].map(x => {
    const q = x[1].split(',').map(Number); return [q[0], q[1], q[2], q.length > 3 ? q[3] : 1]; });
  const bgOf = el => {
    const stack = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n), gi = cs.backgroundImage;
      if (gi && gi !== 'none') {
        const st = gradStops(gi);
        if (st.length) { st.sort((a, c) => (a[0]+a[1]+a[2]) - (c[0]+c[1]+c[2]));
          stack.push(st[0]); if (st[0][3] === 1) break; continue; }
      }
      const c = rgba(cs.backgroundColor);
      if (!c || c[3] === 0) continue;
      stack.push(c); if (c[3] === 1) break;
    }
    let base = [12, 15, 13];                       // the site's --color-bg
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };
  const lum = c => { const f = x => { x /= 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratioOf = (fgRaw, bg) => {
    let fg = fgRaw; if (fg[3] < 1) fg = [...over(fg, bg), 1];
    const l1 = lum(fg), l2 = lum(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const text = [], controls = [];

  for (const el of document.querySelectorAll('p,li,td,th,span,div,a,figcaption,small')) {
    const txt = [...el.childNodes].filter(n => n.nodeType === 3)
      .map(n => n.textContent.trim()).join(' ').trim();
    if (txt.length < 25) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.6) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
    const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    const fg = rgba(cs.color); if (!fg) continue;
    const ratio = ratioOf(fg, bgOf(el));
    if (ratio < need) text.push({ sel: el.tagName.toLowerCase() +
      (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : ''),
      color: cs.color, size, ratio: +ratio.toFixed(2), need, txt: txt.slice(0, 46) });
  }

  for (const el of document.querySelectorAll('a,button,[role="button"],input[type="submit"]')) {
    const t = el.textContent.trim(); if (!t) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const fg = rgba(cs.color); if (!fg) continue;
    const ratio = ratioOf(fg, bgOf(el));
    if (ratio < 3) controls.push({ txt: t.slice(0, 46),
      cls: String(el.className).slice(0, 44), href: el.getAttribute('href') || '',
      ratio: +ratio.toFixed(2) });
  }
  return { text, controls };
};

const textFails = new Map(), controlFails = [];
for (const u of urls) {
  await page.goto(`http://localhost:${PORT}${u}`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(80);
  const { text, controls } = await page.evaluate(PROBE);
  for (const t of text) {
    const k = `${t.sel}|${t.color}|${t.size}`;
    if (!textFails.has(k)) textFails.set(k, { ...t, pages: new Set() });
    textFails.get(k).pages.add(u);
  }
  controls.forEach(c => controlFails.push({ u, ...c }));
}
await browser.close();
server.close();

const list = [...textFails.values()].sort((a, b) => b.pages.size - a.pages.size);
console.log(`\npages checked                 : ${urls.length}`);
console.log(`text styles below WCAG AA     : ${list.length}`);
list.forEach(f => console.log(
  `  ${String(f.ratio).padStart(5)}:1 (need ${f.need})  ${f.size}px  ${f.color}  ${f.sel}` +
  `  ×${f.pages.size}  ${[...f.pages][0]}\n        "${f.txt}"`));

controlFails.sort((a, b) => a.ratio - b.ratio);
console.log(`links/buttons below 3:1       : ${controlFails.length}`);
controlFails.forEach(c => console.log(
  `  ${String(c.ratio).padStart(5)}:1  ${c.u}\n        "${c.txt}"  [${c.cls}] ${c.href}`));

const bad = list.length + controlFails.length;
console.log(bad === 0 ? '\n===== 0 CONTRAST FAILURES =====\n'
                      : `\n===== ${bad} CONTRAST FAILURES =====\n`);
process.exit(bad === 0 ? 0 : 1);
