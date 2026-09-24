// tests/homepage-categories.test.js: the homepage's category count cannot
// disagree with its list again.
//
// The hero said "Six of the most expensive Shopify app categories" and then
// listed five. The count and the list are now both derived from PAINS in
// src/pages/index.astro, and the solutions grid carries one data-tool-card
// per tool. This test reads the source, so it needs no build, and fails when:
//   1. a PAINS entry has no category (the hero list would drop it);
//   2. the grid's data-tool-card set differs from the PAINS urls;
//   3. the hero or the grid intro goes back to a typed number word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

const painsBlock = src.slice(src.indexOf('const PAINS = ['), src.indexOf('];', src.indexOf('const PAINS = [')));
const pains = [...painsBlock.matchAll(/^\s*\{ id: '[^']+'.*$/gm)].map(([line]) => ({
  url: line.match(/url: '([^']+)'/)?.[1],
  category: line.match(/category: '([^']+)'/)?.[1],
}));

test('PAINS parses and every entry names a category', () => {
  assert.ok(pains.length > 0, 'no PAINS entries found; has the array moved?');
  for (const p of pains) assert.ok(p.category, `PAINS entry ${p.url} has no category`);
});

test('the solutions grid has exactly one card per PAINS entry', () => {
  const cards = [...src.matchAll(/data-tool-card="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...cards].sort(), pains.map((p) => p.url).sort());
});

test('the hero and grid intro count PAINS instead of typing a number', () => {
  const hero = src.match(/<p id="answer"[^>]*>([\s\S]*?)<\/p>/)[1];
  assert.match(hero, /^\{ToolCount\} of /);
  assert.match(hero, /\{categoryList\}/);
  assert.match(src, /Deploy one or all \{toolCount\}\./);
  const numberWords = /\b(two|three|four|five|six|seven|eight|nine|ten)\b/i;
  assert.doesNotMatch(hero.replace(/<a [\s\S]*?<\/a>/g, ''), numberWords);
});
