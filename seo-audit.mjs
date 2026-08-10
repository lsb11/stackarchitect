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
export function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// ---- price divergence guard ------------------------------------------------
// Prices are authored in src/pages/*.astro (prose claims AND structured data
// objects), so this guard reads source rather than dist/ — source is the
// superset, and it's where a dev applies the fix.
//
// When true, findings count toward the exit code:
//   ERROR — a page contradicts a price-verified apps.json record
//   WARN  — a page contradicts an unverified apps.json record
//   WARN  — one page prices one app two incompatible ways   (see below)
export const PRICE_GUARD_ENFORCE = true;

// TEMPORARY. Self-contradiction is a genuine error class — one page cannot hold
// two prices for one app — but the ~16 existing instances predate this guard and
// cannot be resolved by picking a value, because no apps.json record is
// price-verified yet. Demoting to WARN keeps CI green while the real prices are
// sourced from vendor pricing pages.
//
// RESTORE TO 'error' once the outstanding self-contradictions are resolved.
// Leaving this at 'warn' permanently makes the check decorative.
const SELF_CONTRADICTION_LEVEL = 'warn';

const APPS_JSON = 'src/data/apps.json';
const PAGES_DIR = 'src/pages';

// "$45–$400+/mo (contact-based)" -> 45 | "~$300/mo" -> 300 | "GMV-based" -> null
// Comparison prose reads "$0 vs $225–$1,250/month": the leading $0 is our free
// replacement, not the vendor's price, so take the side after the last "vs".
export function priceFloor(raw) {
  if (raw == null) return null;
  let s = String(raw).replace(/,/g, '');
  if (/\bvs\b/i.test(s)) s = s.split(/\bvs\b/i).pop();
  const m = s.match(/\$\s*([0-9]+(?:\.[0-9]+)?)/);
  return m ? parseFloat(m[1]) : null;
}

// "$39–$299/month saved" is a savings delta, not a price claim.
const SAVINGS_PHRASE = /\bsav(?:e[ds]?|ings?)\b/i;

// The floor alone is too coarse for the same-page check: "$145–$375/mo" and
// "$145/mo" share a floor yet make different claims. Compare the whole claim
// instead — but as a shape, not a raw string, so that formatting-only variance
// ("$1,250" vs "$1250", "/month" vs "/mo", "–" vs "-") isn't read as a
// contradiction.
export function claimShape(raw) {
  const s = String(raw).replace(/,/g, '').toLowerCase();
  const amounts = [...s.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map((m) => parseFloat(m[1]));
  const openEnded = /\+/.test(s);
  // An omitted period ("$150–$400" in a column already headed /mo) is a
  // wildcard: it contradicts nothing. Only two *stated*, different periods do.
  const period = /(?:\/\s*|\bper\s+)(?:mo|month)|\bmonthly\b/.test(s) ? 'mo'
    : /(?:\/\s*|\bper\s+)(?:yr|year)|\bannually\b/.test(s) ? 'yr'
      : null;
  return { amounts, openEnded, period, key: amounts.join('–') + (openEnded ? '+' : '') };
}

// Two claims for one app on one page conflict when they name different amounts
// (or differ on open-endedness). Claims stating DIFFERENT periods are not
// compared at all: a comparison table listing both "Monthly cost $150+/mo" and
// "Annual cost $1,800+" is measuring two things, not contradicting itself.
export function claimsConflict(a, b) {
  if (a.period != null && b.period != null && a.period !== b.period) return false;
  return a.key !== b.key;
}

export function loadApps(path = APPS_JSON) {
  const arr = JSON.parse(readFileSync(path, 'utf8'));
  const byName = new Map();
  for (const a of arr) byName.set(a.name.toLowerCase(), a);
  return { arr, byName };
}

// savings === monthlyCost * 12 implies savings was generated from monthlyCost
// rather than sourced independently.
export function savingsDerivation(arr) {
  let priced = 0, derived = 0, nonNumeric = 0;
  for (const a of arr) {
    const mc = priceFloor(a.monthlyCost), sv = priceFloor(a.savings);
    if (mc == null) continue;
    priced++;
    if (sv == null) { nonNumeric++; continue; }
    if (Math.abs(mc * 12 - sv) < 0.5) derived++;
  }
  return { priced, derived, nonNumeric };
}

// An ENTITY key always names its own product, so it never inherits an outer
// vendor. A LABEL key is ambiguous: it names a product in a flat list but a
// tier ("Core", "Advanced") inside a vendor's plan array.
const ENTITY_KEY = /(?:^|[{,\s])(?:app|vendor|tool)\s*:\s*["']([^"']+)["']/;
const LABEL_KEY  = /(?:^|[{,\s])(?:name|label)\s*:\s*["']([^"']+)["']/;
const PRICE_KEY  = /(?:^|[{,\s])(?:cost|price|monthlyCost|monthly|from)\s*:\s*["']([^"']*\$[^"']*)["']/;

// A price token as authored in prose: "$225", "$145–$375/month", "$300–$2,000+/mo".
const PROSE_PRICE =
  /\$\s?[0-9][0-9,]*(?:\.[0-9]+)?(?:\s*[–—-]\s*\$?[0-9][0-9,]*(?:\.[0-9]+)?)?\+?(?:\s*\/\s*(?:mo|month|yr|year)[a-z]*)?/g;

// Text permitted between an app name and the price attributed to it: markup,
// punctuation, possessives, and pricing connectives only. Anything else — a
// sentence boundary, a block-level tag, "vs" — means the price belongs to a
// different subject and the pairing is dropped.
const VALID_GAP = new RegExp(
  '^(?:' +
    '\\s|&nbsp;|[:—–\\-|,\'’"\\[(]|' +           // punctuation / possessive apostrophe
    '</?[a-z][a-z0-9]*(?:\\s[^>]*)?>|' +          // inline markup
    "\\b(?:s|is|are|was|at|from|for|the|a|an|now|only|just|about|around|roughly|" +
    'typically|starts?|starting|costs?|charges?|runs?|bills?|priced?|price|pricing|' +
    'plans?|tiers?|begins?|up|to|and)\\b' +
  ')*$',
  'i'
);
// Hard stops: a sentence end or block boundary inside the gap breaks attribution.
const GAP_BREAK = /[.!?]\s|<\/(?:p|li|td|th|h[1-6]|div|section)>|<(?:p|li|h[1-6])[\s>]|\bvs\b/i;

// Index of the app name closest in front of `at`, or null. Names are matched on
// word boundaries so "Analyzify" does not match inside "Analyzify Pro".
function nearestName(text, at, names) {
  let best = null;
  const from = Math.max(0, at - 90);
  const window = text.slice(from, at);
  for (const n of names) {
    const esc = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![A-Za-z0-9.])${esc}(?![A-Za-z0-9.])`, 'gi');
    let m;
    while ((m = re.exec(window))) {
      const end = from + m.index + m[0].length;
      if (!best || end > best.end) best = { name: n, end };
    }
  }
  if (best && GAP_BREAK.test(text.slice(best.end, at))) return null;
  return best;
}

// Returns [{ file, app, raw, floor, kind, line }]
export function extractPriceClaims(byName, dir = PAGES_DIR) {
  const names = [...byName.keys()];
  const claims = [];
  const seen = new Set();
  // A price often carries no period of its own because the row it sits in
  // already states one: { feature: "Annual cost", elevar: "$1,800+" }. Without
  // this, that $1,800 reads as a monthly claim contradicting "$150+/mo".
  const periodOfLine = (line) => {
    if (/\bannual|\byearly\b|\bper year\b|\/\s*yr\b/i.test(line)) return 'yr';
    if (/\bmonthly\b|\bper month\b|\/\s*mo\b/i.test(line)) return 'mo';
    return null;
  };
  const periodFromContext = (text, idx) => {
    const from = text.lastIndexOf('\n', idx) + 1;
    let to = text.indexOf('\n', idx);
    if (to < 0) to = text.length;
    return periodOfLine(text.slice(from, to));
  };

  const push = (file, app, raw, kind, line, ctxPeriod = null) => {
    if (SAVINGS_PHRASE.test(raw)) return;
    const key = `${file}|${app}|${raw}|${line}`;
    if (seen.has(key)) return;
    seen.add(key);
    const shape = claimShape(raw);
    if (shape.period == null && ctxPeriod) shape.period = ctxPeriod;
    claims.push({ file, app, raw, floor: priceFloor(raw), kind, line, shape });
  };

  for (const f of walk(dir).filter((f) => /\.(astro|md|mdx)$/.test(f))) {
    const text = readFileSync(f, 'utf8');

    // (a) prose pairing. A price is attributed to the NEAREST PRECEDING app
    // name, provided the text between them could not name a different product.
    // Matching per-name instead would let "Klaviyo and Elevar cost $225" bind
    // $225 to both; anchoring on the nearest name binds it only to Elevar.
    // This covers the parenthetical form — Elevar ($225–$1,250/mo) — and the
    // verb-linked forms that are actually more common in this codebase:
    // "Elevar charges $225/month", "Analyzify starts at $145/month",
    // "Analyzify's $145–$375/month", "<td>Elevar</td><td>from $225/mo</td>".
    for (const p of text.matchAll(PROSE_PRICE)) {
      // "replace Elevar at $0" prices OUR alternative, not the vendor.
      if (claimShape(p[0]).amounts.every((a) => a === 0)) continue;
      const near = nearestName(text, p.index, names);
      if (!near) continue;
      const gap = text.slice(near.end, p.index);
      if (!VALID_GAP.test(gap)) continue;
      push(f, near.name, p[0].trim(), 'explicit', text.slice(0, p.index).split('\n').length,
           periodFromContext(text, p.index));
    }

    // (b) structured objects, incl. nested tier arrays under a vendor name
    let vendor = null, vendorLine = 0, tierSeen = false;
    const tierRow = (pr, i, line) => {
      if (!pr || !vendor || i - vendorLine > 12) return;
      push(f, vendor, pr, tierSeen ? 'tier' : 'tier-entry', i + 1, periodOfLine(line));
      tierSeen = true;
    };
    text.split('\n').forEach((l, i) => {
      const ent = (l.match(ENTITY_KEY) || [])[1];
      const lab = (l.match(LABEL_KEY) || [])[1];
      const pr  = (l.match(PRICE_KEY) || [])[1];

      if (ent) {
        // Own entity. An unknown one (e.g. Tidio, absent from apps.json) must
        // clear the context, or its price is misattributed to the vendor above.
        const k = ent.toLowerCase();
        vendor = byName.has(k) ? k : null; vendorLine = i; tierSeen = false;
        if (pr && byName.has(k)) push(f, k, pr, 'structured', i + 1, periodOfLine(l));
        return;
      }
      if (lab) {
        const k = lab.toLowerCase();
        if (byName.has(k)) {
          if (pr) push(f, k, pr, 'structured', i + 1, periodOfLine(l));
          else { vendor = k; vendorLine = i; tierSeen = false; }
          return;
        }
        tierRow(pr, i, l); // unknown label + price under a vendor = tier row
        return;
      }
      tierRow(pr, i, l);
    });
  }
  return claims;
}

export function auditPrices({ appsPath = APPS_JSON, pagesDir = PAGES_DIR } = {}) {
  const { arr, byName } = loadApps(appsPath);
  const claims = extractPriceClaims(byName, pagesDir);
  const priceErrors = [], priceWarns = [];

  const verified = arr.filter((a) => a.priceVerifiedDate != null).length;

  // 1 + 2: contradiction against the canonical record
  const buckets = { exact: 0, lt10: 0, lt50: 0, lt100: 0, over2x: 0, incomparable: 0 };
  let comparable = 0, agree = 0;

  for (const c of claims) {
    // A plan table legitimately lists every tier; only its entry tier is
    // comparable to apps.json's single floor value.
    if (c.kind === 'tier') { buckets.incomparable++; continue; }
    // apps.json monthlyCost is monthly by definition. An annual figure
    // ("Annual cost $2,700+") is a different unit, not a contradiction of it.
    if (c.shape.period === 'yr') { buckets.incomparable++; continue; }
    const rec = byName.get(c.app);
    const canon = priceFloor(rec.monthlyCost);
    if (c.floor == null || canon == null) { buckets.incomparable++; continue; }
    comparable++;
    const diff = Math.abs(c.floor - canon);
    if (diff < 0.01) { buckets.exact++; agree++; continue; }

    const rel = canon === 0 ? Infinity : diff / canon;
    if (rel < 0.10) buckets.lt10++;
    else if (rel < 0.50) buckets.lt50++;
    else if (rel < 1.00) buckets.lt100++;
    else buckets.over2x++;

    const where = `${c.file.replace('src/pages/', '')}:${c.line}`;
    const msg = `${where} — ${rec.name} priced ${c.raw} (floor $${c.floor}) but apps.json says ${rec.monthlyCost} (floor $${canon})`;
    if (rec.priceVerifiedDate != null) priceErrors.push(`VERIFIED RECORD CONTRADICTED :: ${msg} [verified ${rec.priceVerifiedDate}]`);
    else priceWarns.push(`unverified record :: ${msg}`);
  }

  // 3: same app, different prices, same page — self-contradiction.
  // Tier rows are excluded: listing Core/Advanced/Premium is legitimate.
  const selfContra = [];
  const byPageApp = new Map();
  for (const c of claims) {
    if (c.kind === 'tier' || c.kind === 'tier-entry') continue;
    if (c.floor == null) continue;
    const k = `${c.file}|${c.app}`;
    if (!byPageApp.has(k)) byPageApp.set(k, []);
    byPageApp.get(k).push(c);
  }
  for (const [k, list] of byPageApp) {
    const shaped = list.map((c) => ({ c, s: c.shape }));
    // Only report the claims that actually participate in a conflict. A page
    // may hold a legitimate annual figure alongside contradictory monthly ones;
    // naming the annual one as a "variant" would send the reader to a red herring.
    const inConflict = shaped.filter((a) => shaped.some((b) => b !== a && claimsConflict(a.s, b.s)));
    if (!inConflict.length) continue;
    const variants = [...new Set(inConflict.map((x) => x.s.key + (x.s.period ? '/' + x.s.period : '')))];
    const [file, app] = k.split('|');
    selfContra.push(
      `SELF-CONTRADICTION :: ${file.replace('src/pages/', '')} — ${byName.get(app).name} is priced ` +
      `${variants.length} incompatible ways (${variants.join(' / ')}) across ${inConflict.length} mentions: ` +
      inConflict.map((x) => `${x.c.raw}@L${x.c.line}`).join(' , ')
    );
  }

  return {
    stats: {
      records: arr.length, verified, unverified: arr.length - verified,
      savings: savingsDerivation(arr),
      claims: claims.length,
      byKind: claims.reduce((o, c) => ((o[c.kind] = (o[c.kind] || 0) + 1), o), {}),
      comparable, agree, buckets,
    },
    priceErrors, priceWarns, selfContra,
  };
}

if (process.argv[1] && process.argv[1].endsWith('seo-audit.mjs')) {
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
// /apps/<slug>/ detail pages are deliberately noindexed — near-duplicate
// template output whose canonical surface is the /apps/ hub. The hub itself
// must NOT match here, so the slug segment is required.
const NOINDEX_OK = [
  /^\/404(\.html)?\/?$/,
  /^\/sitemap-page\/$/,
  /^\/embed\//,
  /^\/apps\/[^/]+\/$/,
  // Legal pages: reachable and still useful as trust signals, but they consume
  // crawl assessment for zero possible search value. noindex, follow.
  /^\/privacy\/$/,
  /^\/terms\/$/,
  /^\/refund-policy\/$/,
];

// Pages deliberately absent from the sitemap. Distinct from NOINDEX_OK: a page
// can be indexable yet not worth a sitemap entry, and this list keeps the
// "missing from sitemap" warning meaningful instead of permanently noisy.
const SITEMAP_OPTIONAL = [/^\/privacy\/$/, /^\/terms\/$/, /^\/refund-policy\/$/];

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
    if (SITEMAP_OPTIONAL.some((r) => r.test(p))) continue;
    if (!smPaths.has(p)) warn(`built page missing from sitemap: ${p}`);
  }
  console.log(`sitemap URLs: ${smUrls.length}, built pages: ${builtPaths.size}`);
}

// ---- price guard report ----------------------------------------------------
{
  const { stats: s, priceErrors, priceWarns, selfContra } = auditPrices();
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  const mode = PRICE_GUARD_ENFORCE ? 'ENFORCED' : 'REPORT-ONLY — not counted toward exit code';

  console.log(`\n===== PRICE GUARD (${mode}) =====`);
  console.log(`apps.json          : ${s.records} records | verified ${s.verified} | unverified ${s.unverified}`);
  console.log(`savings derivation : ${s.savings.derived}/${s.savings.priced} priced records have savings === monthlyCost × 12 ` +
              `(${pct(s.savings.derived, s.savings.priced)}%) — indicates generated, not sourced` +
              (s.savings.nonNumeric ? ` [${s.savings.nonNumeric} non-numeric savings]` : ''));
  console.log(`claims parsed      : ${s.claims} (${Object.entries(s.byKind).map(([k, v]) => `${k} ${v}`).join(', ')})`);
  console.log(`comparable         : ${s.comparable} (both sides numeric) | agree ${s.agree} | diverge ${s.comparable - s.agree}` +
              ` | incomparable ${s.buckets.incomparable}`);
  console.log(`\ndivergence magnitude (page floor vs apps.json floor):`);
  console.log(`  exact match      : ${s.buckets.exact}`);
  console.log(`  within 10%       : ${s.buckets.lt10}   <- rounding class`);
  console.log(`  10–50%           : ${s.buckets.lt50}`);
  console.log(`  50–100%          : ${s.buckets.lt100}`);
  console.log(`  2x or more       : ${s.buckets.over2x}   <- substantive`);

  console.log(`\nwould-be ERRORS   (verified record contradicted) : ${priceErrors.length}`);
  console.log(`${SELF_CONTRADICTION_LEVEL === 'error' ? 'would-be ERRORS  ' : 'would-be WARNINGS'} (self-contradiction, same page) : ${selfContra.length}`);
  console.log(`would-be WARNINGS (unverified record contradicted): ${priceWarns.length}`);

  if (selfContra.length) { console.log(''); selfContra.forEach((m) => console.log('  ' + m)); }
  if (priceErrors.length) { console.log(''); priceErrors.forEach((m) => console.log('  ' + m)); }

  if (PRICE_GUARD_ENFORCE) {
    priceErrors.forEach(err);
    selfContra.forEach(SELF_CONTRADICTION_LEVEL === 'error' ? err : warn);
    priceWarns.forEach(warn);
  }
}

// ---- report ----------------------------------------------------------------
console.log(`\n===== ${errors.length} ERRORS =====`);
errors.forEach((e) => console.log('ERR  ' + e));
console.log(`\n===== ${warns.length} WARNINGS =====`);
warns.forEach((w) => console.log('warn ' + w));
process.exit(errors.length ? 1 : 0);
}
