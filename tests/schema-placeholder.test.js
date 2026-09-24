/**
 * Regression test for the homepage {kitPrice} defect (Sep 2026).
 *
 * Two FAQ answers in src/pages/index.astro were JS template literals that
 * wrote {kitPrice} instead of ${kitPrice}. Readers saw "Complete Kit for
 * {kitPrice}", and so did the FAQPage JSON-LD. schema-visible-guard's check 4
 * now fails the build on a literal {camelCase} name in visible text or schema.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { unrenderedPlaceholders } from '../scripts/schema-visible-guard.mjs';

test('finds the literal placeholders that shipped on the homepage', () => {
  assert.deepEqual(
    unrenderedPlaceholders('Or buy the Complete Kit for {kitPrice} for the pre-built files.'),
    ['{kitPrice}']
  );
  assert.deepEqual(
    unrenderedPlaceholders('The {kitPrice} Complete Kit pays for itself.'),
    ['{kitPrice}']
  );
});

test('reports each placeholder once per string', () => {
  assert.deepEqual(unrenderedPlaceholders('{kitPrice} and {kitPrice} and {singlePrice}'), [
    '{kitPrice}',
    '{singlePrice}',
  ]);
});

test('ignores interpolated values and non-placeholder braces', () => {
  assert.deepEqual(unrenderedPlaceholders('Complete Kit for $19.99'), []);
  // Source form, should it ever reach built text through a code sample.
  assert.deepEqual(unrenderedPlaceholders('const a = `${kitPrice}`;'), []);
  // Make.com mapping syntax is double-braced and lower case.
  assert.deepEqual(unrenderedPlaceholders('only proceed if {{email}} is not empty'), []);
  assert.deepEqual(unrenderedPlaceholders('{{1.orderId}}'), []);
  // Lower-case words in braces are prose, not identifiers.
  assert.deepEqual(unrenderedPlaceholders('the {slug} route'), []);
});
