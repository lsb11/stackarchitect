// scripts/lib/edge-freshness.mjs — is Cloudflare's edge serving crawlers the
// page we last deployed? Pure helpers; the network lives in
// scripts/edge-freshness.mjs.
//
// WHY
// On 9 Oct 2026 a summarising fetcher showed the agentic guide's canonical URL
// with its 24 Sep content hours after the correction deployed, while a
// throwaway query string showed the 9 Oct content. That was read as Cloudflare
// serving crawlers stale HTML, and public/_headers did then send
// `Cloudflare-CDN-Cache-Control: max-age=31536000` on /* (from 941cfb4,
// 25 Jul). The first run of this check disproved it: every HTML response
// came back `cf-cache-status: DYNAMIC`, i.e. not cached by Cloudflare at all
// (Pages Functions middleware runs on every request), and the stale copy was
// the fetcher's own cache. The header was removed anyway; it did nothing
// useful and would start doing harm the day the middleware went away.
//
// The same run also showed every HTML page hashing differently on every
// request, bare or not: something injects per-request bytes outside <main>
// (Cloudflare's JS detection or beacon scripts do this). So pages are compared
// by what a crawler indexes, not by raw bytes: title, meta description,
// canonical, robots, JSON-LD, and <main> with scripts removed.
import crypto from 'node:crypto';

export const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);

// Bytes that legitimately differ between two fetches of a static page.
// Cloudflare's email obfuscation and its beacon inject per-request tokens.
export function normalise(html) {
  return String(html)
    .replace(/\/cdn-cgi\/[^"' )]+/g, '/cdn-cgi/x')
    .replace(/data-cfemail="[^"]*"/g, 'data-cfemail=""')
    .replace(/data-cf-beacon='[^']*'/g, "data-cf-beacon=''")
    .replace(/nonce="[^"]*"/g, 'nonce=""');
}

// What a search engine or AI crawler takes from the page.
export function fingerprint(html) {
  const h = normalise(html);
  const pick = (re) => (h.match(re) || [, ''])[1];
  const ld = [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  const main = pick(/<main\b[^>]*>([\s\S]*?)<\/main>/).replace(/<script\b[\s\S]*?<\/script>/g, '');
  return [
    pick(/<title>([\s\S]*?)<\/title>/),
    pick(/<meta name="description" content="([^"]*)"/),
    pick(/<link rel="canonical" href="([^"]*)"/),
    pick(/<meta name="robots" content="([^"]*)"/),
    ld,
    main || h,
  ].join('\n\u0000\n');
}

export function compare(bare, fresh) {
  const fa = fingerprint(bare);
  const fb = fingerprint(fresh);
  const a = sha(fa);
  const b = sha(fb);
  let at = -1;
  if (a !== b) { at = 0; while (at < fa.length && fa[at] === fb[at]) at++; }
  return { same: a === b, bare: a, fresh: b, diff: at < 0 ? null : { bare: fa.slice(at, at + 80), fresh: fb.slice(at, at + 80) } };
}

// A long edge TTL on HTML is what caused it. Header blocks in _headers whose
// path pattern can match an HTML page must not set one.
export function longEdgeTtlOnHtml(headersFile) {
  const out = [];
  let path = null;
  for (const line of headersFile.split('\n')) {
    if (/^\S/.test(line)) { path = line.trim(); continue; }
    const m = line.match(/^\s+(Cloudflare-CDN-Cache-Control|CDN-Cache-Control)\s*:\s*(.*)$/i);
    if (!m || !path) continue;
    const htmlish = !/\.[a-z0-9]+$/i.test(path) || /\.html?$/i.test(path);
    const ttl = Number(m[2].match(/(?:s-)?max-age=(\d+)/i)?.[1] ?? 0);
    if (htmlish && ttl > 300) out.push({ path, header: m[1], ttl });
  }
  return out;
}
