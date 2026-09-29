#!/usr/bin/env node
/**
 * Fails the build when a built page has an <img> with no alt attribute.
 *
 * WHY THIS EXISTS
 * On 29 Sep 2026 Bing's site scan reported one page with a missing image alt.
 * A scan of dist/ found 118 <img> tags, every one with an alt attribute. The
 * only one without a written alt was the StockLog icon on /stocklog/, which is
 * decorative and was written alt="" in source, but Astro's <Image> emitted it
 * as a bare `alt`. That icon now renders alt="" literally. Nothing checked
 * alt text before this guard, so the next <img> written without one would
 * have shipped silently.
 *
 * WHAT IT CHECKS
 * Runs over dist/ after the build. Every <img> outside comments, <script> and
 * <style> must carry an alt attribute. An empty alt passes, written either as
 * alt="" or as a bare `alt`: both mean "decorative" in HTML, and a decorative
 * image should be skipped by a screen reader.
 *
 * WHAT IT DOES NOT CHECK
 * - Whether a written alt is any good, or whether an empty one is really
 *   decorative. That is a judgement; this is a presence check.
 * - Images a script creates at runtime, and <img> markup inside a <script>
 *   string. Neither is in the built HTML as an element.
 *
 * Wired into `npm run build`; tests/img-alt-guard.test.js tests the parser on
 * fixtures.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** True when the tag has an alt attribute, with or without a value. */
export function hasAlt(imgTag) {
  return /\salt(?=[\s=/>])/i.test(imgTag);
}

/** Every <img> tag in the page that has no alt attribute. */
export function imgsWithoutAlt(html) {
  const body = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, ' ');
  return [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]).filter((t) => !hasAlt(t));
}

function htmlFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

export function findMissingAlt(dist = path.join(ROOT, 'dist')) {
  const failures = [];
  let images = 0;
  for (const f of htmlFiles(dist)) {
    const html = fs.readFileSync(f, 'utf8');
    images += (html.match(/<img\b/gi) || []).length;
    const rel = path.relative(dist, f).split(path.sep).join('/');
    for (const tag of imgsWithoutAlt(html)) {
      failures.push({ page: '/' + rel.replace(/index\.html$/, ''), tag });
    }
  }
  return { images, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(dist)) {
    console.error('[img-alt-guard] dist/ is missing: run astro build first');
    process.exit(1);
  }
  const { images, failures } = findMissingAlt(dist);
  if (failures.length) {
    console.error(`[img-alt-guard] ${failures.length} <img> tag(s) with no alt attribute:`);
    for (const f of failures) console.error(`  ${f.page}  ${f.tag.slice(0, 160)}`);
    console.error('Write an alt that says what the image shows, or alt="" if it is purely decorative.');
    process.exit(1);
  }
  console.log(`[img-alt-guard] ok: ${images} <img> tag(s), every one with an alt attribute`);
}
