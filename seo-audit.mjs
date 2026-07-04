#!/usr/bin/env node
// seo-audit.mjs — machine-check every built page in dist/.
// Run after `npm run build`. Exits 1 if any ERROR found (CI-safe).
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SITE = 'https://stackarchitect.xyz';
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

// ---- collect built pages -------------------------------------------------
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const builtPaths = new Set(
  htmlFiles.map((f) => {
    let p = f.slice(DIST.length).replace(/index\.html$/, '');
    if (!p.endsWith('/')) p = p.replace(/\.html$/, '/'); // non-index html
    return p;
  })
);

// ---- redirects -----------------------------------------------------------
const redirectSources = new Set();
const redirectPrefixes = []; // [prefix] for :slug / splat rules
for (const line of readFileSync('public/_redirects', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const src = t.split(/\s+/)[0];
  if (src.includes(':') || src.includes('*')) {
    redirectPrefixes.push(src.split(/[:*]/)[0]);
  } else {
    redirectSources.add(src.endsWith('/') ? src : src + '/');
    redirectSources.add(src.endsWith('/') ? src.slice(0, -1) : src);
  }
}
const functionRoutes = ['/api/'];

function resolvesInternally(path) {
  const clean = path.split(/[?#]/)[0];
  if (builtPaths.has(clean)) return true;
  if (builtPaths.has(clean.endsWith('/') ? clean : clean + '/')) return 'needs-slash';
  if (redirectSources.has(clean)) return 'redirect';
  if (redirectPrefixes.some((p) => clean.startsWith(p))) return 'redirect';
  if (functionRoutes.some((p) => clean.startsWith(p))) return true;
  // static asset?
  if (/\.[a-z0-9]{2,5}$/i.test(clean)) {
    return existsSync(join(DIST, clean)) ? true : false;
  }
  return false;
}

// ---- per-page checks -------------------------------------------------------
const titles = new Map();
const descs = new Map();
const NOINDEX_OK = [/^\/404(\.html)?\/?$/, /^\/sitemap-page\/$/, /^\/embed\//];

for (const f of htmlFiles) {
  const page = f.slice(DIST.length).replace(/index\.html$/, '') || '/';
  const html = readFileSync(f, 'utf8');
  const isNoindexOk = NOINDEX_OK.some((r) => r.test(page)) || page === '/404.html/';

  // canonical
  const canons = [...html.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  if (canons.length !== 1) err(`${page} — ${canons.length} canonical tags`);
  else {
    const expected = SITE + (page === '/404.html' ? '/404/' : page);
    if (!isNoindexOk && canons[0] !== expected) err(`${page} — canonical is ${canons[0]}, expected ${expected}`);
    if (canons[0].includes('//www.') ) err(`${page} — canonical points at www`);
    if (!isNoindexOk && !canons[0].endsWith('/') && !/\.[a-z]{2,5}$/.test(canons[0])) err(`${page} — canonical missing trailing slash: ${canons[0]}`);
  }

  // robots
  const robots = [...html.matchAll(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/g)].map((m) => m[1]);
  if (robots.length === 0) warn(`${page} — no robots meta`);
  if (robots.some((r) => r.includes('noindex')) && !isNoindexOk) err(`${page} — UNEXPECTED NOINDEX`);
  if (robots.length > 1) {
    const uniq = new Set(robots.map(r => r.includes('noindex') ? 'noindex' : 'index'));
    if (uniq.size > 1) err(`${page} — CONFLICTING robots metas: ${robots.join(' || ')}`);
    else warn(`${page} — ${robots.length} robots metas (same directive)`);
  }

  // title / description
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] ?? '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] ?? '';
  if (!title) err(`${page} — missing <title>`);
  if (!desc && !isNoindexOk) err(`${page} — missing meta description`);
  if (title) (titles.get(title) ?? titles.set(title, []).get(title)).push(page);
  if (desc) (descs.get(desc) ?? descs.set(desc, []).get(desc)).push(page);
  if (title.length > 68) warn(`${page} — title ${title.length} chars (truncates ~60–65)`);
  if (desc && desc.length > 175) warn(`${page} — description ${desc.length} chars`);

  // h1
  const h1s = [...html.matchAll(/<h1[\s>]/g)].length;
  if (h1s === 0 && !isNoindexOk) warn(`${page} — no <h1>`);
  if (h1s > 1) warn(`${page} — ${h1s} <h1> tags`);


  // dead onclick handlers: onclick="fn()" must resolve to a global in the page
  for (const fn of new Set([...html.matchAll(/onclick="(\w+)\(/g)].map(m=>m[1]))) {
    if (!(new RegExp('function\\s+'+fn+'\\b').test(html) || new RegExp('window\\.'+fn+'\\s*=').test(html)))
      err(`${page} — onclick handler ${fn}() has NO global definition (script bundled as module? use is:inline)`);
  }

  // JSON-LD validity
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const [, body] of ldBlocks) {
    try { JSON.parse(body); } catch (e) { err(`${page} — INVALID JSON-LD: ${e.message} :: ${body.slice(0, 90)}…`); }
  }

  // internal links
  const hrefs = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  for (const h of hrefs) {
    if (h.startsWith('http://')) err(`${page} — insecure link ${h}`);
    if (h.startsWith('https://www.stackarchitect.xyz')) err(`${page} — www internal link ${h}`);
    if (!h.startsWith('/') || h.startsWith('//')) continue;
    const r = resolvesInternally(h.startsWith('https://stackarchitect.xyz') ? h.slice(SITE.length) : h);
    if (r === false) err(`${page} — BROKEN internal link ${h}`);
    else if (r === 'needs-slash') warn(`${page} — link ${h} missing trailing slash (301 hop)`);
    else if (r === 'redirect' && !h.startsWith('/go/')) warn(`${page} — link ${h} goes through a 301 (point it at the target directly)`);
  }
}

// duplicates
for (const [t, pages] of titles) if (pages.length > 1) warn(`DUPLICATE TITLE on ${pages.join(' , ')} :: "${t.slice(0, 70)}"`);
for (const [d, pages] of descs) if (pages.length > 1) warn(`DUPLICATE DESCRIPTION on ${pages.join(' , ')}`);

// ---- sitemap checks --------------------------------------------------------
const smIndex = join(DIST, 'sitemap-index.xml');
if (!existsSync(smIndex)) err('sitemap-index.xml missing from dist');
else {
  const sitemaps = [...readFileSync(smIndex, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const smUrls = [];
  for (const sm of sitemaps) {
    const local = join(DIST, new URL(sm).pathname);
    if (!existsSync(local)) { err(`sitemap ${sm} not in dist`); continue; }
    smUrls.push(...[...readFileSync(local, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  for (const u of smUrls) {
    const url = new URL(u);
    if (url.host !== 'stackarchitect.xyz') err(`sitemap URL wrong host: ${u}`);
    if (!url.pathname.endsWith('/')) err(`sitemap URL missing trailing slash: ${u}`);
    if (!builtPaths.has(url.pathname)) err(`sitemap URL has no built page: ${u}`);
    // noindexed page in sitemap?
    const fp = join(DIST, url.pathname, 'index.html');
    if (existsSync(fp) && /noindex/.test((readFileSync(fp, 'utf8').match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/) || [])[1] ?? ''))
      err(`sitemap contains NOINDEXED page: ${u}`);
  }
  // indexable built pages missing from sitemap
  const smPaths = new Set(smUrls.map((u) => new URL(u).pathname));
  for (const p of builtPaths) {
    if (NOINDEX_OK.some((r) => r.test(p)) || p.endsWith('.html')) continue;
    if (!smPaths.has(p)) warn(`built page missing from sitemap: ${p}`);
  }
  console.log(`sitemap URLs: ${smUrls.length}, built pages: ${builtPaths.size}`);
}

// ---- report ----------------------------------------------------------------
console.log(`\n===== ${errors.length} ERRORS =====`);
errors.forEach((e) => console.log('ERR  ' + e));
console.log(`\n===== ${warns.length} WARNINGS =====`);
warns.forEach((w) => console.log('warn ' + w));
process.exit(errors.length ? 1 : 0);
