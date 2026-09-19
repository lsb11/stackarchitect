/**
 * Check 3 of schema-visible-guard: third-party Offers (Sep 2026).
 *
 * Until this check existed, no guard looked at a competitor Offer at all.
 * Check 2 skips anything that is not ours, and check 1 cannot see a bare
 * "145" in an Offer's price. The fixture is the Analyzify node exactly as
 * /shopify-attribution-tools-compared/ ships it: sourced and dated, but
 * asserting $145–$275 on a page that prices Analyzify per year. It is
 * quarantined in docs/schema-claims-unverified.json, not fixed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  thirdPartyOffers,
  thirdPartyOfferViolations,
} from '../scripts/schema-visible-guard.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

/** The shipped node, verbatim. */
const analyzify = {
  '@type': 'SoftwareApplication',
  '@id': 'https://stackarchitect.xyz/apps/analyzify/#app',
  name: 'Analyzify',
  applicationCategory: 'Tracking & Analytics',
  operatingSystem: 'Shopify',
  description: 'Analyzify is a premium Tracking & Analytics app for Shopify.',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://analyzify.com/pricing',
    priceVerifiedDate: '2026-08-08',
    lowPrice: '145',
    highPrice: '275',
  },
};

/** What the page says about Analyzify's price. */
const annualCopy = 'Analyzify charges a flat annual fee: about $749/yr, or roughly $62–$79/mo.';

const clone = (o) => JSON.parse(JSON.stringify(o));

test('the Analyzify node is seen as a third-party Offer', () => {
  const found = thirdPartyOffers(analyzify);
  assert.equal(found.length, 1);
  assert.equal(found[0].owner, 'Analyzify');
  assert.deepEqual(found[0].values, [145, 275]);
});

test('the shipped Analyzify Offer fails: its range is not on the page', () => {
  const [v] = thirdPartyOfferViolations(analyzify, annualCopy);
  assert.ok(v, 'expected a violation');
  assert.deepEqual(v.problems, ['$145 is not on the page', '$275 is not on the page']);
});

test('the same Offer passes when the page shows the range beside the name', () => {
  assert.deepEqual(thirdPartyOfferViolations(analyzify, 'Analyzify: $145–$275/mo.'), []);
});

test('a figure on the page but nowhere near the product name does not count', () => {
  const far = `Analyzify is a GA4 service. ${'x'.repeat(700)} Stape costs $145 and Elevar $275.`;
  const [v] = thirdPartyOfferViolations(analyzify, far);
  assert.match(v.problems.join(), /not shown near "Analyzify"/);
});

test('a missing priceVerifiedDate is caught', () => {
  const node = clone(analyzify);
  delete node.offers.priceVerifiedDate;
  const [v] = thirdPartyOfferViolations(node, 'Analyzify: $145–$275/mo.');
  assert.deepEqual(v.problems, ['no priceVerifiedDate']);
});

test('a source URL on our own domain is not a vendor source', () => {
  const node = clone(analyzify);
  node.offers.url = 'https://stackarchitect.xyz/apps/';
  const [v] = thirdPartyOfferViolations(node, 'Analyzify: $145–$275/mo.');
  assert.deepEqual(v.problems, ['no vendor source URL']);
});

test('free third-party Offers (price 0) are not checked', () => {
  const free = { '@type': 'SoftwareApplication', name: 'Make.com', offers: { '@type': 'Offer', price: '0' } };
  assert.deepEqual(thirdPartyOffers(free), []);
});

test('first-party Offers are left to check 2', () => {
  const kit = {
    '@type': 'SoftwareApplication',
    name: 'Stack Architect Complete Kit',
    provider: { '@id': 'https://stackarchitect.xyz/#org' },
    offers: { '@type': 'Offer', price: '19.99' },
  };
  assert.deepEqual(thirdPartyOffers(kit), []);
});

test('the quarantine holds exactly the Analyzify entry, with a reason', () => {
  const q = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs', 'schema-claims-unverified.json'), 'utf8')
  );
  assert.deepEqual(
    q.thirdPartyOffers.map((e) => e.key),
    ['/shopify-attribution-tools-compared/|Analyzify']
  );
  assert.ok(q.thirdPartyOffers.every((e) => typeof e.why === 'string' && e.why.length > 40));
});

test('every other built third-party Offer is clean', (t) => {
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(dist)) {
    t.skip('dist/ not built — run npm run build');
    return;
  }
  const pages = ['apps', 'shopify-attribution-tools-compared', 'stack', 'make-com-shopify'];
  const bad = [];
  let checked = 0;
  for (const p of pages) {
    const html = fs.readFileSync(path.join(dist, p, 'index.html'), 'utf8');
    const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, ''])[1];
    const visible = body
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ');
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let graph;
      try { graph = JSON.parse(json); } catch { continue; }
      checked += thirdPartyOffers(graph).length;
      for (const v of thirdPartyOfferViolations(graph, visible)) bad.push(`/${p}/|${v.owner}`);
    }
  }
  assert.ok(checked >= 30, `expected at least 30 third-party Offers, saw ${checked}`);
  assert.deepEqual(bad, ['/shopify-attribution-tools-compared/|Analyzify']);
});
