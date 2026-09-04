/**
 * Regression test for the homepage schema price defect (Sep 2026).
 *
 * src/pages/index.astro emitted a SoftwareApplication Offer of "price": "29"
 * for the Complete Kit while KIT_PRICE had been 24 since 29 Aug. It survived
 * schema-visible-guard because that guard asks whether a number APPEARS in the
 * page's visible text, and "29" appears twelve times there as third-party
 * pricing (Stape $29+/mo, BeProfit $29+/mo, "$29–$199/mo").
 *
 * So these tests assert identity, not presence: a first-party Offer price must
 * equal the constant it mirrors. Every case below fails against the pre-fix
 * node and passes against the fixed one.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  firstPartyPrices,
  firstPartyPriceViolations,
} from '../scripts/schema-visible-guard.mjs';
import { KIT_PRICE, SINGLE_PRICE, UPGRADE_PRICE } from '../src/data/products.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const claims = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src', 'data', 'claims.json'), 'utf8')
);

/** The exact node that shipped, with the price it shipped with. */
const brokenKitNode = {
  '@type': 'SoftwareApplication',
  name: 'Stack Architect Complete Kit',
  url: 'https://stackarchitect.xyz/pro/',
  offers: {
    '@type': 'Offer',
    price: '29',
    priceCurrency: 'USD',
    url: 'https://stackarchitect.xyz/pro/',
  },
  provider: { '@id': 'https://stackarchitect.xyz/#org' },
};

test('claims.json ours mirrors the products.ts constants', () => {
  assert.equal(claims.ours.kitPrice.value, KIT_PRICE);
  assert.equal(claims.ours.singlePrice.value, SINGLE_PRICE);
  assert.equal(claims.ours.upgradePrice.value, UPGRADE_PRICE);
});

test('the shipped defect is caught', () => {
  const found = firstPartyPriceViolations(brokenKitNode, claims);
  assert.equal(found.length, 1);
  assert.equal(found[0].value, 29);
  assert.equal(found[0].retiredOf, 'kitPrice', 'should name it as a retired kit price');
});

test('the same node at KIT_PRICE is clean', () => {
  const fixed = structuredClone(brokenKitNode);
  fixed.offers.price = String(KIT_PRICE);
  assert.deepEqual(firstPartyPriceViolations(fixed, claims), []);
});

test('third-party Offers are not checked — no false positive on competitor pricing', () => {
  // /stack/ shape: a SoftwareApplication for someone else's product, with no
  // seller, provider or stackarchitect.xyz url. Google Workspace at $6.
  const competitor = {
    '@type': 'SoftwareApplication',
    name: 'Google Workspace',
    offers: { '@type': 'Offer', price: '6', priceCurrency: 'USD' },
  };
  assert.deepEqual(firstPartyPrices(competitor), []);
  assert.deepEqual(firstPartyPriceViolations(competitor, claims), []);
});

test('competitor prices in prose inside a first-party node are not treated as offers', () => {
  const node = {
    '@type': 'ItemList',
    url: 'https://stackarchitect.xyz/',
    itemListElement: [
      {
        '@type': 'ListItem',
        name: 'Google Ads Conversion Tracking',
        description: 'A free alternative to Stape ($29+/mo) and Littledata ($159+/mo).',
      },
    ],
  };
  assert.deepEqual(firstPartyPriceViolations(node, claims), []);
});

test('first-party free tools (price 0) are allowed', () => {
  const free = {
    '@type': 'WebApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    provider: { '@id': 'https://stackarchitect.xyz/#org' },
  };
  assert.deepEqual(firstPartyPriceViolations(free, claims), []);
});

test('AggregateOffer bounds are checked too', () => {
  const agg = {
    '@type': 'Product',
    url: 'https://stackarchitect.xyz/pro/',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: String(SINGLE_PRICE),
      highPrice: '29',
      priceCurrency: 'USD',
    },
  };
  const found = firstPartyPriceViolations(agg, claims);
  assert.equal(found.length, 1);
  assert.equal(found[0].key, 'highPrice');
});

test('an Offer inherits first-party status from the enclosing node', () => {
  const nested = {
    '@type': 'Product',
    provider: { '@id': 'https://stackarchitect.xyz/#org' },
    offers: { '@type': 'Offer', price: '29' }, // no url or seller of its own
  };
  assert.equal(firstPartyPriceViolations(nested, claims).length, 1);
});

test('the built homepage carries no first-party price mismatch', (t) => {
  const file = path.join(ROOT, 'dist', 'index.html');
  if (!fs.existsSync(file)) {
    t.skip('dist/index.html not built — run npm run build');
    return;
  }
  const html = fs.readFileSync(file, 'utf8');
  const blocks = [...html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  )];
  assert.ok(blocks.length > 0, 'homepage should emit JSON-LD');

  const found = [];
  let sawKitPrice = false;
  for (const [, json] of blocks) {
    let graph;
    try {
      graph = JSON.parse(json);
    } catch {
      continue;
    }
    found.push(...firstPartyPriceViolations(graph, claims));
    if (firstPartyPrices(graph).some((p) => p.value === KIT_PRICE)) sawKitPrice = true;
  }
  assert.deepEqual(found, [], 'first-party prices in homepage JSON-LD must match their constants');
  assert.ok(sawKitPrice, `homepage should assert the Kit at ${KIT_PRICE}`);
});
