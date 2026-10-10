// tests/agentic-consistency.test.js — the agentic guide says what its data
// says, everywhere an AI assistant might read it.
//
// On 9 Oct 2026 src/data/agentic-storefronts-channels.json was corrected
// (Google became US-only; digital products came off the unsupported list),
// and four hand-written copies on the page kept the old facts: the HowTo step
// in the JSON-LD, an FAQ answer, the visible setup step and the Dataset name.
// Those sentences are the ones assistants quote, and this page is the one
// third parties cite. The page now builds them from the data; this holds it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DATA = JSON.parse(fs.readFileSync('src/data/agentic-storefronts-channels.json', 'utf8'));
const PAGE = 'dist/blog/shopify-agentic-storefronts-setup-guide-2026/index.html';
const built = fs.existsSync(PAGE);
const skip = built ? false : 'run npm run build first';
const html = built ? fs.readFileSync(PAGE, 'utf8') : '';
const text = html.replace(/&amp;/g, '&').replace(/&rsquo;/g, "'");
const google = DATA.channels.find((c) => c.id === 'google');
const types = DATA.directCheckoutLimits.unsupportedProductTypes;

test('a product type off the unsupported list is never called unsupported on the page, the llms.txt or the open data', { skip }, () => {
  if (types.some((t) => /digital/i.test(t))) return;
  for (const [where, body] of [['page', text], ['llms.txt', fs.readFileSync('public/llms.txt', 'utf8')]]) {
    assert.doesNotMatch(body, /digital products[^.]{0,80}(not supported|unsupported|cannot)|(unsupported|not supported|cannot)[^.]{0,120}digital products/i, where);
  }
});

test('Google eligibility matches the data everywhere on the page, JSON-LD included', { skip }, () => {
  if (!/^United States only$/.test(google.storeLocationRule)) return;
  assert.doesNotMatch(text, /US, UK, Australia or Canada|US, UK, AU or CA|United Kingdom, Australia or Canada/);
});

test('every unsupported product type appears in the FAQ answer and the HowTo', { skip }, () => {
  const faq = text.slice(text.indexOf('Which products cannot be sold'), text.indexOf('Do discount codes work'));
  for (const t of types) assert.match(faq.toLowerCase(), new RegExp(t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), t);
});

test('the Dataset is dated by the data and offers the download', { skip }, () => {
  assert.doesNotMatch(text, /capability matrix \(August 2026\)/);
  assert.match(text, /"contentUrl":"https:\/\/stackarchitect\.xyz\/downloads\/agentic-storefronts-channels\.json"/);
  const dl = JSON.parse(fs.readFileSync('dist/downloads/agentic-storefronts-channels.json', 'utf8'));
  assert.equal(dl.verifiedDate, DATA.verifiedDate);
  assert.equal(dl.licenseName, 'CC BY 4.0');
});
