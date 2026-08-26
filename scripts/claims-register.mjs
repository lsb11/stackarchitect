#!/usr/bin/env node
/**
 * claims-register.mjs — generates docs/CLAIMS-REGISTER.md from structured
 * data, never by hand.
 *
 * Sources of truth, in order of quality:
 *   1. src/data/apps.json — id, monthlyCost, priceVerifiedDate, priceSourceUrl.
 *      The only place on the site where a price, its source and its check date
 *      are stored together. This is the shape everything else should reach.
 *   2. scripts/claims-guard.mjs's quarantine (docs/claims-unverified.json) —
 *      the files still asserting prices with no source and no date.
 *
 * Regenerate with `npm run claims:register`. Do not edit the output.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const appsRaw = read('src/data/apps.json');
const apps = Array.isArray(appsRaw) ? appsRaw : (appsRaw.apps ?? Object.values(appsRaw));
const quarantine = read('docs/claims-unverified.json');

// Which pages render each app's figures, so a claim maps to where it appears.
const pageFiles = fs
  .readdirSync(path.join(ROOT, 'src/pages'))
  .filter((f) => f.endsWith('.astro'));
const blogFiles = fs.existsSync(path.join(ROOT, 'src/content/blog'))
  ? fs.readdirSync(path.join(ROOT, 'src/content/blog')).filter((f) => /\.mdx?$/.test(f))
  : [];
const corpus = [
  ...pageFiles.map((f) => ['/' + f.replace(/\.astro$/, '').replace(/^index$/, ''), `src/pages/${f}`]),
  ...blogFiles.map((f) => ['/blog/' + f.replace(/\.mdx?$/, ''), `src/content/blog/${f}`]),
].map(([url, file]) => [url, file, fs.readFileSync(path.join(ROOT, file), 'utf8')]);

const appearsOn = (name) =>
  corpus.filter(([, , src]) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(src))
    .map(([url]) => url);

const verified = apps.filter((a) => a.priceVerifiedDate && a.priceSourceUrl);
const unsourced = apps.filter((a) => !a.priceVerifiedDate || !a.priceSourceUrl);

const today = new Date().toISOString().slice(0, 10);
const L = [];
L.push('# CLAIMS-REGISTER.md');
L.push('');
L.push(`**Generated ${today} by \`npm run claims:register\`. Do not edit by hand.**`);
L.push('');
L.push(
  'Every third-party price claim the site can currently account for, with its source and the date a human last checked it. ' +
    'Claims that cannot be accounted for are listed in §3 — that section is the worklist, and it should shrink to nothing.'
);
L.push('');
L.push('## 1. Summary');
L.push('');
L.push('| | Count |');
L.push('|---|---|');
L.push(`| Vendor prices with a source URL and a check date | **${verified.length}** |`);
L.push(`| Vendor prices missing a source or a date | **${unsourced.length}** |`);
L.push(`| Page files asserting prices with no verifiedDate at all | **${Object.keys(quarantine.files).length}** |`);
L.push(
  `| Individual undated claims in those files | **${Object.values(quarantine.files).reduce((n, v) => n + (parseInt(v, 10) || 0), 0)}** |`
);
L.push('');
L.push('## 2. Verified vendor prices');
L.push('');
L.push('Source of truth: `src/data/apps.json`. Each row states the vendor, the figure, the page the figure was read from, and when.');
L.push('');
L.push('| Vendor | Monthly cost | Checked | Source | Appears on |');
L.push('|---|---|---|---|---|');
for (const a of verified.sort((x, y) => x.name.localeCompare(y.name))) {
  const pages = appearsOn(a.name);
  const shown = pages.length > 3 ? `${pages.slice(0, 3).join(', ')} +${pages.length - 3}` : pages.join(', ') || '—';
  L.push(
    `| ${a.name} | ${a.monthlyCost ?? '—'} | ${a.priceVerifiedDate} | [source](${a.priceSourceUrl}) | ${shown} |`
  );
}
L.push('');
if (unsourced.length) {
  L.push('### Vendor entries missing a source or date');
  L.push('');
  L.push('| Vendor | Monthly cost | Missing |');
  L.push('|---|---|---|');
  for (const a of unsourced.sort((x, y) => x.name.localeCompare(y.name))) {
    const miss = [!a.priceVerifiedDate && 'check date', !a.priceSourceUrl && 'source URL'].filter(Boolean).join(' + ');
    L.push(`| ${a.name} | ${a.monthlyCost ?? '—'} | ${miss} |`);
  }
  L.push('');
}
L.push('## 3. Worklist — undated claims by file');
L.push('');
L.push(
  'These files assert third-party prices with no `verifiedDate`. They are quarantined in `docs/claims-unverified.json`; ' +
    'the build fails if any *new* file joins them. Clear an entry by opening the vendor pricing page, reading the figure, ' +
    'and passing the date you read it as `verifiedDate`. Never stamp a date you did not check.'
);
L.push('');
L.push('| File | Undated claims |');
L.push('|---|---|');
for (const [f, note] of Object.entries(quarantine.files).sort(
  (a, b) => (parseInt(b[1], 10) || 0) - (parseInt(a[1], 10) || 0)
)) {
  L.push(`| \`${f}\` | ${parseInt(note, 10) || '?'} |`);
}
L.push('');
L.push('## 4. How a claim gets verified');
L.push('');
L.push('1. Open the vendor\'s own pricing page — not a reseller, not a review site, not our own page.');
L.push('2. Read the figure. If the vendor does not publish one, say so in prose; do not substitute a third-party estimate.');
L.push('3. Record it: `priceVerifiedDate` + `priceSourceUrl` in `apps.json`, or `verifiedDate` on the page/post.');
L.push('4. For prose, use `<PriceClaim>` — it will not render without both a source and a date.');
L.push('5. Arithmetic (annual totals, stack sums) is labelled as arithmetic via `PriceClaim`\'s `derivation` prop. ' +
  'A yearly figure derived from a monthly list price is not a measured saving.');
L.push('');

fs.writeFileSync(path.join(ROOT, 'docs/CLAIMS-REGISTER.md'), L.join('\n'));
console.log(`docs/CLAIMS-REGISTER.md — ${verified.length} verified, ${unsourced.length} incomplete, ${Object.keys(quarantine.files).length} files quarantined`);
