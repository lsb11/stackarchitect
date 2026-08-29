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

/**
 * Prices that are ours, not a third party's, and so need no vendor source:
 *   $0     — the free stack, the whole premise
 *   $24    — the Complete Kit (KIT_PRICE)
 *   $9.99  — any single blueprint (SINGLE_PRICE)
 *   $14    — the single-to-kit upgrade (UPGRADE_PRICE)
 *   $7.99  — StockLog
 * Everything else is somebody else's number and needs a source and a date.
 *
 * TODO: these are hand-kept in sync with src/data/products.ts, which is how
 * they went stale when the kit moved off $29 — every mention of the new price
 * read as an undated third-party claim and failed the build. The follow-up
 * commit moves them into src/data/claims.json and has this file read them.
 */
const OURS = /^\$(0|24|14|9\.99|7\.99)(\/(mo|month|yr|year))?[,.]?$/;

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
