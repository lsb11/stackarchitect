#!/usr/bin/env node
/**
 * indexnow.mjs — push URLs to the IndexNow endpoint (Bing, Yandex, Seznam,
 * Naver share one API; Google does NOT participate).
 *
 * Why this matters here: ChatGPT and Copilot ground their web answers in
 * Bing's index. Faster Bing indexing is therefore both a search win and an
 * AI-citation win. It will not affect Google.
 *
 * Setup (once):
 *   1. Keep public/5da5f79db68a916df6abb8f7e0fc88b5.txt in the repo.
 *      It must be served at https://stackarchitect.xyz/5da5f79db68a916df6abb8f7e0fc88b5.txt
 *      and contain exactly the key string, nothing else.
 *   2. Verify it resolves after deploy before running this.
 *
 * Usage:
 *   node scripts/indexnow.mjs                    # submit every URL in the sitemap
 *   node scripts/indexnow.mjs --since 7          # only URLs with lastmod in last 7 days
 *   node scripts/indexnow.mjs --url /apps/ --url /capi-shield/
 *   node scripts/indexnow.mjs --dry-run          # print what would be sent
 *
 * IndexNow accepts max 10,000 URLs per request. We batch at 1,000 to stay
 * well clear and to keep failures small.
 */

import { readFileSync, existsSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';

const HOST = 'stackarchitect.xyz';
const KEY = '5da5f79db68a916df6abb8f7e0fc88b5';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/IndexNow';
const BATCH = 1000;

// ---------- args ----------
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sinceIdx = args.indexOf('--since');
const sinceDays = sinceIdx > -1 ? Number(args[sinceIdx + 1]) : null;
const explicit = args.reduce((acc, a, i) => {
  if (a === '--url' && args[i + 1]) acc.push(args[i + 1]);
  return acc;
}, []);

// ---------- collect URLs ----------
function fromSitemaps() {
  const parser = new XMLParser({ ignoreAttributes: false });
  const indexPath = 'dist/sitemap-index.xml';
  if (!existsSync(indexPath)) {
    console.error(
      `✗ ${indexPath} not found. Run \`npm run build\` first — this script reads the built sitemap.`
    );
    process.exit(1);
  }

  const idx = parser.parse(readFileSync(indexPath, 'utf8'));
  const sitemapEntries = [].concat(idx.sitemapindex?.sitemap ?? []);
  const out = [];

  for (const sm of sitemapEntries) {
    // sitemap-index references absolute URLs; map back to the local file.
    const file = 'dist/' + String(sm.loc).split('/').pop();
    if (!existsSync(file)) {
      console.warn(`  ! skipping ${file} (not found locally)`);
      continue;
    }
    const doc = parser.parse(readFileSync(file, 'utf8'));
    for (const u of [].concat(doc.urlset?.url ?? [])) {
      out.push({ loc: u.loc, lastmod: u.lastmod });
    }
  }
  return out;
}

let urls;
if (explicit.length) {
  urls = explicit.map((p) => (p.startsWith('http') ? p : `https://${HOST}${p}`));
} else {
  let entries = fromSitemaps();
  if (sinceDays != null && !Number.isNaN(sinceDays)) {
    const cutoff = Date.now() - sinceDays * 86400000;
    entries = entries.filter((e) => e.lastmod && new Date(e.lastmod).getTime() >= cutoff);
  }
  urls = entries.map((e) => e.loc);
}

// Defensive: IndexNow rejects the whole payload if any URL is off-host.
urls = [...new Set(urls)].filter((u) => {
  try { return new URL(u).hostname === HOST; }
  catch { return false; }
});

if (!urls.length) {
  console.log('No URLs to submit.');
  process.exit(0);
}

console.log(`IndexNow → ${urls.length} URL(s), host ${HOST}`);
if (dryRun) {
  urls.slice(0, 20).forEach((u) => console.log('  ' + u));
  if (urls.length > 20) console.log(`  … and ${urls.length - 20} more`);
  console.log('\n(dry run — nothing sent)');
  process.exit(0);
}

// ---------- submit ----------
let failed = 0;
for (let i = 0; i < urls.length; i += BATCH) {
  const batch = urls.slice(i, i + BATCH);
  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  const label = `batch ${Math.floor(i / BATCH) + 1} (${batch.length} URLs)`;
  if (res.status === 200 || res.status === 202) {
    console.log(`  ✓ ${label} — ${res.status} accepted`);
  } else {
    failed++;
    const text = await res.text().catch(() => '');
    console.error(`  ✗ ${label} — ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
    // 403 = key file not reachable; 422 = URL/host mismatch. Both are
    // configuration problems, so stop rather than hammering the endpoint.
    if (res.status === 403 || res.status === 422) {
      console.error(
        `\n  Fix: confirm ${KEY_LOCATION} returns exactly "${KEY}" as text/plain.`
      );
      break;
    }
  }
}

process.exit(failed ? 1 : 0);
