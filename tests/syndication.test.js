// tests/syndication.test.js — the syndicated copies of this site's guides say
// what the site says, and the tool that fixes them would catch what is
// actually wrong with the ones already published.
//
// The fixtures below are not invented. Each is a sentence that was live on
// dev.to or Medium on 9 Oct 2026, quoted verbatim from the platform's API or
// feed. If a change to claims.json, WITHDRAWN or OFFSITE_EXTRA stops catching
// one of them, the copy it came from would survive a sync, and this fails.
//
// Replaces tests/syndication-drafts.test.js. The hand-kept dev_to_*.md drafts
// it guarded were deleted: dev_to_agentic_guide.md still carried an "11x"
// statistic the site page records as superseded twice and removed, which is
// what any hand-kept copy of a page eventually does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadSiteState, buildPack, scanText, planPost, applyPlan, rewriteGoLinks,
  setFrontMatterCanonical, replaceBodyKeepingFrontMatter, GO_TO_PAGE, SITE,
  mediumSourcePage, dropTakenCanonical, packToHtml,
} from '../scripts/lib/syndication.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const state = loadSiteState(ROOT, { requireDist: false });
const needsBuild = state.built ? false : 'run npm run build first';

const LIVE_ON_9_OCT_2026 = {
  'dev.to SST, title': 'Recover 20–40% of invisible Shopify conversions — free',
  'dev.to SST, recovery': 'The 20–40% recovery figure represents real purchases that happened but were invisible to your pixel.',
  'dev.to SST, uplift line': '20–40% additional reported conversions, 1–3 point Meta EMQ improvement, 10–25% lower cost-per-purchase',
  'dev.to SST, EMQ': 'a higher Event Match Quality (EMQ) score — typically jumping from 4–5 (browser-only) to 8–9 (server + browser hybrid)',
  'dev.to CAPI Shield, EMQ': 'this server-side setup typically achieves an Event Match Quality (EMQ) score of 7.0 to 8.5 out of 10.',
  'dev.to CAPI Shield, Google': 'The workflow pushes the hashed server event via HTTP POST directly to the Meta CAPI and Google Ads endpoints.',
  'dev.to CAPI Shield, 40%': 'Every budget decision, every audience adjustment, and every bid strategy is being built on just 40% of your actual data.',
  'Medium Google Ads': 'In 2026, browser-based Google Ads pixels miss 20–40% of real purchases on most Shopify stores.',
  'Medium Google Ads, gap': 'A healthy Enhanced Conversions setup reduces the gap from 20–40% down to 10–20%.',
  'dev.to agentic, 11x': 'AI-driven purchases on Shopify increased 11x in 2025.',
  'Medium inventory, cloak': 'Create a free Make.com account https://stackarchitect.xyz/go/make/?source=the-ultimate-guide-to-shopify-inventory-management-n1',
};

for (const [where, sentence] of Object.entries(LIVE_ON_9_OCT_2026)) {
  test(`off-site scan catches what was live: ${where}`, () => {
    assert.ok(scanText(sentence, state, { offsite: true }).length > 0, `would survive a sync: "${sentence}"`);
  });
}

test('every sitemap page yields a pack the site itself would publish', { skip: needsBuild }, () => {
  const dirty = [];
  for (const p of state.live) {
    const { body, canonical } = buildPack(p, state);
    const issues = scanText(body, state);
    if (issues.length) dirty.push(`${p}: ${issues[0].kind} "${issues[0].text}"`);
    assert.equal(canonical, `${SITE}${p}`);
    assert.ok(body.includes(`](${canonical})`), `${p} pack does not link back to its own page`);
    assert.doesNotMatch(body, /\/go\//, `${p} pack carries an affiliate cloak`);
  }
  assert.deepEqual(dirty, []);
});

// The first WITHDRAWN pattern fired on this sentence, which is the site
// correctly saying Google is NOT supported. A guard that flags a retraction
// notice pushes someone to delete the record. Pinned so it cannot come back.
test("the site's own retraction of the Google claim is not mistaken for the claim", { skip: needsBuild }, () => {
  const body = buildPack('/capi-shield/', state).body;
  assert.deepEqual(scanText(body, state, { offsite: true }), []);
});

test('a retired canonical, a retracted title and a cloak are all fixed in one plan', { skip: needsBuild }, () => {
  const post = {
    title: 'Recover 20–40% of invisible Shopify conversions — free',
    canonical: `${SITE}/blog/recover-lost-shopify-conversions-capi-shield/`,
    body: 'Start at https://stackarchitect.xyz/go/make today.',
  };
  const plan = planPost(post, state);
  const types = plan.actions.map((a) => a.type);
  assert.deepEqual(types.sort(), ['body', 'canonical', 'title']);
  assert.equal(plan.actions.find((a) => a.type === 'canonical').to, `${SITE}/capi-shield/`);
  const out = applyPlan(post, plan, state);
  assert.deepEqual(scanText(`${out.title}\n${out.body}`, state, { offsite: true }), []);
  assert.equal(out.canonical, `${SITE}/capi-shield/`);
});

test('--minimal keeps a clean body and only repairs links', { skip: needsBuild }, () => {
  const post = {
    title: 'Tidio for Shopify', canonical: `${SITE}/blog/tidio-for-shopify-complete-setup-guide/`,
    body: 'Install it [here](https://stackarchitect.xyz/go/tidio).',
  };
  const plan = planPost(post, state, { minimal: true });
  assert.deepEqual(plan.actions.map((a) => a.type), ['links']);
  assert.match(applyPlan(post, plan, state).body, /blog\/tidio-for-shopify-complete-setup-guide\//);
});

test('an original article with a clean body is left alone', () => {
  const plan = planPost({ title: '6 Reasons Your Meta CAPI Events Do Not Match', canonical: '', body: 'Check your event_id.' }, state);
  assert.deepEqual(plan.actions, []);
});

test('every affiliate cloak maps to a live page on this site', { skip: needsBuild }, () => {
  const cloaks = new Set([...fs.readFileSync(path.join(ROOT, 'public/_redirects'), 'utf8').matchAll(/^\/go\/([a-z0-9-]+)\/?\s/gm)].map((m) => m[1]));
  const unmapped = [...cloaks].filter((c) => !GO_TO_PAGE[c]);
  assert.deepEqual(unmapped, [], 'a new /go/ cloak would send syndicated readers to the homepage; map it in GO_TO_PAGE');
  for (const [c, p] of Object.entries(GO_TO_PAGE)) assert.ok(state.live.has(p), `GO_TO_PAGE.${c} -> ${p} is not live`);
  assert.equal(rewriteGoLinks('x https://www.stackarchitect.xyz/go/make/?a=b y'), `x ${SITE}/make-com-shopify/ y`);
});

test('replacing a body keeps front matter, so a post cannot be unpublished or retagged', () => {
  const old = '---\ntitle: "Old"\npublished: true\ntags: shopify, analytics\ncanonical_url: https://x/old/\n---\n\nold body';
  const out = replaceBodyKeepingFrontMatter(old, 'new body', { title: 'New', canonical: `${SITE}/capi-shield/` });
  assert.match(out, /^published: true$/m);
  assert.match(out, /^tags: shopify, analytics$/m);
  assert.match(out, /^title: "New"$/m);
  assert.match(out, new RegExp(`^canonical_url: ${SITE}/capi-shield/$`, 'm'));
  assert.match(out, /\n\nnew body$/);
  assert.doesNotMatch(out, /old body/);
  assert.equal(replaceBodyKeepingFrontMatter('no front matter', 'new', {}), 'new');
  assert.match(setFrontMatterCanonical('---\ntitle: a\n---\nb', 'https://y/'), /^canonical_url: https:\/\/y\/$/m);
});

// Medium, 9 Oct 2026: the feed has no canonical, and the first sync forced a
// title match at 20%. These are the real titles, URLs and footers.
const MEDIUM_CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'syndication/pages.json'), 'utf8')).medium;
const footer = (href) => `<p>Originally published at <a href="${href}">https://stackarchitect.xyz</a></p>`;

test('a Medium copy is matched by its "Originally published at" footer, through _redirects', { skip: needsBuild }, () => {
  const m = mediumSourcePage({
    title: 'CAPI Shield: Closing the Conversion Tracking Gap',
    url: 'https://medium.com/@stackarchitect123/capi-shield-closing-the-conversion-tracking-gap-f1e4e422e85a',
    html: `<p>body</p>${footer('https://stackarchitect.xyz/blog/recover-lost-shopify-conversions-capi-shield/')}`,
  }, state, { overrides: MEDIUM_CFG });
  assert.equal(m.page, '/capi-shield/', 'it was matched to the iOS-updates guide by title');
});

test('a Medium copy with no footer is matched by the pages.json entry', { skip: needsBuild }, () => {
  const m = mediumSourcePage({
    title: 'Shopify Stocky Shutdown — August 31, 2026 | What Happens & What To Do',
    url: 'https://medium.com/@stackarchitect123/shopify-stocky-shutdown-august-31-2026-what-happens-what-to-do-e4c072da5f7d',
    html: '<p>Get the Complete Kit — $29 →</p>',
  }, state, { overrides: MEDIUM_CFG });
  assert.equal(m.page, '/stocky-alternative/');
});

test('an original Medium article is not matched to a page on a weak title overlap', { skip: needsBuild }, () => {
  const m = mediumSourcePage({
    title: "6 Reasons Your Meta Conversions API Events Don't Match (and How to Check Yours)",
    url: 'https://medium.com/@stackarchitect123/6-reasons-your-meta-conversions-api-events-dont-match-and-how-to-check-yours-2ce88c9e2c52',
    html: '<p>See <a href="https://stackarchitect.xyz/meta-capi-payload-validator/">the validator</a>.</p>',
  }, state, { overrides: MEDIUM_CFG });
  assert.equal(m.page, null, m.how);
});

test('dev.to: a canonical another post already holds is kept, not sent (HTTP 422)', () => {
  const quotas = `${SITE}/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/`;
  const old = `${SITE}/blog/how-to-fix-service-invoked-too-many-times-in-google-apps-script/`;
  const plan = { actions: [{ type: 'canonical', from: old, to: quotas }, { type: 'body', page: '/x/' }] };
  const heldBy = new Map([[quotas, 2]]);
  const kept = dropTakenCanonical(plan, 1, heldBy);
  assert.deepEqual(kept.actions.map((a) => a.type), ['body']);
  assert.ok(kept.kept.because.includes('already the canonical'));
  assert.equal(dropTakenCanonical(plan, 2, heldBy).actions.length, 2, 'the post that holds it may keep it');
});

test('the Medium HTML pack keeps headings, links and the link back', () => {
  const html = packToHtml({ title: 'T', body: 'Answer with [a link](https://stackarchitect.xyz/a/) & **bold**.\n\n## Questions\n\n### Q?\n\nA.\n\n---\n\n*Originally published on [Stack Architect](https://stackarchitect.xyz/)*' });
  for (const s of ['<h1>T</h1>', '<a href="https://stackarchitect.xyz/a/">a link</a>', '&amp;', '<strong>bold</strong>', '<h2>Questions</h2>', '<h3>Q?</h3>', '<hr>', '<em>Originally published on <a href="https://stackarchitect.xyz/">Stack Architect</a></em>']) {
    assert.ok(html.includes(s), s);
  }
});
