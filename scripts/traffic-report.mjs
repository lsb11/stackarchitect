#!/usr/bin/env node
// scripts/traffic-report.mjs — what the cookieless counters say, in one screen.
//
//   npm run traffic            # last 7 days
//   npm run traffic -- 28      # last 28 days
//
// Reads D1 through wrangler (you must be logged in: `npx wrangler login`).
// Tables: pageviews (schema/006-pageviews.sql) and clicks (schema/003, /005).
// Unlike GA4, these count every visitor whether or not they accepted cookies,
// because they store nothing about the visitor. Crawler names are what the
// client claims to be; Search Console's Crawl stats are Google's own figures.
import { execFileSync } from 'node:child_process';

const days = Number(process.argv[2] || 7);
const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);

function q(sql) {
  try {
    const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'attribution-gap', '--remote', '--json', '--command', sql],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return JSON.parse(out)[0]?.results ?? [];
  } catch (e) {
    const msg = String(e.stderr || e.message);
    if (/no such table: pageviews/.test(msg)) {
      console.error('✗ The pageviews table does not exist yet. Run:\n  npx wrangler d1 execute attribution-gap --remote --file schema/006-pageviews.sql');
      process.exit(1);
    }
    throw new Error(msg.split('\n').slice(-6).join('\n'));
  }
}
const table = (rows, cols) => {
  if (!rows.length) { console.log('  (none yet)'); return; }
  const w = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length)));
  console.log('  ' + cols.map((c, i) => c.padEnd(w[i])).join('  '));
  for (const r of rows) console.log('  ' + cols.map((c, i) => String(r[c] ?? '').padEnd(w[i])).join('  '));
};
const AI = "('chatgpt.com','chat.openai.com','perplexity.ai','claude.ai','gemini.google.com','copilot.microsoft.com','bing.com','you.com','phind.com','meta.ai')";

console.log(`\nTraffic since ${since} (cookieless counters; every visitor, no consent needed)\n`);

console.log('1. Who fetched pages (HTTP 200 pages only)');
table(q(`SELECT agent, SUM(n) AS fetches, COUNT(DISTINCT path) AS pages FROM pageviews WHERE day >= '${since}' AND status = '200' GROUP BY agent ORDER BY fetches DESC`), ['agent', 'fetches', 'pages']);

console.log('\n2. Search and AI crawlers: pages fetched, and the last day each was seen');
table(q(`SELECT agent, path, SUM(n) AS fetches, MAX(day) AS last_seen FROM pageviews WHERE day >= '${since}' AND agent IN ('Googlebot','Bingbot','GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-User','Claude-SearchBot','PerplexityBot','Perplexity-User','Applebot') GROUP BY agent, path ORDER BY agent, fetches DESC LIMIT 120`), ['agent', 'path', 'fetches', 'last_seen']);

console.log('\n3. Where human readers came from');
table(q(`SELECT ref, SUM(n) AS views, CASE WHEN ref IN ${AI} THEN 'AI assistant' ELSE '' END AS note FROM pageviews WHERE day >= '${since}' AND agent = 'human' AND status = '200' GROUP BY ref ORDER BY views DESC LIMIT 25`), ['ref', 'views', 'note']);

console.log('\n4. Human views and partner clicks per page (click-through = clicks / views)');
let clicks;
try {
  clicks = q(`SELECT landing AS path, SUM(n) AS clicks FROM clicks WHERE day >= '${since}' AND ua_class = 'browser-like' AND sec_fetch_mode = 'navigate' GROUP BY landing`);
} catch {
  clicks = q(`SELECT landing AS path, SUM(n) AS clicks FROM clicks WHERE day >= '${since}' GROUP BY landing`);
  console.log('  (clicks are unfiltered: schema/005 is not applied, so bots are not separated from readers)');
}
const byPath = Object.fromEntries(clicks.map((c) => [c.path, c.clicks]));
const views = q(`SELECT path, SUM(n) AS views FROM pageviews WHERE day >= '${since}' AND agent = 'human' AND status = '200' GROUP BY path ORDER BY views DESC LIMIT 40`);
table(views.map((v) => ({ ...v, clicks: byPath[v.path] ?? 0, ctr: v.views ? `${(((byPath[v.path] ?? 0) / v.views) * 100).toFixed(1)}%` : '' })), ['path', 'views', 'clicks', 'ctr']);

console.log('\n5. Crawlers still requesting retired URLs (each costs a redirect hop)');
table(q(`SELECT agent, path, SUM(n) AS hits FROM pageviews WHERE day >= '${since}' AND status IN ('301','302','308') AND path NOT IN ('(redirect)') GROUP BY agent, path ORDER BY hits DESC LIMIT 20`), ['agent', 'path', 'hits']);
console.log('');
