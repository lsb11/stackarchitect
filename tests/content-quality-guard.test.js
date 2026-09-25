// tests/content-quality-guard.test.js — each rule of scripts/content-quality-guard.mjs
// against a page built to break it, then the real dist/ when a build exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { analysePage, check, parseRedirects, loadDist, updatedClaims, anchorWarnings, internalPath } from '../scripts/content-quality-guard.mjs';

const page = ({ main = '', head = '', outside = '' } = {}) =>
  `<!doctype html><html><head>${head}</head><body><nav class="sa-nav"><a class="sa-nav-cta" href="/pro/">Kit</a></nav>` +
  `<main>${main}</main>${outside}<footer class="sa-footer"><a href="/go/make/">Make</a></footer></body></html>`;
const dated = (d = '2026-09-01') =>
  `<p data-page-updated>Updated <time datetime="${d}">${Number(d.slice(8))} September 2026</time></p>`;
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const good = (extra = '', d = '2026-09-01') =>
  page({ head: ld({ '@type': 'WebPage', dateModified: d }), main: dated(d) + extra });

function run(pages, { sitemap = Object.keys(pages), redirects = '' } = {}) {
  const analysed = Object.fromEntries(Object.entries(pages).map(([p, h]) => [p, analysePage(h)]));
  // /pro/ is built: the nav in page() links to it.
  return check({ pages: analysed, sitemapPaths: sitemap, redirects: parseRedirects(redirects), builtPaths: new Set([...Object.keys(pages), '/pro/']) });
}
const rules = (f) => [...new Set(f.map((x) => x.rule))].sort();

test('a clean page passes', () => {
  assert.deepEqual(run({ '/a/': good() }), []);
});

test('a comment that mentions <main> is not a second main element', () => {
  assert.deepEqual(run({ '/a/': good('<!-- Byline inside <main>: moved from after </main> -->') }), []);
});

test('two main elements fail', () => {
  const html = good().replace('</body>', '<main>again</main></body>');
  assert.deepEqual(rules(run({ '/a/': html })), ['single-main']);
});

test('more than one affiliate button fails; nav and footer do not count', () => {
  const two = '<a class="btn" href="/go/make/">A</a><a class="btn" href="/go/systeme/">B</a>';
  assert.deepEqual(rules(run({ '/a/': good(two) })), ['caps']);
  assert.deepEqual(run({ '/a/': good('<a class="btn" href="/go/make/">A</a>') }), []);
});

test('a sticky affiliate bar counts as the one affiliate block, wherever it sits', () => {
  const sticky = '<div class="sa-sticky"><a class="sa-sticky-btn" href="/go/make/">Go</a></div>';
  assert.deepEqual(run({ '/a/': good() .replace('</main>', `</main>${sticky}`) }), []);
  const plus = good('<a class="btn" href="/go/make/">A</a>').replace('</main>', `</main>${sticky}`);
  assert.deepEqual(rules(run({ '/a/': plus })), ['caps']);
});

test('four inline affiliate links fail, three pass', () => {
  const links = (n) => Array.from({ length: n }, (_, i) => `<p>Use <a href="/go/t${i}/">Tool</a>.</p>`).join('');
  assert.deepEqual(run({ '/a/': good(links(3)) }), []);
  assert.deepEqual(rules(run({ '/a/': good(links(4)) })), ['caps']);
});

test('two kit mentions fail, including a Stripe checkout link; /pro/ pages are exempt', () => {
  const kit = '<a href="/pro/">Kit</a><a href="https://buy.stripe.com/x">Buy</a>';
  assert.deepEqual(rules(run({ '/a/': good(kit) })), ['caps']);
  assert.deepEqual(run({ '/pro/': good(kit) }), []);
});

test('homepage: at most 8 buttons and 5 affiliate links in total', () => {
  const btns = Array.from({ length: 9 }, (_, i) => `<a class="btn" href="#x${i}">x</a>`).join('');
  assert.deepEqual(rules(run({ '/': good(btns) })), ['caps']);
});

test('a sitemap page without a visible Updated date fails', () => {
  const html = page({ head: ld({ '@type': 'WebPage', dateModified: '2026-09-01' }), main: '<p>Hi</p>' });
  assert.deepEqual(rules(run({ '/a/': html })), ['updated-date']);
});

test('JSON-LD dateModified must equal the visible date', () => {
  const html = page({ head: ld({ '@type': 'Article', dateModified: '2026-08-01' }), main: dated('2026-09-01') });
  assert.deepEqual(rules(run({ '/a/': html })), ['updated-date']);
});

test('a second, stale "Updated" line on the page fails', () => {
  assert.deepEqual(rules(run({ '/a/': good('<p>Updated April 2026</p>') })), ['updated-date']);
  assert.deepEqual(updatedClaims('Last updated: 24 July 2026 and Updated 2026-08-01'), ['24 July 2026', '2026-08-01']);
});

test('an FAQ question on two sitemap pages fails', () => {
  const faq = { '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Is it free?' }] };
  const withFaq = page({ head: ld({ '@type': 'WebPage', dateModified: '2026-09-01' }) + ld(faq), main: dated() + '<p>Is it free?</p>' });
  assert.deepEqual(rules(run({ '/a/': withFaq, '/b/': withFaq })), ['faq']);
  assert.deepEqual(run({ '/a/': withFaq, '/b/': good() }), []);
});

test('an FAQPage question that is not visible fails', () => {
  const faq = { '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Hidden question?' }] };
  const html = page({ head: ld({ '@type': 'WebPage', dateModified: '2026-09-01' }) + ld(faq), main: dated() });
  assert.deepEqual(rules(run({ '/a/': html })), ['faq']);
});

test('a sitemap URL that is noindex or a redirect source fails', () => {
  const noindex = good().replace('<head>', '<head><meta name="robots" content="noindex, follow">');
  assert.deepEqual(rules(run({ '/a/': noindex })), ['sitemap']);
  assert.deepEqual(rules(run({ '/a/': good(), '/b/': good() }, { redirects: '/a/ /b/ 301' })), ['sitemap']);
});

test('a redirect whose target is itself a redirect source fails', () => {
  const f = run({ '/c/': good() }, { sitemap: ['/c/'], redirects: '/a/ /b/ 301\n/b/ /c/ 301' });
  assert.deepEqual(rules(f), ['redirect-chain']);
  assert.deepEqual(run({ '/c/': good() }, { sitemap: ['/c/'], redirects: '/a/ /c/ 301\n/b/ /c/ 301' }), []);
});

test('internal links must be direct: trailing slash, not a redirect, built, not noindex', () => {
  const noindex = page({ head: '<meta name="robots" content="noindex, follow">' + ld({ '@type': 'WebPage', dateModified: '2026-09-01' }), main: dated() });
  const pages = (href) => ({ '/a/': good(`<p><a href="${href}">B</a></p>`), '/b/': good(), '/apps/x/': noindex, '/privacy/': noindex });
  const sitemap = ['/a/', '/b/'];
  assert.deepEqual(run(pages('/b/'), { sitemap }), []);
  assert.deepEqual(run(pages('https://stackarchitect.xyz/b/#top'), { sitemap }), []);
  assert.deepEqual(rules(run(pages('/b'), { sitemap })), ['internal-link']);
  assert.deepEqual(rules(run(pages('/old/'), { sitemap, redirects: '/old/ /b/ 301' })), ['internal-link']);
  assert.deepEqual(rules(run(pages('/missing/'), { sitemap })), ['internal-link']);
  assert.deepEqual(rules(run(pages('/apps/x/'), { sitemap })), ['internal-link']);
  // legal pages, /go/ cloaks and files are not checked as pages
  assert.deepEqual(run(pages('/privacy/'), { sitemap }), []);
  assert.deepEqual(run(pages('/go/make/'), { sitemap }), []);
  assert.equal(internalPath('/downloads/x.csv'), null);
});

test('/pro/ may link to its own noindex product pages; other pages may not', () => {
  const noindex = page({ head: '<meta name="robots" content="noindex, follow">' + ld({ '@type': 'WebPage', dateModified: '2026-09-01' }), main: dated() });
  const link = good('<p><a href="/pro/capi-shield/">CAPI Shield</a></p>');
  assert.deepEqual(run({ '/pro/': link, '/pro/capi-shield/': noindex }, { sitemap: ['/pro/'] }), []);
  assert.deepEqual(rules(run({ '/a/': link, '/pro/capi-shield/': noindex }, { sitemap: ['/a/'] })), ['internal-link']);
});

test('an em dash in visible page text fails; nav, footer and scripts do not count', () => {
  assert.deepEqual(rules(run({ '/a/': good('<p>One \u2014 two</p>') })), ['em-dash']);
  assert.deepEqual(run({ '/a/': good('<script>const s = "a \u2014 b";</script>') }), []);
  const chrome = good().replace('>Kit<', '>Kit \u2014 now<');
  assert.deepEqual(run({ '/a/': chrome }), []);
});

test('an anchor that shares no word with its target is a warning, not a failure', () => {
  const pages = {
    '/a/': analysePage(good('<p><a href="/b/">The $0 automation stack</a></p>')),
    '/b/': analysePage(good().replace('<head>', '<head><title>Replace Klaviyo Free</title>')),
  };
  assert.equal(anchorWarnings({ pages, sitemapPaths: ['/a/', '/b/'] }).length, 1);
  assert.deepEqual(run({ '/a/': good('<p><a href="/b/">The $0 automation stack</a></p>'), '/b/': good() }), []);
});

test('the built site passes', { skip: !existsSync('dist/sitemap-0.xml') && 'run `npm run build` first' }, () => {
  const failures = check(loadDist());
  assert.deepEqual(failures.map((f) => `${f.rule} ${f.path}: ${f.msg}`), []);
});
