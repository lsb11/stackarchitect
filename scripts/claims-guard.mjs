#!/usr/bin/env node
/**
 * claims-guard.mjs — fails the build when a page asserts a third-party price
 * without carrying a verification date.
 *
 * WHY A RATCHET AND NOT A FLAG DAY
 * The August 2026 audit found 31 page files asserting third-party prices with
 * no verifiedDate. The obvious "fix" — stamp today's date on all 31 — would
 * assert that a human checked those figures against the vendor's live pricing
 * page. Nobody has. That is manufacturing the exact trust signal the audit
 * exists to make real, and it would be worse than the current state: an
 * undated price is unverified, a falsely dated price is a lie with a
 * timestamp.
 *
 * So the guard ships with the current offenders quarantined in
 * docs/claims-unverified.json. The rules are:
 *
 *   1. A page with third-party price claims and no verifiedDate FAILS the
 *      build — unless it is quarantined.
 *   2. The quarantine can only shrink. Adding to it requires editing the file
 *      by hand, which is a reviewable diff and a deliberate act.
 *   3. A quarantined page that has since gained a verifiedDate, or lost its
 *      price claims, FAILS as stale — so the list cannot rot into a
 *      permanent exemption nobody revisits.
 *
 * Clearing an entry means opening the vendor's pricing page, reading the
 * number, and passing the date you read it as verifiedDate to <Base>. That
 * is the whole job. There is no other way to clear it.
 *
 * ---------------------------------------------------------------------------
 * SECOND CHECK — CANONICAL FIGURES (src/data/claims.json)
 *
 * The ratchet above asks "is this number dated?". It cannot ask "is this
 * number right?", and that is the failure that actually happened: two blog
 * posts drifted from $9 to $12 for Make Core and sat wrong for months, while
 * the kit price lived as a literal inside this file's own allowlist, so
 * moving the kit off $29 broke the build rather than being caught by it.
 *
 * src/data/claims.json names the figures we consider settled — our prices,
 * Make's Core price, Make's free-plan scenario cap, the savings range. This
 * check reads every page and fails the build when one states a number in the
 * right context with the wrong value, or repeats a claim we have retired.
 *
 * There is no quarantine for this one. A quarantine is for work outstanding —
 * a vendor price nobody has verified yet. A contradiction of a canonical
 * figure is not outstanding work, it is a page that is wrong, and the fix is
 * to correct the page or to change claims.json deliberately.
 *
 * Usage:
 *   node scripts/claims-guard.mjs          # exit 1 on violation
 *   node scripts/claims-guard.mjs --list   # print the worklist, always exit 0
 *
 * Runs as part of `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const QUARANTINE = path.join(ROOT, 'docs', 'claims-unverified.json');
const CANONICAL = path.join(ROOT, 'src', 'data', 'claims.json');

const canonical = JSON.parse(fs.readFileSync(CANONICAL, 'utf8'));

/** Every figure under `ours` as a bare number, for the allowlist below. */
const ourPrices = Object.values(canonical.ours)
  .map((c) => c.value)
  .filter((v) => typeof v === 'number');

/**
 * Prices that are ours, not a third party's, and so need no vendor source.
 * Built from src/data/claims.json — $0 (the free stack, the whole premise)
 * plus every figure under `ours`. Everything else is somebody else's number
 * and needs a source and a date.
 *
 * This list used to be a hand-written regex, which is exactly how it went
 * stale: the kit moved to $24 and every mention of the new price read as an
 * undated third-party claim.
 */
const OURS = new RegExp(
  `^\\$(0|${ourPrices.map((v) => String(v).replace('.', '\\.')).join('|')})` +
    `(\\/(mo|month|yr|year))?[,.]?$`
);

const PRICE =
  /\$[0-9][0-9,]*(?:\.[0-9]{2})?(?:\s*[–—-]\s*\$?[0-9][0-9,]*(?:\.[0-9]{2})?)?(?:\s*\/\s*(?:mo|month|yr|year))?\+?/g;

function claimsIn(source) {
  return [...source.matchAll(PRICE)].map((m) => m[0].trim()).filter((p) => !OURS.test(p));
}

function scan() {
  const out = [];

  const pagesDir = path.join(ROOT, 'src', 'pages');
  for (const f of fs.readdirSync(pagesDir).filter((f) => f.endsWith('.astro'))) {
    const rel = `src/pages/${f}`;
    const src = fs.readFileSync(path.join(pagesDir, f), 'utf8');
    out.push({ file: rel, claims: claimsIn(src), dated: /verifiedDate/.test(src) });
  }

  const blogDir = path.join(ROOT, 'src', 'content', 'blog');
  if (fs.existsSync(blogDir)) {
    for (const f of fs.readdirSync(blogDir).filter((f) => /\.mdx?$/.test(f))) {
      const rel = `src/content/blog/${f}`;
      const src = fs.readFileSync(path.join(blogDir, f), 'utf8');
      // Blog posts carry the date in frontmatter, not as a <Base> prop.
      const fm = src.match(/^---\n([\s\S]*?)\n---/);
      const dated = fm ? /^\s*verifiedDate:/m.test(fm[1]) : false;
      out.push({ file: rel, claims: claimsIn(src), dated });
    }
  }

  return out;
}

/**
 * Every text file a reader or a crawler can reach. Wider than the ratchet's
 * scan, which only looks at top-level pages and blog posts: the Make Core
 * price is quoted in components and layouts too, and llms.txt is what a model
 * reads when asked what we charge.
 */
function contentFiles() {
  const roots = [
    ['src', 'pages'],
    ['src', 'content'],
    ['src', 'components'],
    ['src', 'layouts'],
    ['public'],
  ];
  const exts = /\.(astro|md|mdx|ts|js|mjs|json|txt|vtt)$/;
  const skip = /node_modules|\.astro\/|dist\//;
  const found = [];

  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (skip.test(full)) continue;
      if (entry.isDirectory()) walk(full);
      else if (exts.test(entry.name)) found.push(full);
    }
  };

  for (const r of roots) walk(path.join(ROOT, ...r));
  // claims.json states the canonical values; checking it against itself would
  // flag every retired figure it deliberately records.
  return found.filter((f) => f !== CANONICAL);
}

/** Line number of a character offset, for an error a human can act on. */
function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

function checkCanonical() {
  const problems = [];
  const entries = [
    ...Object.entries(canonical.ours).map(([k, v]) => [k, v, 'ours']),
    ...Object.entries(canonical.thirdParty).map(([k, v]) => [k, v, 'thirdParty']),
  ];

  for (const file of contentFiles()) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);

    for (const [id, claim] of entries) {
      // (a) numbers stated in a context that identifies the claim
      for (const pattern of claim.contexts || []) {
        const re = new RegExp(pattern, 'gi');
        for (const m of src.matchAll(re)) {
          const stated = Number(m[1]);
          if (!Number.isFinite(stated) || stated === claim.value) continue;
          // Only flag a value we know to be a stale version of this claim, or
          // one that reads as a straight contradiction. Anything else is
          // probably a sentence the pattern caught by accident.
          const isRetired = (claim.retired || []).includes(stated);
          if (!isRetired) continue;
          problems.push({
            file: rel,
            line: lineOf(src, m.index),
            id,
            found: `$${stated}`,
            expected: `$${claim.value}`,
            why: claim.source
              ? `verified at ${claim.source} on ${claim.verifiedDate}`
              : `ours to set — see ${claim.mirrors}`,
            excerpt: m[0].replace(/\s+/g, ' ').trim().slice(0, 90),
          });
        }
      }

      // (b) phrasings we have retired outright
      for (const f of claim.forbid || []) {
        const re = new RegExp(f.pattern, 'gi');
        for (const m of src.matchAll(re)) {
          problems.push({
            file: rel,
            line: lineOf(src, m.index),
            id,
            found: m[0].replace(/\s+/g, ' ').trim().slice(0, 60),
            expected: String(claim.value),
            why: f.why,
            excerpt: m[0].replace(/\s+/g, ' ').trim().slice(0, 90),
          });
        }
      }
    }
  }

  return problems;
}

const quarantine = fs.existsSync(QUARANTINE)
  ? JSON.parse(fs.readFileSync(QUARANTINE, 'utf8'))
  : { files: {} };

const scanned = scan();
const listMode = process.argv.includes('--list');

const violations = [];
const stale = [];

for (const { file, claims, dated } of scanned) {
  const quarantined = Object.hasOwn(quarantine.files, file);
  if (claims.length > 0 && !dated && !quarantined) {
    violations.push({ file, count: claims.length, sample: [...new Set(claims)].slice(0, 5) });
  }
  if (quarantined && dated) {
    stale.push({ file, why: 'now carries a verifiedDate — remove it from the quarantine' });
  }
  if (quarantined && claims.length === 0) {
    stale.push({ file, why: 'no longer asserts third-party prices — remove it from the quarantine' });
  }
}

const outstanding = scanned.filter(
  (s) => s.claims.length > 0 && !s.dated && Object.hasOwn(quarantine.files, s.file)
);
const verified = scanned.filter((s) => s.claims.length > 0 && s.dated);

if (listMode) {
  console.log('Unverified price claims by file (the worklist):\n');
  for (const s of outstanding.sort((a, b) => b.claims.length - a.claims.length)) {
    console.log(`${String(s.claims.length).padStart(4)}  ${s.file}`);
    console.log(`      ${quarantine.files[s.file]}`);
  }
  console.log(
    `\n${outstanding.length} files quarantined, ${verified.length} verified, ` +
      `${outstanding.reduce((n, s) => n + s.claims.length, 0)} claims outstanding.`
  );
  process.exit(0);
}

let failed = false;

const contradictions = checkCanonical();
if (contradictions.length) {
  failed = true;
  console.error('\n✗ claims-guard: page contradicts a canonical figure in src/data/claims.json\n');
  for (const c of contradictions) {
    console.error(`  ${c.file}:${c.line}`);
    console.error(`    ${c.id}: found ${c.found}, expected ${c.expected} — ${c.why}`);
    console.error(`    …${c.excerpt}…`);
  }
  console.error(
    '\n  Fix the page. If the figure itself has changed, change it in\n' +
      '  src/data/claims.json (and src/data/products.ts for a price we set),\n' +
      '  re-verify any third-party figure against its source, and update the\n' +
      '  verifiedDate to the day you read it.\n'
  );
}

if (violations.length) {
  failed = true;
  console.error('\n✗ claims-guard: page asserts third-party prices with no verifiedDate\n');
  for (const v of violations) {
    console.error(`  ${v.file} — ${v.count} claim(s), e.g. ${v.sample.join(', ')}`);
  }
  console.error(
    '\n  Fix by verifying the figures against the vendor pricing page and passing\n' +
      '  the date you checked as verifiedDate to <Base> (or in blog frontmatter).\n' +
      '  Do not stamp a date you did not check — that is the failure this guard\n' +
      '  exists to prevent.\n'
  );
}

if (stale.length) {
  failed = true;
  console.error('\n✗ claims-guard: stale quarantine entries in docs/claims-unverified.json\n');
  for (const s of stale) console.error(`  ${s.file} — ${s.why}`);
  console.error('');
}

if (failed) process.exit(1);

console.log(
  `✓ claims-guard: ${verified.length} verified, ${outstanding.length} quarantined ` +
    `(${outstanding.reduce((n, s) => n + s.claims.length, 0)} claims outstanding).`
);
