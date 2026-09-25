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
//   7. an internal link on a sitemap page (nav and footer included) lacks the
//      trailing slash, is a redirect source, is not a built page, or points at
//      a noindex page. Exceptions: the legal pages, and /pro/ linking to its
//      own product pages. Added 25 Sep 2026, when every /apps/<slug>/ link on
//      the site turned out to point at a noindex page.
//   8. a sitemap page shows an em dash in its visible text (nav and footer
//      aside). Added 25 Sep 2026 with the sitewide punctuation pass; <title>
//      is in <head> and not checked.
//   9. any built page, once parsed the way a browser or Googlebot parses it,
//      has its <title>, canonical, meta robots or a JSON-LD script outside
//      <head>, or has anything in <head> that is not a head element. Added
//      25 Sep 2026: /tools/ put a <div> before <html>, the parser opened
//      <body> there, and every tag Base.astro writes into <head> landed in
//      the body, where Google may ignore a canonical or robots tag.
//  10. an em dash in a string literal a reader can see but rule 8 cannot:
//      inside a <script> in any src/ .astro or .md file (calculator output,
//      status messages), or in a data file under src/data. Comments are not
//      checked. Added 25 Sep 2026. See scripts/lib/script-string-dashes.mjs.
//
// An anchor whose words share nothing with the target's title or H1 is
// reported as a warning, not a failure: the match is a judgement, and a
// short anchor such as "About" can be right.
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
import { dashesInScript, scriptBlocks, dashesInJson } from './lib/script-string-dashes.mjs';

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

// What the HTML spec allows as a child of <head>. Anything else makes a
// parser close the head early, so everything after it lands in <body>.
export const HEAD_ELEMENTS = new Set(['meta', 'link', 'title', 'script', 'style', 'noscript', 'base', 'template']);
const HTML_NS = 'http://www.w3.org/1999/xhtml';

/** Rule 9: head problems in a parsed document, as short messages. */
export function headProblems(doc) {
  const out = [];
  let head = null;
  walk(doc, (n) => { if (!head && n.tagName === 'head') { head = n; return false; } });
  if (!head) return ['no <head> element'];
  // The parse tree always ends up with a valid <head>: the parser moves a
  // stray element into <body> and takes everything after it along. What is
  // left to see is whether the page's own <head> and </head> tags were the
  // ones used. An implied open means content came before <head>; an implied
  // close means a non-head element inside it ended the head early.
  const loc = head.sourceCodeLocation;
  if (loc !== undefined) {
    if (!loc?.startTag) out.push('<head> opened implicitly: an element comes before it');
    else if (!loc.endTag) out.push('<head> closed early by an element not allowed in it');
  }
  for (const c of head.childNodes || []) {
    if (c.nodeName.startsWith('#')) continue;
    if (!HEAD_ELEMENTS.has(c.tagName)) out.push(`<${c.tagName}> inside <head>`);
  }
  // Only the HTML namespace: an SVG <title> in the body is not the page title.
  const found = { title: [], canonical: [], robots: [], jsonld: [] };
  const scan = (n, inHead) => {
    const here = inHead || n === head;
    if (n.namespaceURI === HTML_NS) {
      const rel = (attr(n, 'rel') || '').toLowerCase().split(/\s+/);
      if (n.tagName === 'title') found.title.push(here);
      if (n.tagName === 'link' && rel.includes('canonical')) found.canonical.push(here);
      if (n.tagName === 'meta' && (attr(n, 'name') || '').toLowerCase() === 'robots') found.robots.push(here);
      if (n.tagName === 'script' && attr(n, 'type') === 'application/ld+json') found.jsonld.push(here);
    }
    for (const c of n.childNodes || []) scan(c, here);
  };
  scan(doc, false);
  const label = { title: '<title>', canonical: 'canonical link', robots: 'meta robots', jsonld: 'JSON-LD script' };
  for (const [k, hits] of Object.entries(found)) {
    // JSON-LD is optional (the /embed/ pages carry none); the other three are not.
    if (hits.length === 0 && k !== 'jsonld') out.push(`no ${label[k]}`);
    const outside = hits.filter((h) => !h).length;
    if (outside) out.push(`${outside} ${label[k]}${outside > 1 ? 's' : ''} outside <head>`);
  }
  return out;
}

export function analysePage(html) {
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const head = headProblems(doc);
  const mains = [];
  let robots = '';
  let title = '';
  let h1 = '';
  const ld = [];
  walk(doc, (n) => {
    if (n.tagName === 'main') mains.push(n);
    if (n.tagName === 'title' && !title) title = textOf(n);
    if (n.tagName === 'h1' && !h1) h1 = textOf(n);
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
  const links = [];
  const emDashes = [];
  let stickyBars = 0;
  let updated = null;
  const faqVisible = [];
  // Every link on the page, chrome included, for rule 7; em dashes in the
  // visible text outside the chrome, for rule 8.
  if (body) walk(body, (n) => {
    if (n.tagName === 'a' && attr(n, 'href')) links.push({ href: attr(n, 'href'), text: textOf(n) });
  });
  if (body) walk(body, (n) => {
    if (n !== body && isChrome(n)) return false;
    // <title> is exempt; parse5 moves it into <body> when a stray element
    // in <head> closes the head early.
    if (SKIP_TEXT.has(n.tagName) || n.tagName === 'title') return false;
    if (n.nodeName === '#text' && n.value.includes('\u2014')) emDashes.push(n.value.replace(/\s+/g, ' ').trim().slice(0, 80));
  });
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
    head,
    jsonld: ld.length,
    mains: mains.length,
    noindex: /\bnoindex\b/i.test(robots),
    affButtons, affInline, affTotal: aff.length, kit, buttons,
    updated, modified,
    faqs: [...new Map([...faqLd, ...faqVisible].map((q) => q.replace(/\s+/g, ' ').trim()).filter(Boolean).map((q) => [norm(q), q])).values()],
    faqLd,
    links,
    emDashes,
    title,
    h1,
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

// ── internal links ──────────────────────────────────────────────────────────
const LEGAL = new Set(['/privacy/', '/terms/', '/refund-policy/']);
/** The site path an href points at, or null when it is not a page on this site
    (off-site, mailto:, a bare #fragment, /go/ cloaks, /api/ Functions, files). */
export function internalPath(href) {
  let h = href.trim();
  const abs = h.match(/^https?:\/\/(www\.)?stackarchitect\.xyz(\/.*)?$/i);
  if (abs) h = abs[2] || '/';
  if (!h.startsWith('/') || h.startsWith('//')) return null;
  const path = h.split('#')[0].split('?')[0];
  if (!path || /^\/(go|api|cdn-cgi)\//.test(path) || /^\/(go|api)$/.test(path)) return null;
  if (/\.[a-z0-9]{2,5}$/i.test(path)) return null;
  return path;
}

const STOP = new Set('a an and the of for to in on with your you is it this that how what why free 2026 guide shopify s vs by at from are'.split(' '));
const words = (t) => new Set(norm(t).split(' ').filter((w) => w.length > 2 && !STOP.has(w)));
/** Links whose anchor shares no significant word with the target's title or
    H1. Warnings only: see the note at the top of this file. */
export function anchorWarnings({ pages, sitemapPaths }) {
  const out = [];
  for (const path of sitemapPaths) {
    for (const { href, text } of pages[path]?.links || []) {
      const target = internalPath(href);
      const t = target && pages[target];
      if (!t || target === path || !text) continue;
      const a = words(text);
      if (a.size === 0) continue;
      const ref = words(`${t.title} ${t.h1}`);
      if (![...a].some((w) => ref.has(w))) out.push({ path, href, text, target: t.title });
    }
  }
  return out;
}

// ── checks ──────────────────────────────────────────────────────────────────
const longDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };

export function check({ pages, sitemapPaths, redirects, builtPaths }) {
  const failures = [];
  const fail = (rule, path, msg) => failures.push({ rule, path, msg });

  for (const [path, p] of Object.entries(pages)) {
    if (p.mains > 1) fail('single-main', path, `${p.mains} <main> elements`);
    // 9. head validity, on every built page: a noindex that parses into the
    // body is as lost as a canonical that does.
    for (const msg of p.head || []) fail('head', path, msg);
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
    if (p.jsonld === 0) fail('head', path, 'no JSON-LD script');
    if (isSource(redirects, path)) fail('sitemap', path, 'is a redirect source in public/_redirects');
  }
  // 7. internal links, 8. em dashes
  for (const path of sitemapPaths) {
    const p = pages[path];
    if (!p) continue;
    for (const { href } of p.links || []) {
      const target = internalPath(href);
      if (!target) continue;
      if (!target.endsWith('/')) { fail('internal-link', path, `${href} has no trailing slash`); continue; }
      if (isSource(redirects, target)) { fail('internal-link', path, `${href} is a redirect source`); continue; }
      if (builtPaths && !builtPaths.has(target)) { fail('internal-link', path, `${href} is not a built page`); continue; }
      const exempt = LEGAL.has(target) || (path === '/pro/' && target.startsWith('/pro/'));
      if (pages[target]?.noindex && !exempt) fail('internal-link', path, `${href} points at a noindex page`);
    }
    if ((p.emDashes || []).length) fail('em-dash', path, `${p.emDashes.length} em dash(es), e.g. "${p.emDashes[0]}"`);
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

// ── rule 10: em dashes in script strings and data files ──────────────────
// claims.json is a record: its `forbid` patterns must match em dashes to catch
// them in content, so it is the one data file not scanned.
export const DASH_RECORDS = new Set(['/data/claims.json']);
export function sourceDashes(root = 'src') {
  const out = [];
  const walkSrc = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) { walkSrc(full); continue; }
      const rel = full.replace(/\\/g, '/');
      if (/\.(astro|md|mdx)$/.test(e.name)) {
        for (const b of scriptBlocks(readFileSync(full, 'utf8'))) {
          for (const h of dashesInScript(b.code)) out.push({ file: rel, line: b.line + h.line - 1, text: h.text });
        }
      } else if (rel.startsWith(`${root}/data/`) && !DASH_RECORDS.has(rel.slice(root.length))) {
        const src = readFileSync(full, 'utf8');
        if (e.name.endsWith('.json')) {
          for (const h of dashesInJson(JSON.parse(src))) out.push({ file: rel, line: h.path, text: h.text });
        } else if (/\.(ts|js|mjs)$/.test(e.name)) {
          for (const h of dashesInScript(src)) out.push({ file: rel, line: h.line, text: h.text });
        }
      }
    }
  };
  if (existsSync(root)) walkSrc(root);
  return out;
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
  for (const d of sourceDashes()) failures.push({ rule: 'em-dash-source', path: `${d.file}:${d.line}`, msg: `em dash in a string literal: "${d.text}"` });
  const byRule = {};
  for (const f of failures) (byRule[f.rule] ||= []).push(f);
  for (const [rule, fs] of Object.entries(byRule)) {
    console.error(`\n✗ content-quality-guard [${rule}] ${fs.length} failure(s)`);
    for (const f of fs) console.error(`  ${f.path}: ${f.msg}`);
  }
  const warnings = anchorWarnings(data);
  if (list) for (const w of warnings) console.warn(`  ⚠ anchor ${w.path}: "${w.text}" → ${w.href} (${w.target})`);
  if (warnings.length) console.warn(`⚠ content-quality-guard: ${warnings.length} anchor(s) share no word with the target's title or H1${list ? '' : ' (--list shows them)'}.`);
  if (failures.length === 0) {
    console.log(`✓ content-quality-guard: ${data.sitemapPaths.length} sitemap pages, ${Object.keys(data.pages).length} built pages — one <main> each, within CTA caps, dated, FAQ questions unique, no redirect chains, internal links direct, no em dashes in pages or script strings, head valid.`);
  } else if (!list) {
    process.exit(1);
  }
}
