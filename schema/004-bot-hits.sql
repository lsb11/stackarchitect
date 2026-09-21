-- Migration 004 — gated crawler hits on /go/*
--
-- Same shape as `clicks`, and deliberately a SEPARATE table rather than a
-- column on it. `clicks` is the revenue metric and must stay the count of
-- requests we sent into a partner's affiliate domain; a bot flag inside it
-- would mean every future reader of that table has to remember to filter.
--
-- Written by functions/go/[[slug]].js from inside waitUntil, on the branch
-- where _bots.js classified the request as a crawler and it was answered with
-- a 200 instead of the 302.
--
-- Apply once:
--
--   npx wrangler d1 execute attribution-gap --remote --file schema/004-bot-hits.sql
--
-- Safe to re-run: everything here is IF NOT EXISTS.
--
-- WHY IT IS WORTH STORING AT ALL
-- Without it the gate is unfalsifiable. The old data cannot answer "how much
-- of this was crawlers" because no User-Agent was ever stored — by design, and
-- that design is not changing. This table answers the question going forward
-- instead: bot_hits.n against clicks.n over the same days is the split, and a
-- sudden move in either direction is the signal that the rule in _bots.js
-- needs re-reading.
--
-- It stores exactly what `clicks` stores and nothing more: no User-Agent, no
-- IP, no identifier. The classification is made and discarded; only the
-- counter survives.

CREATE TABLE IF NOT EXISTS bot_hits (
  day     TEXT    NOT NULL,          -- UTC calendar day, yyyy-mm-dd
  slug    TEXT    NOT NULL,          -- cloak slug, e.g. 'make'
  source  TEXT    NOT NULL,          -- ?source= placement tag, or '(none)'
  landing TEXT    NOT NULL,          -- our path, '(external)' or '(none)'
  n       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, slug, source, landing)
);

-- ── Reading it ─────────────────────────────────────────────────────────────
-- The split, by day:
--
--   npx wrangler d1 execute attribution-gap --remote --command \
--     "SELECT d.day, COALESCE(c.n,0) AS clicks, COALESCE(b.n,0) AS gated FROM \
--      (SELECT DISTINCT day FROM clicks UNION SELECT DISTINCT day FROM bot_hits) d \
--      LEFT JOIN (SELECT day, SUM(n) n FROM clicks   GROUP BY day) c USING (day) \
--      LEFT JOIN (SELECT day, SUM(n) n FROM bot_hits GROUP BY day) b USING (day) \
--      ORDER BY d.day"
