#!/usr/bin/env node
// scripts/indexnow.mjs — tell Bing (and the other IndexNow engines) about
// pages that actually changed, after they are actually live.
//
//   npm run build                 # the local build must match what is deployed
//   node scripts/indexnow.mjs     # DRY RUN: prints what would be sent and why
//   node scripts/indexnow.mjs --submit
//   git add data/indexnow-sent.json && git commit -m "IndexNow: record submission"
//
// Options: --cap=N (default 60)
//
// Manual only. Never wire this to a build, a workflow, a hook or a cron:
// that is how ~55,000 URLs reached Bing for a 62-page site. The rules, and
// why each exists, are in scripts/lib/indexnow-plan.mjs.
import fs from 'node:fs';
import { parseSitemap, plan, freezeBlocks, FREEZE_LIFTS, DEFAULT_CAP } from './lib/indexnow-plan.mjs';

const HOST = 'stackarchitect.xyz';
const KEY = '5da5f79db68a916df6abb8f7e0fc88b5';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/IndexNow';
const LOG = 'data/indexnow-sent.json';

const args = process.argv.slice(2);
const SUBMIT = args.includes('--submit');
const capArg = args.find((a) => a.startsWith('--cap='));
const cap = capArg ? Number(capArg.split('=')[1]) : DEFAULT_CAP;

if (!fs.existsSync('dist/sitemap-0.xml')) { console.error('✗ dist/sitemap-0.xml missing: run `npm run build` first'); process.exit(1); }
const dist = parseSitemap(fs.readFileSync('dist/sitemap-0.xml', 'utf8'));
const res = await fetch(`https://${HOST}/sitemap-0.xml`, { headers: { 'cache-control': 'no-cache' } });
if (!res.ok) { console.error(`✗ live sitemap: HTTP ${res.status}`); process.exit(1); }
const live = parseSitemap(await res.text());
const sent = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')).sent ?? {} : {};
const redirectSources = new Set(fs.readFileSync('public/_redirects', 'utf8').split('\n')
  .map((l) => l.trim().split(/\s+/)[0]).filter((s) => s?.startsWith('/')));

const p = plan({ dist, live, sent, redirectSources, cap });
console.log(`IndexNow ${SUBMIT ? 'SUBMIT' : 'DRY RUN'}: live sitemap ${live.size} URLs, built ${dist.size}`);
console.log(`  unchanged since last sent: ${p.skipped.unchanged}`);
if (p.skipped.notInBuild.length) console.log(`  note: ${p.skipped.notInBuild.length} live URL(s) are not in your local build, so your checkout may be behind main (they are still sent)`);
if (p.skipped.ineligible.length) console.log(`  refused, not a canonical sitemap page: ${p.skipped.ineligible.join(', ')}`);
if (p.overCap.length) console.log(`  held back by --cap=${cap}: ${p.overCap.length} (run again next time)`);
console.log(`  to send: ${p.send.length}`);
for (const s of p.send) console.log(`    ${s.url}  (lastmod ${s.lastmod})`);

if (!SUBMIT || !p.send.length) {
  if (!SUBMIT && p.send.length) console.log('\nDry run only. Add --submit to send.');
  process.exit(0);
}
if (freezeBlocks() && !args.includes('--i-know-the-freeze')) {
  console.error(`\n✗ Refusing: IndexNow is held silent until ${FREEZE_LIFTS} (scripts/lib/indexnow-plan.mjs).`);
  process.exit(1);
}
const keyRes = await fetch(KEY_LOCATION);
if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) { console.error(`✗ key file not served correctly at ${KEY_LOCATION}`); process.exit(1); }

const r = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: p.send.map((s) => s.url) }),
});
if (r.status !== 200 && r.status !== 202) { console.error(`✗ IndexNow: HTTP ${r.status} ${await r.text()}`); process.exit(1); }
for (const s of p.send) sent[s.url] = s.lastmod;
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync(LOG, `${JSON.stringify({ _comment: 'URL -> lastmod last sent to IndexNow by scripts/indexnow.mjs. Commit after every --submit; it is how the next run knows what changed.', sent }, null, 2)}\n`);
console.log(`\n✓ IndexNow accepted ${p.send.length} URL(s) (HTTP ${r.status}). Now commit ${LOG}.`);
