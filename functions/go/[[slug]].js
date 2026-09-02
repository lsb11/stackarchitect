/**
 * /go/* affiliate cloak resolver.
 *
 * This route exists for exactly one reason: to carry a per-placement
 * ?source= tag through to the partner, which public/_redirects cannot do.
 * Cloudflare discards an incoming query string when the static rule's
 * destination already has one, so every ?source= on a static cloak was
 * dropped at the edge and no dashboard ever saw it.
 *
 * SAFETY POSTURE — this is the revenue path, so every failure mode falls back
 * rather than breaking:
 *
 *   - unknown slug            -> next(), i.e. public/_redirects, then 404
 *   - no ?source=             -> the destination exactly as _redirects has it
 *   - malformed source        -> dropped, destination unchanged
 *   - destination already has -> left alone; we never overwrite a param the
 *     that param name            network set, referral credential included
 *   - anything throws         -> next(), so the static rule still earns
 *
 * Both /go/x and /go/x/ land here: functions/_middleware.js exempts /go/*
 * from trailing-slash normalisation, so the catch-all sees either shape and
 * empty segments are filtered out.
 *
 * 302 and not 301 on purpose. These are marketing destinations that change;
 * a cached 301 on an affiliate cloak is unfixable in the reader's browser.
 */
import { CLOAKS, sanitiseSource } from './_cloaks.js';

export async function onRequest(context) {
  try {
    const { params, request, next } = context;

    const segments = Array.isArray(params.slug) ? params.slug : [params.slug];
    const slug = segments.filter(Boolean).join('/').toLowerCase();

    const cloak = CLOAKS[slug];
    if (!cloak) return next();

    const source = sanitiseSource(new URL(request.url).searchParams.get('source'));
    if (!source) return Response.redirect(cloak.destination, 302);

    const target = new URL(cloak.destination);
    if (!target.searchParams.has(cloak.subidParam)) {
      target.searchParams.set(cloak.subidParam, source);
    }
    return Response.redirect(target.toString(), 302);
  } catch {
    // Never let an error here cost a click — drop through to _redirects.
    return context.next();
  }
}
