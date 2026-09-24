import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkHtml, isAffiliateLink } from '../scripts/affiliate-disclosure-guard.mjs';

const DISC = '<p>Some links below are affiliate links (marked <code>sponsored</code>). They fund the free guides.</p>';
const GO = '<a href="/go/make/?source=x" rel="sponsored nofollow noopener">Start free on Make.com</a>';

test('a page with no affiliate link is not checked', () => {
  assert.equal(checkHtml('<main><p>Nothing to sell.</p><a href="/tools/">Tools</a></main>'), null);
});

test('disclosure above the first /go/ link passes', () => {
  assert.equal(checkHtml(`<main>${DISC}${GO}</main>`).ok, true);
});

test('a /go/ link above the disclosure fails, even when the page has one', () => {
  const r = checkHtml(`<main><h1>Make.com for Shopify</h1>${GO}${DISC}</main>`);
  assert.equal(r.ok, false);
  assert.equal(r.href, '/go/make/?source=x');
});

test('a per-link "affiliate" tag is not a disclosure', () => {
  const tagged = '<a href="/go/make/" rel="sponsored">Start free <span class="aff-mark">affiliate</span></a>';
  assert.equal(checkHtml(`<main><p>Pick a tool.</p><span>affiliate</span>${tagged}</main>`).ok, false);
});

test('disclosure wording in a script, style or comment does not count', () => {
  for (const hidden of [
    '<script>const t = "Some links below are affiliate links";</script>',
    '<style>/* affiliate links */</style>',
    '<!-- this page carries affiliate links -->',
  ]) assert.equal(checkHtml(`<main>${hidden}${GO}</main>`).ok, false, hidden);
});

test('disclosure split across inline tags still matches', () => {
  assert.equal(checkHtml(`<p>Stack Architect <strong>earns a commission</strong> if you sign up.</p>${GO}`).ok, true);
});

test('an absolute /go/ URL and a rel="sponsored" vendor link are both affiliate links', () => {
  assert.equal(isAffiliateLink('<a href="https://stackarchitect.xyz/go/tidio/">'), true);
  assert.equal(isAffiliateLink('<a href="https://vendor.example/?ref=1" rel="sponsored noopener">'), true);
  assert.equal(isAffiliateLink('<a href="https://www.gorgias.com/pricing" rel="noopener">'), false);
  assert.equal(isAffiliateLink('<a href="/good-guide/">'), false);
});
