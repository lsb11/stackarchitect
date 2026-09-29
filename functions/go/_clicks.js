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
 * REQUEST SIGNALS (schema/005-click-signals.sql)
 * Five more key columns, so a click can be told from a fetch:
 *   - sec_fetch_mode, sec_fetch_dest, sec_fetch_site: the browser's
 *     Sec-Fetch-* header, or "absent" when it was not sent. Only the values the
 *     Fetch Metadata spec defines are stored as themselves; anything else,
 *     including an empty header, is stored as "other". A header is whatever the
 *     sender typed, and an unbounded value has no place in a primary key.
 *   - is_prefetch: "true" when Sec-Purpose contains "prefetch", else "false".
 *   - ua_class: one of six coarse buckets from uaClass() in _bots.js. The
 *     User-Agent string is read there and never reaches this file's writes.
 * Why these are safe to keep: every one is a short value from a fixed list
 * that thousands of other browsers send identically. None of them can tell
 * one visitor from another, which is the line the rest of this file holds.
 * Rows written before the migration read "unknown" in all five, so an old row
 * is visibly old rather than counted as a category.
 *
 * FAILURE POSTURE
 * This is the revenue path. The write runs inside waitUntil AFTER the 302 has
 * been returned, and swallows its own errors. A missing binding, a D1 outage
 * or a malformed row costs a statistic and never costs a click.
 */

/** Sentinels, so a reader of the table never has to guess what a blank meant. */
export const NO_REFERER = '(none)';
import { uaClass } from './_bots.js';

export const EXTERNAL = '(external)';

/** Sentinel for a Sec-Fetch-* header the request did not send. */
export const ABSENT = 'absent';

/** Sentinel for a Sec-Fetch-* value the Fetch Metadata spec does not define. */
export const OTHER = 'other';

// The values each header may take (w3c.github.io/webappsec-fetch-metadata and
// the Fetch standard's request destinations).
const FETCH_VALUES = {
  mode: new Set(['navigate', 'same-origin', 'no-cors', 'cors', 'websocket']),
  dest: new Set([
    'audio', 'audioworklet', 'document', 'embed', 'empty', 'fencedframe',
    'font', 'frame', 'iframe', 'image', 'json', 'manifest', 'object',
    'paintworklet', 'report', 'script', 'serviceworker', 'sharedworker',
    'style', 'track', 'video', 'webidentity', 'worker', 'xslt',
  ]),
  site: new Set(['cross-site', 'same-origin', 'same-site', 'none']),
};

function fetchHeader(headers, kind) {
  const v = headers.get(`Sec-Fetch-${kind}`);
  if (v === null) return ABSENT;
  const lower = v.trim().toLowerCase();
  return FETCH_VALUES[kind.toLowerCase()].has(lower) ? lower : OTHER;
}

/**
 * The five request signals for one hit, from its headers. Never throws: the
 * handler's catch drops a request through to _redirects, so an exception here
 * would change where a click goes. On any failure every signal is "unknown".
 *
 * @param {Headers} headers The request's headers.
 */
export function signalsFrom(headers) {
  try {
    return {
      sec_fetch_mode: fetchHeader(headers, 'Mode'),
      sec_fetch_dest: fetchHeader(headers, 'Dest'),
      sec_fetch_site: fetchHeader(headers, 'Site'),
      is_prefetch: /prefetch/i.test(headers.get('Sec-Purpose') ?? '') ? 'true' : 'false',
      ua_class: uaClass(headers.get('User-Agent')),
    };
  } catch {
    return {
      sec_fetch_mode: 'unknown',
      sec_fetch_dest: 'unknown',
      sec_fetch_site: 'unknown',
      is_prefetch: 'unknown',
      ua_class: 'unknown',
    };
  }
}

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

/** The key columns after the day, in bind order. */
export const SIGNAL_COLUMNS = ['sec_fetch_mode', 'sec_fetch_dest', 'sec_fetch_site', 'is_prefetch', 'ua_class'];
const KEY = ['day', 'slug', 'source', 'landing', ...SIGNAL_COLUMNS];

/** The UPSERT, as one statement. Exported so a test can assert its shape. */
export const UPSERT_SQL = upsertInto('clicks', KEY);

/**
 * The same UPSERT against `bot_hits` (schema/004-bot-hits.sql): requests the
 * crawler gate in _bots.js answered with a 200 instead of the affiliate 302.
 * A separate table, not a column, so `clicks` stays the count of requests that
 * actually reached a partner and needs no filter to read correctly.
 */
export const BOT_UPSERT_SQL = upsertInto('bot_hits', KEY);

/**
 * TEMPORARY. The four-column statements the tables took before
 * schema/005-click-signals.sql. Added in the commit "Record request
 * classification on /go/ clicks to identify non-human traffic", so that
 * clicks deployed before the migration is run are still counted.
 * REMOVE these, isPreMigration() and the retry in upsert() once schema/005 is
 * confirmed applied to the live database (docs/AFFILIATE-CLICKS.md,
 * "Verifying schema/005").
 */
export const LEGACY_UPSERT_SQL = upsertInto('clicks', KEY.slice(0, 4));
export const LEGACY_BOT_UPSERT_SQL = upsertInto('bot_hits', KEY.slice(0, 4));

/** Both counters are the same statement over a different table. */
function upsertInto(table, cols) {
  return (
    `INSERT INTO ${table} (${cols.join(', ')}, n) VALUES (${cols.map(() => '?').join(', ')}, 1) ` +
    `ON CONFLICT(${cols.join(', ')}) DO UPDATE SET n = n + 1`
  );
}

/**
 * TEMPORARY, with the legacy statements above. True only for the error SQLite
 * gives when a statement names one of the new columns and the table does not
 * have it yet: "table clicks has no column named sec_fetch_mode", or "no such
 * column: sec_fetch_mode". Any other error is a real fault in the new write
 * and must not be retried in a form that would hide it.
 */
export function isPreMigration(err) {
  const msg = String(err?.message ?? err ?? '');
  return new RegExp(`no (column named|such column:) (${SIGNAL_COLUMNS.join('|')})\\b`).test(msg);
}

/**
 * Count one click. Never throws, never returns a rejected promise.
 *
 * @param {object} db   The D1 binding (context.env.DB), or anything falsy to
 *                      skip — local `astro dev` has no binding and must not
 *                      log an error on every affiliate click.
 * @param {object} click slug, source, landing, optional day, and the five
 *                       signals from signalsFrom(). A missing signal is
 *                       stored as "unknown".
 */
export async function recordClick(db, click) {
  return upsert(db, UPSERT_SQL, LEGACY_UPSERT_SQL, click);
}

/**
 * Count one gated crawler hit. Same contract as recordClick in every respect:
 * never throws, never returns a rejected promise, and a missing binding costs
 * a statistic rather than the response.
 *
 * @param {object} db   The D1 binding (context.env.DB), or anything falsy.
 * @param {object} hit  Same shape as recordClick's click.
 */
export async function recordBotHit(db, hit) {
  return upsert(db, BOT_UPSERT_SQL, LEGACY_BOT_UPSERT_SQL, hit);
}

async function upsert(db, sql, legacySql, row) {
  if (!db || typeof db.prepare !== 'function') return false;
  const base = [row.day ?? dayFrom(), row.slug, row.source || NO_REFERER, row.landing];
  const signals = SIGNAL_COLUMNS.map((c) => row[c] ?? 'unknown');
  try {
    await db.prepare(sql).bind(...base, ...signals).run();
    return true;
  } catch (err) {
    // TEMPORARY: see LEGACY_UPSERT_SQL. Retried only when the table predates
    // schema/005; every other failure falls through and costs the count.
    if (isPreMigration(err)) {
      try {
        await db.prepare(legacySql).bind(...base).run();
        return true;
      } catch {
        return false;
      }
    }
    // A statistic is not worth a log line on the revenue path.
    return false;
  }
}
