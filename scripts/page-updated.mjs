#!/usr/bin/env node
// scripts/page-updated.mjs — maintains src/data/page-updated.json, the one
// source for every page's visible "Updated <date>" and its JSON-LD dateModified.
//
// WHY A FILE AND NOT `git log` AT BUILD TIME (2026-09-24)
// Until this date the author card on 55 pages said "Last reviewed 2 September
// 2026", the same date on every page, and each page's schema carried its own
// hand-typed dateModified that nobody bumped. The honest date for a page is
// when its content last changed, and the nearest thing git knows is the last
// commit to its source file.
//
// But reading git at build time gets it wrong in the common case: a sitewide
// sweep that removes a button or rewords a disclosure touches every page file
// and would stamp every page "updated today". So the git date is taken once,
// recorded here, and then moved forward only for a page whose content was
// really rewritten:
//
//   node scripts/page-updated.mjs --init             # (re)seed every route from git
//   node scripts/page-updated.mjs --touch /route/ …  # this page was rewritten today
//   node scripts/page-updated.mjs --check            # verify, exit 1 on failure
//
// --check fails when a sitemap route has no entry, or when an entry is LATER
// than the last change to its source file (the file's last commit date, or
// today when it has uncommitted changes). A page cannot have been updated
// after its file last changed. --check does not run in `npm run build`; it is
// in `npm test`, because it needs git history that a shallow CI clone may lack.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const FILE = 'src/data/page-updated.json';

/** Source file behind a route, or null when the route is generated. */
export function sourceFor(route) {
  const slug = route.replace(/^\/|\/$/g, '');
  const candidates = route === '/'
    ? ['src/pages/index.astro']
    : [
        `src/pages/${slug}.astro`,
        `src/pages/${slug}/index.astro`,
        slug.startsWith('blog/') ? `src/content/blog/${slug.slice(5)}.md` : null,
      ].filter(Boolean);
  return candidates.find((f) => existsSync(f)) ?? null;
}

const today = () => new Date().toISOString().slice(0, 10);

/** The date this file last changed: its last commit, or today if it is dirty. */
export function lastChange(file) {
  const dirty = execFileSync('git', ['status', '--porcelain', '--', file], { encoding: 'utf8' }).trim();
  if (dirty) return today();
  const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { encoding: 'utf8' }).trim();
  return out || null;
}

const read = () => (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {});
const write = (map) => {
  const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(FILE, JSON.stringify(sorted, null, 2) + '\n');
};
const sitemapRoutes = () =>
  [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === '--init') {
    // Routes come from the arguments, or from the current sitemap.
    const routes = args.length ? args : sitemapRoutes();
    const map = read();
    for (const r of routes) {
      const f = sourceFor(r);
      if (!f) { console.error(`no source file for ${r}`); process.exitCode = 1; continue; }
      map[r] = execFileSync('git', ['log', '-1', '--format=%cs', '--', f], { encoding: 'utf8' }).trim();
    }
    write(map);
    console.log(`page-updated: seeded ${routes.length} route(s) from git`);
  } else if (cmd === '--touch') {
    const map = read();
    for (const r of args) map[r] = today();
    write(map);
    console.log(`page-updated: ${args.join(', ')} → ${today()}`);
  } else if (cmd === '--check') {
    const map = read();
    const problems = [];
    for (const r of sitemapRoutes()) {
      if (!map[r]) { problems.push(`${r}: no entry in ${FILE}`); continue; }
      const f = sourceFor(r);
      const changed = f && lastChange(f);
      if (changed && map[r] > changed) problems.push(`${r}: says ${map[r]}, but ${f} last changed ${changed}`);
    }
    if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
    console.log('page-updated: every sitemap route dated, none later than its source file');
  } else {
    console.error('usage: page-updated.mjs --init [routes…] | --touch <routes…> | --check');
    process.exit(2);
  }
}
