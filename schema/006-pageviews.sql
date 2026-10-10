-- Migration 006 — cookieless page view and crawler counts
--
-- Apply once:
--
--   npx wrangler d1 execute attribution-gap --remote --file schema/006-pageviews.sql
--
-- Safe to re-run: everything here is IF NOT EXISTS.
--
-- WHY (10 Oct 2026)
-- GA4 only sees visitors who press Accept, so the site had no count of its own
-- traffic, and no record at all of whether Googlebot, Bingbot or the AI
-- crawlers were fetching its pages while both engines showed one page indexed.
-- functions/_middleware.js already runs on every request; it now adds one to a
-- daily counter per (page, kind of client, referring site, country).
--
-- WHAT IS NOT STORED
-- No cookie, no IP address, no User-Agent string, no time finer than the day,
-- no identifier of any kind. `agent` is a named crawler or a coarse bucket,
-- decided from the User-Agent and then discarded. Nothing is read from or
-- written to the visitor's device, so this needs no consent, the same as the
-- /go/ click counts (see /privacy/).
--
-- `agent` names a crawler by what it CLAIMS to be. A scraper can send
-- "Googlebot"; Googlebot's own figures are in Search Console → Settings →
-- Crawl stats. Read crawler rows as "something calling itself X".

CREATE TABLE IF NOT EXISTS pageviews (
  day     TEXT    NOT NULL,          -- UTC day, yyyy-mm-dd
  path    TEXT    NOT NULL,          -- page path, or '(404)' / '(other)'
  status  TEXT    NOT NULL,          -- '200', '301', '404', ...
  agent   TEXT    NOT NULL,          -- 'human', 'Googlebot', 'GPTBot', 'other-bot', ...
  ref     TEXT    NOT NULL,          -- referring host, '(none)' or '(internal)'
  country TEXT    NOT NULL,          -- two-letter code from Cloudflare, or 'XX'
  n       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path, status, agent, ref, country)
);

CREATE INDEX IF NOT EXISTS pageviews_agent ON pageviews (agent, day);
