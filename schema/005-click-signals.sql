-- Migration 005: request signals on the /go/* click counters
--
-- Adds five columns to `clicks` and `bot_hits`, and makes them part of the
-- key, so a click can be told from a fetch (docs/AFFILIATE-CLICKS.md, "How to
-- tell a real click from a fetch"). Written by functions/go/_clicks.js; the
-- values and why they are safe to store are described there.
--
-- WHY A REBUILD AND NOT ALTER TABLE
-- The counters are an UPSERT keyed on the primary key. A column outside the
-- key would keep whichever value was written first to each row and silently
-- merge a navigation with a prefetch. SQLite cannot change a primary key in
-- place, so each table is copied into a new one with the wider key, the old
-- one dropped, and the new one renamed.
--
-- BEFORE RUNNING: export first, and take the "before" count. Both commands
-- are in docs/AFFILIATE-CLICKS.md, "Verifying schema/005". The export is the
-- only way back.
--
--   npx wrangler d1 execute attribution-gap --remote --file schema/005-click-signals.sql
--
-- RUNS ONCE. The first statement creates a marker table, so a second run
-- fails at once with "table migration_005_applied already exists" and changes
-- nothing. That error means it is already applied.
--
-- IF A RUN STOPS PARTWAY
-- The data is in `clicks` until its DROP, and in `clicks_005` after it. Look
-- at which tables exist before doing anything else. The export restores both.
--
-- Existing rows get 'unknown' in all five columns, never NULL, so a historic
-- row reads as historic and is not counted as any category.

CREATE TABLE migration_005_applied (at TEXT NOT NULL);
INSERT INTO migration_005_applied (at) VALUES (datetime('now'));

CREATE TABLE clicks_005 (
  day            TEXT    NOT NULL,                    -- UTC calendar day, yyyy-mm-dd
  slug           TEXT    NOT NULL,                    -- cloak slug, e.g. 'make'
  source         TEXT    NOT NULL,                    -- ?source= placement tag, or '(none)'
  landing        TEXT    NOT NULL,                    -- our path, '(external)' or '(none)'
  sec_fetch_mode TEXT    NOT NULL DEFAULT 'unknown',  -- Sec-Fetch-Mode, 'absent' or 'other'
  sec_fetch_dest TEXT    NOT NULL DEFAULT 'unknown',  -- Sec-Fetch-Dest, 'absent' or 'other'
  sec_fetch_site TEXT    NOT NULL DEFAULT 'unknown',  -- Sec-Fetch-Site, 'absent' or 'other'
  is_prefetch    TEXT    NOT NULL DEFAULT 'unknown',  -- 'true' or 'false'
  ua_class       TEXT    NOT NULL DEFAULT 'unknown',  -- bucket from uaClass() in _bots.js
  n              INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, slug, source, landing, sec_fetch_mode, sec_fetch_dest, sec_fetch_site, is_prefetch, ua_class)
);
INSERT INTO clicks_005 (day, slug, source, landing, n)
  SELECT day, slug, source, landing, n FROM clicks;
DROP TABLE clicks;
ALTER TABLE clicks_005 RENAME TO clicks;
CREATE INDEX IF NOT EXISTS idx_clicks_source ON clicks (source, day);

CREATE TABLE bot_hits_005 (
  day            TEXT    NOT NULL,
  slug           TEXT    NOT NULL,
  source         TEXT    NOT NULL,
  landing        TEXT    NOT NULL,
  sec_fetch_mode TEXT    NOT NULL DEFAULT 'unknown',
  sec_fetch_dest TEXT    NOT NULL DEFAULT 'unknown',
  sec_fetch_site TEXT    NOT NULL DEFAULT 'unknown',
  is_prefetch    TEXT    NOT NULL DEFAULT 'unknown',
  ua_class       TEXT    NOT NULL DEFAULT 'unknown',
  n              INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, slug, source, landing, sec_fetch_mode, sec_fetch_dest, sec_fetch_site, is_prefetch, ua_class)
);
INSERT INTO bot_hits_005 (day, slug, source, landing, n)
  SELECT day, slug, source, landing, n FROM bot_hits;
DROP TABLE bot_hits;
ALTER TABLE bot_hits_005 RENAME TO bot_hits;
