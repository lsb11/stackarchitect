// tests/stocklog-cta.test.js — StockLog's buy path goes somewhere real.
//
// Until 12 Oct 2026 STOCKLOG_APP_STORE_URL held 'https://apps.shopify.com/'
// as a placeholder, so every "Install from the Shopify App Store" button on
// /stocklog/ and in StockLogPromo sent a merchant to the App Store's own
// homepage. On the only product billed monthly, with the listing not yet
// submitted, that is the whole funnel ending in a dead end. An install button
// now either points at a real listing under apps.shopify.com/<handle>, or
// falls back to the waitlist. The App Store root is never a destination.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { STOCKLOG_APP_STORE_URL, STOCKLOG_NOTIFY_URL } from '../src/data/products.ts';

const BUILT = fs.existsSync('dist/stocklog/index.html');
const skip = BUILT ? false : 'run npm run build first';
const htmlFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? htmlFiles(p) : e.name.endsWith('.html') ? [p] : [];
});

test('the App Store URL is either empty or a real listing, never the store root', () => {
  if (STOCKLOG_APP_STORE_URL === '') return;
  assert.match(STOCKLOG_APP_STORE_URL, /^https:\/\/apps\.shopify\.com\/[a-z0-9-]+\/?$/,
    'set it to the listing URL (apps.shopify.com/<handle>), not the App Store homepage');
});

test('no built page links to the App Store homepage', { skip }, () => {
  const offenders = htmlFiles('dist').filter((f) => /href="https:\/\/apps\.shopify\.com\/?"/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(offenders, []);
});

test('every StockLog install button has a destination that accepts the visitor', { skip }, () => {
  const want = STOCKLOG_APP_STORE_URL || STOCKLOG_NOTIFY_URL;
  const html = fs.readFileSync('dist/stocklog/index.html', 'utf8');
  const ctas = [...html.matchAll(/<a class="btn" href="([^"]*)"[^>]*>([^<]*)</g)];
  assert.ok(ctas.length >= 3, `expected the page's install buttons, found ${ctas.length}`);
  for (const [, href, label] of ctas) {
    assert.equal(href, want, label);
    assert.ok(label.trim().length > 0);
  }
  // The label has to match where it actually goes.
  const promisesInstall = /Install from the Shopify App Store/.test(html);
  assert.equal(promisesInstall, Boolean(STOCKLOG_APP_STORE_URL),
    'the button says "Install from the Shopify App Store" while no listing exists');
});

test('the Stocky alternatives page carries the StockLog block', { skip }, () => {
  const html = fs.readFileSync('dist/stocky-alternative/index.html', 'utf8');
  assert.match(html, /Prefer a hosted app over spreadsheets/);
});
