/**
 * The widened retired-kit-price rule in claims-guard (19 Sep 2026).
 *
 * The line-bound `contexts` patterns missed a live "$29" relatedGuides badge
 * in shopify-bfcm-automation-checklist-2026.md: the price sat two YAML lines
 * below `href: "/pro"`. The fixture below is that frontmatter as it shipped
 * in bb18ad9.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { retiredNearAnchor } from '../scripts/lib/retired-near-anchor.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const claims = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'claims.json'), 'utf8'));
const kit = claims.ours.kitPrice;
const spec = { retired: kit.retired, ...kit.near };

const bfcmBadge = `  - title: "Replace Klaviyo Free"
    href: "/replace-klaviyo-free"
  - title: "Complete Kit — All 4 automations"
    href: "/pro"
    badge: "$29"
---`;

test('the widened rule is configured at ±300 and armed with the retired kit prices', () => {
  assert.equal(kit.near.window, 300);
  assert.deepEqual([...kit.retired].sort(), [24, 29]);
});

test('the shipped BFCM badge is caught', () => {
  const hits = retiredNearAnchor(bfcmBadge, spec);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].value, 29);
});

test('the line-bound contexts alone did not catch the BFCM badge', () => {
  const caught = kit.contexts.some((p) =>
    [...bfcmBadge.matchAll(new RegExp(p, 'gi'))].some((m) => kit.retired.includes(Number(m[1])))
  );
  assert.equal(caught, false, 'if the old patterns catch it, this test no longer documents the gap');
});

test('the same badge at the current price is clean', () => {
  assert.deepEqual(retiredNearAnchor(bfcmBadge.replace('$29', '$19.99'), spec), []);
});

test('an anchor AFTER the price counts — the /best-free-shopify-apps-2026/ heading', () => {
  const heading = `<h2>Skip the 8-hour build.<br>
      <span class="grn">Deploy in 10 minutes. $29.</span>
    </h2>
    <p>The Complete Kit gives you four pre-built Make.com JSON blueprints</p>`;
  assert.equal(retiredNearAnchor(heading, spec).length, 1);
});

test('$24, the other retired figure, is caught too', () => {
  assert.equal(retiredNearAnchor('<a href="/pro/">Get it</a> for $24.', spec).length, 1);
});

test("other vendors' recurring prices and ranges near a /pro/ link are not flagged", () => {
  const src = `<a href="/pro/">Kit</a> Stape ($29/mo), BeProfit $29+/mo, saves $29–$99/mo, $24 per month`;
  assert.deepEqual(retiredNearAnchor(src, spec), []);
});

test('a retired figure with no anchor within 300 characters is not flagged — accepted miss', () => {
  const src = `"text": "Deploy in 10 minutes. $29."${' '.repeat(400)}<a href="/pro/">`;
  assert.deepEqual(retiredNearAnchor(src, spec), []);
});
