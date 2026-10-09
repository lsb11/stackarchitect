#!/usr/bin/env node
// scripts/syndication-sync.mjs — find every cross-posted copy of this site's
// guides and bring it back in line with the site.
//
//   npm run build                          # packs are generated from dist/
//   npm run syndication:sync               # dry run: prints the plan, changes nothing
//   npm run syndication:sync -- --apply    # writes the changes
//
// Options
//   --platform=devto,hashnode,medium   limit platforms (default: every one with credentials)
//   --minimal                          fix canonicals and affiliate links only; replace a
//                                      body only where a retracted claim is found
//   --only=<text>                      only posts whose title or URL contains <text>
//
// Credentials (environment; never committed)
//   DEVTO_API_KEY    dev.to → Settings → Extensions → "DEV Community API Keys"
//   HASHNODE_PAT     hashnode.com → Settings → Developer → Personal Access Token
//   HASHNODE_HOST    default stocky-shutdown.hashnode.dev
//   MEDIUM_USER      default @stackarchitect123 (read-only: Medium has no edit API)
//
// Why it exists, what it changes and the rule it enforces: scripts/lib/syndication.mjs.
// Runbook: syndication/README.md.
import path from 'node:path';
import fs from 'node:fs';
import { loadSiteState, planPost, applyPlan, buildPack, writePack, replaceBodyKeepingFrontMatter, mediumSourcePage, dropTakenCanonical, writePackHtml, SITE } from './lib/syndication.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const APPLY = Boolean(args.apply);
const MINIMAL = Boolean(args.minimal);
const ONLY = typeof args.only === 'string' ? args.only.toLowerCase() : null;
const env = process.env;
const platforms = (args.platform ? String(args.platform).split(',') : ['devto', 'hashnode', 'medium'])
  .filter((p) => p !== 'devto' || env.DEVTO_API_KEY)
  .filter((p) => p !== 'hashnode' || env.HASHNODE_PAT);

const state = loadSiteState(process.cwd());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const totals = { posts: 0, changed: 0, manual: 0, clean: 0, failed: 0 };

function describe(plan) {
  if (!plan.actions.length) return 'no change';
  return plan.actions.map((a) => {
    if (a.type === 'canonical') return `canonical → ${a.to.replace(SITE, '')}`;
    if (a.type === 'body') return `body ← ${a.page} (${a.why})`;
    if (a.type === 'title') return `title → "${a.to}"`;
    if (a.type === 'links') return 'affiliate links → site pages';
    return `MANUAL: ${a.why}`;
  }).join('; ');
}

function report(platform, post, plan) {
  totals.posts++;
  const flagged = plan.issues.filter((i) => i.kind !== 'affiliate');
  const go = plan.issues.filter((i) => i.kind === 'affiliate').length;
  console.log(`\n[${platform}] ${post.title}\n  ${post.url}`);
  console.log(`  canonical: ${post.canonical || '(none)'}  [${plan.canon.status}]`);
  if (flagged.length) for (const i of flagged.slice(0, 4)) console.log(`  ✗ ${i.kind}: "${i.text}"`);
  if (flagged.length > 4) console.log(`  ✗ …and ${flagged.length - 4} more`);
  if (go) console.log(`  ✗ ${go} bare affiliate link(s)`);
  if (plan.kept) console.log(`  ⚑ canonical kept: ${plan.kept.because}`);
  console.log(`  → ${describe(plan)}`);
  if (plan.actions.some((a) => a.type === 'manual')) totals.manual++;
  else if (!plan.actions.length) totals.clean++;
}

// ── dev.to ────────────────────────────────────────────────────────────────
async function devto() {
  const h = { 'api-key': env.DEVTO_API_KEY, accept: 'application/vnd.forem.api-v1+json', 'content-type': 'application/json' };
  const res = await fetch('https://dev.to/api/articles/me/all?per_page=1000', { headers: h });
  if (!res.ok) throw new Error(`dev.to list: HTTP ${res.status} ${await res.text()}`);
  const articles = await res.json();
  const heldBy = new Map(articles.filter((a) => a.canonical_url && a.canonical_url !== a.url).map((a) => [a.canonical_url, a.id]));
  for (const a of articles) {
    const post = { title: a.title, url: a.url, canonical: a.canonical_url === a.url ? '' : a.canonical_url, body: a.body_markdown ?? '' };
    if (ONLY && !`${post.title} ${post.url}`.toLowerCase().includes(ONLY)) continue;
    const plan = dropTakenCanonical(planPost(post, state, { minimal: MINIMAL }), a.id, heldBy);
    report('dev.to', post, plan);
    if (!plan.actions.length || plan.actions.every((x) => x.type === 'manual')) continue;
    const next = applyPlan(post, plan, state);
    const body = plan.actions.some((x) => x.type === 'body')
      ? replaceBodyKeepingFrontMatter(post.body, next.body, { title: next.title !== post.title ? next.title : null, canonical: next.canonical })
      : next.body;
    if (norm(body) === norm(post.body) && next.title === post.title && next.canonical === post.canonical) { totals.clean++; continue; }
    totals.changed++;
    if (!APPLY) continue;
    const put = await fetch(`https://dev.to/api/articles/${a.id}`, {
      method: 'PUT', headers: h,
      body: JSON.stringify({ article: { title: next.title, body_markdown: body, canonical_url: next.canonical || undefined, published: a.published } }),
    });
    console.log(put.ok ? '  ✓ updated' : `  ✗ FAILED: HTTP ${put.status} ${await put.text()}`);
    if (!put.ok) totals.failed++;
    else if (next.canonical) heldBy.set(next.canonical, a.id);
    await sleep(1500);
  }
}

// ── Hashnode ──────────────────────────────────────────────────────────────
async function gql(query, variables) {
  const res = await fetch('https://gql.hashnode.com/', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'user-agent': 'stackarchitect-syndication-sync/1.0 (+https://stackarchitect.xyz/)',
      authorization: env.HASHNODE_PAT.trim(),
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    // On 9 Oct 2026 this returned an HTML page instead of JSON, which surfaced
    // as a bare "Unexpected token '<'". Say what came back instead.
    const title = text.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
    throw new Error(`Hashnode answered HTTP ${res.status} with a web page${title ? ` ("${title}")` : ''}, not the API's JSON. `
      + (res.status === 401 || res.status === 403
        ? 'Most likely the token: create a new one at hashnode.com → Settings → Developer, then `export HASHNODE_PAT=…` with no quotes or spaces.'
        : 'Most likely a block on your network or a Hashnode outage: try again in a few minutes, or from another connection.'));
  }
  if (json.errors?.length) throw new Error(`Hashnode GraphQL: ${json.errors.map((e) => e.message).join('; ')}`);
  if (!res.ok) throw new Error(`Hashnode: HTTP ${res.status}`);
  return json.data;
}

async function hashnode() {
  const host = env.HASHNODE_HOST || 'stocky-shutdown.hashnode.dev';
  const posts = [];
  let after = null;
  do {
    const d = await gql(`query($host:String!,$after:String){publication(host:$host){
      posts(first:20,after:$after){edges{node{id title url canonicalUrl content{markdown}}}
      pageInfo{hasNextPage endCursor}}}}`, { host, after });
    if (!d.publication) throw new Error(`Hashnode has no publication at ${host}. Set HASHNODE_HOST to the blog's address, e.g. yourname.hashnode.dev`);
    const page = d.publication.posts;
    posts.push(...page.edges.map((e) => e.node));
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);

  for (const n of posts) {
    const post = { title: n.title, url: n.url, canonical: n.canonicalUrl ?? '', body: n.content?.markdown ?? '' };
    if (ONLY && !`${post.title} ${post.url}`.toLowerCase().includes(ONLY)) continue;
    const plan = planPost(post, state, { minimal: MINIMAL });
    report('hashnode', post, plan);
    if (!plan.actions.length || plan.actions.every((x) => x.type === 'manual')) continue;
    const next = applyPlan(post, plan, state);
    if (norm(next.body) === norm(post.body) && next.title === post.title && next.canonical === post.canonical) { totals.clean++; continue; }
    totals.changed++;
    if (!APPLY) continue;
    try {
      await gql(`mutation($input:UpdatePostInput!){updatePost(input:$input){post{id url}}}`, {
        input: { id: n.id, title: next.title, contentMarkdown: next.body, originalArticleURL: next.canonical || undefined },
      });
      console.log('  ✓ updated');
    } catch (e) { totals.failed++; console.log(`  ✗ FAILED: ${e.message}`); }
    await sleep(1500);
  }
}

// ── Medium (read-only) ────────────────────────────────────────────────────
// Medium's API cannot edit a post, so this reports and prints the steps.
// Its feed carries no canonical: how a post is matched to the page it copies,
// and why a weak title match is no longer forced, is in mediumSourcePage().
// Only posts carrying a retracted claim or a bare /go/ link are "need you";
// a clean copy is listed as an optional refresh, so the manual list is short.
async function medium() {
  const user = env.MEDIUM_USER || '@stackarchitect123';
  const res = await fetch(`https://medium.com/feed/${user}`);
  if (!res.ok) throw new Error(`Medium feed: HTTP ${res.status}`);
  const xml = await res.text();
  const cfg = JSON.parse(fs.readFileSync('syndication/pages.json', 'utf8'));
  for (const item of xml.split('<item>').slice(1)) {
    const pick = (tag) => (item.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)) || [, ''])[1];
    const title = pick('title');
    const url = pick('link').split('?')[0];
    if (ONLY && !`${title} ${url}`.toLowerCase().includes(ONLY)) continue;
    const html = pick('content:encoded');
    const match = mediumSourcePage({ title, url, html }, state, { overrides: cfg.medium ?? {} });
    const page = match.page;
    const post = { title, url, canonical: page ? `${SITE}${page}` : '', body: html };
    const plan = planPost(post, state, { minimal: MINIMAL });
    const dirty = plan.issues.length > 0;
    totals.posts++;
    const flagged = plan.issues.filter((i) => i.kind !== 'affiliate');
    const go = plan.issues.filter((i) => i.kind === 'affiliate').length;
    console.log(`\n[medium] ${title}\n  ${url}`);
    console.log(page ? `  copy of ${page}, from ${match.how}` : `  original article (${match.how})`);
    for (const i of flagged.slice(0, 4)) console.log(`  ✗ ${i.kind}: "${i.text}"`);
    if (flagged.length > 4) console.log(`  ✗ …and ${flagged.length - 4} more`);
    if (go) console.log(`  ✗ ${go} bare affiliate link(s)`);
    if (page && dirty) {
      totals.manual++;
      const file = path.relative(process.cwd(), writePackHtml(page, state));
      console.log(`  → MANUAL on Medium: open ${file} in your browser, ⌘A, ⌘C`);
      console.log('                      ⋯ → Edit story → click in the story, ⌘A, ⌘V (title and body both replaced) → Save and publish');
      console.log(`                      ⋯ → Story settings → Advanced settings → Canonical link: ${SITE}${page}`);
    } else if (page) {
      totals.clean++;
      console.log(`  → nothing retracted; optional refresh from ${path.relative(process.cwd(), writePackHtml(page, state))}`);
    } else if (dirty) {
      totals.manual++;
      console.log('  → MANUAL: edit the flagged sentences above by hand (an original article is never overwritten)');
    } else {
      totals.clean++;
      console.log('  → no change');
    }
  }
}

console.log(`Syndication ${APPLY ? 'APPLY' : 'DRY RUN'}${MINIMAL ? ' (minimal)' : ''} — platforms: ${platforms.join(', ') || 'none'}`);
if (!platforms.length) console.log('No credentials found. Set DEVTO_API_KEY and/or HASHNODE_PAT (see syndication/README.md).');
for (const p of platforms) {
  try { await ({ devto, hashnode, medium })[p](); } catch (e) { totals.failed++; console.log(`\n[${p}] ERROR: ${e.message}`); }
}
console.log(`\n── ${totals.posts} posts: ${totals.changed} to change, ${totals.manual} need you, ${totals.clean} already fine, ${totals.failed} failed`);
if (!APPLY && totals.changed) console.log('Dry run only. Re-run with --apply to write these changes.');
process.exit(totals.failed ? 1 : 0);
