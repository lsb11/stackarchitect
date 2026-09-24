#!/usr/bin/env node
/**
 * schema-visible-guard.mjs — fails the build when JSON-LD asserts a numeric
 * claim that does not appear in the page's visible text.
 *
 * WHY THIS EXISTS
 * Removing "EMQ 6–8" from the homepage prose left it standing inside an
 * ItemList description in the same file's JSON-LD. Schema is invisible to
 * readers and highly visible to search engines, so a claim deleted from the
 * copy can go on being asserted to Google indefinitely with nobody noticing.
 * Google's structured data policy requires markup to represent the page's
 * visible content; this guard makes the drift impossible rather than relying
 * on remembering to fix both.
 *
 * WHAT IT CHECKS
 * Runs over dist/ after the build, and makes five separate checks.
 *
 *  1. Numeric claims. For every page, extracts numeric claims from JSON-LD
 *     string values and from the rendered visible text, then fails on any
 *     number asserted in schema but absent from the page.
 *  2. First-party Offer prices. Fails when a price WE set, asserted in an
 *     Offer, does not equal the constant it mirrors in src/data/products.ts
 *     (pinned in src/data/claims.json). Check 1 cannot do this — see the long
 *     note above firstPartyPrices for why. Added after the homepage shipped
 *     the Complete Kit at a retired $29.
 *  3. Third-party Offers. Fails when a competitor's Offer has no
 *     priceVerifiedDate, no vendor source URL, or a price that is not shown
 *     next to the product's name. See CHECK 3 below.
 *  4. Unrendered placeholders. Fails when visible text or a JSON-LD string
 *     contains a literal {camelCase} name, such as {kitPrice}. See CHECK 4.
 *  5. Stocky shutdown wording. Fails when visible text, a meta/alt/title
 *     attribute or a JSON-LD string still says Stocky is shutting down, or
 *     claims data is deleted. See CHECK 5.
 *
 * Numbers are normalised (thousands separators, en/em dashes, $ and %
 * retained) so "$1,500" and "$1500" compare equal, and a range written
 * "6–8" in schema matches "6-8" in prose.
 *
 * DELIBERATELY NOT CHECKED
 *  - Bare integers 0–12 and 4-digit years. Positions, ratings, step counts,
 *    itemListElement indices and dates are structural, not claims.
 *  - Values under keys that are inherently metadata rather than assertions
 *    (see STRUCTURAL_KEYS) — position, ratingValue, datePublished and the
 *    like carry numbers that have no business appearing in prose.
 *  - URLs, @id values and identifiers.
 *
 * Usage:
 *   node scripts/schema-visible-guard.mjs           # exit 1 on violation
 *   node scripts/schema-visible-guard.mjs --list    # report only, exit 0
 *
 * Runs as part of `npm run build`, after astro build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');

/** Keys whose numeric values are structural metadata, never prose claims. */
const STRUCTURAL_KEYS = new Set([
  'position', 'ratingValue', 'bestRating', 'worstRating', 'ratingCount',
  'reviewCount', 'datePublished', 'dateModified', 'dateCreated', 'uploadDate',
  'startDate', 'endDate', 'priceValidUntil', 'width', 'height', 'duration',
  'numberOfItems', 'commentCount', 'wordCount', 'timeRequired', 'version',
  '@id', 'url', 'sameAs', 'identifier', 'sku', 'gtin', 'telephone',
  'postalCode', 'priceCurrency', 'value', 'maxValue', 'minValue',
  'openingHours', 'validFrom', 'contentUrl', 'embedUrl', 'thumbnailUrl',
  'logo', 'image', 'potentialAction', 'target',
]);

/** Extract numeric claims worth checking from a string. */
function numericClaims(text) {
  const out = new Set();
  // money, optionally a range, optionally a period
  for (const m of text.matchAll(
    /\$\s?\d[\d,]*(?:\.\d+)?(?:\s*[–—-]\s*\$?\d[\d,]*(?:\.\d+)?)?(?:\s*\/\s*(?:mo|month|yr|year))?\+?/gi
  )) out.add(norm(m[0]));
  // percentages, optionally a range
  for (const m of text.matchAll(/\d[\d,]*(?:\.\d+)?\s*[–—-]?\s*(?:\d[\d,]*(?:\.\d+)?)?\s*%/g))
    out.add(norm(m[0]));
  // bare numeric ranges like "6–8" or "7.0–8.5" — the EMQ failure mode.
  // Excludes anything where either side is a 4-digit year ("Shopify 2026 — 12
  // Tools" is a title, not a range) or is zero-padded ("Blueprint 01–04" is an
  // identifier). Both produced false positives on first run.
  for (const m of text.matchAll(/\b(\d+(?:\.\d+)?)\s*[–—]\s*(\d+(?:\.\d+)?)\b/g)) {
    const [, a, b] = m;
    if (/^\d{4}$/.test(a) || /^\d{4}$/.test(b)) continue;
    if (/^0\d/.test(a) || /^0\d/.test(b)) continue;
    out.add(norm(m[0]));
  }
  return out;
}

function norm(s) {
  return s
    .replace(/[–—]/g, '-')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/**
 * Site-level entities describe the organisation and the site as a whole, not
 * the page they happen to be embedded in. Their descriptions legitimately
 * carry figures (e.g. the "$700+/month of paid apps" positioning line) that
 * no individual page needs to restate, and they are injected into all 120
 * documents by Base.astro. Checking them would flag every page for a claim
 * that belongs to the site, not the page.
 */
const SITE_LEVEL_TYPES = new Set([
  'Organization', 'WebSite', 'SiteNavigationElement', 'Person', 'BreadcrumbList',
]);

function isSiteLevel(node) {
  if (!node || typeof node !== 'object') return false;
  const t = node['@type'];
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => SITE_LEVEL_TYPES.has(x));
}

/** Pull every string value out of a JSON-LD graph, skipping structural keys. */
function stringsFrom(node, key = null, acc = []) {
  if (node == null) return acc;
  if (typeof node === 'string') {
    if (!STRUCTURAL_KEYS.has(key) && !/^https?:\/\//.test(node)) acc.push(node);
    return acc;
  }
  if (Array.isArray(node)) {
    for (const v of node) stringsFrom(v, key, acc);
    return acc;
  }
  if (typeof node === 'object') {
    if (isSiteLevel(node)) return acc;
    for (const [k, v] of Object.entries(node)) {
      if (STRUCTURAL_KEYS.has(k)) continue;
      stringsFrom(v, k, acc);
    }
  }
  return acc;
}

function visibleText(html) {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, ''])[1];
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * A single money figure counts as visible when its digits appear on the page
 * with a currency prefix, even if the surrounding formatting differs. Schema
 * writing "from $2,999/month" and the page writing "$2,999+" are the same
 * claim to a reader; only the suffix differs.
 *
 * DELIBERATELY NOT APPLIED TO RANGES. "$19–$99/mo" must match exactly,
 * because a page containing "$19" somewhere and "$99" somewhere else has not
 * asserted the range — and a range the page never states is precisely the
 * drift this guard exists to catch.
 */
function singleMoneyVisible(claim, visRaw) {
  if (!claim.startsWith('$')) return false;
  if (/\d[-–—]/.test(claim) || claim.split('$').length > 2) return false; // a range
  const core = claim.match(/^\$(\d+(?:\.\d+)?)/);
  if (!core) return false;
  return visRaw.includes('$' + core[1]);
}

/* =========================================================================
 * CHECK 2 — first-party Offer prices must equal the constant they mirror.
 *
 * WHY THIS IS SEPARATE FROM CHECK 1
 * The homepage shipped `"price": "29"` inside a SoftwareApplication Offer
 * while the Kit had been $24 since 29 Aug. Check 1 did not see it, and could
 * not have: it lifts claims out of strings with a money/percent/range regex,
 * and a bare "29" carries no $, no % and no dash, so it yields no claim at
 * all. Even had it produced one, "29" appears twelve times in that page's
 * visible text as somebody else's pricing (Stape $29+/mo, BeProfit $29+/mo,
 * "$29-$199/mo"), so a presence test over the whole page would have passed it.
 *
 * Presence is the wrong question for a price we set. The right question is
 * identity: does this Offer's price equal the constant it mirrors? That is
 * answerable exactly, with no text matching, so it cannot false-positive on
 * competitor pricing — which never appears as a first-party Offer.price.
 *
 * SCOPE — deliberately narrow. An Offer is checked only when the product-like
 * node enclosing it names us as seller/provider/publisher/author/brand (#org
 * or #luke) or carries a `url` on our domain, AND the Offer itself has no
 * priceVerifiedDate or priceSourceUrl. Each exclusion is load-bearing; see
 * PRODUCT_TYPES, marksFirstParty and isThirdPartyOffer below for the pages
 * that forced them.
 * ====================================================================== */

const OFFER_TYPES = new Set(['Offer', 'AggregateOffer', 'UnitPriceSpecification']);
const PRICE_KEYS = ['price', 'lowPrice', 'highPrice'];
const OUR_DOMAIN = /(?:^|\/\/)(?:www\.)?stackarchitect\.xyz(?:\/|$)/;

/**
 * Only these types can own an Offer, and only they pass first-party status
 * down to it. An ItemList or a WebPage must NOT: /apps/ and
 * /shopify-attribution-tools-compared/ both list competitors' apps inside an
 * ItemList on our own URL, and treating the list's ownership as the items'
 * flagged fourteen third-party prices on the first run of this check.
 */
const PRODUCT_TYPES = new Set([
  'Product', 'SoftwareApplication', 'WebApplication', 'MobileApplication',
  'Service', 'IndividualProduct', 'ProductModel',
]);

function typesOf(node) {
  const t = node?.['@type'];
  return Array.isArray(t) ? t : t ? [t] : [];
}

/**
 * Does this node claim us as the party BEHIND the thing, rather than merely
 * describing it?
 *
 * `@id` is deliberately not consulted. Every competitor app on /apps/ carries
 * an @id like "https://stackarchitect.xyz/apps/yotpo/#app" — that is a node
 * identifier scoped to our graph, not a claim that we sell Yotpo. Only a
 * seller/provider/publisher/author/brand pointing at #org, or a canonical url
 * on our own domain, means the price is ours to keep in sync.
 */
function marksFirstParty(node) {
  if (!node || typeof node !== 'object') return false;
  for (const k of ['seller', 'provider', 'publisher', 'author', 'brand']) {
    const v = node[k];
    const id = typeof v === 'string' ? v : v?.['@id'];
    if (typeof id === 'string' && /#org\b|#luke\b/.test(id)) return true;
  }
  return typeof node.url === 'string' && OUR_DOMAIN.test(node.url);
}

/**
 * An Offer that carries priceVerifiedDate or priceSourceUrl is, by the rule in
 * CLAUDE.md, somebody else's number: those two fields exist precisely to cite
 * an external source and the date a human read it. A price we set has no
 * external source to cite, so it never carries them. This is the cleanest
 * available signal and it keeps the check off every vendor Offer on /apps/.
 */
function isThirdPartyOffer(node) {
  return 'priceVerifiedDate' in node || 'priceSourceUrl' in node;
}

/**
 * Every first-party price asserted in a JSON-LD graph.
 *
 * `ownerIsOurs` carries down only from the enclosing product-like node,
 * because an Offer usually names no seller of its own.
 */
export function firstPartyPrices(node, ownerIsOurs = false, path = '$', out = []) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => firstPartyPrices(v, ownerIsOurs, `${path}[${i}]`, out));
    return out;
  }
  if (!node || typeof node !== 'object') return out;

  const types = typesOf(node);

  // A product-like node re-decides ownership for everything beneath it: an
  // enclosing list cannot make a competitor's app ours.
  let inherit = ownerIsOurs;
  if (types.some((t) => PRODUCT_TYPES.has(t))) inherit = marksFirstParty(node);

  if (types.some((t) => OFFER_TYPES.has(t))) {
    const mine = (inherit || marksFirstParty(node)) && !isThirdPartyOffer(node);
    if (mine) {
      for (const k of PRICE_KEYS) {
        if (!(k in node)) continue;
        const value = Number(node[k]);
        if (!Number.isFinite(value)) continue;
        out.push({ path: `${path}.${k}`, key: k, raw: node[k], value });
      }
    }
  }

  for (const [k, v] of Object.entries(node)) {
    if (k === '@type') continue;
    firstPartyPrices(v, inherit, `${path}.${k}`, out);
  }
  return out;
}

/**
 * A first-party price is legitimate only if it is 0 (our free tools) or a
 * value pinned under `ours` in src/data/claims.json — the same figures
 * src/data/products.ts exports. Anything else is drift, and a retired value
 * is named as such because that is the likely story.
 */
export function firstPartyPriceViolations(graph, claims) {
  const allowed = new Map([[0, 'free']]);
  const retired = new Map();
  for (const [name, spec] of Object.entries(claims.ours ?? {})) {
    if (typeof spec?.value === 'number') allowed.set(spec.value, name);
    for (const r of spec?.retired ?? []) {
      if (typeof r === 'number') retired.set(r, name);
    }
  }
  return firstPartyPrices(graph)
    .filter((p) => !allowed.has(p.value))
    .map((p) => ({
      ...p,
      retiredOf: retired.get(p.value) ?? null,
      allowed: [...allowed.keys()].sort((a, b) => a - b),
    }));
}

/* =========================================================================
 * CHECK 3 — third-party Offers must be sourced, dated and shown.
 *
 * WHY
 * Check 2 skips every Offer that is not ours, and check 1 cannot see an Offer
 * price at all (a bare "145" carries no $). So until Sep 2026 none of the ~30
 * competitor Offers the site emits was checked by anything. The page templates
 * gate on apps.json at build time, but a gate in a template is not a guard:
 * /shopify-attribution-tools-compared/ was dropping priceVerifiedDate from all
 * four of its Offers, and its Analyzify Offer asserted $145–$275 on a page
 * whose visible copy prices Analyzify per year.
 *
 * RULES, per non-zero third-party Offer (the CLAUDE.md hard rule, made testable)
 *  1. it carries priceVerifiedDate;
 *  2. it cites a vendor source — priceSourceUrl, or `url` — off our domain;
 *  3. every price it asserts (price / lowPrice / highPrice) appears in the
 *     visible text as a $ figure within NAME_WINDOW characters of the product's
 *     name. Presence anywhere on the page is not enough: "$29" is on most pages
 *     as somebody's price, which is what let check 1's presence test pass a
 *     retired Kit price.
 * ====================================================================== */

const THIRD_PARTY_OFFER_TYPES = new Set(['Offer', 'AggregateOffer']);
const NAME_WINDOW = 600;

/** Every non-zero Offer in a graph that check 2 does not treat as ours. */
export function thirdPartyOffers(graph) {
  const mine = new Set(firstPartyPrices(graph).map((p) => p.path));
  const out = [];
  (function walk(node, p, owner) {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${p}[${i}]`, owner));
    if (!node || typeof node !== 'object') return;
    const types = typesOf(node);
    if (types.some((t) => THIRD_PARTY_OFFER_TYPES.has(t))) {
      const keys = PRICE_KEYS.filter((k) => k in node);
      const values = keys.map((k) => Number(node[k])).filter((v) => Number.isFinite(v) && v > 0);
      if (values.length && !keys.some((k) => mine.has(`${p}.${k}`))) {
        out.push({ path: p, owner, node, values });
      }
    }
    const next = types.some((t) => PRODUCT_TYPES.has(t)) ? node.name ?? owner : owner;
    for (const [k, v] of Object.entries(node)) {
      if (k !== '@type') walk(v, `${p}.${k}`, next);
    }
  })(graph, '$', null);
  return out;
}

/** Offsets of every case-insensitive occurrence of `needle` in `hay`. */
function offsetsOf(hay, needle) {
  const at = [];
  if (!needle) return at;
  const h = hay.toLowerCase();
  const n = needle.toLowerCase();
  for (let i = h.indexOf(n); i !== -1; i = h.indexOf(n, i + 1)) at.push(i);
  return at;
}

/**
 * Problems with each third-party Offer in `graph`, judged against `visible`,
 * the page's visible text as visibleText() returns it.
 */
export function thirdPartyOfferViolations(graph, visible) {
  const text = visible.replace(/,/g, '');
  const out = [];
  for (const o of thirdPartyOffers(graph)) {
    const problems = [];
    if (!o.node.priceVerifiedDate) problems.push('no priceVerifiedDate');
    const src = o.node.priceSourceUrl ?? o.node.url;
    if (typeof src !== 'string' || OUR_DOMAIN.test(src)) problems.push('no vendor source URL');
    const names = offsetsOf(text, o.owner);
    for (const v of o.values) {
      const re = new RegExp(`\\$\\s?${String(v).replace('.', '\\.')}(?![0-9])`, 'g');
      const at = [...text.matchAll(re)].map((m) => m.index);
      if (!at.length) problems.push(`$${v} is not on the page`);
      else if (!o.owner || !at.some((a) => names.some((n) => Math.abs(a - n) <= NAME_WINDOW))) {
        problems.push(`$${v} is not shown near "${o.owner ?? '(unnamed)'}"`);
      }
    }
    if (problems.length) out.push({ path: o.path, owner: o.owner, values: o.values, problems });
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * CHECK 4: unrendered template placeholders.
 *
 * Two homepage FAQ answers shipped "Complete Kit for {kitPrice}" to readers
 * and to the FAQPage JSON-LD until 24 Sep 2026. The answers were JS template
 * literals, where only ${kitPrice} interpolates. A bare {kitPrice} is plain
 * text there, though it would work in Astro markup. No other check saw it,
 * because the string carries no number.
 *
 * Matches a single-braced camelCase identifier. Requiring a capital letter
 * keeps out prose braces and Make's {{email}} syntax, which is double-braced
 * and lower case. Runs on visible text and on JSON-LD strings.
 * ------------------------------------------------------------------------- */
const PLACEHOLDER = /(?<![{$])\{[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*\}(?!\})/g;

export function unrenderedPlaceholders(text) {
  return [...new Set(text.match(PLACEHOLDER) ?? [])];
}

/* -------------------------------------------------------------------------
 * CHECK 5: Stocky shutdown wording.
 *
 * Stocky closed on 31 August 2026. Read-only export stays open for at least
 * 90 days after that, and Shopify has published no end date and no deletion
 * date. Copy written before the closure said "shutting down" and "shuts down
 * August 31", and it kept shipping for weeks after the date passed because
 * no check reads tense. Nor does any check read a claim that data was or will
 * be deleted, which is the one statement here that could cost a merchant
 * their export.
 *
 * Scanned: visible body text, the text-bearing attributes (content, title,
 * alt, aria-label) and every JSON-LD string. Allowlisted: the homepage video
 * transcript only, the <details class="hero-video-transcript"> block, because
 * it transcribes audio recorded before the closure and a transcript has to
 * match what is said. Nothing else on index.html is exempt.
 * ------------------------------------------------------------------------- */
const SHUTDOWN_WORDING = [
  /stocky.{0,60}(shutting down|will (shut|close)|shuts down|is closing|before the shutdown|closes on)|(shutting down|shuts down).{0,40}stocky/gi,
  /delet(ed|es|ing) all/gi,
];
const TRANSCRIPT_BLOCK = /<details\b[^>]*\bclass="[^"]*\bhero-video-transcript\b[^"]*"[^>]*>[\s\S]*?<\/details>/gi;
const TEXT_ATTRS = /\b(?:content|title|alt|aria-label)="([^"]*)"/gi;

export function shutdownWordingIn(text) {
  const hits = [];
  for (const re of SHUTDOWN_WORDING) {
    for (const m of text.matchAll(re)) hits.push(m[0]);
  }
  return hits;
}

/** Every shutdown-wording hit on a built page, with where it was found. */
export function shutdownWordingHits(html) {
  const page = html.replace(TRANSCRIPT_BLOCK, ' ');
  const hits = [];
  for (const h of shutdownWordingIn(visibleText(page))) hits.push({ where: 'visible text', text: h });
  const head = page.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  for (const m of head.matchAll(TEXT_ATTRS)) {
    for (const h of shutdownWordingIn(decodeAttr(m[1]))) hits.push({ where: 'attribute', text: h });
  }
  for (const m of page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let graph;
    try {
      graph = JSON.parse(m[1]);
    } catch {
      continue;
    }
    for (const s of nodeTexts(graph)) {
      for (const h of shutdownWordingIn(s)) hits.push({ where: 'JSON-LD', text: h });
    }
  }
  return hits;
}

/**
 * One string per JSON-LD node: its own string values joined. The Stocky node
 * on /stocky-swap/ carried the name and the wording in separate fields
 * ({ name: "Stocky", description: "...shutting down..." }), so scanning each
 * string alone never sees the word "Stocky" beside the tense. Site-level
 * nodes are included here, unlike check 1: a stale claim is stale anywhere.
 */
function nodeTexts(node, acc = []) {
  if (Array.isArray(node)) {
    for (const v of node) {
      if (typeof v === 'string') acc.push(v);
      else nodeTexts(v, acc);
    }
  } else if (node && typeof node === 'object') {
    const own = Object.values(node).filter((v) => typeof v === 'string' && !/^https?:\/\//.test(v));
    if (own.length) acc.push(own.join(' '));
    for (const v of Object.values(node)) if (v && typeof v === 'object') nodeTexts(v, acc);
  }
  return acc;
}

function decodeAttr(s) {
  return s
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&[a-z#0-9]+;/gi, ' ');
}

/* The checks above are pure and are imported by
 * tests/schema-first-party-price.test.js. Everything below is the CLI: it
 * reads dist/ and exits non-zero, so it must not run on import. The body is
 * left at its original indentation so the wrapping shows as two lines of diff
 * rather than as a rewrite of the whole file. */
const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();

function main() {
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
})(DIST);

/**
 * Pre-existing violations, quarantined on 2026-08-26 so the guard can be
 * enforced immediately without blocking on 15 separate content decisions
 * (does this number belong on the page, or should it leave the schema?).
 * Same ratchet as claims-guard.mjs: this list may only shrink, and the guard
 * fails on a stale entry so it cannot become a permanent exemption.
 */
const QUARANTINE_PATH = path.join(ROOT, 'docs', 'schema-claims-unverified.json');
const quarantine = fs.existsSync(QUARANTINE_PATH)
  ? new Set(JSON.parse(fs.readFileSync(QUARANTINE_PATH, 'utf8')).allow)
  : new Set();

const violations = [];

const claims = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'claims.json'), 'utf8'));
const priceViolations = [];

// Check 3's quarantine lives in the same file under its own key, keyed
// "url|product name". Same ratchet: it may only shrink, and a stale entry fails.
const offerQuarantine = new Map(
  (fs.existsSync(QUARANTINE_PATH)
    ? JSON.parse(fs.readFileSync(QUARANTINE_PATH, 'utf8')).thirdPartyOffers ?? []
    : []
  ).map((e) => [e.key, e.why])
);
const offerViolations = [];
const placeholderViolations = [];
const shutdownViolations = [];

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const url = '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  const vis = visibleText(html);
  // Numbers present anywhere visible, normalised the same way.
  const visClaims = numericClaims(vis);
  // Also accept a bare number appearing in prose without its unit.
  const visRaw = norm(vis);

  for (const h of shutdownWordingHits(html)) shutdownViolations.push({ url, ...h });

  for (const p of unrenderedPlaceholders(vis)) {
    placeholderViolations.push({ url, where: 'visible text', placeholder: p });
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let graph;
    try {
      graph = JSON.parse(m[1]);
    } catch {
      continue; // invalid JSON-LD is a separate concern
    }
    for (const s of stringsFrom(graph)) {
      for (const p of unrenderedPlaceholders(s)) {
        placeholderViolations.push({ url, where: 'JSON-LD', placeholder: p });
      }
    }
    for (const v of firstPartyPriceViolations(graph, claims)) {
      priceViolations.push({ url, ...v });
    }
    for (const v of thirdPartyOfferViolations(graph, vis)) {
      offerViolations.push({ url, key: `${url}|${v.owner}`, ...v });
    }
    for (const s of stringsFrom(graph)) {
      for (const claim of numericClaims(s)) {
        if (visClaims.has(claim)) continue;
        if (visRaw.includes(claim)) continue;
        if (singleMoneyVisible(claim, visRaw)) continue;
        violations.push({ url, claim, context: s.slice(0, 150) });
      }
    }
  }
}

// Collapse duplicates (the same claim often recurs across a graph).
const seen = new Set();
const unique = violations.filter((v) => {
  const k = v.url + '|' + v.claim;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

const live = unique.filter((v) => !quarantine.has(`${v.url}|${v.claim}`));
const cleared = [...quarantine].filter(
  (k) => !unique.some((v) => `${v.url}|${v.claim}` === k)
);

const uniquePrice = [];
{
  const pseen = new Set();
  for (const v of priceViolations) {
    const k = `${v.url}|${v.path}|${v.raw}`;
    if (pseen.has(k)) continue;
    pseen.add(k);
    uniquePrice.push(v);
  }
}

if (uniquePrice.length && !process.argv.includes('--list')) {
  console.error('\n\u2717 schema-visible-guard: first-party price in JSON-LD does not match its constant\n');
  for (const v of uniquePrice) {
    console.error(`  ${v.url}`);
    console.error(
      `    ${v.path} = ${JSON.stringify(v.raw)}` +
        (v.retiredOf ? `  \u2014 that is a RETIRED ${v.retiredOf}` : '') +
        `  (pinned: ${v.allowed.join(', ')})`
    );
  }
  console.error(
    '\n  These are prices we set. They come from src/data/products.ts and are\n' +
      '  pinned in src/data/claims.json under `ours`. Reference the constant\n' +
      '  rather than writing the number: Astro does not interpolate inside a\n' +
      '  <script type="application/ld+json"> element, so a price written there\n' +
      '  cannot be kept honest \u2014 hand the node to <Base schema={...}> instead.\n'
  );
  process.exit(1);
}

if (placeholderViolations.length && !process.argv.includes('--list')) {
  console.error('\n✗ schema-visible-guard: unrendered template placeholder on a built page\n');
  for (const v of placeholderViolations) console.error(`  ${v.url}  ${v.placeholder}  in ${v.where}`);
  console.error(
    '\n  A {name} inside a JS template literal is literal text. Write ${name}\n' +
      '  there. In Astro markup, {name} is correct and renders the value.\n'
  );
  process.exit(1);
}

if (shutdownViolations.length && !process.argv.includes('--list')) {
  console.error('\n✗ schema-visible-guard: Stocky shutdown wording on a built page\n');
  for (const v of shutdownViolations) console.error(`  ${v.url}  "${v.text}"  in ${v.where}`);
  console.error(
    '\n  Stocky closed on 31 August 2026. Read-only export stays open for at least\n' +
      '  90 days after that, with no end date published. Write it in the past tense,\n' +
      '  and do not say data was or will be deleted. Only the homepage video\n' +
      '  transcript is exempt.\n'
  );
  process.exit(1);
}

if (process.argv.includes('--list')) {
  console.log(`schema-visible-guard: ${shutdownViolations.length} Stocky shutdown wording hit(s)`);
  for (const v of shutdownViolations) console.log(`  ${v.url}  "${v.text}"  in ${v.where}`);
  console.log(`schema-visible-guard: ${placeholderViolations.length} unrendered placeholder(s)`);
  for (const v of placeholderViolations) console.log(`  ${v.url}  ${v.placeholder}  in ${v.where}`);
  console.log(
    `schema-visible-guard: ${unique.length} schema-only numeric claim(s) ` +
      `(${live.length} live, ${unique.length - live.length} quarantined)\n`
  );
  for (const v of unique) {
    const q = quarantine.has(`${v.url}|${v.claim}`) ? ' [quarantined]' : '';
    console.log(`  ${v.url}${q}\n    ${v.claim} — "${v.context}"`);
  }
  console.log(`\nschema-visible-guard: ${uniquePrice.length} first-party price mismatch(es)`);
  for (const v of uniquePrice) console.log(`  ${v.url}\n    ${v.path} = ${JSON.stringify(v.raw)}`);
  console.log(`\nschema-visible-guard: ${offerViolations.length} third-party Offer problem(s)`);
  for (const v of offerViolations) {
    const q = offerQuarantine.has(v.key) ? ' [quarantined]' : '';
    console.log(`  ${v.url} ${v.owner}${q}\n    ${v.problems.join('; ')}`);
  }
  process.exit(0);
}

const liveOffers = offerViolations.filter((v) => !offerQuarantine.has(v.key));
const clearedOffers = [...offerQuarantine.keys()].filter(
  (k) => !offerViolations.some((v) => v.key === k)
);
if (clearedOffers.length) {
  console.error('\n\u2717 schema-visible-guard: stale third-party Offer quarantine entries\n');
  for (const k of clearedOffers) console.error(`  ${k} \u2014 no longer violates; remove it from docs/schema-claims-unverified.json`);
  console.error('');
  process.exit(1);
}
if (liveOffers.length) {
  console.error('\n\u2717 schema-visible-guard: third-party Offer is unsourced, undated or not shown\n');
  for (const v of liveOffers) {
    console.error(`  ${v.url}  ${v.owner}  (${v.values.map((x) => '$' + x).join('\u2013')})`);
    for (const p of v.problems) console.error(`    ${p}`);
  }
  console.error(
    '\n  A competitor price in structured data needs priceVerifiedDate, a vendor\n' +
      '  source URL, and the same figure visible next to the product name. Fix the\n' +
      '  record in src/data/apps.json, or drop the Offer from the schema.\n'
  );
  process.exit(1);
}

if (cleared.length) {
  console.error('\n✗ schema-visible-guard: stale quarantine entries\n');
  for (const k of cleared) console.error(`  ${k} — no longer violates; remove it from docs/schema-claims-unverified.json`);
  console.error('');
  process.exit(1);
}

if (live.length) {
  console.error('\n✗ schema-visible-guard: JSON-LD asserts numbers the page does not show\n');
  for (const v of live) {
    console.error(`  ${v.url}`);
    console.error(`    ${v.claim}  in: "${v.context}"`);
  }
  console.error(
    '\n  Structured data must represent the visible page. Either state the claim\n' +
      '  on the page, or remove it from the schema. A number deleted from the copy\n' +
      '  but left in JSON-LD goes on being asserted to Google unseen.\n'
  );
  process.exit(1);
}

console.log(
  `\u2713 schema-visible-guard: ${files.length} pages, no new schema-only numeric claims ` +
    `(${quarantine.size} quarantined), first-party prices match their constants, ` +
    `${offerViolations.length - liveOffers.length} third-party Offer(s) quarantined, ` +
    `no unrendered placeholders, no Stocky shutdown wording.`
);
}
