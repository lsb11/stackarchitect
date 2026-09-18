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
//
// WHY THIS CHANGED (2026-09-18) — LEGACY REDIRECTS RESOLVE HERE NOW
// This middleware is the ONLY slash enforcer. The zone-level "enforce trailing
// slash" Cloudflare Redirect Rule has been deleted from the dashboard, because
// it ran upstream of this Worker and nothing in the repo could preempt it.
//
// Both that rule and this file appended the slash BEFORE public/_redirects was
// consulted — the Pages asset server that serves _redirects runs last. So a
// slashless legacy URL cost two 301s: one to add the slash, one to reach the
// real destination. 110 of 231 literal legacy sources behaved that way, and
// every slashless line in _redirects was unreachable dead code.
//
// The fix is ordering: consult the compiled legacy map FIRST, and only append a
// slash when the path is not a legacy source. Host, protocol and destination
// are then resolved together into a single 301.
//
// public/_redirects is still deployed and is still the source of truth. It is
// the fallback if this Function fails to run, and /go/* cloaks still rely on it.
// functions/_legacy-redirects.js is generated from it by
// scripts/gen-legacy-redirects.mjs; tests/legacy-redirects.test.js fails if the
// two drift.
import { resolveLegacy } from './_legacy-redirects.js';

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

  // LEGACY MAP FIRST, slash second. Reversing these two is what produced the
  // two-hop chains. /go/* and /api/* are never looked up: the cloaks belong to
  // the asset server, and /api/* are live Functions, not legacy paths.
  if (!isApi && !isGo) {
    const hit = resolveLegacy(p);
    // A rule whose destination is the request we already have would loop.
    if (hit && hit.to !== p) {
      const dest = new URL(hit.to, url);
      // Carry the query string across. Inbound legacy links arrive with utm_*
      // and ?ref= attached, and dropping those loses the attribution that made
      // the link worth preserving.
      if (url.search && !dest.search) dest.search = url.search;
      return Response.redirect(dest.toString(), hit.status);
    }
  }

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
