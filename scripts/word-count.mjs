#!/usr/bin/env node
// scripts/word-count.mjs — the CLAUDE.md word-count method, made executable.
//
// CLAUDE.md quotes a per-page word count and a floor, and says "a different
// extraction gives a different number, so state the method before disputing a
// figure". Prose is a poor place to keep a method. This file is the method:
//
//   words inside <main>, with <script>, <style> and HTML comments stripped,
//   tags and entities removed, counting only tokens containing a letter or
//   digit — over every URL in dist/sitemap-0.xml.
//
// A page with no <main> is not measurable by this method and is reported as
// such rather than silently scored zero or skipped. That distinction matters:
// until the <main> wrap, the four /pro/<slug>/ pages had no <main> at all, so
// the "no indexable page is under 800 words" line was measured over a set that
// could not include them — and all four are under 800.
//
// Reads dist/, so run `npm run build` first. Reports only; never fails a build.
import { readFileSync } from 'node:fs';

const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

function countWords(html) {
  const open = html.indexOf('<main');
  const close = html.lastIndexOf('</main>');
  if (open === -1 || close === -1 || close < open) return null;
  const text = html
    .slice(html.indexOf('>', open) + 1, close)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ');
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

const rows = urls.map((url) => {
  const { pathname } = new URL(url);
  const file = 'dist' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname);
  let html;
  try {
    html = readFileSync(file, 'utf8');
  } catch {
    return { path: pathname, words: null, reason: 'no built file' };
  }
  const words = countWords(html);
  return { path: pathname, words, reason: words === null ? 'no <main>' : null };
});

rows.sort((a, b) => (a.words ?? -1) - (b.words ?? -1));
for (const r of rows) {
  console.log(String(r.words ?? r.reason).padStart(11), ' ', r.path);
}

const measured = rows.filter((r) => r.words !== null).map((r) => r.words);
const unmeasurable = rows.length - measured.length;
console.log('—'.repeat(60));
console.log(
  `${rows.length} sitemap URLs · ${measured.length} measured` +
    (unmeasurable ? ` · ${unmeasurable} unmeasurable (no <main>)` : '') +
    `\nfloor ${Math.min(...measured)} · under 800: ${measured.filter((n) => n < 800).length}` +
    ` · over 1,500: ${measured.filter((n) => n > 1500).length}` +
    ` · over 3,000: ${measured.filter((n) => n > 3000).length}`,
);
