#!/usr/bin/env node
/**
 * Fails when a Stripe Payment Link is written anywhere except
 * src/data/products.ts.
 *
 * Every checkout link lives in products.ts (KIT_STRIPE_URL and each
 * product's stripeUrl) so a price change is one edit. A second copy is how
 * the /pro/ hero ended up pointing at a deactivated link. Pages import the
 * constants and render them through buildStripeUrl().
 *
 * Matches a link with a code after the host, not the bare hostname, so the
 * `indexOf('buy.stripe.com')` host test in Base.astro's tracker is fine.
 * tests/ is not scanned: fixtures there need fake links. Root-level RECORDS
 * files state what a link used to be, the same exemption claims-guard makes.
 *
 * Wired into `npm run build`; tests/stripe-links-guard.test.js runs it too.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'src/data/products.ts';
const DIRS = ['src', 'public', 'functions', 'scripts'];
const RECORDS = new Set(['CLAUDE.md', 'README.md', 'AUDIT.md', 'STACKARCHITECT_PRO_BUILD_BRIEF.md']);
const TEXT = /\.(astro|ts|tsx|js|mjs|cjs|jsx|md|mdx|json|txt|html|css|vtt|xml|yml|yaml|svg)$/i;
const LINK = /buy\.stripe\.com\/[A-Za-z0-9_]+/g;

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); }
    else if (TEXT.test(e.name)) out.push(p);
  }
  return out;
}

export function findStrayLinks(root = ROOT) {
  const files = DIRS.flatMap((d) => (fs.existsSync(path.join(root, d)) ? walk(path.join(root, d), []) : []));
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (e.isFile() && TEXT.test(e.name) && !RECORDS.has(e.name)) files.push(path.join(root, e.name));
  }
  const hits = [];
  for (const f of files) {
    const rel = path.relative(root, f).split(path.sep).join('/');
    if (rel === SOURCE) continue;
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(LINK)) hits.push({ file: rel, line: i + 1, link: m[0] });
    });
  }
  return hits;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hits = findStrayLinks();
  if (hits.length) {
    console.error(`[stripe-links-guard] ${hits.length} Stripe link(s) outside ${SOURCE}:`);
    for (const h of hits) console.error(`  ${h.file}:${h.line}  ${h.link}`);
    console.error(`Import KIT_STRIPE_URL or the product's stripeUrl from ${SOURCE} instead.`);
    process.exit(1);
  }
  console.log(`[stripe-links-guard] ok: every Stripe link is in ${SOURCE}`);
}
