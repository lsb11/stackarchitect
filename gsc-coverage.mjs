#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// GSC INDEXING WATCHDOG — stackarchitect.xyz
//
// Inspects EVERY URL in the live sitemap against the Google Search Console
// URL Inspection API and reports exactly which pages are:
//   ✓ indexed              (Submitted and indexed)
//   ◐ crawled-not-indexed  (Crawled – currently not indexed)
//   ○ discovered           (Discovered – currently not indexed)
//   ✗ excluded / errored   (canonical mismatch, noindex, 404, redirect…)
//
// Zero npm dependencies — signs the service-account JWT with node:crypto.
//
// SETUP (one-time, ~5 minutes):
//   1. console.cloud.google.com → create/select a project
//   2. Enable "Google Search Console API"
//   3. IAM → Service Accounts → create one → Keys → Add key → JSON
//   4. Copy the service account email (…@…iam.gserviceaccount.com)
//   5. GSC → stackarchitect.xyz property → Settings → Users → Add user
//      → paste the service-account email → permission: Full (Owner not needed)
//   6. Save the JSON key as gsc-key.json (git-ignored) or set env var
//      GSC_KEY_JSON to the file's contents (for CI).
//
// RUN:
//   npm run gsc:coverage
//   node gsc-coverage.mjs --limit 20        (spot-check first 20 URLs)
//   node gsc-coverage.mjs --only-problems   (print only non-indexed URLs)
//   npm run gsc:weekly                      (one line, appended to a log)
//
// WEEKLY MODE
// --weekly prints exactly one tab-separated line and appends it to
// gsc-weekly.tsv, so a year of runs is 52 lines that diff cleanly:
//
//   2026-09-10  indexed=1  crawled_not_indexed=177  offhome_impressions=12
//
// Three numbers, chosen because each moves for a different reason:
//   indexed              — did anything get in
//   crawled_not_indexed  — the 177-page bucket this site's problem lives in
//   offhome_impressions  — impressions on any URL that is not the homepage,
//                          over a 7-day window. The homepage is excluded
//                          because it is the one page that was ever indexed,
//                          so including it hides whether anything else is.
//
// The window ends GSC_LAG_DAYS (3) before today: Search Analytics data is
// incomplete for the most recent days, and a window that runs to "today"
// reports a fall every time it is run.
//
// QUOTA: URL Inspection API allows 2,000 inspections/day per property.
// This site has ~86 sitemap URLs, so a full run uses <5% of daily quota.
// ─────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createSign } from 'node:crypto';

const SITE_URL = 'sc-domain:stackarchitect.xyz'; // change to 'https://stackarchitect.xyz/' if you verified a URL-prefix property instead of a Domain property
const SITEMAP = 'https://stackarchitect.xyz/sitemap-0.xml';
const OUT_CSV = 'gsc-coverage-report.csv';

const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const ONLY_PROBLEMS = args.includes('--only-problems');
const WEEKLY = args.includes('--weekly');
const WEEKLY_LOG = 'gsc-weekly.tsv';
const GSC_LAG_DAYS = 3;
const HOMEPAGE = 'https://stackarchitect.xyz/';

// ── Auth: service-account JWT → access token ────────────────────────────
function loadKey() {
  if (process.env.GSC_KEY_JSON) return JSON.parse(process.env.GSC_KEY_JSON);
  if (existsSync('gsc-key.json')) return JSON.parse(readFileSync('gsc-key.json', 'utf8'));
  console.error(
    '✗ No credentials. Save your service-account key as gsc-key.json\n' +
      '  or set GSC_KEY_JSON. See setup instructions at the top of this file.'
  );
  process.exit(1);
}

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function getAccessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = b64url(signer.sign(key.private_key));
  const jwt = `${header}.${claims}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error('✗ Token exchange failed:', JSON.stringify(data));
    process.exit(1);
  }
  return data.access_token;
}

// ── Weekly-line helpers (pure — see gsc-coverage.test.js) ────────────────

/**
 * The 7-day window to ask Search Analytics for, ending GSC_LAG_DAYS before
 * `today` because the most recent days are still filling in.
 * @returns {{startDate: string, endDate: string}} ISO yyyy-mm-dd, inclusive.
 */
export function weeklyWindow(today = new Date(), lagDays = GSC_LAG_DAYS) {
  const end = new Date(today.getTime() - lagDays * 86400000);
  const start = new Date(end.getTime() - 6 * 86400000);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

/**
 * Impressions on every URL that is not the homepage.
 *
 * The homepage is the one page GSC has ever reported as indexed here, so a
 * total that includes it can rise while nothing else on the site surfaces at
 * all — which is the exact thing this line exists to detect.
 *
 * @param {Array<{keys?: string[], impressions?: number}>} rows Search
 *        Analytics rows, dimension `page`.
 */
export function offHomepageImpressions(rows, homepage = HOMEPAGE) {
  const norm = (u) => String(u ?? '').replace(/\?.*$/, '').replace(/#.*$/, '');
  const home = norm(homepage);
  return (rows ?? [])
    .filter((r) => norm(r.keys?.[0]) !== home)
    .reduce((sum, r) => sum + (r.impressions ?? 0), 0);
}

/** The one line. Tab-separated so it diffs and greps without a parser. */
export function weeklyLine({ date, indexed, crawledNotIndexed, offhomeImpressions }) {
  return [
    date,
    `indexed=${indexed}`,
    `crawled_not_indexed=${crawledNotIndexed}`,
    `offhome_impressions=${offhomeImpressions}`,
  ].join('\t');
}

// ── Fetch sitemap URLs ───────────────────────────────────────────────────
async function getSitemapUrls() {
  const res = await fetch(SITEMAP);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

// ── Inspect one URL ──────────────────────────────────────────────────────
async function inspect(url, token) {
  const res = await fetch(
    'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL }),
    }
  );
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 20000));
    return inspect(url, token);
  }
  const data = await res.json();
  if (data.error) return { url, verdict: 'API_ERROR', state: data.error.message };
  const r = data.inspectionResult?.indexStatusResult ?? {};
  return {
    url,
    verdict: r.verdict ?? 'UNKNOWN',
    state: r.coverageState ?? 'Unknown',
    lastCrawl: r.lastCrawlTime ?? '',
    googleCanonical: r.googleCanonical ?? '',
    userCanonical: r.userCanonical ?? '',
    robots: r.robotsTxtState ?? '',
    referringUrls: (r.referringUrls ?? []).length,
  };
}

// ── Search Analytics: pages + impressions for one window ────────────────
async function searchAnalyticsPages(token, { startDate, endDate }) {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dimensions: ['page'], rowLimit: 1000 }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`searchAnalytics: ${data.error.message}`);
  return data.rows ?? [];
}

// ── Main ─────────────────────────────────────────────────────────────────
//
// Guarded so gsc-coverage.test.js can import the pure helpers above without
// the script trying to authenticate against Google.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

async function main() {
  const key = loadKey();
  const token = await getAccessToken(key);

  // ── Weekly mode: three numbers, one line, nothing else ──────────────────
  if (WEEKLY) {
    const urls = await getSitemapUrls();
    let indexed = 0;
    let crawledNotIndexed = 0;
    for (const url of urls) {
      const r = await inspect(url, token);
      const st = r.state.toLowerCase();
      if (st.includes('indexed') && !st.includes('not indexed')) indexed++;
      else if (st.includes('crawled') && st.includes('not indexed')) crawledNotIndexed++;
      await new Promise((r2) => setTimeout(r2, 600));
    }

    const window = weeklyWindow();
    const rows = await searchAnalyticsPages(token, window);
    const line = weeklyLine({
      date: window.endDate,
      indexed,
      crawledNotIndexed,
      offhomeImpressions: offHomepageImpressions(rows),
    });

    appendFileSync(WEEKLY_LOG, line + '\n');
    console.log(line);
    return;
  }

  const urls = (await getSitemapUrls()).slice(0, LIMIT);
  console.log(`Inspecting ${urls.length} sitemap URLs against GSC…\n`);

  const results = [];
  const buckets = { indexed: [], crawledNotIndexed: [], discovered: [], other: [] };

  for (const [i, url] of urls.entries()) {
    const r = await inspect(url, token);
    results.push(r);
    const s = r.state.toLowerCase();
    if (s.includes('submitted and indexed') || s.includes('indexed, not submitted')) buckets.indexed.push(r);
    else if (s.includes('crawled - currently not indexed') || s.includes('crawled – currently not indexed')) buckets.crawledNotIndexed.push(r);
    else if (s.includes('discovered')) buckets.discovered.push(r);
    else buckets.other.push(r);

    const flag = s.includes('indexed') && !s.includes('not indexed') ? '✓' : '✗';
    if (!ONLY_PROBLEMS || flag === '✗')
      console.log(`${String(i + 1).padStart(3)}/${urls.length} ${flag} ${r.state.padEnd(42)} ${url}`);
    await new Promise((r2) => setTimeout(r2, 600)); // stay well under QPS limits
  }

  // canonical mismatches — a silent ranking killer
  const canonicalMismatches = results.filter(
    (r) => r.googleCanonical && r.userCanonical && r.googleCanonical !== r.userCanonical
  );

  console.log('\n══════════ COVERAGE SUMMARY ══════════');
  console.log(`  Indexed:                 ${buckets.indexed.length}/${results.length}`);
  console.log(`  Crawled, not indexed:    ${buckets.crawledNotIndexed.length}  ← quality/duplication signal — improve or consolidate these pages`);
  console.log(`  Discovered, not crawled: ${buckets.discovered.length}  ← crawl-priority signal — add internal links to these pages`);
  console.log(`  Other/excluded/error:    ${buckets.other.length}`);
  console.log(`  Canonical mismatches:    ${canonicalMismatches.length}`);

  for (const r of [...buckets.discovered, ...buckets.crawledNotIndexed]) {
    console.log(`   → ${r.url}  (${r.state}, last crawl: ${r.lastCrawl || 'never'})`);
  }
  for (const r of canonicalMismatches) {
    console.log(`   ⚠ Google chose different canonical: ${r.url} → ${r.googleCanonical}`);
  }

  // CSV for tracking over time
  const csv = [
    'url,state,verdict,lastCrawl,googleCanonical,referringUrls',
    ...results.map((r) =>
      [r.url, `"${r.state}"`, r.verdict, r.lastCrawl, r.googleCanonical, r.referringUrls].join(',')
    ),
  ].join('\n');
  writeFileSync(OUT_CSV, csv);
  console.log(`\nFull report written to ${OUT_CSV}`);

  // Non-zero exit if unindexed pages exist → CI can flag it
  if (buckets.discovered.length + buckets.crawledNotIndexed.length > 0) process.exitCode = 2;
}

if (isMain) await main();
