-- Migration 003 — affiliate click counts
--
-- One row per (day, cloak slug, source tag, landing page), with a counter.
-- Written by functions/go/_clicks.js from inside waitUntil, after the 302 has
-- already been returned.
--
-- Apply once:
--
--   npx wrangler d1 execute attribution-gap --remote --file schema/003-affiliate-clicks.sql
--
-- Safe to re-run: everything here is IF NOT EXISTS.
--
-- WHY A COUNTER AND NOT A ROW PER CLICK
-- Aggregating at write time bounds the table by (placements × landing pages ×
-- days) rather than by traffic, so it needs no retention job. At 117 rendered
-- placements that is a few hundred rows a day at the absolute ceiling, and in
-- practice far fewer, because most placements appear on one page.
--
-- WHAT IS NOT STORED
-- No cookie, no IP, no user agent, no timestamp finer than the day, and no
-- identifier of any kind. Two clicks from one reader on the same day are two
-- clicks: the metric is clicks, not visitors. Deduplicating to visitors needs
-- the identifier this design exists to avoid, so it is not a gap to close.
--
-- `source` and `landing` both use the sentinel '(none)' rather than NULL or
-- '', so a reader of this table never has to guess what a blank meant.
-- `landing` also uses '(external)' for a Referer from another site — see the
-- cardinality note in _clicks.js.

CREATE TABLE IF NOT EXISTS clicks (
  day     TEXT    NOT NULL,          -- UTC calendar day, yyyy-mm-dd
  slug    TEXT    NOT NULL,          -- cloak slug, e.g. 'make'
  source  TEXT    NOT NULL,          -- ?source= placement tag, or '(none)'
  landing TEXT    NOT NULL,          -- our path, '(external)' or '(none)'
  n       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, slug, source, landing)
);

-- The two readings this is for: "how did this placement do" and "what did this
-- page send". Both scan by day first, so the PK covers the common case; this
-- index covers the second reading without one.
CREATE INDEX IF NOT EXISTS idx_clicks_source ON clicks (source, day);

-- ── Reading it ─────────────────────────────────────────────────────────────
-- No endpoint and no dashboard: this is read with wrangler, the same way
-- moderation is (scripts/moderate-gap.mjs). Two queries answer the question
-- the table was added for.
--
-- Click-through by source tag, last 30 days:
--
--   npx wrangler d1 execute attribution-gap --remote --command \
--     "SELECT source, SUM(n) AS clicks FROM clicks \
--      WHERE day >= date('now','-30 day') GROUP BY source ORDER BY clicks DESC"
--
-- Click-through by landing page, last 30 days:
--
--   npx wrangler d1 execute attribution-gap --remote --command \
--     "SELECT landing, slug, SUM(n) AS clicks FROM clicks \
--      WHERE day >= date('now','-30 day') GROUP BY landing, slug ORDER BY clicks DESC"
