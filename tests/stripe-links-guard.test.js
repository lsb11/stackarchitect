import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findStrayLinks } from '../scripts/stripe-links-guard.mjs';
import { KIT_STRIPE_URL, PRODUCTS } from '../src/data/products.ts';

test('no Stripe Payment Link is written outside src/data/products.ts', () => {
  const hits = findStrayLinks().map((h) => `${h.file}:${h.line} ${h.link}`);
  assert.deepEqual(hits, []);
});

test('every checkout link in products.ts is a distinct buy.stripe.com link', () => {
  const urls = [KIT_STRIPE_URL, ...PRODUCTS.map((p) => p.stripeUrl)];
  for (const u of urls) assert.match(u, /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/, u);
  assert.equal(new Set(urls).size, urls.length, 'two products share a Stripe link');
});
