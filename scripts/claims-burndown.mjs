#!/usr/bin/env node
/**
 * claims-burndown.mjs — generates docs/CLAIMS-BURNDOWN.md, the prioritised
 * order in which to verify the quarantined price claims.
 *
 * Ranking inputs, in priority order:
 *   1. Is the page in sitemap-0.xml? An undated price on an indexable page is
 *      a live trust liability; on a noindexed page it is housekeeping.
 *   2. Does it make a comparative claim about a NAMED commercial product?
 *      "cheaper than Elevar" is the assertion a quality rater checks first,
 *      and the one most likely to be wrong when a vendor reprices.
 *   3. How many claims does it carry? Volume breaks ties, it does not lead —
 *      50 claims on a noindexed page matter less than 3 on the homepage.
 *
 * Regenerate with `npm run claims:burndown`. Do not edit the output.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const quarantine = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/claims-unverified.json'), 'utf8')
);

const sitemap = fs.readFileSync(path.join(ROOT, 'dist/sitemap-0.xml'), 'utf8');
const indexed = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1].replace('https://stackarchitect.xyz', '')
  )
);

/** Named commercial products the site compares itself against. */
const VENDORS = [
  'Elevar', 'Triple Whale', 'Northbeam', 'Klaviyo', 'Stape', 'Littledata',
  'Analyzify', 'WeltPixel', 'Gorgias', 'Tidio', 'Zendesk', 'Stocky',
  'Inventory Planner', 'Prediko', 'Katana', 'Qoblex', 'Linnworks', 'Lifetimely',
  'Judge.me', 'Okendo', 'Loox', 'Yotpo', 'Privy', 'Attentive', 'PageFly',
  'GemPages', 'Loop Returns', 'AfterShip', 'Mesa', 'Alloy', 'Celigo', 'Zapier',
];

function urlFor(file) {
  if (file.startsWith('src/pages/')) {
    const slug = file.replace('src/pages/', '').replace(/\.astro$/, '');
    return slug === 'index' ? '/' : `/${slug}/`;
  }
  return `/blog/${file.replace('src/content/blog/', '').replace(/\.mdx?$/, '')}/`;
}

const rows = Object.entries(quarantine.files).map(([file, note]) => {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const url = urlFor(file);
  const named = VENDORS.filter((v) => new RegExp(`\\b${v.replace('.', '\\.')}\\b`).test(src));
  return {
    file,
    url,
    inSitemap: indexed.has(url),
    vendors: named,
    count: parseInt(note, 10) || 0,
  };
});

rows.sort((a, b) => {
  if (a.inSitemap !== b.inSitemap) return a.inSitemap ? -1 : 1;
  if ((a.vendors.length > 0) !== (b.vendors.length > 0)) return a.vendors.length ? -1 : 1;
  if (b.vendors.length !== a.vendors.length) return b.vendors.length - a.vendors.length;
  return b.count - a.count;
});

const tier = (r) =>
  !r.inSitemap ? 'D — not indexed' : r.vendors.length >= 5 ? 'A — indexed, heavy comparison' : r.vendors.length ? 'B — indexed, some comparison' : 'C — indexed, no named vendor';

const L = [];
L.push('# CLAIMS-BURNDOWN.md');
L.push('');
L.push(`**Generated ${new Date().toISOString().slice(0, 10)} by \`npm run claims:burndown\`. Do not edit by hand.**`);
L.push('');
L.push('Verification order for the quarantined price claims. Work top-down.');
L.push('');
L.push('**How to clear a row.** Open each vendor\'s own pricing page, read the figure, and pass the date you read it as `verifiedDate` to `<Base>` (pages) or in frontmatter (posts). Use `<PriceClaim>` for prices in prose. Then remove the file from `docs/claims-unverified.json` — the build fails if you forget, and fails again if you remove a row that still has undated claims.');
L.push('');
L.push('**Do not machine-read these prices.** Vendor pricing pages vary by geography and cohort, and a fetched price recorded as human-verified reintroduces exactly what the ratchet prevents.');
L.push('');
const tiers = {};
for (const r of rows) (tiers[tier(r)] ??= []).push(r);
L.push('| Tier | Files | Claims |');
L.push('|---|---|---|');
for (const [t, rs] of Object.entries(tiers))
  L.push(`| ${t} | ${rs.length} | ${rs.reduce((n, r) => n + r.count, 0)} |`);
L.push('');
for (const [t, rs] of Object.entries(tiers)) {
  L.push(`## Tier ${t}`);
  L.push('');
  L.push('| # | Page | Claims | Named products compared |');
  L.push('|---|---|---|---|');
  rs.forEach((r, i) => {
    const v = r.vendors.length ? r.vendors.slice(0, 6).join(', ') + (r.vendors.length > 6 ? `, +${r.vendors.length - 6}` : '') : '—';
    L.push(`| ${i + 1} | \`${r.url}\` | ${r.count} | ${v} |`);
  });
  L.push('');
}
L.push('## Why this order');
L.push('');
L.push('An undated price is only a live liability if the page can be indexed, so sitemap membership leads. Within that, a page comparing itself to a named commercial product on price is asserting something about a third party that a reader can check in one click and a rater will check first — those rank above pages that merely mention costs. Claim volume only breaks ties: 50 undated figures on a page nobody can reach matter less than three on a page that ranks.');
L.push('');
L.push(`Total: **${rows.length} files**, **${rows.reduce((n, r) => n + r.count, 0)} claims**, of which **${rows.filter((r) => r.inSitemap).length} files** are in the sitemap.`);
L.push('');

fs.writeFileSync(path.join(ROOT, 'docs/CLAIMS-BURNDOWN.md'), L.join('\n'));
console.log(`docs/CLAIMS-BURNDOWN.md — ${rows.length} files ranked`);
