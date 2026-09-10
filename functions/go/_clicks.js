/**
 * _clicks.js — click counting for the /go/* affiliate cloaks.
 *
 * Underscore-prefixed, so Pages does not route it; it is a module, not an
 * endpoint.
 *
 * WHAT THIS COUNTS AND WHAT IT DELIBERATELY DOES NOT
 * One number per (day, cloak, source tag, landing page): how many times that
 * placement was clicked. No cookie, no IP, no user agent, no third-party
 * script, and no identifier of any kind — which means two clicks from the same
 * reader on the same day count twice. That is the intended trade: the metric
 * is CLICKS, not visitors, because deduplicating to visitors requires exactly
 * the identifier this design exists to avoid storing. Do not "improve" it by
 * adding one.
 *
 * WHY IT AGGREGATES AT WRITE TIME
 * An UPSERT incrementing a counter, rather than one row per click. Rows are
 * then bounded by (placements × landing pages × days) instead of by traffic,
 * so the table needs no retention job and no cleanup cron to stay small.
 *
 * CARDINALITY IS BOUNDED ON PURPOSE
 * `landing` is the path of the page the click came from, and only ever one of:
 *   - a same-origin path, query and fragment stripped
 *   - "(external)" — a Referer from another site. The specific site is dropped;
 *     the column is "which of OUR pages sent this", and letting arbitrary
 *     external URLs into a primary key makes the row count unbounded.
 *   - "(none)"     — no Referer at all. Kept rather than dropped: that is
 *     direct traffic, in-app browsers and clients that strip the header, and
 *     discarding it would silently under-count the cloaks most used off-site.
 *
 * The same "(none)" applies to `source` for a /go/ hit carrying no ?source=.
 * Every rendered link on the site has one, so those hits are old links and
 * hand-typed URLs — worth seeing, not worth losing.
 *
 * FAILURE POSTURE
 * This is the revenue path. The write runs inside waitUntil AFTER the 302 has
 * been returned, and swallows its own errors. A missing binding, a D1 outage
 * or a malformed row costs a statistic and never costs a click.
 */

/** Sentinels, so a reader of the table never has to guess what a blank meant. */
export const NO_REFERER = '(none)';
export const EXTERNAL = '(external)';

const MAX_LANDING = 128;

/**
 * The landing page a click came from, reduced to one of the three shapes
 * above.
 *
 * @param {string|null|undefined} referer Raw Referer header.
 * @param {string} origin The site's own origin, to tell ours from theirs.
 */
export function landingFrom(referer, origin) {
  if (typeof referer !== 'string' || referer === '') return NO_REFERER;
  let url;
  try {
    url = new URL(referer);
  } catch {
    // A Referer that will not parse tells us nothing about which page it was.
    return NO_REFERER;
  }
  let self;
  try {
    self = new URL(origin);
  } catch {
    return EXTERNAL;
  }
  if (url.host !== self.host) return EXTERNAL;
  // Path only: the query is where campaign params and reader-specific noise
  // live, and neither belongs in a primary key.
  return url.pathname.slice(0, MAX_LANDING) || '/';
}

/** UTC date stamp. The window is a calendar day, not a rolling 24 hours. */
export function dayFrom(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** The UPSERT, as one statement. Exported so a test can assert its shape. */
export const UPSERT_SQL =
  'INSERT INTO clicks (day, slug, source, landing, n) VALUES (?, ?, ?, ?, 1) ' +
  'ON CONFLICT(day, slug, source, landing) DO UPDATE SET n = n + 1';

/**
 * Count one click. Never throws, never returns a rejected promise.
 *
 * @param {object} db   The D1 binding (context.env.DB), or anything falsy to
 *                      skip — local `astro dev` has no binding and must not
 *                      log an error on every affiliate click.
 * @param {{slug: string, source: string, landing: string, day?: string}} click
 */
export async function recordClick(db, { slug, source, landing, day }) {
  if (!db || typeof db.prepare !== 'function') return false;
  try {
    await db
      .prepare(UPSERT_SQL)
      .bind(day ?? dayFrom(), slug, source || NO_REFERER, landing)
      .run();
    return true;
  } catch {
    // A statistic is not worth a log line on the revenue path.
    return false;
  }
}
