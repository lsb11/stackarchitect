// scripts/lib/edge-freshness.mjs — is Cloudflare's edge serving crawlers the
// page we last deployed? Pure helpers; the network lives in
// scripts/edge-freshness.mjs.
//
// WHY (found 9 Oct 2026)
// From 25 Jul 2026 (941cfb4) public/_headers sent every response
//   Cloudflare-CDN-Cache-Control: public, max-age=31536000
// telling Cloudflare's edge it could keep HTML for a year. On 9 Oct the
// agentic guide's canonical URL still served the 24 Sep version (Google
// listed for UK stores, a date of 24 Sep) hours after the correction
// deployed, while the same URL with a throwaway query string served the
// 9 Oct version. /llms.txt served 27 URLs at its canonical URL and 56 with a
// query string. Crawlers fetch the canonical URL, so for up to eleven weeks
// Googlebot, Bingbot and AI crawlers could have been read content that had
// since been fixed, including figures this site had retracted.
//
// A deploy that lands is not the same as a deploy that crawlers see. The
// check: fetch each canonical URL twice, once bare and once with a unique
// query string (which the edge has never cached, so it comes from the
// current deploy), and require the same bytes.
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

export function compare(bare, fresh) {
  const a = sha(normalise(bare));
  const b = sha(normalise(fresh));
  return { same: a === b, bare: a, fresh: b };
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
