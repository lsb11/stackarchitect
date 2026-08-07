// Cloudflare Pages Edge Middleware — Host, Protocol & Trailing-Slash Canonicalisation
//
// WHY THIS CHANGED
// The previous version redirected www → apex but did NOT normalise the
// trailing slash. Because astro.config.mjs sets `trailingSlash: 'always'`,
// a request for:
//     https://www.stackarchitect.xyz/autocrat-quota-fix
// produced TWO redirects:
//     301 → https://stackarchitect.xyz/autocrat-quota-fix     (this middleware)
//     301 → https://stackarchitect.xyz/autocrat-quota-fix/    (Pages slash rule)
//
// GSC's 6-month export shows Google holding exactly those un-slashed www URLs
// (e.g. www.stackarchitect.xyz/autocrat-quota-fix, 982 impressions). Every hop
// slows consolidation and is a likely contributor to the "Redirect error" (19)
// and "Page with redirect" (7) buckets in the Coverage report.
//
// This version resolves host, protocol AND trailing slash in ONE 301.
//
// Deliberately NOT redirected:
//   • /api/*        — Pages Functions
//   • /go/*         — REVENUE CRITICAL. public/_redirects already declares
//                     both slash variants for every affiliate cloak. Adding a
//                     trailing-slash 301 here would insert an extra hop in
//                     front of the affiliate 302, so every partner click would
//                     become 301 → 302 instead of a single 302. Some affiliate
//                     networks drop tracking parameters across extra hops.
//   • paths with a file extension (.xml, .txt, .json, .png, .csv …) — these
//     must NOT gain a trailing slash or they 404. This was the main risk of
//     naively appending "/" to everything.

const PRIMARY_HOST = 'stackarchitect.xyz';

// Anything with an extension in the last segment is a file, not a page.
const FILE_RE = /\.[a-zA-Z0-9]{2,5}$/;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  let changed = false;

  // 1. Force HTTPS
  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    changed = true;
  }

  // 2. Force apex host (strip www.)
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.replace(/^www\./, '');
    changed = true;
  }

  // Safety: never rewrite a host we don't own the canonical for.
  if (url.hostname !== PRIMARY_HOST) {
    return changed ? Response.redirect(url.toString(), 301) : context.next();
  }

  // 3. Force trailing slash on page routes only
  const p = url.pathname;
  const isApi = p.startsWith('/api/');
  const isGo = p.startsWith('/go/');           // affiliate cloaks — see note above
  const isFile = FILE_RE.test(p.split('/').pop() || '');

  if (!isApi && !isGo && !isFile && !p.endsWith('/')) {
    url.pathname = p + '/';
    changed = true;
  }

  if (changed) {
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
