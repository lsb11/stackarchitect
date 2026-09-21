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
 * Click counting (see _clicks.js) hangs off waitUntil, so it runs after the
 * 302 is already on its way back and cannot delay or fail a click. Both exit
 * paths log — the no-source path too, because a /go/ hit with no ?source= is
 * an old link or a hand-typed URL and that is worth seeing.
 *
 * Both /go/x and /go/x/ land here: functions/_middleware.js exempts /go/*
 * from trailing-slash normalisation, so the catch-all sees either shape and
 * empty segments are filtered out.
 *
 * 302 and not 301 on purpose. These are marketing destinations that change;
 * a cached 301 on an affiliate cloak is unfixable in the reader's browser.
 *
 * CRAWLER GATE — see _bots.js for the rule and the evidence behind it. A
 * request classified as a crawler never reaches the 302 and is never written
 * to `clicks`; it gets a 200 naming the vendor, and is counted in `bot_hits`
 * instead. The gate sits after the slug lookup, so an unknown slug still falls
 * through to _redirects exactly as before, and inside the same try/catch, so a
 * fault in the classifier costs a redirect no more than a fault anywhere else
 * here does.
 */
import { CLOAKS, sanitiseSource } from './_cloaks.js';
import { landingFrom, recordClick, recordBotHit, NO_REFERER } from './_clicks.js';
import { isLikelyBot, botResponse } from './_bots.js';

export async function onRequest(context) {
  try {
    const { params, request, next, env, waitUntil } = context;

    const segments = Array.isArray(params.slug) ? params.slug : [params.slug];
    const slug = segments.filter(Boolean).join('/').toLowerCase();

    const cloak = CLOAKS[slug];
    if (!cloak) return next();

    const url = new URL(request.url);
    const source = sanitiseSource(url.searchParams.get('source'));
    const referer = request.headers.get('Referer');

    // Counted before every return, so the exit paths cannot drift. waitUntil
    // is not guaranteed present (it is absent in the unit tests, and in any
    // runtime that does not implement it), so the call is optional and its
    // absence costs a statistic rather than throwing on the revenue path.
    const row = {
      slug,
      source: source || NO_REFERER,
      landing: landingFrom(referer, url.origin),
    };
    const bot = isLikelyBot(request.headers.get('User-Agent'), referer);
    const count = bot ? recordBotHit(env?.DB, row) : recordClick(env?.DB, row);
    if (typeof waitUntil === 'function') waitUntil(count);

    // A crawler gets a real page and the vendor's own URL, never the
    // affiliate destination — so the network records no click for it.
    if (bot) return botResponse(cloak);

    if (!source) return redirect(cloak.destination);

    const target = new URL(cloak.destination);
    if (!target.searchParams.has(cloak.subidParam)) {
      target.searchParams.set(cloak.subidParam, source);
    }
    return redirect(target.toString());
  } catch {
    // Never let an error here cost a click — drop through to _redirects.
    return context.next();
  }
}

/**
 * The 302, built by hand rather than with Response.redirect, for one reason:
 * the header. Now that /go/* answers a crawler differently from a reader, a
 * cached response is a response served to the wrong one — and the expensive
 * direction is a cached bot page replayed to a reader, which silently costs
 * every click behind it. no-store on both branches removes the question.
 */
function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Cache-Control': 'no-store', Vary: 'User-Agent, Referer' },
  });
}
