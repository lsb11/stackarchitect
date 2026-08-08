#!/usr/bin/env node
/**
 * pricing-audit.mjs — generates a manual worklist of every price claim on
 * the site, so a human can go check each one against the vendor's current
 * pricing page. It does NOT check prices itself and makes no network calls.
 *
 * Scans:
 *   - src/pages/**\/*.astro
 *   - src/content/blog/**\/*.{md,mdx}
 *   - src/data/apps.json — narrowly, just the monthlyCost / savings fields
 *     (not the free-text prose fields like technicalVerdict/pricingScaling,
 *     which may mention prices informally but aren't the structured claim)
 *
 * Claim patterns: $NNN, $NNN/mo, $NNN/month, $NNN+, "free tier", "starts at $".
 *
 * verifiedDate is resolved per source file:
 *   - .astro pages: the verifiedDate prop passed to <Base ...>, either as a
 *     string literal or as an identifier resolvable to a same-file const.
 *   - blog posts: a `verifiedDate:` key in the frontmatter block (not part
 *     of the current content schema, so this will be NEVER until someone
 *     adds one by hand — see src/layouts/Base.astro and
 *     src/content.config.ts).
 *   - apps.json: each entry's own `priceVerifiedDate` field, resolved by
 *     the enclosing entry's `id` as the line scan passes through it. Entries
 *     with priceVerifiedDate still null report NEVER, same as everywhere else.
 *
 * Output contract:
 *   - stdout is PURE CSV: file,line,claim,verifiedDate — safe to redirect
 *     to a file (`node scripts/pricing-audit.mjs > claims.csv`).
 *   - stderr carries the stale-claim flags and the summary, so redirecting
 *     stdout doesn't bury them or corrupt the CSV.
 *
 * Sort: rows with no verifiedDate (NEVER) first, then by verifiedDate
 * ascending (oldest verification first — the most overdue for a recheck).
 *
 * Usage:
 *   node scripts/pricing-audit.mjs                 # CSV to stdout, flags+summary to stderr
 *   node scripts/pricing-audit.mjs > claims.csv     # just the worklist
 *   node scripts/pricing-audit.mjs --stale 60       # flag threshold other than 90 days
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PAGES_DIR = 'src/pages';
const BLOG_DIR = 'src/content/blog';
const APPS_JSON = 'src/data/apps.json';

const args = process.argv.slice(2);
const staleIdx = args.indexOf('--stale');
const STALE_DAYS = staleIdx > -1 ? Number(args[staleIdx + 1]) : 90;

// ---------- file collection ----------
function walk(dir, exts) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((ext) => e.name.endsWith(ext))) out.push(p);
  }
  return out;
}

// ---------- verifiedDate resolution ----------
function astroVerifiedDate(src) {
  const baseMatch = src.match(/<Base\b[\s\S]*?>/);
  if (!baseMatch) return null;
  const tag = baseMatch[0];

  const literal = tag.match(/verifiedDate\s*=\s*"([^"]+)"/);
  if (literal) return literal[1];

  const ident = tag.match(/verifiedDate\s*=\s*\{\s*(\w+)\s*\}/);
  if (ident) {
    const constMatch = src.match(new RegExp(`const\\s+${ident[1]}\\s*=\\s*['"]([^'"]+)['"]`));
    if (constMatch) return constMatch[1];
  }
  return null;
}

function frontmatterVerifiedDate(src) {
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(/^verifiedDate:\s*["']?([^"'\n]+)["']?\s*$/m);
  return m ? m[1].trim() : null;
}

function toValidDate(raw) {
  if (!raw) return null;
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

// ---------- claim patterns ----------
// $150, $150.50, $1,800, $150+, $150/mo, $150/month
const DOLLAR_RE = /\$\d[\d,]*(?:\.\d{1,2})?(?:\+|\/mo(?:nth)?\b)?/gi;
const FREE_TIER_RE = /free tier/gi;
const STARTS_AT_RE = /starts at \$/gi;

function claimsInLine(line) {
  const claims = [];
  for (const m of line.matchAll(DOLLAR_RE)) claims.push(m[0]);
  for (const m of line.matchAll(FREE_TIER_RE)) claims.push(m[0]);
  for (const m of line.matchAll(STARTS_AT_RE)) claims.push(m[0]);
  return claims;
}

// ---------- scan ----------
const rows = []; // { file, line, claim, verifiedRaw, verifiedDate }

function scanTextFile(file, resolveVerifiedDate) {
  const src = readFileSync(file, 'utf8');
  const verifiedRaw = resolveVerifiedDate(src);
  const verifiedDate = toValidDate(verifiedRaw);
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    for (const claim of claimsInLine(line)) {
      rows.push({
        file,
        line: i + 1,
        claim,
        verifiedRaw: verifiedDate ? verifiedRaw : null,
        verifiedDate,
      });
    }
  });
}

for (const f of walk(PAGES_DIR, ['.astro'])) {
  scanTextFile(f, astroVerifiedDate);
}

for (const f of walk(BLOG_DIR, ['.md', '.mdx'])) {
  scanTextFile(f, frontmatterVerifiedDate);
}

// apps.json — narrow scan: monthlyCost / savings fields only, not free text
{
  const src = readFileSync(APPS_JSON, 'utf8');
  const appsData = JSON.parse(src);
  const verifiedRawById = new Map(appsData.map((a) => [a.id, a.priceVerifiedDate]));

  const lines = src.split('\n');
  let currentId = null;
  lines.forEach((line, i) => {
    const idMatch = line.match(/"id"\s*:\s*"([^"]+)"/);
    if (idMatch) currentId = idMatch[1];

    const entryVerifiedRaw = currentId ? verifiedRawById.get(currentId) : null;
    const entryVerifiedDate = toValidDate(entryVerifiedRaw);

    const mc = line.match(/"monthlyCost"\s*:\s*"([^"]*)"/);
    if (mc && mc[1]) {
      rows.push({ file: APPS_JSON, line: i + 1, claim: mc[1], verifiedRaw: entryVerifiedDate ? entryVerifiedRaw : null, verifiedDate: entryVerifiedDate });
    }
    const sv = line.match(/"savings"\s*:\s*"([^"]*)"/);
    if (sv && sv[1]) {
      rows.push({ file: APPS_JSON, line: i + 1, claim: sv[1], verifiedRaw: entryVerifiedDate ? entryVerifiedRaw : null, verifiedDate: entryVerifiedDate });
    }
  });
}

// ---------- sort: NEVER first, then verifiedDate ascending ----------
rows.sort((a, b) => {
  if (!a.verifiedDate && !b.verifiedDate) return a.file.localeCompare(b.file) || a.line - b.line;
  if (!a.verifiedDate) return -1;
  if (!b.verifiedDate) return 1;
  return a.verifiedDate - b.verifiedDate || a.file.localeCompare(b.file) || a.line - b.line;
});

// ---------- CSV output (stdout) ----------
function csvField(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

console.log(['file', 'line', 'claim', 'verifiedDate'].join(','));

const now = new Date();
const dayMs = 24 * 60 * 60 * 1000;
let neverCount = 0;
let staleCount = 0;
const staleRows = [];

for (const r of rows) {
  const verifiedOut = r.verifiedDate ? r.verifiedRaw : 'NEVER';
  console.log([csvField(r.file), r.line, csvField(r.claim), csvField(verifiedOut)].join(','));

  if (!r.verifiedDate) {
    neverCount++;
  } else {
    const days = Math.floor((now - r.verifiedDate) / dayMs);
    if (days > STALE_DAYS) {
      staleCount++;
      staleRows.push({ ...r, days });
    }
  }
}

// ---------- flags + summary (stderr — keeps stdout pure CSV) ----------
for (const r of staleRows) {
  console.error(`STALE (${r.days}d old): ${r.file}:${r.line} — ${r.claim}`);
}

console.error('');
console.error(`Total claims: ${rows.length}`);
console.error(`Never verified: ${neverCount}`);
console.error(`Stale (>${STALE_DAYS}d): ${staleCount}`);
