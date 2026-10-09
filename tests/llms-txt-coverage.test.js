// tests/llms-txt-coverage.test.js — every indexable URL is discoverable in
// public/llms.txt.
//
// WHY
// llms.txt is the discovery manifest for AI assistants, which fetch and cite
// pages regardless of whether Google has indexed them. On this domain that is
// not a secondary channel: as of 9 Oct 2026 Google has one page indexed, so
// llms.txt is the main machine-readable route into the site.
//
// It is hand-maintained and it drifted. On 9 Oct 2026 it listed 31 of the 51
// sitemap URLs. The 20 missing were not stubs — they included the AI playbook,
// the inventory guide, the abandoned-cart guide and the agentic-storefronts
// guide. Nothing failed, because nothing read the file.
//
// The sitemap is the source of truth: astro.config.mjs already decides what is
// indexable (its filter() drops /apps/*, /embed/* and the legal pages), so this
// test inherits that decision rather than keeping a second list in step with it.
//
// Anything deliberately left out goes in EXCLUDED with a reason. The list may
// only shrink; an entry that no longer needs to be there fails, the same
// ratchet claims-guard and the OG manifest use.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// Deliberate omissions, each with the reason it is not in llms.txt.
const EXCLUDED = new Map([
  // (empty — every sitemap URL is currently listed)
]);

const SITEMAP = 'dist/sitemap-0.xml';

function sitemapPaths() {
  const xml = read(SITEMAP);
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

// Paths llms.txt references. Trailing punctuation is stripped because the file
// is prose as well as a list: a URL can end a sentence or sit inside a clause
// ("goes to https://stackarchitect.xyz/stack/, which lists these seven").
function listedPaths() {
  const txt = read('public/llms.txt');
  const out = new Set();
  for (const m of txt.matchAll(/stackarchitect\.xyz(\/[^)\s\],]*)/g)) {
    let p = m[1].replace(/[.,;:]+$/, '');
    p = p.split('#')[0];
    if (!p.endsWith('/')) p += '/';
    out.add(p);
  }
  return out;
}

const built = fs.existsSync(path.join(ROOT, SITEMAP));

test('every sitemap URL is listed in llms.txt', { skip: built ? false : 'run npm run build first' }, () => {
  const listed = listedPaths();
  const missing = sitemapPaths().filter((p) => !listed.has(p) && !EXCLUDED.has(p));
  assert.deepEqual(
    missing, [],
    `these indexable pages are invisible to AI assistants reading llms.txt:\n${missing.join('\n')}\n` +
    'Add an entry under the right heading, or add the path to EXCLUDED with a reason.',
  );
});

test('every EXCLUDED entry is still a real sitemap URL', { skip: built ? false : 'run npm run build first' }, () => {
  const paths = new Set(sitemapPaths());
  const stale = [...EXCLUDED.keys()].filter((p) => !paths.has(p));
  assert.deepEqual(stale, [], `EXCLUDED names paths that are no longer in the sitemap: ${stale.join(', ')}`);
});

test('llms.txt does not point at a route that is noindex', { skip: built ? false : 'run npm run build first' }, () => {
  const noindex = JSON.parse(read('src/data/noindex-routes.json')).routes;
  const listed = listedPaths();
  // /pro/<slug>/ pages are noindex for search but are legitimate citations for
  // an assistant answering "what does this cost", so they are allowed here.
  // The check exists for routes with no such justification.
  const unexpected = noindex.filter((r) => listed.has(r) && !r.startsWith('/pro/'));
  assert.deepEqual(unexpected, [], `llms.txt sends assistants to noindex routes: ${unexpected.join(', ')}`);
});
