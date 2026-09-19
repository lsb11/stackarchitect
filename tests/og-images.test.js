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
