-- Migration 002 — moderation audit trail
-- Applied to the live `attribution-gap` D1 database on 2026-08-22.
--
-- schema.sql describes the table as it should be created from scratch. This
-- file exists so an already-provisioned database can be brought to the same
-- shape without being dropped. Run once:
--
--   npx wrangler d1 execute attribution-gap --remote --file schema/002-moderation-audit.sql
--
-- SQLite has no ADD COLUMN IF NOT EXISTS. Re-running this will error with
-- "duplicate column name" — that error means it is already applied, and is safe.

ALTER TABLE submissions ADD COLUMN moderation_note TEXT;
ALTER TABLE submissions ADD COLUMN moderated_at    TEXT;
