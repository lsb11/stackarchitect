// tests/edge-freshness.test.js — Cloudflare's edge must not be told to keep
// HTML. See scripts/lib/edge-freshness.mjs for what happened when it was.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { longEdgeTtlOnHtml, compare } from '../scripts/lib/edge-freshness.mjs';

test('public/_headers sets no long edge TTL on anything that can be HTML', () => {
  assert.deepEqual(longEdgeTtlOnHtml(fs.readFileSync('public/_headers', 'utf8')), []);
});

test('the rule that shipped on 25 Jul 2026 is caught', () => {
  const shipped = '/*\n  Cache-Control: public, max-age=0, must-revalidate\n  Cloudflare-CDN-Cache-Control: public, max-age=31536000, must-revalidate\n';
  assert.equal(longEdgeTtlOnHtml(shipped).length, 1);
  assert.equal(longEdgeTtlOnHtml('/*.css\n  CDN-Cache-Control: max-age=31536000\n').length, 0, 'hashed assets may be cached');
});

test('per-request Cloudflare tokens do not count as staleness; a content change does', () => {
  assert.ok(compare('<a data-cfemail="abc">x</a>', '<a data-cfemail="def">x</a>').same);
  assert.ok(!compare('<p>Updated 24 September 2026</p>', '<p>Updated 9 October 2026</p>').same);
});
