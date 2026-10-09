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
import { loadSiteState, planPost, applyPlan, buildPack, writePack, replaceBodyKeepingFrontMatter, SITE } from './lib/syndication.mjs';

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
  console.log(`  → ${describe(plan)}`);
  if (plan.actions.some((a) => a.type === 'manual')) totals.manual++;
  else if (!plan.actions.length) totals.clean++;
}

// ── dev.to ────────────────────────────────────────────────────────────────
async function devto() {
  const h = { 'api-key': env.DEVTO_API_KEY, accept: 'application/vnd.forem.api-v1+json', 'content-type': 'application/json' };
  const res = await fetch('https://dev.to/api/articles/me/all?per_page=1000', { headers: h });
  if (!res.ok) throw new Error(`dev.to list: HTTP ${res.status} ${await res.text()}`);
  for (const a of await res.json()) {
    const post = { title: a.title, url: a.url, canonical: a.canonical_url === a.url ? '' : a.canonical_url, body: a.body_markdown ?? '' };
    if (ONLY && !`${post.title} ${post.url}`.toLowerCase().includes(ONLY)) continue;
    const plan = planPost(post, state, { minimal: MINIMAL });
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
    await sleep(1500);
  }
}

// ── Hashnode ──────────────────────────────────────────────────────────────
async function gql(query, variables) {
  const res = await fetch('https://gql.hashnode.com', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: env.HASHNODE_PAT },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(`Hashnode GraphQL: ${json.errors.map((e) => e.message).join('; ')}`);
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
// Medium exposes no canonical in its feed, so each post is matched to a site
// page by title; low-confidence matches are said to be low-confidence.
async function medium() {
  const user = env.MEDIUM_USER || '@stackarchitect123';
  const res = await fetch(`https://medium.com/feed/${user}`);
  if (!res.ok) throw new Error(`Medium feed: HTTP ${res.status}`);
  const xml = await res.text();
  const tok = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'stack', 'architect', '2026', 'free', 'shopify'].includes(w)));
  const pages = [...state.live].map((p) => ({ p, t: tok(buildPack(p, state).title) }));
  for (const item of xml.split('<item>').slice(1)) {
    const pick = (tag) => (item.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)) || [, ''])[1];
    const title = pick('title');
    const url = pick('link').split('?')[0];
    if (ONLY && !`${title} ${url}`.toLowerCase().includes(ONLY)) continue;
    const t = tok(title);
    const best = pages.map(({ p, t: pt }) => {
      const inter = [...t].filter((w) => pt.has(w)).length;
      return { p, score: inter / Math.max(1, new Set([...t, ...pt]).size) };
    }).sort((a, b) => b.score - a.score)[0];
    const page = best.score >= 0.2 ? best.p : null;
    const post = { title, url, canonical: page ? `${SITE}${page}` : '', body: pick('content:encoded') };
    const plan = planPost(post, state, { minimal: MINIMAL });
    report('medium', post, plan);
    console.log(page
      ? `  ⚑ matched to ${page} by title (confidence ${(best.score * 100).toFixed(0)}%)`
      : '  ⚑ no confident match to a site page: treat as an original article');
    if (page) {
      totals.manual++;
      console.log('  MANUAL on Medium: ⋯ → Edit story → replace the body with ' + path.relative(process.cwd(), writePack(page, state)));
      console.log(`                    ⋯ → Story settings → Advanced settings → Canonical link: ${SITE}${page}`);
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
