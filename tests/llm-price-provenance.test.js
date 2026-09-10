/**
 * The per-price provenance rule for public/llms.txt and public/llms-full.txt.
 *
 * The probe these tests are built from: take a line that already cites one
 * vendor with a date and a URL, append a second vendor's bare price to it, and
 * see whether the guard notices. Under the old per-LINE scope it did not — the
 * first vendor's citation vouched for the second vendor's figure. Lines 24, 44
 * and 50 of llms-full.txt are exactly that shape, which is why all three are
 * reproduced here rather than one synthetic example.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findUnsourcedPrices, clauseFor, PRICE } from '../scripts/lib/llm-price-provenance.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The three real lines, as they stand today. */
const LINES = {
  elevar:
    '- **Replaces**: Elevar (entry $225/mo — verified 2026-08-08, ' +
    'https://www.audiense.com/products/audiense-online/pricing/ ; getelevar.com now redirects ' +
    'to Audiense. Higher tiers to $1,250/mo are third-party reported and NOT verified), ' +
    'Triple Whale (GMV-based; entry ~$129/mo third-party reported, NOT verified), ' +
    'Northbeam ($1,500+/mo — verified 2026-08-08, https://www.northbeam.io/pricing ).',
  analyzify:
    '- **Replaces**: WeltPixel (price NOT verified — no figure published here until a human ' +
    "reads the vendor's own pricing page), Analyzify ($145–$275/mo — verified 2026-08-08, " +
    'https://analyzify.com/pricing ).',
  klaviyo:
    '- **Replaces**: Klaviyo (entry $20/mo — verified 2026-08-11, https://www.klaviyo.com/pricing ' +
    '; it rises across a published contact ladder, and the top of that ladder is NOT verified here.)',
};

test('the three real vendor lines pass as written', () => {
  for (const [name, line] of Object.entries(LINES)) {
    assert.deepEqual(findUnsourcedPrices(line), [], `${name} should need no fixing`);
  }
});

test('a bare price on its own line fails — the case that always worked', () => {
  const found = findUnsourcedPrices('- **Replaces**: SomeVendor ($42/mo).');
  assert.equal(found.length, 1);
  assert.equal(found[0].price, '$42/mo');
  assert.equal(found[0].why, 'no source and no verification date');
});

test("a bare price appended to a cited line fails — the hole this closes", () => {
  for (const [name, line] of Object.entries(LINES)) {
    const found = findUnsourcedPrices(`${line} Also SomeVendor at $999/mo.`);
    assert.equal(found.length, 1, `${name}: expected exactly the appended price to fail`);
    assert.equal(found[0].price, '$999/mo', `${name}: wrong price blamed`);
  }
});

test('a bare price spliced INTO a cited line fails, and blames only itself', () => {
  // Between Elevar's citation and Triple Whale's, where the old scope was widest.
  const line = LINES.elevar.replace('Triple Whale (', 'Recart ($59/mo), Triple Whale (');
  const found = findUnsourcedPrices(line);
  assert.equal(found.length, 1);
  assert.equal(found[0].price, '$59/mo');
});

test("one vendor's citation does not reach past a closing parenthesis", () => {
  const scope = (src) => {
    const m = [...src.matchAll(PRICE)].find((x) => x[0].startsWith('$999'));
    return clauseFor(src, m.index, m[0].length);
  };
  assert.ok(!/verified/.test(scope(`${LINES.analyzify} Northbeam $999/mo.`)));
});

test('provenance may wrap onto the following line, but not sit on the preceding one', () => {
  assert.deepEqual(
    findUnsourcedPrices('- **Replaces**: Vendor ($77/mo — verified\n  2026-08-08, https://vendor.example/pricing ).'),
    [],
    'a wrapped citation below the price still counts'
  );

  const above = findUnsourcedPrices(
    '- **Canonical URL**: https://stackarchitect.xyz/capi-shield/ — verified 2026-08-08\n' +
      '- **Replaces**: Vendor ($77/mo).'
  );
  assert.equal(above.length, 1, 'a link on the line above is not a vendor source');
  assert.equal(above[0].price, '$77/mo');
});

test('"NOT verified" clears only the clause it appears in', () => {
  const found = findUnsourcedPrices(
    '- **Replaces**: Vendor (entry $50/mo, NOT verified; higher tiers to $500/mo).'
  );
  assert.equal(found.length, 1);
  assert.equal(found[0].price, '$500/mo');
});

test('our own prices need no vendor source', () => {
  const isOurs = (p) => /^\$(0|24)(\/(mo|month))?$/.test(p);
  assert.deepEqual(findUnsourcedPrices('The Complete Kit is $24 one-time; the stack is $0/month.', isOurs), []);
});

test('the shipped files carry provenance for every third-party price', () => {
  const ours = /^\$(0|24|9\.99|14|7\.99)(\/(mo|month|yr|year))?[,.]?$/;
  for (const rel of ['public/llms.txt', 'public/llms-full.txt']) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.deepEqual(findUnsourcedPrices(src, (p) => ours.test(p)), [], rel);
  }
});
