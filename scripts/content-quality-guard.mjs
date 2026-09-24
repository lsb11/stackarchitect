#!/usr/bin/env node
// scripts/content-quality-guard.mjs — the content audit of 24 Sep 2026, made
// into a build failure.
//
// Google fetched most of this site and declined to index it. The audit that
// followed found that page length and duplicate text were not the problem. What
// it did find was sitewide: affiliate and kit calls to action stacked several
// deep on one page, the same FAQ question answered on up to four URLs, and a
// single "Last reviewed" date stamped identically on 55 pages. Each rule below
// is one of those findings, so that a later edit cannot quietly bring it back.
//
// Runs over dist/ after `astro build`. Fails (exit 1) when:
//   1. any built page has more than one <main> element
//   2. a sitemap page exceeds the commercial caps (see CAPS)
//   3. a sitemap page lacks a visible "Updated <date>", or its JSON-LD
//      dateModified disagrees with it
//   4. an FAQ question appears on more than one sitemap page, or an FAQPage
//      question in JSON-LD is not visible on the page
//   5. a sitemap URL is a redirect source or carries noindex
//   6. a redirect target in public/_redirects is itself a redirect source, or
//      is not a built page
//
// Elements are counted from a parsed DOM, never from raw text. A comment that
// says "<main>" is not a main element, and the audit that led to this file got
// that wrong once by using grep.
//
//   node scripts/content-quality-guard.mjs            # check, exit 1 on failure
//   node scripts/content-quality-guard.mjs --list     # report only, exit 0
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';

export const CAPS = {
  // Affiliate CTA buttons or blocks (a /go/ or rel=sponsored link styled as a
  // button, or a sticky affiliate bar).
  affiliateButtons: 1,
  // Inline affiliate text links: a link inside a sentence that names the tool.
  affiliateInline: 3,
  // Links to the /pro/ kit or a /pro/<slug>/ product page.
  kitLinks: 1,
  // Homepage totals.
  homeButtons: 8,
  homeAffiliate: 5,
};
// Pages whose job is to sell the kit, so the kit cap does not apply.
const KIT_EXEMPT = (path) => path === '/' || path === '/pro/' || path.startsWith('/pro/');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── DOM helpers ─────────────────────────────────────────────────────────────
const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
const cls = (n) => attr(n, 'class') || '';
function walk(n, fn) {
  if (fn(n) === false) return;
  for (const c of n.childNodes || []) walk(c, fn);
  if (n.content) walk(n.content, fn); // <template>
}
const SKIP_TEXT = new Set(['script', 'style', 'noscript', 'template', 'svg']);
function textOf(n) {
  let s = '';
  walk(n, (x) => {
    if (SKIP_TEXT.has(x.tagName)) return false;
    if (x.nodeName === '#text') s += x.value + ' ';
  });
  return s.replace(/\s+/g, ' ').trim();
}
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Site chrome that is not page content: the global nav and the global footer.
const isChrome = (n) =>
  (n.tagName === 'nav' && /\bsa-nav\b/.test(cls(n))) ||
  (n.tagName === 'footer' && /\bsa-footer\b/.test(cls(n)));

const BUTTON_CLASS = /(^|[\s_-])(btn|cta|button)/i;
const isAffiliate = (a) => {
  const href = attr(a, 'href') || '';
  if (/^(https?:\/\/(www\.)?stackarchitect\.xyz)?\/go\//.test(href)) return true;
  return /\bsponsored\b/.test(attr(a, 'rel') || '');
};
// A kit mention is a link to /pro/ or a /pro/<slug>/ product page, or a
// direct Stripe checkout link, which is the same offer one step further on.
const isKit = (a) => {
  const href = attr(a, 'href') || '';
  return /^(https?:\/\/(www\.)?stackarchitect\.xyz)?\/pro\//.test(href) || /^https:\/\/buy\.stripe\.com\//.test(href);
};
const isButton = (a) => BUTTON_CLASS.test(cls(a)) || attr(a, 'role') === 'button';
// The sticky bar is counted once as a block, so its own link is not a second.
const inSticky = (a) => /\bsa-sticky-btn\b/.test(cls(a));

function contentText(body) {
  let s = '';
  walk(body, (x) => {
    if (x !== body && isChrome(x)) return false;
    if (SKIP_TEXT.has(x.tagName)) return false;
    if (x.nodeName === '#text') s += x.value + ' ';
  });
  return s.replace(/\s+/g, ' ');
}

// Every "Updated <date>" a page states must be the page's date. A second,
// older "Last updated" line elsewhere on the page is how a stale date hides.
const MONTH_RE = '(January|February|March|April|May|June|July|August|September|October|November|December)';
const UPDATED_CLAIM = new RegExp(
  `\\b(?:last\\s+)?updated\\s*:?\\s*(?:on\\s+)?(\\d{1,2}\\s+${MONTH_RE}\\s+\\d{4}|${MONTH_RE}\\s+\\d{1,2},?\\s+\\d{4}|${MONTH_RE}\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2})`,
  'gi',
);
export function updatedClaims(text) {
  const out = [];
  for (const m of text.matchAll(UPDATED_CLAIM)) out.push(m[1]);
  return out;
}
function claimMatches(claim, iso) {
  const [y, mo, d] = iso.split('-').map(Number);
  const month = MONTHS[mo - 1].toLowerCase();
  const c = claim.toLowerCase().replace(/,/g, '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(c)) return c === iso;
  const parts = c.split(/\s+/);
  if (parts.length === 2) return parts[0] === month && Number(parts[1]) === y; // "September 2026"
  const [a, b, yy] = parts;
  const day = /^\d+$/.test(a) ? Number(a) : Number(b);
  const mon = /^\d+$/.test(a) ? b : a;
  return mon === month && day === d && Number(yy) === y;
}

export function analysePage(html) {
  const doc = parse(html);
  const mains = [];
  let robots = '';
  const ld = [];
  walk(doc, (n) => {
    if (n.tagName === 'main') mains.push(n);
    if (n.tagName === 'meta' && attr(n, 'name') === 'robots') robots = attr(n, 'content') || '';
    if (n.tagName === 'script' && attr(n, 'type') === 'application/ld+json') {
      try { ld.push(JSON.parse(n.childNodes.map((c) => c.value).join(''))); } catch { /* schema guard owns this */ }
    }
  });

  // Page content = <body> minus the global nav and footer. Wider than <main>
  // on purpose: a CTA placed just outside </main> is still on the page.
  let body = null;
  walk(doc, (n) => { if (!body && n.tagName === 'body') { body = n; return false; } });
  const anchors = [];
  let stickyBars = 0;
  let updated = null;
  const faqVisible = [];
  const collect = (n, inFaq) => {
    if (n !== body && isChrome(n)) return;
    if (cls(n).split(/\s+/).includes('sa-sticky')) stickyBars++;
    if (n.tagName === 'a') anchors.push(n);
    if (attr(n, 'data-page-updated') !== undefined && !updated) {
      let dt = null;
      walk(n, (x) => { if (x.tagName === 'time' && !dt) dt = attr(x, 'datetime'); });
      updated = { text: textOf(n), datetime: dt, hidden: attr(n, 'hidden') !== undefined };
    }
    const faqHere = inFaq || /faq/i.test(cls(n) + ' ' + (attr(n, 'id') || ''));
    if (faqHere && n.tagName === 'summary') faqVisible.push(textOf(n));
    for (const c of n.childNodes || []) collect(c, faqHere);
  };
  if (body) collect(body, false);

  const aff = anchors.filter(isAffiliate);
  const affButtons = aff.filter((a) => isButton(a) && !inSticky(a)).length + stickyBars;
  const affInline = aff.filter((a) => !isButton(a)).length;
  const kit = anchors.filter(isKit).length;
  const buttons = anchors.filter(isButton).length;

  const faqLd = [];
  const modified = [];
  const visit = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(visit);
    const t = [].concat(o['@type'] || []);
    if (t.includes('FAQPage')) for (const q of [].concat(o.mainEntity || [])) if (q?.name) faqLd.push(q.name);
    if (typeof o.dateModified === 'string') modified.push(o.dateModified);
    Object.values(o).forEach(visit);
  };
  ld.forEach(visit);

  return {
    mains: mains.length,
    noindex: /\bnoindex\b/i.test(robots),
    affButtons, affInline, affTotal: aff.length, kit, buttons,
    updated, modified,
    faqs: [...new Map([...faqLd, ...faqVisible].map((q) => q.replace(/\s+/g, ' ').trim()).filter(Boolean).map((q) => [norm(q), q])).values()],
    faqLd,
    bodyText: body ? norm(textOf(body)) : '',
    rawText: body ? contentText(body) : '',
  };
}

// ── redirects ───────────────────────────────────────────────────────────────
export function parseRedirects(text) {
  const rules = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [from, to, status] = line.split(/\s+/);
    if (from && to) rules.push({ from, to, status: Number(status) || 301 });
  }
  return rules;
}
const slashless = (p) => (p.length > 1 ? p.replace(/\/$/, '') : p);
function isSource(rules, path) {
  const p = slashless(path.split('?')[0]);
  return rules.some((r) => {
    if (r.from.includes('*') || r.from.includes(':')) {
      const re = new RegExp('^' + slashless(r.from).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:[a-z]+/gi, '[^/]+').replace(/\*/g, '.*') + '/?$');
      return re.test(path.split('?')[0]);
    }
    return slashless(r.from) === p;
  });
}

// ── checks ──────────────────────────────────────────────────────────────────
const longDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };

export function check({ pages, sitemapPaths, redirects, builtPaths }) {
  const failures = [];
  const fail = (rule, path, msg) => failures.push({ rule, path, msg });

  for (const [path, p] of Object.entries(pages)) {
    if (p.mains > 1) fail('single-main', path, `${p.mains} <main> elements`);
  }

  const faqOwners = new Map();
  for (const path of sitemapPaths) {
    const p = pages[path];
    if (!p) { fail('sitemap', path, 'in the sitemap but not built'); continue; }

    // 2. caps
    if (path === '/') {
      if (p.buttons > CAPS.homeButtons) fail('caps', path, `${p.buttons} buttons (max ${CAPS.homeButtons})`);
      if (p.affTotal > CAPS.homeAffiliate) fail('caps', path, `${p.affTotal} affiliate links (max ${CAPS.homeAffiliate})`);
    }
    if (p.affButtons > CAPS.affiliateButtons) fail('caps', path, `${p.affButtons} affiliate buttons/blocks (max ${CAPS.affiliateButtons})`);
    if (p.affInline > CAPS.affiliateInline) fail('caps', path, `${p.affInline} inline affiliate links (max ${CAPS.affiliateInline})`);
    if (!KIT_EXEMPT(path) && p.kit > CAPS.kitLinks) fail('caps', path, `${p.kit} kit links (max ${CAPS.kitLinks})`);

    // 3. visible, honest date
    if (!p.updated || p.updated.hidden || !p.updated.datetime || !/^Updated\b/.test(p.updated.text)) {
      fail('updated-date', path, 'no visible "Updated <date>" element');
    } else {
      const d = p.updated.datetime;
      if (!p.updated.text.includes(longDate(d))) fail('updated-date', path, `visible text "${p.updated.text}" does not show ${longDate(d)}`);
      if (p.modified.length === 0) fail('updated-date', path, 'no dateModified in JSON-LD');
      for (const m of p.modified) if (m.slice(0, 10) !== d) fail('updated-date', path, `JSON-LD dateModified ${m} ≠ visible ${d}`);
      for (const c of updatedClaims(p.rawText)) if (!claimMatches(c, d)) fail('updated-date', path, `page also says "Updated ${c}", but its date is ${d}`);
    }

    // 4. FAQ
    for (const q of p.faqs) {
      const k = norm(q);
      if (!faqOwners.has(k)) faqOwners.set(k, { q, pages: new Set() });
      faqOwners.get(k).pages.add(path);
    }
    for (const q of p.faqLd) if (!p.bodyText.includes(norm(q))) fail('faq', path, `FAQPage question not visible: "${q}"`);

    // 5. sitemap hygiene
    if (p.noindex) fail('sitemap', path, 'carries noindex');
    if (isSource(redirects, path)) fail('sitemap', path, 'is a redirect source in public/_redirects');
  }
  for (const { q, pages: set } of faqOwners.values()) {
    const ps = [...set];
    if (ps.length > 1) fail('faq', ps.join(' '), `FAQ question on ${ps.length} pages: "${q}"`);
  }

  // 6. redirect targets
  for (const r of redirects) {
    if (r.from.startsWith('/go/')) continue; // off-site 302 cloaks
    if (/^https?:/.test(r.to) || r.to.includes(':') || r.to.includes('*')) continue;
    const to = r.to.split('?')[0].split('#')[0];
    if (isSource(redirects, to)) fail('redirect-chain', r.from, `target ${r.to} is itself a redirect source`);
    else if (builtPaths && !builtPaths.has(to.endsWith('/') ? to : to + '/') && !/\.[a-z0-9]+$/i.test(to)) {
      fail('redirect-chain', r.from, `target ${r.to} is not a built page`);
    }
  }
  return failures;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function htmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...htmlFiles(full));
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

export function loadDist(dist = 'dist') {
  const sitemapPaths = [...readFileSync(join(dist, 'sitemap-0.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname);
  const pages = {};
  const builtPaths = new Set();
  for (const f of htmlFiles(dist)) {
    const rel = f.slice(dist.length).replace(/\\/g, '/');
    const path = rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
    builtPaths.add(path);
    pages[path] = analysePage(readFileSync(f, 'utf8'));
  }
  const redirects = existsSync('public/_redirects') ? parseRedirects(readFileSync('public/_redirects', 'utf8')) : [];
  return { pages, sitemapPaths, redirects, builtPaths };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const list = process.argv.includes('--list');
  const data = loadDist();
  const failures = check(data);
  const byRule = {};
  for (const f of failures) (byRule[f.rule] ||= []).push(f);
  for (const [rule, fs] of Object.entries(byRule)) {
    console.error(`\n✗ content-quality-guard [${rule}] ${fs.length} failure(s)`);
    for (const f of fs) console.error(`  ${f.path}: ${f.msg}`);
  }
  if (failures.length === 0) {
    console.log(`✓ content-quality-guard: ${data.sitemapPaths.length} sitemap pages, ${Object.keys(data.pages).length} built pages — one <main> each, within CTA caps, dated, FAQ questions unique, no redirect chains.`);
  } else if (!list) {
    process.exit(1);
  }
}
