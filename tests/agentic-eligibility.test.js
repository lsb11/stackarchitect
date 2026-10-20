// tests/agentic-eligibility.test.js: the eligibility checker on the agentic
// guide gives the answers the guide's own FAQ gives, from the same data.
//
// The FAQ states the UK case in words ("a UK-based store cannot use Google,
// but can use ChatGPT and Copilot if it sells to US customers, and Meta if it
// sells to US, Canadian or Mexican ones"). These cases pin the checker to that
// sentence, and to the JSON, so a data change that the checker cannot read
// fails here rather than giving a reader a confident wrong answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseRules, checkEligibility } from '../src/utils/agenticEligibility.ts';

const DATA = JSON.parse(fs.readFileSync('src/data/agentic-storefronts-channels.json', 'utf8'));
const rules = parseRules(DATA.channels);
const yes = (store, sells) => checkEligibility(rules, store, sells).filter((v) => v.eligible).map((v) => v.id).sort();

test('every channel in the Shopify admin has a readable rule; Perplexity is not one', () => {
  const inAdmin = DATA.channels.filter((c) => c.inShopifyAdmin).map((c) => c.id).sort();
  assert.deepEqual(rules.map((r) => r.id).sort(), inAdmin);
  assert.ok(!rules.some((r) => r.id === 'perplexity'));
});

test('the FAQ’s UK case: Google no; ChatGPT and Copilot with US customers; Meta with US, Canadian or Mexican ones', () => {
  assert.deepEqual(yes('United Kingdom', ['United States']), ['chatgpt', 'copilot', 'meta']);
  assert.deepEqual(yes('United Kingdom', ['Canada']), ['meta']);
  assert.deepEqual(yes('United Kingdom', ['Mexico']), ['meta']);
  assert.deepEqual(yes('United Kingdom', []), []);
});

test('a US store selling to the US qualifies for every channel', () => {
  assert.deepEqual(yes('United States', ['United States']), ['chatgpt', 'copilot', 'google', 'meta']);
});

test('the checker agrees with each channel’s store rule in the data', () => {
  for (const c of DATA.channels.filter((x) => x.inShopifyAdmin)) {
    const v = checkEligibility(rules, 'United Kingdom', ['United States', 'Canada', 'Mexico']).find((x) => x.id === c.id);
    assert.equal(v.eligible, c.storeLocationRule === 'Any country', c.id);
  }
});

test('wording the parser does not know fails loudly instead of guessing', () => {
  const odd = [{ ...DATA.channels[0], customerLocationRule: 'Must sell to customers in the United States or Brazil' }];
  assert.throws(() => parseRules(odd), /does not know/);
  const odd2 = [{ ...DATA.channels[0], storeLocationRule: 'EU member states' }];
  assert.throws(() => parseRules(odd2), /cannot read store rule/);
});
