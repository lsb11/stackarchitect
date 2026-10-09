// scripts/lib/syndication.mjs — what a syndicated copy of a page should say,
// and what is wrong with the copies already out there.
//
// WHY THIS EXISTS
// Every guide on this site was cross-posted to dev.to, Hashnode and Medium.
// Those copies left the repo, so nothing that protects a page protected them.
// Measured 9 Oct 2026:
//   - dev.to "Recover 20-40% of invisible Shopify conversions" carried the
//     20-40% figure retracted on 4 Sep, in its TITLE and three more times,
//     plus EMQ "4-5 to 8-9" and "10-25% lower cost-per-purchase";
//   - dev.to and Medium "CAPI Shield" posts said "EMQ 7.0 to 8.5" and that
//     CAPI Shield posts to "the Meta CAPI and Google Ads endpoints", both
//     withdrawn from the site;
//   - Medium "Google Ads" stated 20-40% three times;
//   - bare /go/* affiliate cloaks, which carry rel="sponsored" and a
//     disclosure only on this site's own pipeline, sat in six posts;
//   - five posts declared a canonical the 24 Sep consolidation had retired;
//   - the agentic-storefronts copies still led with an "11x" statistic the
//     site page records as superseded twice and removed.
// Those copies sit on domains far stronger than this one (dev.to, Medium,
// hashnode.dev), so while this site has one indexed page they are the
// versions of its claims most likely to be found and quoted.
//
// THE RULE
// A syndicated body is GENERATED from this site's built output, never kept by
// hand: the page's own 40-60 word answer paragraph, then its FAQ (which
// schema-visible-guard check 6 holds to the visible page text, verbatim), then
// a link to the full guide. A hand-kept copy drifts; the "11x" in
// dev_to_agentic_guide.md is the proof. Built output cannot, because every
// guard in `npm run build` has already passed over it.
//
// The answer-then-questions shape is also the one assistants extract from, and
// it ends by sending the reader here, where affiliate links are disclosed.
import fs from 'node:fs';
import path from 'node:path';
import { retiredNearAnchor } from './retired-near-anchor.mjs';

export const SITE = 'https://stackarchitect.xyz';

// Each affiliate cloak, mapped to the page on this site that covers the tool.
// A syndicated post links here instead; the reader reaches the vendor one
// click later, through a link this site discloses.
export const GO_TO_PAGE = {
  make: '/make-com-shopify/',
  tidio: '/blog/tidio-for-shopify-complete-setup-guide/',
  'tidio-ai': '/blog/tidio-for-shopify-complete-setup-guide/',
  'tidio-pricing': '/blog/tidio-for-shopify-complete-setup-guide/',
  gorgias: '/gorgias-shopify-guide/',
  systeme: '/replace-klaviyo-free/',
  getresponse: '/replace-klaviyo-free/',
  beehiiv: '/best-free-shopify-apps-2026/',
  workspace: '/blog/when-to-upgrade-free-make-google-workspace/',
};

// Withdrawn claims that are not numbers, so no claims.json `forbid` rule can
// see them. Each was true of an earlier version of the site and is not now.
//
// These match the POSITIVE claim only. A broad "CAPI Shield ... Google Ads"
// window was tried first and fired on /capi-shield/'s own correct sentence,
// "CAPI Shield's Google branch is not a working route to it as shipped" —
// the retraction-notice trap claims.json's `unless` lists exist to avoid.
export const WITHDRAWN = [
  { re: /no gclid needed/i, why: 'withdrawn: Shopify order data carries no gclid' },
  { re: /Meta CAPI and Google Ads endpoints|CAPI Shield\b[^.\n]{0,80}\b(?:Meta|Facebook)\s*(?:\+|&|and)\s*Google\b/i,
    why: 'withdrawn: CAPI Shield is Meta-only; every page dropped Google' },
  { re: /\b11\s?(?:x|×)\b/i, why: 'superseded: the agentic page records "11x" as superseded twice and removed' },
];

// Off-site only. Three sentences live on dev.to and Medium on 9 Oct 2026
// passed every claims.json `forbid` rule:
//   "20-40% additional reported conversions, 1-3 point Meta EMQ improvement"
//   "built on just 40% of your actual data"
//   "reduces the gap from 20-40% down to 10-20%"
// The site's own rules are deliberately narrow, tuned with `unless` lists so
// retraction notices survive; widening them here would be a site-wide change
// made blind. Off-site the trade is different: a false positive only means
// the post is replaced with the site's current, guard-clean text, which is
// the default action anyway. So these are broad on purpose, and never run
// over the site.
export const OFFSITE_EXTRA = [
  { re: /\b\d{1,2}(?:\s*[–—-]\s*\d{1,2})?\s*%[^.\n]{0,60}?\b(?:conversions?|purchases?|data|events?|tracking|signal|cost-per-purchase|CPA)\b/i,
    why: 'a quantified share of conversions or tracking data' },
  { re: /\b(?:gap|loss|lost|miss(?:es|ed|ing)?|invisible|recover(?:s|ed|y)?)\b[^.\n]{0,40}?\b\d{1,2}(?:\s*[–—-]\s*\d{1,2})?\s*%/i,
    why: 'a quantified loss or recovery' },
  { re: /\b\d(?:\.\d)?(?:\s*[–—-]\s*\d(?:\.\d)?)?\s*points?\b[^.\n]{0,25}\bEMQ\b/i,
    why: 'an EMQ point lift' },
];

export function loadSiteState(root, { requireDist = true } = {}) {
  const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
  const built = fs.existsSync(path.join(root, 'dist/sitemap-0.xml'));
  if (!built && requireDist) throw new Error('dist/ is missing: run `npm run build` first');
  const live = built
    ? new Set([...read('dist/sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname))
    : new Set();
  const redirects = new Map();
  for (const line of read('public/_redirects').split('\n')) {
    const [from, to] = line.trim().split(/\s+/);
    if (!from || !to || !from.startsWith('/') || from.startsWith('/go/') || from.startsWith('#')) continue;
    const key = from.endsWith('/') ? from : `${from}/`;
    if (!redirects.has(key)) redirects.set(key, to.replace(SITE, ''));
  }
  const claims = JSON.parse(read('src/data/claims.json'));
  const forbid = [];
  for (const group of Object.values(claims)) {
    if (!group || typeof group !== 'object') continue;
    for (const [id, entry] of Object.entries(group)) {
      for (const f of entry?.forbid ?? []) forbid.push({ id, ...f });
    }
  }
  return { root, built, live, redirects, forbid, kit: claims.ours.kitPrice };
}

// Where a syndicated post SHOULD point, given where it points now.
export function resolveCanonical(url, state) {
  if (!url) return { status: 'none' };
  let u;
  try { u = new URL(url); } catch { return { status: 'none' }; }
  if (u.hostname.replace(/^www\./, '') !== 'stackarchitect.xyz') return { status: 'original', url };
  let p = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`;
  for (let hop = 0; hop < 5 && !state.live.has(p) && state.redirects.has(p); hop++) {
    p = state.redirects.get(p);
  }
  if (!state.live.has(p)) return { status: 'dead', url, path: p };
  const target = `${SITE}${p}`;
  return { status: target === url ? 'live' : 'retired', url, path: p, target };
}

// Everything in a body that the site itself would refuse to publish.
export function scanText(text, state, { offsite = false } = {}) {
  const plain = text.replace(/<[^>]+>/g, ' ');
  const found = [];
  for (const f of state.forbid) {
    const excepts = (f.unless || []).map((u) => new RegExp(u, 'i'));
    for (const m of plain.matchAll(new RegExp(f.pattern, 'gi'))) {
      const line = plain.slice(plain.lastIndexOf('\n', m.index) + 1, plain.indexOf('\n', m.index) >>> 0);
      if (excepts.some((u) => u.test(line))) continue;
      found.push({ kind: 'retracted', rule: f.id, text: m[0].replace(/\s+/g, ' ').trim().slice(0, 90) });
    }
  }
  for (const w of [...WITHDRAWN, ...(offsite ? OFFSITE_EXTRA : [])]) {
    const m = plain.match(w.re);
    if (m) found.push({ kind: 'withdrawn', rule: w.why, text: m[0].replace(/\s+/g, ' ').trim().slice(0, 90) });
  }
  for (const h of retiredNearAnchor(plain, { retired: state.kit.retired, ...state.kit.near })) {
    found.push({ kind: 'retired-price', rule: 'ours.kitPrice', text: String(h.excerpt ?? h.found ?? h).slice(0, 90) });
  }
  const go = [...text.matchAll(/https?:\/\/(?:www\.)?stackarchitect\.xyz\/go\/([a-z0-9-]+)\/?[^\s)"'<]*/gi)];
  for (const m of go) found.push({ kind: 'affiliate', rule: `/go/${m[1]}`, text: m[0] });
  return found;
}

export function rewriteGoLinks(text) {
  return text.replace(/https?:\/\/(?:www\.)?stackarchitect\.xyz\/go\/([a-z0-9-]+)\/?[^\s)"'<]*/gi,
    (_, slug) => `${SITE}${GO_TO_PAGE[slug] ?? '/'}`);
}

export function setFrontMatterCanonical(md, target) {
  if (!md.startsWith('---\n')) return md;
  const end = md.indexOf('\n---', 4);
  if (end < 0) return md;
  let fm = md.slice(4, end);
  fm = /^canonical_url:/m.test(fm)
    ? fm.replace(/^canonical_url:.*$/m, `canonical_url: ${target}`)
    : `${fm}\ncanonical_url: ${target}`;
  return `---\n${fm}${md.slice(end)}`;
}

const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&mdash;/g, '—')
  .replace(/&ndash;/g, '–').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
  .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&rarr;/g, '→')
  .replace(/&middot;/g, '·').replace(/&amp;/g, '&');

function htmlToMd(fragment) {
  return decode(fragment
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
      const abs = href.startsWith('/') ? `${SITE}${href}` : href;
      return `[${inner.replace(/<[^>]+>/g, '').trim()}](${abs})`;
    })
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ').trim();
}

// The syndicated version of one page, from the built HTML alone.
export function buildPack(pagePath, state) {
  const file = path.join(state.root, 'dist', pagePath, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [, pagePath])[1])
    .replace(/\s*[|—–-]\s*Stack Architect\s*$/, '').trim();
  const main = (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/) || [, ''])[1]
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, '');
  const answer = [...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => htmlToMd(m[1]))
    .find((t) => t.split(/\s+/).length >= 30);
  if (!answer) throw new Error(`${pagePath}: no answer paragraph found in <main>`);

  const faqs = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data;
    try { data = JSON.parse(m[1]); } catch { continue; }
    const nodes = Array.isArray(data) ? data : (data['@graph'] ?? [data]);
    for (const n of nodes) {
      if (n?.['@type'] !== 'FAQPage') continue;
      for (const q of n.mainEntity ?? []) {
        faqs.push({ q: decode(q.name).trim(), a: htmlToMd(q.acceptedAnswer?.text ?? '') });
      }
    }
  }

  const canonical = `${SITE}${pagePath}`;
  const parts = [answer];
  if (faqs.length) {
    parts.push('## Questions this guide answers');
    for (const { q, a } of faqs) parts.push(`### ${q}\n\n${a}`);
  }
  parts.push('---');
  parts.push(`**The full guide, with every step, source and date:** [${title}](${canonical})`);
  parts.push(`*Originally published on [Stack Architect](${SITE}/) by Luke Sandelands. `
    + 'Figures there carry the date they were last checked; this copy does not, so prefer the original.*');
  const body = rewriteGoLinks(parts.join('\n\n'));
  return { title, canonical, body, faqCount: faqs.length };
}

// What to do with one post already published somewhere.
//   post: { title, canonical, body }
//   opts.minimal: fix canonical and links only, unless a retracted claim is found
export function planPost(post, state, opts = {}) {
  const canon = resolveCanonical(post.canonical, state);
  const issues = scanText(`${post.title}\n${post.body}`, state, { offsite: true });
  const titleIssues = scanText(post.title, state, { offsite: true }).filter((i) => i.kind !== 'affiliate');
  const actions = [];
  const claimIssues = issues.filter((i) => i.kind !== 'affiliate');

  if (canon.status === 'retired') actions.push({ type: 'canonical', from: post.canonical, to: canon.target });
  if (canon.status === 'dead') actions.push({ type: 'manual', why: `canonical ${canon.path} is not a live page` });

  const sitePage = canon.status === 'live' || canon.status === 'retired' ? canon.path : null;
  if (sitePage && (!opts.minimal || claimIssues.length)) {
    const pack = buildPack(sitePage, state);
    actions.push({ type: 'body', page: sitePage, why: claimIssues.length ? 'retracted or withdrawn claims' : 'replace with current site version' });
    if (titleIssues.length) actions.push({ type: 'title', from: post.title, to: pack.title });
  } else if (issues.some((i) => i.kind === 'affiliate')) {
    actions.push({ type: 'links' });
  }
  if (!sitePage && claimIssues.length) {
    actions.push({ type: 'manual', why: 'original article (no site page to regenerate from) carries retracted or withdrawn claims' });
  }
  return { canon, issues, actions };
}

// Applies a plan to a post, returning the new title/canonical/body.
export function applyPlan(post, plan, state) {
  let { title, canonical, body } = post;
  for (const a of plan.actions) {
    if (a.type === 'canonical') { canonical = a.to; body = setFrontMatterCanonical(body, a.to); }
    if (a.type === 'title') title = a.to;
    if (a.type === 'links') body = rewriteGoLinks(body);
    if (a.type === 'body') body = buildPack(a.page, state).body;
  }
  const leftover = scanText(`${title}\n${body}`, state).filter((i) => !plan.actions.some((a) => a.type === 'manual'));
  return { title, canonical, body, leftover };
}

// Packs are derived from dist/, so they are generated, not committed: a
// committed copy would go stale on every content edit, which is the drift
// this module exists to end. They land in syndication/out/ (gitignored).
export function packFilename(pagePath) {
  return `${pagePath.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'home'}.md`;
}

export function writePack(pagePath, state) {
  const { title, canonical, body } = buildPack(pagePath, state);
  const dir = path.join(state.root, 'syndication', 'out');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, packFilename(pagePath));
  fs.writeFileSync(file, `---\ntitle: ${JSON.stringify(title)}\ncanonical_url: ${canonical}\n---\n\n${body}\n`);
  return file;
}

// dev.to body_markdown may carry its own front matter, which overrides the
// article's attributes. Replacing the body must keep that block (tags,
// published, cover image) and only rewrite title/canonical inside it, or an
// update could silently retag or unpublish the post.
export function replaceBodyKeepingFrontMatter(oldBody, newContent, { title, canonical }) {
  if (!oldBody?.startsWith('---\n')) return newContent;
  const end = oldBody.indexOf('\n---', 4);
  if (end < 0) return newContent;
  let fm = oldBody.slice(4, end);
  const set = (k, v) => {
    const line = `${k}: ${k === 'title' ? JSON.stringify(v) : v}`;
    fm = new RegExp(`^${k}:`, 'm').test(fm) ? fm.replace(new RegExp(`^${k}:.*$`, 'm'), line) : `${fm}\n${line}`;
  };
  if (title) set('title', title);
  if (canonical) set('canonical_url', canonical);
  return `---\n${fm}\n---\n\n${newContent}`;
}
