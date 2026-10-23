// tests/gsc-known-urls.test.js: every URL Google has shown in search lands on
// a live page.
//
// GSC's Performance export of 23 Oct 2026 listed 61 URLs with impressions,
// most of them www, slashless or retired paths. One, a truncated
// "/blog/how-to-reduce-shopify-apps-" with 48 impressions, resolved to a 404.
// This replays the middleware's order (host to apex, legacy map first, then
// the trailing slash) for every URL in data/gsc-known-urls.json and fails
// unless it ends on a sitemap URL. Subdomains tools./audit. are dashboard
// redirect rules; for those only the path is checked, as on the apex.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveLegacy } from '../functions/_legacy-redirects.js';

const KNOWN = JSON.parse(fs.readFileSync('data/gsc-known-urls.json', 'utf8')).urls;
const SITEMAP = fs.existsSync('dist/sitemap-0.xml')
  ? new Set([...fs.readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>https:\/\/stackarchitect\.xyz([^<]*)<\/loc>/g)].map((m) => m[1]))
  : null;
// Deliberately indexable pages outside the sitemap (see CLAUDE.md).
const ALSO_LIVE = new Set(['/sitemap-page/']);

function land(path) {
  const hit = resolveLegacy(path);
  if (hit && hit.to !== path) return { to: hit.to, hops: 1 };
  if (!path.endsWith('/') && !/\.[a-z0-9]+$/i.test(path)) return { to: path + '/', hops: 1 };
  return { to: path, hops: 0 };
}

test('every URL Google has shown lands on a live page in at most one redirect', { skip: !SITEMAP && 'needs a build' }, () => {
  const bad = [];
  for (const { host, path } of KNOWN) {
    const { to } = land(path);
    const settled = land(to);
    if (settled.hops) bad.push(`${host}${path} -> ${to} -> ${settled.to} (chain)`);
    else if (!SITEMAP.has(to) && !ALSO_LIVE.has(to)) bad.push(`${host}${path} -> ${to} (not a live page)`);
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('the 23 Oct 2026 404 is covered', () => {
  assert.equal(resolveLegacy('/blog/how-to-reduce-shopify-apps-')?.to, '/shopify-app-stack-kill-or-keep-auditor/');
});
