#!/usr/bin/env node
/**
 * check-hosts.mjs — diagnose the duplicate-host / redirect-chain problem.
 *
 * GSC (6-month, domain property) shows impressions split across FOUR hosts:
 *   www.stackarchitect.xyz   ← the bulk of impressions
 *   stackarchitect.xyz       ← the canonical, sitemap, and internal-link target
 *   tools.stackarchitect.xyz ← legacy
 *   audit.stackarchitect.xyz ← legacy
 *
 * Meanwhile the apex URL-prefix property reports ~1 indexed page. That is the
 * signature of Google having indexed the www variants while every canonical
 * signal points at the apex.
 *
 * This script follows redirects one hop at a time and prints the exact chain,
 * status codes, and the canonical tag of the final document — so you can see
 * whether the 301s are live, and whether any chain is longer than one hop.
 *
 * Run:  node scripts/check-hosts.mjs
 * (no dependencies — plain Node 18+)
 */

const PATHS = [
  '/',
  '/capi-shield/',
  '/autocrat-quota-fix',            // note: no trailing slash — as GSC has it
  '/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations',
  '/stocky-swap/',
  '/apps/',
];

const HOSTS = [
  'https://www.stackarchitect.xyz',
  'https://stackarchitect.xyz',
];

const LEGACY_HOSTS = [
  'https://tools.stackarchitect.xyz/',
  'https://audit.stackarchitect.xyz/',
];

const MAX_HOPS = 8;

async function trace(startUrl) {
  const chain = [];
  let url = startUrl;

  for (let i = 0; i < MAX_HOPS; i++) {
    let res;
    try {
      res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'StackArchitect-HostCheck/1.0' } });
    } catch (err) {
      chain.push({ url, status: 'ERR', note: err.message });
      return chain;
    }

    const loc = res.headers.get('location');
    chain.push({ url, status: res.status, location: loc });

    if (res.status >= 300 && res.status < 400 && loc) {
      url = new URL(loc, url).toString();
      continue;
    }

    // Terminal response — grab the canonical tag if it's HTML.
    if (res.ok && (res.headers.get('content-type') || '').includes('text/html')) {
      const html = await res.text();
      const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
      chain[chain.length - 1].canonical = m ? m[1] : '(none)';
      chain[chain.length - 1].robots = robots ? robots[1] : '(none)';
    }
    return chain;
  }
  chain.push({ url, status: 'LOOP?', note: `exceeded ${MAX_HOPS} hops` });
  return chain;
}

function render(chain) {
  const hops = chain.length - 1;
  chain.forEach((c, i) => {
    const arrow = i === 0 ? '   ' : '  ↳';
    let line = `${arrow} [${c.status}] ${c.url}`;
    console.log(line);
    if (c.canonical !== undefined) {
      const finalUrl = c.url.replace(/\/$/, '');
      const canon = String(c.canonical).replace(/\/$/, '');
      const match = finalUrl === canon ? '✓ matches final URL' : '✗ DIFFERS from final URL';
      console.log(`       canonical: ${c.canonical}  ${match}`);
      console.log(`       robots:    ${c.robots}`);
    }
    if (c.note) console.log(`       note: ${c.note}`);
  });

  if (hops === 0) console.log(`       → 0 redirects`);
  else if (hops === 1) console.log(`       → 1 redirect (ideal)`);
  else console.log(`       → ⚠ ${hops} redirects — CHAIN. Collapse to a single hop.`);
  console.log('');
}

console.log('\n=== HOST + REDIRECT CHAIN CHECK ===\n');

for (const path of PATHS) {
  for (const host of HOSTS) {
    const start = host + path;
    console.log(`── ${start}`);
    render(await trace(start));
  }
}

console.log('=== LEGACY SUBDOMAINS (still indexed per GSC) ===\n');
for (const url of LEGACY_HOSTS) {
  console.log(`── ${url}`);
  render(await trace(url));
}

console.log(`
WHAT YOU WANT TO SEE
  www.stackarchitect.xyz/<path>   → exactly ONE 301 → https://stackarchitect.xyz/<path>/
  stackarchitect.xyz/<path>       → 200, canonical == the URL itself
  tools./audit. subdomains        → 301 to the equivalent apex page, or removed entirely

RED FLAGS
  • Two or more hops (e.g. www→apex then apex→apex-with-slash). Each hop
    dilutes the signal and slows consolidation. Fix by making the middleware
    add the trailing slash in the SAME redirect.
  • www returning 200 instead of 301 — Google will keep both hosts indexed.
  • Legacy subdomains returning 200 — they compete with the apex for the
    same keywords.
`);
