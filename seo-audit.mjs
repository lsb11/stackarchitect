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

// ── ANSWER BLOCK GUARD ──────────────────────────────────────────────────────
// Every indexable content page opens with a self-contained 40–60 word answer
// paragraph (Runbook §3.1) — it is the unit an LLM lifts verbatim, so it has to
// stand alone and it has to read as an answer to the H1 above it.
//
// Three things drift here, and all three have happened:
//   1. the block is dropped entirely on a new page
//   2. it is padded past 60 words, at which point it stops being quotable
//   3. it renders BEFORE the H1, so the quoted unit answers a question the
//      reader has not been asked yet (this was live on all 21 blog posts until
//      the H1 was moved into BlogPost.astro)
// Legal pages carry no answer block by design.
export const ANSWER_EXEMPT = [/^\/terms\//, /^\/privacy\//, /^\/refund-policy\//];

export function answerWordCount(text) {
  return text.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ')
    .trim().split(/\s+/).filter(Boolean).length;
}

// Returns { present, words, afterH1 } for one page's HTML.
export function checkAnswerBlock(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  const m = body.match(/<(p|div)[^>]*id="answer"[^>]*>([\s\S]*?)<\/\1>/);
  if (!m) return { present: false, words: 0, afterH1: false };
  const h1 = body.search(/<h1[\s>]/);
  return {
    present: true,
    words: answerWordCount(m[2]),
    afterH1: h1 !== -1 && h1 < m.index,
  };
}

// ---- price divergence guard ------------------------------------------------
// Prices are authored in src/pages/*.astro (prose claims AND structured data
// objects), so this guard reads source rather than dist/ — source is the
// superset, and it's where a dev applies the fix.
//
// When true, findings count toward the exit code. Every class is an ERROR:
//   ERROR — a page contradicts a price-verified apps.json record
//   ERROR — a page publishes a price for a record that is not verified at all
//   ERROR — one page prices one app two incompatible ways   (see below)
//   ERROR — two indexable pages price one app two incompatible ways
//
// The second class is what closes the backlog: a price on the site with no
// priceVerifiedDate + priceSourceUrl behind it now fails the build, so an
// unsourced figure cannot be reintroduced. An app the vendor genuinely does not
// price publicly carries a non-numeric monthlyCost ("Not publicly listed") and
// no page may attach a figure to it.
export const PRICE_GUARD_ENFORCE = true;

// Self-contradiction is a genuine error class — one page cannot hold two prices
// for one app. Held at 'warn' while the records were unverified; the outstanding
// instances are resolved, so it is enforced.
const SELF_CONTRADICTION_LEVEL = 'error';

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
  // "+" and "from $19.99" make the same claim: this is a floor, not the price.
  // Treating them as different shapes would force awkward copy ("From $19.99+")
  // to satisfy the guard, which is the guard bending the prose rather than
  // catching an error.
  const openEnded = /\+/.test(s) || /\b(?:from|starts? at|starting at|as low as)\s*\$/.test(s);
  // An omitted period ("$150–$400" in a column already headed /mo) is a
  // wildcard: it contradicts nothing. Only two *stated*, different periods do.
  const period = /(?:\/\s*|\bper\s+)(?:mo|month)|\bmonthly\b/.test(s) ? 'mo'
    : /(?:\/\s*|\bper\s+)(?:yr|year)|\bannually\b/.test(s) ? 'yr'
      : null;
  return { amounts, openEnded, period, key: amounts.join('–') + (openEnded ? '+' : '') };
}

// Human-readable rendering of a shape, for messages that must make the
// difference between "$145" and "$145–$375" visible at a glance.
export function shapeLabel(s) {
  if (!s.amounts.length) return 'no figure';
  const body = s.amounts.map((n) => '$' + n).join('–') + (s.openEnded ? '+' : '');
  return body + (s.period ? '/' + s.period : '');
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

// Three price states, not two. This mirrors statusOf() in src/data/appsIndex.js,
// which is the definition the /apps/ page and both download endpoints render
// from; it is restated here because appsIndex.js imports JSON the Vite way and
// is not loadable from plain node. The two must not drift — see the
// "three states" cases in seo-audit.test.mjs.
//
//   verified  — a human read the figure on the vendor's page, and the record
//               carries both the date and the URL it was read from.
//   held      — somebody checked and deliberately did not record a figure.
//   unchecked — nobody has looked.
//
// The audit previously printed "verified N | unverified M", which folded held
// into unchecked. That contradicted the page, which states all three, and it
// hid the more informative of the two: a held record is a decision, not a gap.
// Enforcement is unaffected — the UNVERIFIED PRICE PUBLISHED check has always
// required both fields, and held and unchecked records are equally ineligible
// to carry a published figure. This is a reporting fix.
export function priceStatusOf(a) {
  if (a.priceVerifiedDate != null && a.priceSourceUrl != null) return 'verified';
  if (a.priceHeldReason != null) return 'held';
  return 'unchecked';
}

export function priceStatusCounts(arr) {
  const c = { verified: 0, held: 0, unchecked: 0 };
  for (const a of arr) c[priceStatusOf(a)]++;
  return c;
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

// src/pages/foo.astro -> /foo/ ; src/pages/blog/bar.astro -> /blog/bar/ ;
// src/pages/index.astro -> / . Used to test a claim's page against the sitemap.
export function pageUrlFor(file) {
  let p = file.replace(/\\/g, '/').replace(/^src\/pages/, '').replace(/\.(astro|md|mdx)$/, '');
  p = p.replace(/\/index$/, '/');
  if (!p.startsWith('/')) p = '/' + p;
  if (!p.endsWith('/')) p += '/';
  return p;
}

export function auditPrices({ appsPath = APPS_JSON, pagesDir = PAGES_DIR, indexablePaths = null } = {}) {
  const { arr, byName } = loadApps(appsPath);
  const claims = extractPriceClaims(byName, pagesDir);
  const priceErrors = [], priceWarns = [];
  // When the sitemap is available, cross-page consistency is judged only across
  // pages that are actually indexable. Without it, every scanned page counts.
  const isIndexable = (file) => indexablePaths == null || indexablePaths.has(pageUrlFor(file));

  const status = priceStatusCounts(arr);

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
    const where = `${c.file.replace('src/pages/', '')}:${c.line}`;
    const canonShape = claimShape(rec.monthlyCost);

    // A record with no numeric monthlyCost makes no price claim at all. A page
    // that attaches a figure to it is publishing an unsourced number.
    if (!canonShape.amounts.length) {
      buckets.incomparable++;
      if (c.shape.amounts.length) {
        priceErrors.push(
          `UNSOURCED PRICE PUBLISHED :: ${where} — ${rec.name} priced ${c.raw} but apps.json ` +
          `records no public price (monthlyCost "${rec.monthlyCost}"). The vendor does not publish ` +
          `this figure; remove the number or verify it against the vendor's own pricing page.`
        );
      }
      continue;
    }
    if (c.floor == null) { buckets.incomparable++; continue; }
    comparable++;

    // Compare the WHOLE claim, not just its floor: "$145–$375/mo" and "$145/mo"
    // share a floor and are different claims. claimsConflict compares the full
    // amount list plus open-endedness, and abstains across differing periods.
    const conflict = claimsConflict(c.shape, canonShape);

    // Magnitude buckets stay floor-based — they measure how far apart two
    // numbers are, which is a question about the floors specifically.
    const canon = priceFloor(rec.monthlyCost);
    const diff = Math.abs(c.floor - canon);
    if (!conflict) { buckets.exact++; agree++; continue; }
    const rel = canon === 0 ? Infinity : diff / canon;
    if (diff < 0.01) buckets.exact++;
    else if (rel < 0.10) buckets.lt10++;
    else if (rel < 0.50) buckets.lt50++;
    else if (rel < 1.00) buckets.lt100++;
    else buckets.over2x++;

    const msg = `${where} — ${rec.name} priced ${c.raw} (${shapeLabel(c.shape)}) but apps.json says ` +
                `${rec.monthlyCost} (${shapeLabel(canonShape)})`;
    if (rec.priceVerifiedDate != null) priceErrors.push(`VERIFIED RECORD CONTRADICTED :: ${msg} [verified ${rec.priceVerifiedDate}]`);
    else priceErrors.push(`UNVERIFIED RECORD CONTRADICTED :: ${msg} — verify against the vendor's own pricing page`);
  }

  // 2b: a figure published for a record that carries no verification at all.
  // Matching an unverified record is not a defence — the number is still
  // unsourced. This is the check that keeps the backlog closed.
  for (const c of claims) {
    if (c.shape.period === 'yr' || !c.shape.amounts.length) continue;
    const rec = byName.get(c.app);
    if (rec.priceVerifiedDate != null && rec.priceSourceUrl != null) continue;
    if (!claimShape(rec.monthlyCost).amounts.length) continue; // already reported above
    const where = `${c.file.replace('src/pages/', '')}:${c.line}`;
    priceErrors.push(
      `UNVERIFIED PRICE PUBLISHED :: ${where} — ${rec.name} priced ${c.raw} but apps.json has ` +
      `${rec.priceVerifiedDate == null ? 'no priceVerifiedDate' : 'no priceSourceUrl'}`
    );
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

  // 4: same app, different claims, two different indexable pages. Page-scoped
  // consistency is not enough — a reader (or a model) comparing two of our own
  // pages must not find two prices for one product.
  const crossPage = [];
  const byApp = new Map();
  for (const c of claims) {
    if (c.kind === 'tier' || c.kind === 'tier-entry') continue;
    if (c.shape.period === 'yr' || !c.shape.amounts.length) continue;
    if (!isIndexable(c.file)) continue;
    if (!byApp.has(c.app)) byApp.set(c.app, []);
    byApp.get(c.app).push(c);
  }
  for (const [app, list] of byApp) {
    const byShape = new Map();
    for (const c of list) {
      const k = c.shape.key + (c.shape.period ? '/' + c.shape.period : '');
      if (!byShape.has(k)) byShape.set(k, []);
      byShape.get(k).push(c);
    }
    if (byShape.size < 2) continue;
    // Differing periods are not a contradiction (monthly vs annual figures).
    const conflicting = [...byShape.entries()].filter(([, cs]) =>
      cs.some((a) => list.some((b) => b.file !== a.file && claimsConflict(a.shape, b.shape))));
    if (conflicting.length < 2) continue;
    const files = [...new Set(list.map((c) => c.file.replace('src/pages/', '')))];
    if (files.length < 2) continue;
    crossPage.push(
      `CROSS-PAGE DIVERGENCE :: ${byName.get(app).name} is priced ${conflicting.length} incompatible ways ` +
      `across ${files.length} indexable pages: ` +
      conflicting.map(([k, cs]) => `${k} (${cs.map((c) => c.file.replace('src/pages/', '') + ':' + c.line).join(', ')})`).join(' / ')
    );
  }

  return {
    stats: {
      records: arr.length, status,
      savings: savingsDerivation(arr),
      claims: claims.length,
      byKind: claims.reduce((o, c) => ((o[c.kind] = (o[c.kind] || 0) + 1), o), {}),
      comparable, agree, buckets,
    },
    priceErrors, priceWarns, selfContra, crossPage,
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

// Normalise an href to a site-internal path, or null if it is not ours.
// Handles both relative ("/x/") and same-origin absolute ("https://…/x/") forms.
function toInternalPath(href) {
  let p = href.trim();
  if (p.startsWith(SITE)) p = p.slice(SITE.length) || '/';
  if (!p.startsWith('/') || p.startsWith('//')) return null; // external, mailto:, #frag, etc.
  return p;
}

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
  // Post-purchase thank-you pages: noindex because they carry the fulfilment
  // link and have nothing to rank for. Also filtered out of the sitemap.
  /^\/pro\/[^/]+\/success\/$/,
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

  // answer block — presence, length, and position relative to the H1
  if (!isNoindexOk && !ANSWER_EXEMPT.some((r) => r.test(page))) {
    const a = checkAnswerBlock(html);
    if (!a.present) err(`${page} — missing <p id="answer"> block (Runbook §3.1)`);
    else {
      if (a.words < 40 || a.words > 60) err(`${page} — #answer is ${a.words} words, must be 40–60`);
      if (!a.afterH1) err(`${page} — #answer renders BEFORE the <h1>; it must follow the heading it answers`);
    }
  }


  // dead onclick handlers: onclick="fn()" must resolve to a global in the page
  for (const fn of new Set([...html.matchAll(/onclick="(\w+)\(/g)].map(m=>m[1]))) {
    if (!(new RegExp('function\\s+'+fn+'\\b').test(html) || new RegExp('window\\.'+fn+'\\s*=').test(html)))
      err(`${page} — onclick handler ${fn}() has NO global definition (script bundled as module? use is:inline)`);
  }

  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

  // ── ENTITY SINGLETON GUARD ────────────────────────────────────────────────
  // This defect has recurred three times: #organization vs #org, then three
  // competing #luke Person nodes, then ten pages each declaring their own full
  // Organization. One @id must have exactly one DEFINING node per page —
  // multiple definitions under one @id let a consumer pick either, and an
  // ours-named node with NO @id is a second, unlinkable copy of the entity.
  //
  // A DEFINING node carries properties beyond @type/@id/@context. A bare
  // { "@id": … } or { "@type": …, "@id": … } is a reference and is expected
  // everywhere — references are never counted.
  const entityCounts = { '#org': 0, '#luke': 0 };
  const anonEntities = [];
  const OURS_NAME = /^(Stack Architect|Luke Sandelands|Luke)$/;
  for (const [, body] of ldBlocks) {
    let parsed;
    try { parsed = JSON.parse(body); } catch { continue; } // reported below
    (function walkEntities(node) {
      if (Array.isArray(node)) return node.forEach(walkEntities);
      if (!node || typeof node !== 'object') return;
      const types = [].concat(node['@type'] ?? []);
      const isOrg = types.includes('Organization');
      const isPerson = types.includes('Person');
      if (isOrg || isPerson) {
        const props = Object.keys(node).filter((k) => !/^@(type|id|context)$/.test(k));
        if (props.length > 0) {
          const id = node['@id'];
          if (id === `${SITE}/#org`) entityCounts['#org']++;
          else if (id === `${SITE}/#luke`) entityCounts['#luke']++;
          else if (!id && typeof node.name === 'string' && OURS_NAME.test(node.name.trim()))
            anonEntities.push(`${types.join('/')} "${node.name}"`);
        }
      }
      for (const v of Object.values(node)) walkEntities(v);
    })(parsed);
  }
  for (const [id, n] of Object.entries(entityCounts)) {
    if (n > 1) err(`${page} — ${n} DEFINING nodes carry @id ${id} (must be exactly 1; the canonical node lives in src/layouts/Base.astro, every other use must be { "@id": … })`);
  }
  for (const e of anonEntities) {
    err(`${page} — ${e} declared with NO @id (duplicate entity; reference ${SITE}/#org or ${SITE}/#luke instead)`);
  }

  // JSON-LD validity
  for (const [, body] of ldBlocks) {
    let parsed;
    try { parsed = JSON.parse(body); } catch (e) { err(`${page} — INVALID JSON-LD: ${e.message} :: ${body.slice(0, 90)}…`); continue; }
    // A redirected URL asserted in structured data is the same defect as an <a>
    // pointing at one: it tells a machine the URL is canonical when it 301s.
    // Runbook §2.4. Only url/@id/item/sameAs-style string values are checked.
    (function walkLd(node) {
      if (Array.isArray(node)) return node.forEach(walkLd);
      if (!node || typeof node !== 'object') return;
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'string' && /^(url|@id|item|mainEntityOfPage|contentUrl|target)$/.test(k)) {
          const p = toInternalPath(v);
          if (p && !p.startsWith('/go/') && resolvesInternally(p.split('#')[0]) === 'redirect')
            err(`${page} — JSON-LD ${k} "${v}" points at a path on the LEFT-HAND SIDE of public/_redirects`);
        } else walkLd(v);
      }
    })(parsed);
  }

  // internal links
  //
  // NOTE (2026-08-10): the previous version `continue`d on any href not starting
  // with "/" BEFORE stripping the origin, which made the absolute-URL branch
  // below unreachable. Every link written as https://stackarchitect.xyz/... —
  // including 15 pointing at consolidated URLs — slipped past unchecked. Strip
  // same-origin absolute URLs to a path FIRST, then classify.
  const hrefs = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  for (const h of hrefs) {
    if (h.startsWith('http://')) err(`${page} — insecure link ${h}`);
    if (h.startsWith('https://www.stackarchitect.xyz')) err(`${page} — www internal link ${h}`);
    const p = toInternalPath(h);
    if (p === null) continue;
    const r = resolvesInternally(p);
    if (r === false) err(`${page} — BROKEN internal link ${h}`);
    else if (r === 'needs-slash') warn(`${page} — link ${h} missing trailing slash (301 hop)`);
    // ERROR, not warn, since consolidation v1 (2026-08-10). Sitewide internal
    // links into redirected URLs waste every crawl of the redirected path and
    // dilute the signal the consolidation exists to concentrate. Runbook §2.4
    // requires zero of these, and a warn cannot enforce that. /go/* is exempt:
    // those are deliberately cloaked affiliate hops, not internal navigation.
    else if (r === 'redirect' && !p.startsWith('/go/')) err(`${page} — link ${h} points at a path on the LEFT-HAND SIDE of public/_redirects (point it at the target directly)`);
  }
}

// duplicates
for (const [t, pages] of titles) if (pages.length > 1) warn(`DUPLICATE TITLE on ${pages.join(' , ')} :: "${t.slice(0, 70)}"`);
for (const [d, pages] of descs) if (pages.length > 1) warn(`DUPLICATE DESCRIPTION on ${pages.join(' , ')}`);

let indexablePaths = null;
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
  indexablePaths = smPaths;
  console.log(`sitemap URLs: ${smUrls.length}, built pages: ${builtPaths.size}`);
}

// ---- price guard report ----------------------------------------------------
{
  const { stats: s, priceErrors, priceWarns, selfContra, crossPage } = auditPrices({ indexablePaths });
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  const mode = PRICE_GUARD_ENFORCE ? 'ENFORCED' : 'REPORT-ONLY — not counted toward exit code';

  console.log(`\n===== PRICE GUARD (${mode}) =====`);
  console.log(`apps.json          : ${s.records} records | verified ${s.status.verified} | checked, not recorded ${s.status.held} | not yet checked ${s.status.unchecked}`);
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

  console.log(`\nERRORS (record contradicted / price unsourced) : ${priceErrors.length}`);
  console.log(`${SELF_CONTRADICTION_LEVEL === 'error' ? 'ERRORS' : 'WARNINGS'} (self-contradiction, same page)      : ${selfContra.length}`);
  console.log(`ERRORS (cross-page divergence)                 : ${crossPage.length}`);
  console.log(`WARNINGS                                       : ${priceWarns.length}`);

  if (selfContra.length) { console.log(''); selfContra.forEach((m) => console.log('  ' + m)); }
  if (crossPage.length) { console.log(''); crossPage.forEach((m) => console.log('  ' + m)); }
  if (priceErrors.length) { console.log(''); priceErrors.forEach((m) => console.log('  ' + m)); }

  if (PRICE_GUARD_ENFORCE) {
    priceErrors.forEach(err);
    crossPage.forEach(err);
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
