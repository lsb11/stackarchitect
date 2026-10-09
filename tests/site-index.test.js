// tests/site-index.test.js — every indexable page is one click from the
// homepage, the one page Google is known to have indexed. Why: src/data/siteIndex.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const SRC = fs.readFileSync('src/data/siteIndex.ts', 'utf8');
const listed = [...SRC.matchAll(/href: '([^']+)'/g)].map((m) => m[1]);
const built = fs.existsSync('dist/sitemap-0.xml');
const sitemap = built
  ? [...fs.readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>https:\/\/stackarchitect\.xyz([^<]+)<\/loc>/g)].map((m) => m[1])
  : [];
const linksIn = (file) => {
  const html = fs.readFileSync(file, 'utf8');
  const main = (html.match(/<main[\s\S]*?<\/main>/) || [''])[0];
  return new Set([...main.matchAll(/href="(?:https:\/\/stackarchitect\.xyz)?(\/[^"#?]*)/g)].map((m) => m[1]));
};

test('the site index lists each page once', () => {
  assert.equal(new Set(listed).size, listed.length);
});

test('the site index and the built sitemap hold the same pages', { skip: built ? false : 'run npm run build first' }, () => {
  assert.deepEqual([...listed].sort(), [...sitemap].sort());
});

test('every sitemap page is linked from the homepage <main>', { skip: built ? false : 'run npm run build first' }, () => {
  const home = linksIn('dist/index.html');
  assert.deepEqual(sitemap.filter((p) => p !== '/' && !home.has(p)), []);
});

test('the HTML sitemap links every sitemap page and claims no index count', { skip: built ? false : 'run npm run build first' }, () => {
  const links = linksIn('dist/sitemap-page/index.html');
  assert.deepEqual(sitemap.filter((p) => !links.has(p)), []);
  assert.doesNotMatch(fs.readFileSync('dist/sitemap-page/index.html', 'utf8'), /pages indexed/i);
});
