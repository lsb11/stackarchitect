// Holds src/data/keyFacts.ts to its rules, and checks every listed route
// actually renders its facts (after a build).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const src = readFileSync('src/data/keyFacts.ts', 'utf8');
const built = existsSync('dist/sitemap-0.xml');

// keyFacts.ts is TypeScript; pull the data out without a TS loader.
const sources = {};
for (const m of src.matchAll(/(\w+): \{\s*title: '([^']+)',\s*publisher: '([^']+)',\s*url: '([^']+)',\s*read: '([^']+)',/g)) {
  sources[m[1]] = { title: m[2], publisher: m[3], url: m[4], read: m[5] };
}
const facts = [...src.matchAll(/id: '([^']+)',\s*text: '([^']+)',\s*source: '([^']+)'/g)].map((m) => ({ id: m[1], text: m[2], source: m[3] }));

test('key facts parse', () => {
  assert.ok(Object.keys(sources).length >= 5, 'sources not found');
  assert.ok(facts.length >= 10, 'facts not found');
});

test('every source is the vendor’s page, read on a real past date', () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const [id, s] of Object.entries(sources)) {
    assert.match(s.url, /^https:\/\//, id);
    assert.doesNotMatch(s.url, /stackarchitect\.xyz/, `${id} cites this site`);
    assert.match(s.read, /^\d{4}-\d{2}-\d{2}$/, id);
    assert.ok(s.read <= today, `${id} read date is in the future`);
  }
});

test('every fact is one standalone sentence with a known source', () => {
  const ids = new Set();
  for (const f of facts) {
    assert.ok(!ids.has(f.id), `duplicate id ${f.id}`);
    ids.add(f.id);
    assert.ok(sources[f.source], `${f.id}: unknown source ${f.source}`);
    assert.match(f.text, /\.$/, `${f.id} must end with a full stop`);
    assert.doesNotMatch(f.text, /\b(this page|above|below|we recommend)\b/i, `${f.id} depends on context`);
    assert.doesNotMatch(f.text, /—/, `${f.id} has an em dash`);
  }
});

test('every route with facts renders them', { skip: built ? false : 'run npm run build first' }, () => {
  const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
  const routeBlocks = [...src.matchAll(/'(\/[a-z0-9\-\/]*\/)'/g)].map((m) => m[1]);
  for (const r of new Set(routeBlocks)) {
    assert.ok(sitemap.includes(`https://stackarchitect.xyz${r}</loc>`), `${r} is not a sitemap page`);
    const html = readFileSync(`dist${r}index.html`, 'utf8');
    assert.ok(html.includes('id="sa-keyfacts-h"'), `${r} lists facts but does not render <KeyFacts />`);
    const main = html.match(/<main[\s\S]*<\/main>/);
    if (main) assert.ok(main[0].includes('sa-keyfacts-h'), `${r} renders key facts outside <main>`);
  }
});
