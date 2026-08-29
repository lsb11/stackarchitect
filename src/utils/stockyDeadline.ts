/**
 * Stocky end of service — one date, one predicate, evaluated at BUILD time.
 *
 * WHY BUILD TIME AND NOT CLIENT SIDE
 * pro.astro and Countdown.astro previously swapped their post-deadline copy in
 * a `setInterval` after hydration. A crawler that renders no JS — which is the
 * common case for the LLM fetchers this site is written for — sees only the
 * pre-deadline markup, so on 1 September the indexed copy still reads "Stocky
 * shuts down in -- Days". Rendering the branch at build time means the served
 * HTML is correct for whichever side of the date it was built on.
 *
 * THE TRADE-OFF THIS BUYS: a static build does not re-evaluate itself. A site
 * built on 30 August and not redeployed keeps pre-deadline copy indefinitely.
 * Schedule a deploy for 1 September 2026 — the same caveat stocky-swap.astro
 * already documents at its own `shutdownPassed`.
 *
 * Not every page should consume this. stocky-alternative.astro is deliberately
 * evergreen: it refers to the shutdown by date rather than tense and forks the
 * reader on state, so it needs no branch and must not gain one.
 */

/** Shopify's stated end of service for Stocky. */
export const STOCKY_EOL_ISO = '2026-08-31T23:59:59Z';

/** Long form, as written in prose: "August 31, 2026". */
export const STOCKY_EOL_LONG = 'August 31, 2026';

/** Short form, as written in labels and bands: "31 Aug 2026". */
export const STOCKY_EOL_SHORT = '31 Aug 2026';

/**
 * True once Stocky's end of service has passed.
 *
 * @param now Epoch ms to compare against. Defaults to `Date.now()`; the
 *            parameter exists so tests can pin both sides of the boundary.
 */
export function isPostShutdown(now: number = Date.now()): boolean {
  return now > new Date(STOCKY_EOL_ISO).getTime();
}
