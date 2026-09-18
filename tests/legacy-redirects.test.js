// tests/legacy-redirects.test.js — the single-hop guarantee, as a regression test.
//
// WHY THIS IS A LOCAL SIMULATION AND NOT A LIVE CRAWL
// This has to pass BEFORE the zone-level "enforce trailing slash" Redirect Rule
// is deleted from the Cloudflare dashboard, and again after. A live crawl
// cannot do that: until the zone rule is gone it inserts a hop upstream of the
// Worker, so a live assertion of "exactly one 301" would fail by construction
// no matter how correct this repo is. So this test drives
// functions/_middleware.js directly, and scripts/redirect-smoke.mjs stays the
// live check.
//
// What it asserts, for every permutation of host, scheme and trailing slash:
//   1. the 62 live pages reach their canonical URL in exactly one 301, or zero
//      when already canonical;
//   2. every legacy source reaches its FINAL destination in exactly one 301 —
//      never an intermediate slash-adding hop;
//   3. no live page is captured by a legacy rule;
//   4. /go/* and /api/* are left alone;
//   5. functions/_legacy-redirects.js has not drifted from public/_redirects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

import { onRequest } from '../functions/_middleware.js';
import { LEGACY_RULES, resolveLegacy } from '../functions/_legacy-redirects.js';

const PRIMARY = 'https://stackarchitect.xyz';

// The four host/scheme permutations from the Phase 2 crawl.
const ORIGINS = [
  'http://stackarchitect.xyz',
  'https://stackarchitect.xyz',
  'http://www.stackarchitect.xyz',
  'https://www.stackarchitect.xyz',
];

// Runs one request through the middleware and reports what it did.
// `next` stands in for the Pages asset server, which only runs when the
// middleware declines to redirect.
async function run(url) {
  let served = false;
  const res = await onRequest({
    request: new Request(url),
    next: async () => {
      served = true;
      return new Response('page', { status: 200 });
    },
  });
  return {
    status: res.status,
    location: res.headers.get('location'),
    served,
  };
}

// Follows the legacy map to a fixed point, so the test compares against the
// FINAL destination rather than whatever the first matching rule happens to say.
function finalDestination(pathname) {
  let current = pathname;
  for (let i = 0; i < 10; i++) {
    const hit = resolveLegacy(current);
    if (!hit || hit.to === current) return current;
    current = hit.to;
  }
  assert.fail(`redirect loop in the legacy map starting at ${pathname}`);
}

const sitemapPaths = existsSync('dist/sitemap-0.xml')
  ? [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => new URL(m[1]).pathname,
    )
  : [];

test('generated legacy map is in sync with public/_redirects', () => {
  // Exit code is the assertion; --check prints the reason on failure.
  execFileSync(process.execPath, ['scripts/gen-legacy-redirects.mjs', '--check'], {
    stdio: 'pipe',
  });
});

test('the 62 live pages resolve in at most one 301, to their canonical URL', async (t) => {
  assert.ok(sitemapPaths.length > 0, 'run `npm run build` first — dist/sitemap-0.xml is missing');
  assert.equal(sitemapPaths.length, 62, 'sitemap URL count changed — the URL set is frozen');

  let checked = 0;
  for (const path of sitemapPaths) {
    const variants = path === '/' ? [path] : [path, path.replace(/\/$/, '')];
    for (const origin of ORIGINS) {
      for (const variant of variants) {
        const url = origin + variant;
        const { status, location, served } = await run(url);
        checked++;

        if (url === PRIMARY + path) {
          // Already canonical: the middleware must not touch it at all.
          assert.equal(served, true, `${url} should have been served, not redirected`);
          assert.equal(status, 200, `${url} should be 200`);
          continue;
        }
        assert.equal(status, 301, `${url} should be a single 301`);
        assert.equal(
          location,
          PRIMARY + path,
          `${url} must reach its canonical URL in ONE hop`,
        );
      }
    }
  }
  t.diagnostic(`${checked} host/scheme/slash permutations checked`);
});

test('no live page is captured by a legacy redirect rule', () => {
  for (const path of sitemapPaths) {
    assert.equal(
      resolveLegacy(path),
      null,
      `${path} is a live page but matches a rule in public/_redirects`,
    );
  }
});

test('every legacy source reaches its final destination in exactly one 301', async (t) => {
  // Pattern rules (`:slug`, `*`) are exercised with concrete sample paths,
  // since the literal pattern text is not a real URL.
  const literals = LEGACY_RULES.map((r) => r.from).filter(
    (f) => !f.includes('*') && !f.includes(':'),
  );
  const samples = ['/tools/capi-shield/', '/tools/capi-shield', '/faq/anything-at-all/', '/faq/x'];
  const sources = [...new Set([...literals, ...samples])];

  let checked = 0;
  const twoHop = [];
  for (const source of sources) {
    const expected = finalDestination(source);
    for (const origin of ORIGINS) {
      const { status, location } = await run(origin + source);
      checked++;
      if (status !== 301) {
        twoHop.push(`${origin}${source} → ${status} (expected 301)`);
        continue;
      }
      if (location !== PRIMARY + expected) {
        twoHop.push(`${origin}${source} → ${location} (expected ${PRIMARY}${expected})`);
      }
    }
  }
  assert.deepEqual(twoHop, [], 'these did not reach their final destination in one hop');
  t.diagnostic(`${sources.length} legacy sources × ${ORIGINS.length} origins = ${checked} checks`);
});

test('a slashless legacy source does not take a slash-adding detour', async () => {
  // The exact regression: 110 sources behaved this way before 2026-09-18.
  const { status, location } = await run('https://stackarchitect.xyz/analyzify-alternative');
  assert.equal(status, 301);
  assert.equal(location, PRIMARY + '/shopify-attribution-tools-compared/');
});

test('host, scheme and destination collapse into a single hop together', async () => {
  const { status, location } = await run('http://www.stackarchitect.xyz/analyzify-alternative');
  assert.equal(status, 301);
  assert.equal(location, PRIMARY + '/shopify-attribution-tools-compared/');
});

test('query strings survive the redirect', async () => {
  const { location } = await run(PRIMARY + '/analyzify-alternative?utm_source=x&ref=producthunt');
  assert.equal(
    location,
    PRIMARY + '/shopify-attribution-tools-compared/?utm_source=x&ref=producthunt',
  );
});

test('/go/* cloaks are never intercepted by the middleware', async () => {
  for (const path of ['/go/make', '/go/make/', '/go/systeme', '/go/getresponse/']) {
    const { served, status } = await run(PRIMARY + path);
    assert.equal(served, true, `${path} must fall through to the asset server`);
    assert.equal(status, 200);
  }
  assert.equal(
    LEGACY_RULES.some((r) => r.from.startsWith('/go/')),
    false,
    '/go/* must not be compiled into the legacy map',
  );
});

test('/api/* is never slash-redirected or rewritten', async () => {
  for (const path of ['/api/gap-stats', '/api/submit-gap', '/api/capture-email']) {
    const { served, status } = await run(PRIMARY + path);
    assert.equal(served, true, `${path} must reach the Function untouched`);
    assert.equal(status, 200);
  }
});

test('files with an extension never gain a trailing slash', async () => {
  for (const path of ['/robots.txt', '/sitemap-0.xml', '/sitemap-index.xml', '/rss.xml']) {
    const { served } = await run(PRIMARY + path);
    assert.equal(served, true, `${path} must not be redirected`);
  }
});

test('non-primary hosts redirect to the apex in one hop', async () => {
  for (const origin of ['https://abc123.stackarchitect.pages.dev', 'https://www.stackarchitect.xyz']) {
    const { status, location } = await run(origin + '/capi-shield/');
    assert.equal(status, 301);
    assert.equal(location, PRIMARY + '/capi-shield/');
  }
});
