// tests/indexnow-plan.test.js — the rules that stop scripts/indexnow.mjs from
// repeating the ~55,000-URL flood (CLAUDE.md, "IndexNow: deliberately silent").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, eligible, freezeBlocks, parseSitemap, FREEZE_LIFTS } from '../scripts/lib/indexnow-plan.mjs';

const S = 'https://stackarchitect.xyz';
const redirects = new Set(['/stocky-shutdown/', '/go/make', '/blog/old-post/']);
const map = (o) => new Map(Object.entries(o));

test('only canonical sitemap pages are ever eligible', () => {
  assert.ok(eligible(`${S}/capi-shield/`, redirects));
  for (const bad of [`${S}/stocky-shutdown/`, `${S}/go/make/`, `${S}/embed/x/`, `${S}/capi-shield`,
    'https://www.stackarchitect.xyz/capi-shield/', 'http://stackarchitect.xyz/capi-shield/', 'https://evil.example/']) {
    assert.equal(eligible(bad, redirects), false, bad);
  }
});

test('sends changed pages, skips unchanged, undeployed and ineligible ones', () => {
  const live = map({ [`${S}/a/`]: '2026-10-22', [`${S}/b/`]: '2026-10-01', [`${S}/c/`]: '2026-10-23', [`${S}/stocky-shutdown/`]: '2026-10-22' });
  const dist = map({ [`${S}/a/`]: '2026-10-22', [`${S}/b/`]: '2026-10-01', [`${S}/c/`]: '2026-10-24', [`${S}/stocky-shutdown/`]: '2026-10-22' });
  const sent = { [`${S}/b/`]: '2026-10-01' };
  const p = plan({ dist, live, sent, redirectSources: redirects });
  assert.deepEqual(p.send.map((s) => s.url), [`${S}/a/`]);
  assert.equal(p.skipped.unchanged, 1);
  assert.deepEqual(p.skipped.notDeployed, [`${S}/c/`]);
  assert.deepEqual(p.skipped.ineligible, [`${S}/stocky-shutdown/`]);
});

test('a hard cap holds the rest back rather than sending everything', () => {
  const entries = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [`${S}/p${i}/`, '2026-10-22']));
  const p = plan({ dist: map(entries), live: map(entries), sent: {}, redirectSources: redirects, cap: 60 });
  assert.equal(p.send.length, 60);
  assert.equal(p.overCap.length, 60);
});

test('a second run after a successful submit sends nothing', () => {
  const live = map({ [`${S}/a/`]: '2026-10-22' });
  const sent = { [`${S}/a/`]: '2026-10-22' };
  assert.equal(plan({ dist: live, live, sent, redirectSources: redirects }).send.length, 0);
});

test(`submission is blocked until the freeze lifts on ${FREEZE_LIFTS}`, () => {
  assert.equal(freezeBlocks(new Date('2026-10-09T12:00:00Z')), true);
  assert.equal(freezeBlocks(new Date('2026-10-20T23:59:00Z')), true);
  assert.equal(freezeBlocks(new Date('2026-10-21T00:00:00Z')), false);
});

test('parses the sitemap Astro emits', () => {
  const xml = `<urlset><url><loc>${S}/a/</loc><lastmod>2026-09-25T10:00:00.000Z</lastmod></url><url><loc>${S}/b/</loc></url></urlset>`;
  const m = parseSitemap(xml);
  assert.equal(m.get(`${S}/a/`), '2026-09-25T10:00:00.000Z');
  assert.equal(m.get(`${S}/b/`), null);
});
