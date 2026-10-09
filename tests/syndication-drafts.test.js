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

  test(`${f} links back to this site enough to be worth syndicating`, () => {
    // The point of syndication on a borrowed domain is the path home.
    const n = (read(f).match(/stackarchitect\.xyz/g) || []).length;
    assert.ok(n >= 5, `${f} references this site only ${n} time(s)`);
  });
}
