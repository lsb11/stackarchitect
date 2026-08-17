// Cloudflare Pages Edge Middleware — Host, Protocol & Trailing-Slash Canonicalisation
//
// WHY THIS CHANGED (2026-08-17)
// The previous version's non-primary-host branch fell through to
// `context.next()`, which SERVED the full site on any host that is neither the
// apex nor a www.* subdomain. That included every per-deployment preview host
// (`<hash>.stackarchitect.pages.dev`) — each one an indexable duplicate of the
// entire site. Those hosts are now redirected to the apex instead of served.
//
// The single-hop www/protocol/trailing-slash behaviour is UNCHANGED and remains
// verified working:
//     www.stackarchitect.xyz/autocrat-quota-fix
//         → one 301 → stackarchitect.xyz/autocrat-quota-fix/
//     stackarchitect.xyz/autocrat-quota-fix
//         → one 301 → stackarchitect.xyz/autocrat-quota-fix/
//
// Deliberately NOT slash-redirected:
//   • /api/*        — Pages Functions
//   • /go/*         — REVENUE CRITICAL. public/_redirects already declares
//                     both slash variants for every affiliate cloak. Adding a
//                     trailing-slash 301 here would insert an extra hop in
//                     front of the affiliate 302, so every partner click would
//                     become 301 → 302 instead of a single 302. Some affiliate
//                     networks drop tracking parameters across extra hops.
//   • paths with a file extension (.xml, .txt, .json, .png, .csv …) — these
//     must NOT gain a trailing slash or they 404.

const PRIMARY_HOST = 'stackarchitect.xyz';
const FILE_RE = /\.[a-zA-Z0-9]{2,5}$/;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  let changed = false;

  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    changed = true;
  }

  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.replace(/^www\./, '');
    changed = true;
  }

  // Any remaining non-primary host (pages.dev, preview deployments, stale
  // custom domains) is redirected to the apex rather than served.
  if (url.hostname !== PRIMARY_HOST) {
    url.hostname = PRIMARY_HOST;
    changed = true;
  }

  const p = url.pathname;
  const isApi = p.startsWith('/api/');
  const isGo = p.startsWith('/go/');   // affiliate cloaks — must not gain a slash hop
  const isFile = FILE_RE.test(p.split('/').pop() || '');

  if (!isApi && !isGo && !isFile && !p.endsWith('/')) {
    url.pathname = p + '/';
    changed = true;
  }

  if (changed) {
    return Response.redirect(url.toString(), 301);
  }

  const response = await context.next();
  const host = new URL(context.request.url).hostname;
  if (host !== PRIMARY_HOST) {
    const patched = new Response(response.body, response);
    patched.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return patched;
  }
  return response;
}
