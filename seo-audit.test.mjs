import { test } from 'node:test';
import assert from 'node:assert';
import {
  walk, claimShape, claimsConflict, shapeLabel, pageUrlFor, auditPrices, loadApps,
  extractPriceClaims, checkAnswerBlock, answerWordCount, ANSWER_EXEMPT,
} from './seo-audit.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

test('walk correctly recurses through directories', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'walk-test-'));
  try {
    // Create the following directory structure:
    // tmpDir/
    //   file1.txt
    //   dir1/
    //     file2.txt
    //     dir2/
    //       file3.txt

    fs.writeFileSync(path.join(tmpDir, 'file1.txt'), 'content 1');

    fs.mkdirSync(path.join(tmpDir, 'dir1'));
    fs.writeFileSync(path.join(tmpDir, 'dir1', 'file2.txt'), 'content 2');

    fs.mkdirSync(path.join(tmpDir, 'dir1', 'dir2'));
    fs.writeFileSync(path.join(tmpDir, 'dir1', 'dir2', 'file3.txt'), 'content 3');

    // Run the walk function
    const files = walk(tmpDir);

    // Verify it found exactly 3 files
    assert.strictEqual(files.length, 3, 'Should find exactly 3 files');

    // Verify all the expected files are in the array, using absolute paths as `walk` returns full paths based on the input dir
    assert.ok(files.includes(path.join(tmpDir, 'file1.txt')), 'Should include file1.txt');
    assert.ok(files.includes(path.join(tmpDir, 'dir1', 'file2.txt')), 'Should include dir1/file2.txt');
    assert.ok(files.includes(path.join(tmpDir, 'dir1', 'dir2', 'file3.txt')), 'Should include dir1/dir2/file3.txt');

    // Verify it did not include any directories
    assert.ok(!files.includes(path.join(tmpDir, 'dir1')), 'Should not include dir1');
    assert.ok(!files.includes(path.join(tmpDir, 'dir1', 'dir2')), 'Should not include dir1/dir2');

  } finally {
    // Clean up temporary directory
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('walk returns empty array for empty directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'walk-test-empty-'));
  try {
    const files = walk(tmpDir);
    assert.strictEqual(files.length, 0, 'Should return empty array for empty directory');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ---- price guard: range-aware comparison -----------------------------------

test('claimShape distinguishes a range from its floor', () => {
  const range = claimShape('$145–$375/mo');
  const floor = claimShape('$145/mo');
  assert.deepStrictEqual(range.amounts, [145, 375]);
  assert.deepStrictEqual(floor.amounts, [145]);
  assert.ok(claimsConflict(range, floor), '"$145–$375/mo" must not read as "$145/mo"');
});

test('claimShape ignores formatting-only variance', () => {
  assert.ok(!claimsConflict(claimShape('$1,250/month'), claimShape('$1250 / mo')));
  assert.ok(!claimsConflict(claimShape('$145-$375/mo'), claimShape('$145–$375/month')));
});

test('claimShape treats "from $X" as open-ended, same as "$X+"', () => {
  assert.ok(claimShape('From $19.99/mo').openEnded);
  assert.ok(claimShape('starts at $40').openEnded);
  assert.ok(!claimsConflict(claimShape('From $19.99/mo'), claimShape('$19.99+')));
  assert.ok(claimsConflict(claimShape('$19.99/mo'), claimShape('$19.99+')),
    'a bare figure still contradicts an open-ended one');
});

test('claims stating different periods are not compared', () => {
  assert.ok(!claimsConflict(claimShape('$150+/mo'), claimShape('$1,800+/year')));
});

test('shapeLabel renders the full claim, not just the floor', () => {
  assert.strictEqual(shapeLabel(claimShape('$145–$375/mo')), '$145–$375/mo');
  assert.strictEqual(shapeLabel(claimShape('$145/mo')), '$145/mo');
  assert.strictEqual(shapeLabel(claimShape('Not publicly listed')), 'no figure');
});

test('pageUrlFor maps a source file to its site path', () => {
  assert.strictEqual(pageUrlFor('src/pages/index.astro'), '/');
  assert.strictEqual(pageUrlFor('src/pages/tools.astro'), '/tools/');
  assert.strictEqual(pageUrlFor('src/pages/blog/foo.astro'), '/blog/foo/');
  assert.strictEqual(pageUrlFor('src/pages/apps/index.astro'), '/apps/');
});

// ---- price guard: end-to-end over the real repo -----------------------------

test('every price on an indexable page is verified and consistent', () => {
  const { priceErrors, selfContra, crossPage } = auditPrices();
  assert.deepStrictEqual(priceErrors, [], 'unverified or contradicted prices');
  assert.deepStrictEqual(selfContra, [], 'same page prices one app two ways');
  assert.deepStrictEqual(crossPage, [], 'two pages price one app two ways');
});

// Scoped to apps actually quoted on a page, which is what the guard governs.
// The other records still carrying an unsourced monthlyCost are the runbook §7A
// backlog: harmless while unquoted, and blocked from any page by the guard.
test('every app quoted on a page has a verified, sourced price', () => {
  const { byName } = loadApps();
  const quoted = new Set(extractPriceClaims(byName).map((c) => c.app));
  const bad = [...quoted]
    .map((n) => byName.get(n))
    .filter((a) => claimShape(a.monthlyCost).amounts.length &&
      (!a.priceVerifiedDate || !a.priceSourceUrl));
  assert.deepStrictEqual(bad.map((a) => a.id), [],
    'a quoted app needs both priceVerifiedDate and priceSourceUrl');
});


// ---- answer block guard -----------------------------------------------------
// Locks in three properties of <p id="answer">: it exists, it is 40–60 words,
// and it renders AFTER the H1. The third is the regression that shipped on all
// 21 blog posts — the layout emitted the answer above <slot />, and the H1 came
// from the markdown body, so the quotable unit preceded the heading it answered.

const H1 = '<h1>How to Fix Shopify Tracking</h1>';
const words = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

test('answerWordCount ignores markup and entities', () => {
  assert.strictEqual(answerWordCount('<strong>two</strong> words'), 2);
  assert.strictEqual(answerWordCount('a &mdash; b'), 2);
  assert.strictEqual(answerWordCount('  spaced   out  '), 2);
});

test('checkAnswerBlock reports a missing answer block', () => {
  const r = checkAnswerBlock(`<main>${H1}<p>No answer here.</p></main>`);
  assert.strictEqual(r.present, false);
  assert.strictEqual(r.afterH1, false);
});

test('checkAnswerBlock accepts an answer of 40-60 words placed after the h1', () => {
  const r = checkAnswerBlock(`<main>${H1}<p id="answer">${words(50)}</p></main>`);
  assert.strictEqual(r.present, true);
  assert.strictEqual(r.words, 50);
  assert.strictEqual(r.afterH1, true);
});

test('checkAnswerBlock counts both sides of the 40-60 word band', () => {
  const at40 = checkAnswerBlock(`${H1}<p id="answer">${words(40)}</p>`);
  const at60 = checkAnswerBlock(`${H1}<p id="answer">${words(60)}</p>`);
  const at39 = checkAnswerBlock(`${H1}<p id="answer">${words(39)}</p>`);
  const at61 = checkAnswerBlock(`${H1}<p id="answer">${words(61)}</p>`);
  assert.strictEqual(at40.words, 40);
  assert.strictEqual(at60.words, 60);
  assert.strictEqual(at39.words, 39);
  assert.strictEqual(at61.words, 61);
});

test('checkAnswerBlock flags an answer that precedes the h1', () => {
  const r = checkAnswerBlock(`<main><p id="answer">${words(50)}</p>${H1}</main>`);
  assert.strictEqual(r.present, true);
  assert.strictEqual(r.afterH1, false, 'answer before the h1 must not pass');
});

test('checkAnswerBlock ignores an #answer that only appears inside a script', () => {
  const r = checkAnswerBlock(`${H1}<script>var x = '<p id="answer">nope</p>';</script>`);
  assert.strictEqual(r.present, false);
});

test('ANSWER_EXEMPT covers exactly the legal pages', () => {
  const exempt = (p) => ANSWER_EXEMPT.some((r) => r.test(p));
  assert.ok(exempt('/terms/'));
  assert.ok(exempt('/privacy/'));
  assert.ok(exempt('/refund-policy/'));
  assert.ok(!exempt('/gorgias-shopify-guide/'));
  assert.ok(!exempt('/blog/tidio-vs-gorgias-shopify/'));
});

// End-to-end over the real build, mirroring the audit's own exemptions.
const AUDIT_NOINDEX_OK = [
  /^\/404(\.html)?\/?$/, /^\/sitemap-page\/$/, /^\/embed\//, /^\/apps\/[^/]+\/$/,
  /^\/privacy\/$/, /^\/terms\/$/, /^\/refund-policy\/$/,
  /^\/pro\/[^/]+\/success\/$/,
];

test('every indexable content page has a 40-60 word answer after its h1', (t) => {
  if (!fs.existsSync('dist')) return t.skip('dist/ not built');
  const failures = [];
  let guarded = 0;
  for (const f of walk('dist').filter((f) => f.endsWith('.html'))) {
    const page = f.slice('dist'.length).replace(/index\.html$/, '') || '/';
    if (AUDIT_NOINDEX_OK.some((r) => r.test(page)) || page === '/404.html/') continue;
    if (ANSWER_EXEMPT.some((r) => r.test(page))) continue;
    guarded++;
    const a = checkAnswerBlock(fs.readFileSync(f, 'utf8'));
    if (!a.present) failures.push(`${page} — no #answer`);
    else if (a.words < 40 || a.words > 60) failures.push(`${page} — ${a.words} words`);
    else if (!a.afterH1) failures.push(`${page} — #answer before h1`);
  }
  assert.ok(guarded > 50, `expected to guard the content pages, guarded ${guarded}`);
  assert.deepStrictEqual(failures, []);
});
