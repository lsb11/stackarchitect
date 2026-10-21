// tests/stocky-swap-wording.test.js: Stocky Swap is an order log, everywhere.
//
// CLAUDE.md has said so since 19 Oct 2026, and on 21 Oct 2026 seven places
// still called it inventory management, including the homepage's ItemList
// JSON-LD ("Stocky Swap: Free Inventory Management") and an FAQ answer on the
// ultimate guide. It writes one row per paid order line; it does not hold
// stock on hand, purchase orders or forecasts. This holds the wording.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src/pages', 'src/components', 'src/layouts', 'src/data', 'src/content'];
const FILES = ['public/llms.txt', 'public/llms-full.txt'];
const EXT = /\.(astro|ts|js|md|mdx|json)$/;

// "Stocky Swap ... inventory management / ledger / system", either order,
// within one sentence.
const NEAR = [
  /stocky swap[^.<"]{0,80}\binventory (management|ledger|system|tracking)\b/i,
  /\binventory (management|ledger|system)\b[^.<"]{0,60}stocky swap/i,
];
const UNLESS = /\bnot (a |an )?(full )?inventory|\bis none of that|\bnot inventory|inventory apps \/ mo|order log, not/i;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
}

test('Stocky Swap is never described as inventory management', () => {
  const hits = [];
  for (const file of [...ROOTS.flatMap((r) => walk(r)), ...FILES.filter((f) => fs.existsSync(f))]) {
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (NEAR.some((re) => re.test(line)) && !UNLESS.test(line)) hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 160)}`);
    });
  }
  assert.deepEqual(hits, [], hits.join('\n'));
});

test('the pattern catches the homepage JSON-LD as it was', () => {
  assert.ok(NEAR.some((re) => re.test('"name": "Stocky Swap: Free Inventory Management"')));
});
