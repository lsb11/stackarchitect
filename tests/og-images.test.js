/**
 * Images carry claims that no text check can read (19 Sep 2026).
 *
 * og-complete-kit.png said "$29 one-time" for three weeks after the kit went
 * to $24 and then $19.99, and og-capi-shield.png said "Meta & Google" after
 * every page had stopped claiming Google. Both were bitmaps from a generator
 * that was never committed, so nothing could re-render them and no grep could
 * see them. scripts/og/og-images.json now records the text of every raster
 * image; this file holds that record to the constants and to the files.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { retiredNearAnchor } from '../scripts/lib/retired-near-anchor.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p));
const manifest = JSON.parse(read('scripts/og/og-images.json'));
const images = manifest.images;
const products = read('src/data/products.ts').toString();
const claims = JSON.parse(read('src/data/claims.json'));

const RASTER = /\.(png|jpe?g|webp|gif|avif)$/i;
function rasters(dir) {
  const out = [];
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) out.push(...rasters(rel));
    else if (RASTER.test(e.name)) out.push(rel);
  }
  return out;
}

function constant(name) {
  const m = products.match(new RegExp(`export const ${name}\\s*=\\s*([0-9.]+)\\s*;`));
  assert.ok(m, `${name} not found in src/data/products.ts`);
  return Number(m[1]);
}

// mirrors formatPrice() in src/data/products.ts
const formatPrice = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

test('every raster image under public/ and src/assets/ has an entry', () => {
  const missing = [...rasters('public'), ...rasters('src/assets')].filter((p) => !images[p]);
  assert.deepEqual(missing, [], `add these to scripts/og/og-images.json with the text they carry:\n${missing.join('\n')}`);
});

test('every entry points at a file that exists', () => {
  const gone = Object.keys(images).filter((p) => !fs.existsSync(path.join(ROOT, p)));
  assert.deepEqual(gone, []);
});

test('every entry is either generated or dated by the person who read it', () => {
  for (const [p, e] of Object.entries(images)) {
    assert.ok(Array.isArray(e.text), `${p}: text must be a list`);
    assert.ok(e.generator || /^\d{4}-\d{2}-\d{2}$/.test(e.transcribed ?? ''), `${p}: needs "generator" or a "transcribed" date`);
  }
});

test('a generated image is the file its generator wrote', () => {
  for (const [p, e] of Object.entries(images)) {
    if (!e.generator) continue;
    const sha = crypto.createHash('sha256').update(read(p)).digest('hex');
    assert.equal(sha, e.sha256, `${p} changed since ${e.generator} wrote it; re-run the generator, do not edit the PNG`);
  }
});

test('an image that depicts a constant shows its current value', () => {
  for (const [p, e] of Object.entries(images)) {
    for (const [name, drawn] of Object.entries(e.depicts ?? {})) {
      const now = constant(name);
      assert.equal(drawn, now, `${p} shows ${name} = ${drawn} but products.ts says ${now}; re-run ${e.generator}`);
      assert.ok(e.text.some((t) => t.includes(formatPrice(now))), `${p}: ${formatPrice(now)} is not in its recorded text`);
    }
  }
});

test('no image states a retired kit price beside the kit', () => {
  const kit = claims.ours.kitPrice;
  const spec = { retired: kit.retired, ...kit.near };
  for (const [p, e] of Object.entries(images)) {
    const hits = retiredNearAnchor(e.text.join('\n'), spec);
    assert.deepEqual(hits, [], `${p} states a retired kit price`);
  }
});

test('no image repeats a tracking claim the site has withdrawn', () => {
  const withdrawn = [/no gclid needed/i, /CAPI Shield[\s\S]*Meta\s*(?:\+|&|and)\s*Google/i];
  for (const [p, e] of Object.entries(images)) {
    const text = e.text.join('\n');
    for (const re of withdrawn) assert.doesNotMatch(text, re, p);
  }
});

test('the rule catches the kit card as it shipped until 19 Sep 2026', () => {
  const kit = claims.ours.kitPrice;
  const shipped = ['THE COMPLETE KIT', 'Every scenario pre-built.', 'Live in 10 minutes.', '$29 one-time'].join('\n');
  assert.equal(retiredNearAnchor(shipped, { retired: kit.retired, ...kit.near }).length, 1);
});

/**
 * The retracted 20-40% figure, applied to image text.
 *
 * claims-guard.mjs already fails the build on a quantified conversion-loss or
 * recovery percentage, but its walker reads source files and a PNG is not one.
 * og-tiktok-events-api.png carried "Recover 20-40% of lost TikTok conversions"
 * from 14 Jul until 3 Oct 2026 — logged as a `concern` in the manifest on
 * 19 Sep and shipped on every social share for another two weeks, because the
 * concern was a note and nothing failed on it.
 *
 * The patterns are NOT restated here. They are read from the same claims.json
 * entry claims-guard uses, so a change to the claim reaches images on the next
 * run instead of drifting from them — which is the failure this whole file
 * exists to catch.
 *
 * Both readings of a card's text are checked, because a card is not prose.
 *
 *  - joined by "\n": matches claims-guard exactly, `unless` scoped to the line
 *    the match sits on.
 *  - joined by " ": the card as a reader sees it. The patterns step over
 *    `[^\n<]`, so they stop at a line break wherever a run of literal
 *    whitespace does not bridge it — and a card wraps where a sentence would
 *    not. On the TikTok card as it shipped, the line-by-line reading trips one
 *    rule and the flattened reading trips three. Here `unless` is tested
 *    against the whole string, since a flattened card has no lines to scope to.
 *
 * Checked against the full manifest when this was written: the flattened pass
 * adds no hits of its own today, so it is a floor, not a new constraint.
 */
function forbiddenIn(text, rules) {
  const lines = text.split('\n');
  const flat = lines.join(' ');
  const hits = new Set();
  for (const f of rules) {
    const excepts = (f.unless || []).map((u) => new RegExp(u, 'i'));
    const note = (m) => hits.add(m[0].replace(/\s+/g, ' ').trim().slice(0, 60));

    for (const m of text.matchAll(new RegExp(f.pattern, 'gi'))) {
      const line = lines[text.slice(0, m.index).split('\n').length - 1] || '';
      if (!excepts.some((u) => u.test(line))) note(m);
    }
    if (excepts.some((u) => u.test(flat))) continue;
    for (const m of flat.matchAll(new RegExp(f.pattern, 'gi'))) note(m);
  }
  return [...hits];
}

test('no image states a conversion-loss percentage the site retracted', () => {
  const rules = claims.thirdParty.attributionLossFigure.forbid;
  for (const [p, e] of Object.entries(images)) {
    assert.deepEqual(
      forbiddenIn(e.text.join('\n'), rules), [],
      `${p} states a loss/recovery percentage retracted on 4 Sep 2026. ` +
      'An image is fixed by its generator, never by editing the manifest.',
    );
  }
});

test('the rule catches the TikTok card as it shipped until 3 Oct 2026', () => {
  const rules = claims.thirdParty.attributionLossFigure.forbid;
  const shipped = [
    'TIKTOK EVENTS API FOR SHOPIFY',
    'Recover 20–40% of lost',
    'TikTok conversions — free',
  ].join('\n');
  assert.ok(forbiddenIn(shipped, rules).length > 0, 'the rule no longer catches the card it was written for');
});

// Pins the flattened pass, which otherwise could be deleted with this file
// still green. On the card as it actually shipped, reading it line by line
// trips one rule; reading it as a sentence trips three. The single rule is
// the whole margin, and it is not one this file controls — narrowing it in
// claims.json would silently stop catching this card.
test('flattening a card widens which rules see a wrapped claim', () => {
  const rules = claims.thirdParty.attributionLossFigure.forbid;
  const shipped = [
    'TIKTOK EVENTS API FOR SHOPIFY',
    'Recover 20–40% of lost',
    'TikTok conversions — free',
  ].join('\n');
  const firing = (t) => rules.filter((f) => new RegExp(f.pattern, 'gi').test(t)).length;
  assert.equal(firing(shipped), 1, 'line-scoped reading of the shipped card');
  assert.equal(firing(shipped.split('\n').join(' ')), 3, 'flattened reading of the same card');
});
