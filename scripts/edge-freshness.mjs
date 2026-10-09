#!/usr/bin/env node
// scripts/edge-freshness.mjs — does each sitemap URL serve the current deploy
// at its canonical address? Why this exists: scripts/lib/edge-freshness.mjs.
//
//   node scripts/edge-freshness.mjs            # every URL in the live sitemap, plus /llms.txt
//   node scripts/edge-freshness.mjs /capi-shield/ /llms.txt
//
// Exit 1 when any URL serves different bytes bare than with a fresh query
// string. Fix: Cloudflare dashboard → Caching → Configuration → Purge
// Everything, then re-run. If it comes back, look for a Cache Rule.
import { compare } from './lib/edge-freshness.mjs';

const SITE = 'https://stackarchitect.xyz';
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; stackarchitect-edge-freshness/1.0; +https://stackarchitect.xyz/)' };
const stamp = Date.now().toString(36);
const get = async (u) => {
  const r = await fetch(u, { headers: UA, redirect: 'manual' });
  return { status: r.status, cache: r.headers.get('cf-cache-status') ?? '-', age: r.headers.get('age') ?? '-', text: await r.text() };
};

let paths = process.argv.slice(2);
if (!paths.length) {
  const xml = (await get(`${SITE}/sitemap-0.xml?fresh=${stamp}`)).text;
  paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '')).concat(['/llms.txt', '/sitemap-0.xml']);
}

let stale = 0;
for (let i = 0; i < paths.length; i += 6) {
  await Promise.all(paths.slice(i, i + 6).map(async (p) => {
    const [bare, fresh] = await Promise.all([get(`${SITE}${p}`), get(`${SITE}${p}?fresh=${stamp}`)]);
    const c = compare(bare.text, fresh.text);
    const ok = c.same && bare.status === 200;
    if (!ok) stale++;
    console.log(`${ok ? 'OK   ' : 'STALE'} ${p}  HTTP ${bare.status}  cf-cache-status ${bare.cache}  age ${bare.age}${ok ? '' : `  (bare ${c.bare} ≠ current ${c.fresh})`}`);
  }));
}
console.log(`\nedge-freshness: ${paths.length - stale} current, ${stale} stale`);
if (stale) console.log('Purge: Cloudflare → stackarchitect.xyz → Caching → Configuration → Purge Everything. Then re-run.');
process.exit(stale ? 1 : 0);
