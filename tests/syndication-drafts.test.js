// tests/syndication-drafts.test.js — the posts that go out on someone else's
// domain carry no affiliate link, and point home.
//
// WHY
// Root-level dev_to_*.md are syndication drafts: full guides published on a
// third-party platform with canonical_url pointing back here. They are not
// served by this site, so almost nothing that protects a page protects them.
//
// Specifically, rehypeSponsorAffiliateLinks (astro.config.mjs) stamps
// rel="sponsored noopener" on every /go/* link in Markdown, and
// affiliate-disclosure-guard fails a build when a page carries an affiliate
// link without disclosing it first. BOTH run on this site's pipeline only.
// Paste the same Markdown into dev.to and the links ship bare: no rel, no
// disclosure, on a platform with its own affiliate rules.
//
// On 9 Oct 2026 the two drafts carried eight /go/make cloaks between them and
// one had no disclosure anywhere in 8,026 words.
//
// The rule is the simple one rather than "disclose properly off-site": a
// syndicated post carries no affiliate link at all. It costs nothing, since
// the reader reaches the vendor through the site page one click later, and
// that click is a visit to this domain instead of an exit to the vendor's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const drafts = fs.readdirSync(ROOT).filter((f) => /^dev_to_.*\.md$/.test(f));
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const SITEMAP = path.join(ROOT, 'dist/sitemap-0.xml');
const built = fs.existsSync(SITEMAP);
const sitemap = built
  ? new Set([...fs.readFileSync(SITEMAP, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname))
  : new Set();
const redirectSources = new Set(
  read('public/_redirects').split('\n')
    .map((l) => l.trim().split(/\s+/)[0])
    .filter((s) => s && s.startsWith('/') && !s.startsWith('/go/')),
);

test('there is at least one syndication draft to check', () => {
  assert.ok(drafts.length > 0, 'expected root-level dev_to_*.md drafts');
});

for (const f of drafts) {
  test(`${f} carries no affiliate cloak`, () => {
    const hits = [...read(f).matchAll(/\[([^\]]*)\]\((https?:\/\/[^)]*\/go\/[^)]*)\)/g)]
      .map((m) => `${m[1]} -> ${m[2]}`);
    assert.deepEqual(
      hits, [],
      `${f} is published on a third-party platform, where neither ` +
      'rehypeSponsorAffiliateLinks nor affiliate-disclosure-guard runs. ' +
      'Link to the page on this site that covers the tool instead.',
    );
  });

  test(`${f} declares a canonical_url back to this site`, () => {
    const m = read(f).match(/^canonical_url:\s*(\S+)/m);
    assert.ok(m, `${f} has no canonical_url in its front matter`);
    assert.match(m[1], /^https:\/\/stackarchitect\.xyz\//, `${f} canonical_url does not point here`);
  });

  // The canonical must name a page that is live NOW, not one that redirects.
  //
  // Found 9 Oct 2026 on Hashnode, where three posts are among this site's
  // strongest controlled links (hashnode.dev, DR 83, dofollow). Every one
  // declared a canonical that the 24 Sep consolidation had since retired:
  //   /blog/how-to-fix-shopify-google-ads-conversion-tracking-2026/
  //   /blog/how-to-fix-service-invoked-too-many-times-in-google-apps-script/
  //   /stocky-shutdown/
  // Each 301s in one hop, so nothing broke. But a canonical is a statement
  // about which URL is the original, and naming a redirect source makes it
  // the weakest version of that statement on the links that most needed it.
  //
  // A draft cannot be published with that defect. A post that is already
  // live has to be fixed on its platform by hand, which is how Hashnode got
  // this way: nothing re-checks a canonical once it has left the repo.
  test(`${f} canonical_url is a live sitemap URL, not a redirect source`,
    { skip: built ? false : 'run npm run build first' }, () => {
      const m = read(f).match(/^canonical_url:\s*(\S+)/m);
      assert.ok(m, `${f} has no canonical_url`);
      const p = new URL(m[1]).pathname;
      assert.ok(redirectSources.has(p) === false,
        `${f} canonical ${p} is a redirect source in public/_redirects; ` +
        'point it at the destination instead');
      assert.ok(sitemap.has(p),
        `${f} canonical ${p} is not in dist/sitemap-0.xml, so it is not a page this site wants indexed`);
    });

  test(`${f} links back to this site enough to be worth syndicating`, () => {
    // The point of syndication on a borrowed domain is the path home.
    const n = (read(f).match(/stackarchitect\.xyz/g) || []).length;
    assert.ok(n >= 5, `${f} references this site only ${n} time(s)`);
  });
}
