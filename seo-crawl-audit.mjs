// Full dist/ crawl audit: link graph, orphans, depth, metas, schema, broken links
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SITE = 'https://stackarchitect.xyz';

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const files = walk(DIST);
const pages = new Map(); // path -> {title, desc, canonical, links[], schemaTypes[], words, h1}

const norm = (href) => {
  if (!href) return null;
  if (href.startsWith(SITE)) href = href.slice(SITE.length);
  if (!href.startsWith('/')) return null;
  href = href.split('#')[0].split('?')[0];
  if (!href) return null;
  if (!href.endsWith('/') && !/\.[a-z0-9]+$/i.test(href)) href += '/';
  return href;
};

const collectSchemaTypes = (node, acc) => {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) { node.forEach((n) => collectSchemaTypes(n, acc)); return acc; }
  if (node['@type']) acc.push(node['@type']);
  Object.values(node).forEach((v) => collectSchemaTypes(v, acc));
  return acc;
};

for (const f of files) {
  const rel = '/' + relative(DIST, f).replace(/index\.html$/, '').replace(/\.html$/, '/');
  const html = readFileSync(f, 'utf8');
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1]?.trim() || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
  const robots = (html.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || '';
  const links = [...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => norm(m[1])).filter(Boolean);
  const schemaTypes = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap((m) => {
      try {
        return collectSchemaTypes(JSON.parse(m[1]), []);
      } catch { return ['PARSE_ERROR']; }
    })
    .flat();
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
  const words = body.split(/\s+/).filter(Boolean).length;
  pages.set(rel, { title, desc, canonical, h1, robots, links: [...new Set(links)], schemaTypes, words, file: f });
}

const paths = new Set(pages.keys());

// Broken internal links
const broken = new Map();
// load redirects
const redirects = new Set();
if (existsSync('public/_redirects')) {
  for (const line of readFileSync('public/_redirects', 'utf8').split('\n')) {
    const m = line.trim().split(/\s+/);
    if (m[0]?.startsWith('/')) { redirects.add(norm(m[0]) || m[0]); }
  }
}
for (const [p, d] of pages) {
  for (const l of d.links) {
    if (l.startsWith('/go/') || l.startsWith('/cdn-cgi/') || l.startsWith('/videos/') || /\.(png|svg|xml|txt|ico|webmanifest|pdf|json|mp4)$/.test(l)) continue;
    if (!paths.has(l) && !redirects.has(l)) {
      if (!broken.has(l)) broken.set(l, []);
      broken.get(l).push(p);
    }
  }
}

// Inbound link counts + BFS depth from homepage
const inbound = new Map([...paths].map((p) => [p, 0]));
for (const [p, d] of pages) for (const l of d.links) if (l !== p && inbound.has(l)) inbound.set(l, inbound.get(l) + 1);

const depth = new Map([['/', 0]]);
let frontier = ['/'];
while (frontier.length) {
  const next = [];
  for (const p of frontier) {
    for (const l of pages.get(p)?.links || []) {
      if (paths.has(l) && !depth.has(l)) { depth.set(l, depth.get(p) + 1); next.push(l); }
    }
  }
  frontier = next;
}

// Duplicate titles/descriptions
const byTitle = new Map(), byDesc = new Map();
for (const [p, d] of pages) {
  byTitle.set(d.title, [...(byTitle.get(d.title) || []), p]);
  if (d.desc) byDesc.set(d.desc, [...(byDesc.get(d.desc) || []), p]);
}

console.log('=== PAGES:', pages.size, '===\n');

console.log('--- BROKEN INTERNAL LINKS (target not in build, not in _redirects) ---');
for (const [l, from] of broken) console.log(l, '  <- linked from', from.length, 'pages e.g.', from.slice(0, 2).join(', '));

console.log('\n--- ORPHANS / LOW INBOUND (excluding nav-linked; inbound counts include nav) ---');
const sorted = [...inbound.entries()].sort((a, b) => a[1] - b[1]);
for (const [p, n] of sorted.slice(0, 15)) console.log(String(n).padStart(4), p, 'depth=' + (depth.get(p) ?? 'UNREACHABLE'));

console.log('\n--- UNREACHABLE FROM HOME ---');
for (const p of paths) if (!depth.has(p)) console.log(p);

console.log('\n--- DEPTH > 2 ---');
for (const [p, d] of depth) if (d > 2) console.log(d, p);

console.log('\n--- DUPLICATE TITLES ---');
for (const [t, ps] of byTitle) if (ps.length > 1) console.log(JSON.stringify(t), ps);
console.log('\n--- DUPLICATE DESCRIPTIONS ---');
for (const [t, ps] of byDesc) if (ps.length > 1) console.log(ps);

console.log('\n--- MISSING / WEAK METAS ---');
for (const [p, d] of pages) {
  const issues = [];
  if (!d.title) issues.push('NO TITLE');
  if (d.title.length > 65) issues.push('TITLE ' + d.title.length + 'ch');
  if (!d.desc) issues.push('NO DESC');
  if (d.desc && (d.desc.length < 70 || d.desc.length > 165)) issues.push('DESC ' + d.desc.length + 'ch');
  if (!d.canonical) issues.push('NO CANONICAL');
  if (d.canonical && d.canonical !== SITE + p) issues.push('CANONICAL MISMATCH: ' + d.canonical);
  if (!d.h1) issues.push('NO H1');
  if (d.schemaTypes.includes('PARSE_ERROR')) issues.push('SCHEMA JSON ERROR');
  if (issues.length) console.log(p, '=>', issues.join(' | '));
}

console.log('\n--- THIN PAGES (<400 words, excl. calculators) ---');
for (const [p, d] of pages) if (d.words < 400) console.log(String(d.words).padStart(5), p);

console.log('\n--- SCHEMA COVERAGE ---');
const noFaq = [], noBreadcrumb = [];
for (const [p, d] of pages) {
  if (!d.schemaTypes.includes('BreadcrumbList') && p !== '/' && p !== '/404/') noBreadcrumb.push(p);
}
console.log('Pages missing BreadcrumbList:', noBreadcrumb.length);
noBreadcrumb.slice(0, 40).forEach((p) => console.log('  ', p));
