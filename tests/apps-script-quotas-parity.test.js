/**
 * Every figure in the quotas post's limits tables, compared with the
 * apps-script-quotas package.
 *
 * WHY THIS EXISTS
 * The post and the package state the same Google figures. The package is
 * checked against Google's quotas page daily and ships a new version when
 * Google changes a number; the post is edited by hand. Without this test the
 * two can disagree and nobody notices, and the post's error explainer (which
 * reads the package) would then contradict the tables beside it.
 *
 * WHAT IT CHECKS, all read from source so no build is needed:
 *   1. src/data/apps-script-quotas.json, which renders the two complete
 *      tables ("Daily quotas" and "Hard limitations"): same rows as the
 *      package, same consumer and Workspace figures.
 *   2. The table at the top of the post (#current-limits), typed by hand.
 *   3. The summary table under "The Exact Google Apps Script Quota Limits",
 *      typed by hand in longer words ("90 minutes", "500KB"). Each row is
 *      mapped to a package id below; a row with no mapping fails, so a new
 *      row cannot slip past unchecked.
 *   4. The LIMITS constant behind the quota calculator.
 *
 * When this fails, find out which side is wrong from Google's page
 * (developers.google.com/apps-script/guides/services/quotas) before changing
 * either. Do not edit a figure just to make the test pass.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('apps-script-quotas');
const { slug, parseLimit } = require('apps-script-quotas/lib/parse');

const POST = new URL('../src/pages/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations.astro', import.meta.url);
const SRC = fs.readFileSync(POST, 'utf8');
const DATA = JSON.parse(fs.readFileSync(new URL('../src/data/apps-script-quotas.json', import.meta.url), 'utf8'));

const clean = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\*/g, '').replace(/\s+/g, ' ').trim();

/** Rows of the <table> whose tag holds `marker`, or else the first one after
    it, as arrays of cell text. */
function tableAfter(marker) {
  const at = SRC.indexOf(marker);
  assert.ok(at > -1, `marker not found in the quotas post: ${marker}`);
  const open = SRC.lastIndexOf('<table', at);
  const inTag = open > -1 && SRC.indexOf('>', open) > at;
  const start = inTag ? open : SRC.indexOf('<table', at);
  const end = SRC.indexOf('</table>', start);
  return [...SRC.slice(start, end).matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => clean(c[1])))
    .filter((cells) => cells.length);
}

/** A figure as one comparable number: seconds for time, KB for size, else the count. */
function measure(text) {
  const m = clean(text).replace(/,/g, '').match(/^([\d.]+)\s*([A-Za-z]+)?/);
  assert.ok(m, `no figure in "${text}"`);
  const n = Number(m[1]);
  const unit = (m[2] || '').toLowerCase();
  const factor = { sec: 1, second: 1, seconds: 1, min: 60, minute: 60, minutes: 60, hr: 3600, hrs: 3600, hour: 3600, hours: 3600, kb: 1, mb: 1024 }[unit];
  return factor ? n * factor : n;
}
const pkgMeasure = (limit) => measure(limit.raw);

test('the complete tables have exactly the package\'s rows and figures', () => {
  for (const kind of ['quotas', 'limitations']) {
    const ours = DATA[kind];
    const theirs = pkg[kind];
    assert.equal(ours.length, theirs.length, `${kind}: the post lists ${ours.length} rows, the package ${theirs.length}`);
    for (const row of ours) {
      const p = theirs.find((r) => r.id === slug(row.feature));
      assert.ok(p, `${kind}: "${row.feature}" is not in the package`);
      assert.equal(clean(row.consumer), p.consumer.raw, `${row.feature}, consumer`);
      assert.equal(clean(row.workspace), p.workspace.raw, `${row.feature}, Workspace`);
    }
  }
});

test('the table at the top of the post (#current-limits) matches the package', () => {
  const rows = tableAfter('id="current-limits"');
  assert.ok(rows.length >= 5, 'expected at least five rows in #current-limits');
  for (const [feature, consumer, workspace] of rows) {
    const p = pkg.get(slug(feature));
    assert.ok(p && p.id === slug(feature), `"${feature}" is not a package row`);
    assert.equal(parseLimit(consumer).raw, p.consumer.raw, `${feature}, consumer`);
    assert.equal(parseLimit(workspace).raw, p.workspace.raw, `${feature}, Workspace`);
  }
});

// The summary table words its rows its own way, so each label is mapped to
// the package row it restates.
const SUMMARY = {
  'Single execution time': 'script-runtime',
  'Trigger runtime/day': 'triggers-total-runtime',
  'UrlFetch calls/day': 'url-fetch-calls',
  'Document creates/day': 'documents-created',
  'Email recipients/day': 'email-recipients-per-day',
  'Concurrent executions': 'simultaneous-executions-per-user',
  'Script properties size': 'properties-total-storage',
};

test('the summary table under "The Exact ... Quota Limits" matches the package', () => {
  const rows = tableAfter('<h2 id="exact-limits">');
  assert.ok(rows.length >= 7, 'expected at least seven rows in the summary table');
  for (const [label, consumer, workspace] of rows) {
    const id = SUMMARY[label];
    assert.ok(id, `summary row "${label}" has no mapping in this test: add one`);
    const p = pkg.get(id);
    assert.equal(p.id, id);
    assert.equal(measure(consumer), pkgMeasure(p.consumer), `${label}, consumer: "${consumer}" vs "${p.consumer.raw}"`);
    assert.equal(measure(workspace), pkgMeasure(p.workspace), `${label}, Workspace: "${workspace}" vs "${p.workspace.raw}"`);
  }
});

test('the quota calculator\'s LIMITS constant matches the package', () => {
  const block = SRC.match(/const LIMITS = \{([\s\S]*?)\};/);
  assert.ok(block, 'LIMITS constant not found');
  const num = (k) => Number(block[1].match(new RegExp(`${k}:\\s*([\\d_]+)`))[1].replace(/_/g, ''));
  assert.equal(num('scriptRuntimeSec'), pkg.get('script-runtime').consumer.seconds);
  assert.equal(num('triggerDailyConsumerSec'), pkg.get('triggers-total-runtime').consumer.seconds);
  assert.equal(num('triggerDailyWorkspaceSec'), pkg.get('triggers-total-runtime').workspace.seconds);
  assert.equal(num('urlFetchConsumer'), pkg.get('url-fetch-calls').consumer.value);
  assert.equal(num('urlFetchWorkspace'), pkg.get('url-fetch-calls').workspace.value);
});
