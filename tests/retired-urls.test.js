// tests/retired-urls.test.js — every URL retired by the 24 Sep 2026 consolidation
// (freeze exception #3) reaches a live page in at most two hops, from any host
// and slash form, and in exactly one hop on the apex.
//
// The edge is modelled as the repo documents it: functions/_middleware.js runs
// first and resolves host, scheme, slash and the compiled legacy map
// (functions/_legacy-redirects.js, generated from public/_redirects) into one
// 301; anything it passes through is served by the Pages asset server. The
// zone-level "enforce trailing slash" Redirect Rule was deleted on 18 Sep 2026
// (see the header of functions/_middleware.js). If it ever comes back it adds
// one hop in front, which is the second hop this test allows off the apex.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { onRequest } from '../functions/_middleware.js';
import { LEGACY_RULES } from '../functions/_legacy-redirects.js';

const PRIMARY = 'https://stackarchitect.xyz';

// Merged into their cluster primary. Sources are the slashed canonical forms.
export const RETIRED = {
  '/tidio-shopify-guide/': '/blog/tidio-for-shopify-complete-setup-guide/',
  '/blog/how-to-fix-shopify-google-ads-conversion-tracking-2026/': '/shopify-google-ads-conversion-tracking/',
  '/blog/how-to-fix-service-invoked-too-many-times-in-google-apps-script/':
    '/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/',
  '/stocky-shutdown/': '/stocky-alternative/',
  '/blog/recover-lost-shopify-conversions-capi-shield/': '/capi-shield/',
  '/blog/shopify-email-marketing-free-2026/': '/replace-klaviyo-free/',
  '/blog/the-lean-shopify-tech-stack-2026/': '/stack/',
  '/blog/shopify-automation-stack-for-small-stores/': '/stack/',
  '/blog/scalable-google-sheets-automation-for-high-volume-workflows/': '/shopify-google-sheets-automation/',
};

const sitemap = existsSync('dist/sitemap-0.xml')
  ? new Set([...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname))
  : null;

// Follows the edge until a request is served. Returns every hop.
async function follow(url) {
  const hops = [];
  for (let i = 0; i < 6; i++) {
    let served = false;
    const res = await onRequest({
      request: new Request(url),
      next: async () => { served = true; return new Response('page', { status: 200 }); },
    });
    if (served) return { hops, final: url, status: res.status };
    assert.equal(res.status, 301, `${url} answered ${res.status}, not a 301`);
    url = res.headers.get('location');
    hops.push(url);
  }
  assert.fail(`redirect loop from ${url}`);
}

test('every retired URL, in every host and slash form, reaches its target in at most two hops', async () => {
  for (const [from, to] of Object.entries(RETIRED)) {
    for (const origin of [PRIMARY, 'https://www.stackarchitect.xyz', 'http://stackarchitect.xyz', 'http://www.stackarchitect.xyz']) {
      for (const path of [from, from.replace(/\/$/, '')]) {
        const { hops, final, status } = await follow(origin + path);
        assert.ok(hops.length <= 2, `${origin}${path} took ${hops.length} hops`);
        assert.equal(final, PRIMARY + to, `${origin}${path} ended at ${final}`);
        assert.equal(status, 200);
        if (origin === PRIMARY) assert.equal(hops.length, 1, `${origin}${path} must be a single 301 on the apex`);
      }
    }
  }
});

test('retired targets are live sitemap pages, and retired URLs are not', { skip: !sitemap && 'run `npm run build` first' }, () => {
  for (const [from, to] of Object.entries(RETIRED)) {
    assert.ok(sitemap.has(to), `${to} is not in the sitemap`);
    assert.ok(!sitemap.has(from), `${from} is retired but still in the sitemap`);
  }
});

test('no redirect in public/_redirects points at another redirect source', () => {
  const sources = new Set(LEGACY_RULES.filter((r) => !/[*:]/.test(r.from)).map((r) => r.from.replace(/\/$/, '')));
  const chains = LEGACY_RULES
    .filter((r) => !/^https?:/.test(r.to) && !/[*:]/.test(r.to))
    .filter((r) => sources.has(r.to.split('?')[0].replace(/\/$/, '')))
    .map((r) => `${r.from} → ${r.to}`);
  assert.deepEqual(chains, []);
});
