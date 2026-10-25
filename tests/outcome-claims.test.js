// tests/outcome-claims.test.js: no unsourced promise of what a setup will do
// for a store's results.
//
// WHY THIS EXISTS
// On 21 Oct 2026, after the 20–40% loss figure and the EMQ scores had been
// retracted and guarded, three outcome promises were still live, one of them
// in /capi-shield/'s FAQPage (the text assistants quote): "Most stores see
// measurable ROAS improvement within 14–21 days", "should see recovery within
// the first billing cycle", and "typically see worse productivity ... for 60+
// days". None had a source. claims-guard only reads numbers in price or
// figure context, so a timescale promise passed it.
//
// WHAT IT CHECKS
// Every page, component, layout, data file and post, plus llms.txt and
// llms-full.txt, for sentences that promise a typical result or a timescale
// for one. A sourced statistic stays possible: name the source in the same
// sentence (the `unless` list), as the site does for Meta's 17.8% figure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src/pages', 'src/components', 'src/layouts', 'src/data', 'src/content'];
const FILES = ['public/llms.txt', 'public/llms-full.txt'];
const EXT = /\.(astro|ts|js|md|mdx|json)$/;

const FORBID = [
  /\bmost stores (see|will see|get|report|notice)\b/i,
  /\b(should|will|typically|usually) see (a |an )?(measurable |significant )?(recovery|improvement|increase|lift|rise|uplift)/i,
  /\bmeasurable roas (improvement|increase|lift)/i,
  /\broas (improvement|increase|lift|recovery) within\b/i,
  /\btypically see (worse|better|higher|lower)\b/i,
];
// A sentence that names its source, or says the site publishes no figure.
// "reported" alone is not a source: "an increase in reported conversions"
// slipped through on that word until 25 Oct 2026.
const UNLESS = [/\breported (by|in|that)\b|\bas reported\b|\baccording to\b|\bpublished\b|\bsurvey\b|\bstudy\b/i, /\bwe publish no\b|\bwe do not publish\b|\bwe have not measured\b/i];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
}

test('no unsourced outcome promises in site content', () => {
  const hits = [];
  for (const file of [...ROOTS.flatMap((r) => walk(r)), ...FILES.filter((f) => fs.existsSync(f))]) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const sentence of line.split(/(?<=[.!?])\s+/)) {
        if (FORBID.some((re) => re.test(sentence)) && !UNLESS.some((re) => re.test(sentence))) {
          hits.push(`${file}:${i + 1}: ${sentence.trim().slice(0, 160)}`);
        }
      }
    });
  }
  assert.deepEqual(hits, [], 'unsourced outcome promise:\n' + hits.join('\n'));
});

test('the patterns catch the sentences that were live on 21 Oct 2026', () => {
  const live = [
    'Most stores see measurable ROAS improvement within 14–21 days as the algorithm relearns with full data.',
    'stores that lost ground after January 13 2026 should see recovery within the first billing cycle.',
    'Stores that skip this week typically see worse productivity in Gorgias than in their old tool for 60+ days.',
    'After CAPI Shield deployment most stores see an immediate increase in reported conversions in Meta Events Manager within 24–48 hours.',
  ];
  for (const s of live) assert.ok(FORBID.some((re) => re.test(s)) && !UNLESS.some((re) => re.test(s)), s);
  assert.ok(UNLESS.some((re) => re.test('Meta reported in April 2026 that advertisers saw lower cost per result.')));
});
