/**
 * Regression test for stale Stocky shutdown wording (Sep 2026).
 *
 * Stocky closed on 31 August 2026, but "shutting down August 31" kept
 * shipping in page copy, apps.json and JSON-LD for weeks afterwards.
 * schema-visible-guard's check 5 fails the build on that wording, and on any
 * claim that data is deleted, everywhere except the homepage video transcript.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { shutdownWordingHits } from '../scripts/schema-visible-guard.mjs';

const page = (body, head = '') =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

test('fails on future-tense shutdown wording in visible text, attributes and JSON-LD', () => {
  const hits = shutdownWordingHits(
    page(
      '<p>Shopify Stocky (inventory, shutting down August 31 2026)</p>' +
        '<p>Shopify deleted all Stocky records.</p>' +
        '<script type="application/ld+json">' +
        JSON.stringify({ '@type': 'SoftwareApplication', name: 'Stocky', description: 'Shopify-owned inventory app shutting down August 31, 2026' }) +
        '</script>',
      '<meta name="description" content="Stocky shuts down on 31 August.">'
    )
  );
  assert.deepEqual(
    hits.map((h) => h.where).sort(),
    ['JSON-LD', 'attribute', 'visible text', 'visible text']
  );
});

test('passes past-tense wording', () => {
  assert.deepEqual(
    shutdownWordingHits(
      page(
        '<p>Stocky closed on 31 August 2026. Read-only export stays open for at least 90 days after that.</p>' +
          '<script type="application/ld+json">' +
          JSON.stringify({ '@type': 'SoftwareApplication', name: 'Stocky', description: 'Shopify-owned inventory app that closed on 31 August 2026' }) +
          '</script>'
      )
    ),
    []
  );
});

test('allowlists the homepage video transcript and nothing else on the page', () => {
  const transcript =
    '<details class="hero-video-transcript" data-astro-cid-j7pv25f6><summary>Read transcript</summary>' +
    '<div class="transcript-body"><p>Shopify is shutting down Stocky August 31st.</p></div></details>';
  assert.deepEqual(shutdownWordingHits(page(transcript)), []);

  // The same sentence one element outside the transcript still fails.
  const hits = shutdownWordingHits(page(transcript + '<p>Shopify is shutting down Stocky August 31st.</p>'));
  assert.equal(hits.length, 1);
  assert.equal(hits[0].where, 'visible text');

  // A different <details> is not exempt.
  assert.equal(
    shutdownWordingHits(page('<details class="faq"><p>Stocky is closing soon.</p></details>')).length,
    1
  );
});

test('fails on "before the shutdown" deadline wording now that Stocky has closed', () => {
  for (const s of [
    'Replace Stocky before the August 2026 shutdown.',
    'Stocky Swap, replace Stocky before August shutdown.',
    'Export purchase orders separately before the shutdown.',
    'Move your data before Stocky closes.',
    'Free inventory management before Aug 2026 shutdown.',
    'Stocky replacement (before August 31 shutdown).',
    'Stocky Swap: Replace Shopify Stocky Before August 31.',
    'Stocky Retires August 31 2026.',
    'Your migration started before the August 31 2026 deadline.',
  ]) {
    assert.equal(shutdownWordingHits(page(`<p>${s}</p>`)).length, 1, s);
  }
  assert.deepEqual(shutdownWordingHits(page('<p>Stocky closed on 31 August 2026.</p>')), []);
  assert.deepEqual(shutdownWordingHits(page('<p>If you did not export before the deadline, look now.</p>')), []);
});
