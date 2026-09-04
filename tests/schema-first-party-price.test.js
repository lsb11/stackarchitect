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
import {
  KIT_PRICE,
  SINGLE_PRICE,
  UPGRADE_PRICE,
  STOCKLOG_PRICE,
  STOCKLOG_UNIT,
} from '../src/data/products.ts';

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
  assert.equal(claims.ours.stockLogPrice.value, STOCKLOG_PRICE);
});

test('StockLog is pinned as recurring, not one-time', () => {
  // The pin said "USD one-time" until 4 Sep 2026 while /about/ emitted a
  // UnitPriceSpecification of MONTH beside it. The number matched; the offer
  // did not. Nothing in the guard can catch that, so assert it here.
  assert.match(claims.ours.stockLogPrice.unit, /\/month\b/);
  assert.doesNotMatch(claims.ours.stockLogPrice.unit, /one-time/);
  assert.equal(STOCKLOG_UNIT, 'MONTH');
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

/* -------------------------------------------------------------------------
 * RECURRING PRICES. Every case above is one-time, and a monthly price is not
 * the same shape: it states the figure twice, once on the Offer and once on a
 * nested UnitPriceSpecification carrying the period. Both are prices we set,
 * so both have to be checked — a guard that walked only the Offer would let
 * the priceSpecification drift away from it silently, which is the more
 * likely half to be forgotten because it is the one further from the eye.
 * ---------------------------------------------------------------------- */

/** /about/'s StockLog node, at the constant. */
function stockLogNode(price = String(STOCKLOG_PRICE), specPrice = price) {
  return {
    '@type': 'SoftwareApplication',
    '@id': 'https://stocklog.onrender.com/#app',
    name: 'StockLog',
    url: 'https://stocklog.onrender.com/',
    author: { '@id': 'https://stackarchitect.xyz/#luke' },
    publisher: { '@id': 'https://stackarchitect.xyz/#org' },
    offers: {
      '@type': 'Offer',
      url: 'https://stocklog.onrender.com/',
      price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: specPrice,
        priceCurrency: 'USD',
        unitText: STOCKLOG_UNIT,
      },
    },
  };
}

test('a recurring first-party price is covered — StockLog at the constant is clean', () => {
  assert.deepEqual(firstPartyPriceViolations(stockLogNode(), claims), []);
});

test('both halves of a recurring price are checked, not just the Offer', () => {
  // StockLog is first-party via author/publisher #luke/#org, not via a
  // stackarchitect.xyz url — its url is stocklog.onrender.com. That the node
  // is reached at all is the thing this asserts alongside the count.
  const found = firstPartyPrices(stockLogNode());
  assert.equal(found.length, 2, 'Offer.price and UnitPriceSpecification.price');
  assert.ok(found.every((p) => p.value === STOCKLOG_PRICE));
});

test('a UnitPriceSpecification that drifts from its Offer is caught', () => {
  // The half nobody looks at: the Offer still reads $7.99, the period price
  // has been left on a retired figure.
  const found = firstPartyPriceViolations(stockLogNode(String(STOCKLOG_PRICE), '5.99'), claims);
  assert.equal(found.length, 1);
  assert.equal(found[0].value, 5.99);
  assert.match(found[0].path, /priceSpecification/);
});

test('a recurring price drifting off the constant is caught on the Offer too', () => {
  const found = firstPartyPriceViolations(stockLogNode('6.99'), claims);
  assert.equal(found.length, 2, 'both halves move together and both are flagged');
  assert.ok(found.every((p) => p.value === 6.99));
});

test('the check is by value, not by product — a known limit, asserted so it is known', () => {
  // 9.99 is SINGLE_PRICE. It is pinned under `ours`, so StockLog asserting it
  // passes: the guard answers "is this one of our prices?", not "is this the
  // right one of our prices?". Tying each Offer to a named claim would need a
  // mapping from node to claim id that nothing in the JSON-LD carries. What
  // covers this instead is the unit assertion above plus the constant being
  // the only thing the page renders — there is no literal left to get wrong.
  assert.deepEqual(firstPartyPriceViolations(stockLogNode('9.99'), claims), []);
  assert.equal(claims.ours.singlePrice.value, 9.99);
});

test('the built about page carries no first-party price mismatch', (t) => {
  const file = path.join(ROOT, 'dist', 'about', 'index.html');
  if (!fs.existsSync(file)) {
    t.skip('dist/about/index.html not built — run npm run build');
    return;
  }
  const html = fs.readFileSync(file, 'utf8');
  const found = [];
  let stockLogPrices = 0;
  for (const [, json] of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  )) {
    let graph;
    try {
      graph = JSON.parse(json);
    } catch {
      continue;
    }
    found.push(...firstPartyPriceViolations(graph, claims));
    stockLogPrices += firstPartyPrices(graph).filter((p) => p.value === STOCKLOG_PRICE).length;
  }
  assert.deepEqual(found, [], 'first-party prices in /about/ JSON-LD must match their constants');
  assert.equal(stockLogPrices, 2, `/about/ should assert StockLog at ${STOCKLOG_PRICE} twice`);
  assert.match(html, /"unitText"\s*:\s*"MONTH"/, 'the billing period must survive to the page');
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
