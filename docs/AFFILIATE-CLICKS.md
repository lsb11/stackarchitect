# Affiliate click counts

Which pages send clicks to partners, read from our own server rather than GA4.
GA4 only sees a click after the visitor presses Accept; this sees every request
to `/go/*`.

## Read this before the numbers

**Most of what is counted is probably not a reader clicking a link on this
site.** On 29 Sep 2026, 2,313 of the 2,456 clicks recorded since 10 Sep had no
Referer (`landing = '(none)'`). Only 99 named one of our pages, and 89 of
those were the homepage.

Every `/go/` link on the site is same-origin, none carries `rel="noreferrer"`,
and the site sends `Referrer-Policy: strict-origin-when-cross-origin`
(`public/_headers`). So a normal browser clicking one of our links sends the
page's path. A `(none)` row is a request that did not arrive that way: a crawler
using a browser User-Agent, a pasted or bookmarked link, an in-app browser, or
a privacy tool that strips the header. The data cannot tell those apart, and
nothing here should be read as saying which.

**For "which page earns", read the rows with a real path.** Treat `(none)` as
an upper bound on everything else, not as clicks from a page.

## What is recorded, and where

| | |
|---|---|
| Database | D1 `attribution-gap`, binding `DB` (`wrangler.toml`) |
| Route | `functions/go/[[slug]].js` |
| Writer | `functions/go/_clicks.js` (`recordClick`, `recordBotHit`) |
| Crawler test | `functions/go/_bots.js` (`isLikelyBot`, and `uaClass` for the bucket) |
| Tables | `clicks` (`schema/003-affiliate-clicks.sql`), `bot_hits` (`schema/004-bot-hits.sql`), both widened by `schema/005-click-signals.sql` |
| Since | `clicks` 10 Sep 2026 (`166d3f0`); `bot_hits` 21 Sep 2026 (`cf1daed`); the five signal columns from the day schema/005 is applied |

Both tables have one row per `(day, slug, source, landing, sec_fetch_mode,
sec_fetch_dest, sec_fetch_site, is_prefetch, ua_class)` and a counter `n`:

- `day`: UTC calendar day, `yyyy-mm-dd`.
- `slug`: the cloak, e.g. `make`, `tidio-pricing`.
- `source`: the `?source=` placement tag on the link, or `(none)`.
- `landing`: the path of our page the click came from, query and fragment
  dropped. `(external)` for a Referer from another site (which site is not
  kept). `(none)` for no Referer.
- `sec_fetch_mode`, `sec_fetch_dest`, `sec_fetch_site`: the request's
  `Sec-Fetch-*` header. `absent` when it was not sent; `other` for any value
  the Fetch Metadata spec does not define, including an empty header.
- `is_prefetch`: `true` when `Sec-Purpose` contains `prefetch`, else `false`.
- `ua_class`: `none`, `headless`, `tool`, `declared-bot`, `browser-like` or
  `other`, from `uaClass()` in `_bots.js`.
- All five read `unknown` on rows written before schema/005 was applied.
  `unknown` is never a live value, so an old row cannot be mistaken for a
  category.

**Not recorded, on purpose:** IP address, User-Agent, cookies, the full
referring URL, any query string other than `source`, and any time finer than
the day. Two clicks from one person are two clicks. The count is clicks, not
visitors, because counting visitors needs the identifier this design refuses to
store. The User-Agent is read to decide which table to write to and which
bucket it falls in, then discarded; only the bucket name is stored.

The write runs in `waitUntil` after the response and swallows its own errors,
so a D1 fault costs a count and never a redirect.

## How bot hits are separated

`_bots.js` treats a request as a crawler when its User-Agent is missing, or
when it has no Referer **and** its User-Agent names a known crawler or HTTP
library. That request gets a 200 page linking to the vendor's own site (no
affiliate click) and is counted in `bot_hits`, not `clicks`.

What that means for reading `clicks`:

- **Before 21 Sep 2026 13:39 BST, `clicks` includes crawlers.** There was no
  gate. Do not compare those days with later ones as if they were like for
  like.
- **After it, `clicks` still includes any crawler that sends a browser
  User-Agent.** The gate is built to miss a bot rather than block a reader. It
  has caught 9 hits in total so far, against about 100 `(none)` clicks a day,
  so it is not what keeps `clicks` clean. The Referer test above does more.

## How to tell a real click from a fetch

A **likely-human click** is a row with all of:

- `sec_fetch_mode = 'navigate'`: the browser is loading a page, not fetching
  a resource.
- `sec_fetch_dest = 'document'`: into a top-level tab, not a frame or image.
- `sec_fetch_site = 'same-origin'`: started from a page on this site.
- `is_prefetch = 'false'`: not a speculative load the browser made on its own.
- `landing` is one of our paths (starts with `/`, and not `/go/`).

Every current mainstream browser sends the `Sec-Fetch-*` headers on a link
click. A script or crawler sends them only if it was written to. The
definition is deliberately strict: a real reader arriving from a link on
another site (`cross-site`) does not count as human by it. Read that as a
floor for real clicks, not a total.

Last 7 days, split by that definition:

```sh
npx wrangler d1 execute attribution-gap --remote --command "SELECT SUM(CASE WHEN sec_fetch_mode = 'unknown' THEN 0 WHEN sec_fetch_mode = 'navigate' AND sec_fetch_dest = 'document' AND sec_fetch_site = 'same-origin' AND is_prefetch = 'false' AND landing LIKE '/%' AND landing NOT LIKE '/go/%' THEN n ELSE 0 END) AS likely_human, SUM(CASE WHEN sec_fetch_mode = 'unknown' THEN 0 WHEN sec_fetch_mode = 'navigate' AND sec_fetch_dest = 'document' AND sec_fetch_site = 'same-origin' AND is_prefetch = 'false' AND landing LIKE '/%' AND landing NOT LIKE '/go/%' THEN 0 ELSE n END) AS not_human, SUM(CASE WHEN sec_fetch_mode = 'unknown' THEN n ELSE 0 END) AS unknown_before_005, (SELECT COALESCE(SUM(n), 0) FROM bot_hits WHERE day >= date('now','-7 day')) AS gated_bot_hits FROM clicks WHERE day >= date('now','-7 day')"
```

To see why the `not_human` rows failed, group them by the signals:

```sh
npx wrangler d1 execute attribution-gap --remote --command "SELECT sec_fetch_mode, sec_fetch_dest, sec_fetch_site, is_prefetch, ua_class, CASE WHEN landing LIKE '/%' AND landing NOT LIKE '/go/%' THEN 'our page' ELSE landing END AS referer, SUM(n) AS clicks FROM clicks WHERE day >= date('now','-7 day') AND sec_fetch_mode <> 'unknown' GROUP BY 1, 2, 3, 4, 5, 6 ORDER BY clicks DESC"
```

**The signal columns only populate from the day schema/005 was applied.**
Every row before then reads `unknown` and falls in `unknown_before_005`, not
in either of the other two. A 7-day window that spans the migration day is part
old, part new; wait 7 days after it for a clean week. No output is pasted here
yet: until the migration runs, every row is `unknown`.

## Queries

Run from the repo root. Each needs Cloudflare auth (`npx wrangler login`).
"Last 30 days" is `date('now','-30 day')`, in UTC. Output below is the real
result on **29 Sep 2026**, which is why the 30-day window reaches back to the
first recorded day, 10 Sep.

### 1. Clicks by partner, last 30 days

Which partners get the traffic.

```sh
npx wrangler d1 execute attribution-gap --remote --command "SELECT slug, SUM(n) AS clicks FROM clicks WHERE day >= date('now','-30 day') GROUP BY slug ORDER BY clicks DESC"
```

```
slug           clicks
make           1373
systeme        290
tidio          181
getresponse    166
workspace      139
beehiiv        117
tidio-pricing  82
tidio-ai       82
gorgias        26
```

### 1a. Links on the site, per partner, against clicks

The links are counted in the built site (`<a href="/go/...">` in every page
under `dist/`, noindex pages included) on 29 Sep 2026. The clicks are from
25 Sep, the first full day after the 24 Sep consolidation (`585d1fc`) set the
current link set, to 29 Sep.

| Partner | Links | Pages | Share of links | Clicks since 25 Sep | Share of clicks | From our pages |
|---|---:|---:|---:|---:|---:|---:|
| make | 45 | 36 | 64% | 255 | 49% | 5 |
| systeme | 9 | 7 | 13% | 60 | 12% | 3 |
| tidio | 7 | 5 | 10% | 47 | 9% | 3 |
| gorgias | 4 | 2 | 6% | 28 | 5% | 1 |
| getresponse | 3 | 3 | 4% | 41 | 8% | 8 |
| workspace | 2 | 2 | 3% | 25 | 5% | 1 |
| beehiiv | 0 | 0 | 0% | 21 | 4% | 1 |
| tidio-pricing | 0 | 0 | 0% | 20 | 4% | 0 |
| tidio-ai | 0 | 0 | 0% | 20 | 4% | 0 |
| **Total** | **70** | | | **517** | | **22** |

What it shows:

- **For the six partners that still have links, clicks follow link count
  closely.** On its own that proves little: readers would also click more
  where there are more links.
- **The three partners with no links carry 61 clicks, 12% of the total.**
  Their links were removed on 24 Sep, and their clicks carried on at the same
  rate afterwards, 21, 20 and 20 of them since 25 Sep, all but one with no
  Referer from our pages.
- **`tidio-ai` and `tidio-pricing` get the same count on every day since
  counting began on 10 Sep**, before and after the removal. From 20 to 29 Sep
  that was 4, 5, 4, 4, 6, 6, 4, 4, 4 and 2 each.

A reader cannot click a link that is not on the page, and two unrelated links
drawing identical counts every day, unchanged by their removal, is what a
client re-requesting a stored list of URLs on a schedule looks like. That is
strong evidence for the crawler reading of the `(none)` traffic. It is not
proof of what the client is; the signal columns are for that.

### 2. Clicks by landing page, last 30 days: which page earns

The page each click came from, split by partner. The sentinels are left out
here (see "Read this before the numbers"); query 2a shows them.

```sh
npx wrangler d1 execute attribution-gap --remote --command "SELECT landing, slug, SUM(n) AS clicks FROM clicks WHERE day >= date('now','-30 day') AND landing NOT IN ('(none)','(external)') AND landing NOT LIKE '/go/%' GROUP BY landing, slug ORDER BY clicks DESC"
```

```
landing                           slug           clicks
/                                 make           33
/                                 workspace      14
/                                 getresponse    13
/                                 systeme        11
/                                 tidio          10
/                                 beehiiv        5
/stack/                           systeme        3
/stack/                           tidio          3
/                                 gorgias        1
/                                 tidio-ai       1
/                                 tidio-pricing  1
/how-we-test/                     make           1
/make-vs-zapier-cost-calculator/  make           1
/replace-klaviyo-free/            systeme        1
/tools/                           make           1
```

99 clicks in all, 89 of them from the homepage. No other page reached 10.

### 2a. Clicks by landing page, sentinels included

The same question with every row, so the size of `(none)` is visible.

```sh
npx wrangler d1 execute attribution-gap --remote --command "SELECT landing, SUM(n) AS clicks FROM clicks WHERE day >= date('now','-30 day') GROUP BY landing ORDER BY clicks DESC"
```

```
landing                           clicks
(none)                            2313
/                                 89
(external)                        38
/stack/                           6
/go/workspace                     2
/go/systeme                       2
/tools/                           1
/replace-klaviyo-free/            1
/make-vs-zapier-cost-calculator/  1
/how-we-test/                     1
/go/tidio                         1
/go/make/                         1
```

A `/go/...` landing is a request whose Referer was a cloak URL itself, i.e.
the second hop of a redirect, not a page.

### 3. Clicks by source tag for one partner

Compares placements for one partner. Change `'make'` to any slug from query 1.
`with_referer` is the part of each count that came with a Referer (a page
path or `(external)`).

```sh
npx wrangler d1 execute attribution-gap --remote --command "SELECT source, SUM(n) AS clicks, SUM(CASE WHEN landing = '(none)' THEN 0 ELSE n END) AS with_referer FROM clicks WHERE slug = 'make' AND day >= date('now','-30 day') GROUP BY source ORDER BY clicks DESC"
```

First 20 of 124 rows for `make`:

```
source                                       clicks  with_referer
(none)                                       157     14
home-card-capi                               55      5
attribution-tools-compared-decision-rule     41      0
home-scanner-plan                            40      4
home-card-autocrat                           39      1
home-card-stocky                             38      1
app-development-cost-n2                      36      0
home-card-tiktok                             35      1
home-grid-make                               35      1
home-mech-make                               35      3
home-cta-strip                               33      1
shopify-google-sheets-automation-map-n1      33      0
home-card-pl                                 32      1
app-development-cost-n1                      31      0
home-n19                                     26      1
home-compare-table                           25      1
shopify-google-sheets-automation-map-n2      24      0
tools-n2                                     21      2
how-to-fix-service-invoked-too-many-time-n1  20      0
autocrat-quota-fix-map-n3                    19      0
```

Rank placements on `with_referer`, not `clicks`. Tags with `clicks` in the
tens and `with_referer` at 0 are counts no reader can be shown to have made.
Tags `test` (4) and `audit-test` (1) are our own test clicks.

### 4. Daily totals, last 30 days

Trend. Remember the gate started partway through 21 Sep.

```sh
npx wrangler d1 execute attribution-gap --remote --command "SELECT day, SUM(n) AS clicks FROM clicks WHERE day >= date('now','-30 day') GROUP BY day ORDER BY day"
```

```
day         clicks
2026-09-10  26
2026-09-11  109
2026-09-12  181
2026-09-13  270
2026-09-14  136
2026-09-15  155
2026-09-16  51
2026-09-17  50
2026-09-18  294
2026-09-19  129
2026-09-20  79
2026-09-21  99
2026-09-22  108
2026-09-23  158
2026-09-24  113
2026-09-25  98
2026-09-26  146
2026-09-27  86
2026-09-28  123
2026-09-29  45
```

29 Sep is a part day.

### 5. Clicks against bot hits, last 30 days

What the crawler gate is catching, day by day.

```sh
npx wrangler d1 execute attribution-gap --remote --command "SELECT d.day, COALESCE(c.n,0) AS clicks, COALESCE(b.n,0) AS bot_hits FROM (SELECT day FROM clicks WHERE day >= date('now','-30 day') UNION SELECT day FROM bot_hits WHERE day >= date('now','-30 day')) d LEFT JOIN (SELECT day, SUM(n) n FROM clicks GROUP BY day) c USING (day) LEFT JOIN (SELECT day, SUM(n) n FROM bot_hits GROUP BY day) b USING (day) ORDER BY d.day"
```

```
day         clicks  bot_hits
2026-09-10  26      0
2026-09-11  109     0
2026-09-12  181     0
2026-09-13  270     0
2026-09-14  136     0
2026-09-15  155     0
2026-09-16  51      0
2026-09-17  50      0
2026-09-18  294     0
2026-09-19  129     0
2026-09-20  79      0
2026-09-21  99      4
2026-09-22  108     0
2026-09-23  158     0
2026-09-24  113     0
2026-09-25  98      5
2026-09-26  146     0
2026-09-27  86      0
2026-09-28  123     0
2026-09-29  45      0
```

`bot_hits` is 0 on every day before 21 Sep because the table did not exist,
not because there were no crawlers. All 9 bot hits had no Referer.

## Verifying schema/005

Run these around the migration. Deploy order and restore steps follow.

**Totals, before and after.** Run this immediately before the migration and
again immediately after:

```sh
npx wrangler d1 execute attribution-gap --remote --command "SELECT (SELECT SUM(n) FROM clicks WHERE day < date('now')) AS clicks_before_today, (SELECT SUM(n) FROM bot_hits WHERE day < date('now')) AS bot_hits_before_today, (SELECT SUM(n) FROM clicks) AS clicks_all, (SELECT SUM(n) FROM bot_hits) AS bot_hits_all"
```

`clicks_before_today` and `bot_hits_before_today` must match exactly. Rows for
past days are never written to again, so any difference there is data the
migration lost or doubled: **a mismatch means restore from the export.** The
`_all` columns include today, which keeps taking clicks while you run the two
commands, so they may grow a little and should never shrink. (If the two runs
straddle midnight UTC, compare with the day fixed: replace `date('now')` with
the date of the first run.)

**The columns exist and history reads `unknown`:**

```sh
npx wrangler d1 execute attribution-gap --remote --command "PRAGMA table_info(clicks)"
npx wrangler d1 execute attribution-gap --remote --command "SELECT COUNT(*) AS rows_before_today, SUM(CASE WHEN sec_fetch_mode = 'unknown' AND sec_fetch_dest = 'unknown' AND sec_fetch_site = 'unknown' AND is_prefetch = 'unknown' AND ua_class = 'unknown' THEN 1 ELSE 0 END) AS all_unknown FROM clicks WHERE day < date('now')"
```

`table_info` lists ten columns, the five new ones with `dflt_value` `'unknown'`
and `pk` 5 to 9. The two numbers in the second query are equal.

**A fresh click writes real values.** After the migration, open a live page
in a normal browser (the homepage has Make links) and click an affiliate link.
Then:

```sh
npx wrangler d1 execute attribution-gap --remote --command "SELECT slug, source, landing, sec_fetch_mode, sec_fetch_dest, sec_fetch_site, is_prefetch, ua_class, n FROM clicks WHERE day = date('now') AND sec_fetch_mode <> 'unknown' ORDER BY n DESC"
```

Look for the link's `source` tag with `landing = '/'`, `navigate`,
`document`, `same-origin`, `false`, `browser-like`.

If today's newest rows still say `unknown`:

- **Before the migration, that is expected.** The new code cannot write the
  new columns yet, so it retries with the old four-column statement, and those
  rows get `unknown` when the migration copies them.
- **After the migration, the old statement cannot write at all** (its
  `ON CONFLICT` no longer matches the table's key), so no new `unknown` row can
  appear for today. If your click shows up nowhere, the new write is failing:
  either the deploy running is still the old code (check the deployment list
  below), or the nine-column statement has a fault. The fallback does not hide
  that, because it only fires on a missing-column error.

### Deploy order

1. **Export** (the only way back):

   ```sh
   npx wrangler d1 export attribution-gap --remote --table clicks --table bot_hits --output ~/stackarchitect-d1-backups/go-clicks-$(date +%F)-pre-005.sql
   ```

   Check it holds both tables before going on:
   `grep -c '^INSERT INTO "clicks"' <file>` and the same for `"bot_hits"`.

2. **Push**, and wait for the Pages deploy to finish before migrating. The
   new code must be live first: the old code cannot write to the migrated
   tables, while the new code can write to either.

   ```sh
   npx wrangler pages deployment list --project-name stackarchitect2
   ```

   The newest production deployment should show the pushed commit.

3. **Before count:** the totals query above.
4. **Migrate:**

   ```sh
   npx wrangler d1 execute attribution-gap --remote --file schema/005-click-signals.sql
   ```

5. **After count:** the totals query again. The `before_today` columns must
   match.
6. **Verify a live click:** the last query above.

Then remove the temporary fallback (`LEGACY_UPSERT_SQL`,
`LEGACY_BOT_UPSERT_SQL`, `isPreMigration` and the retry in `upsert()` in
`functions/go/_clicks.js`, and their tests).

### Restoring from the export

The export holds `CREATE TABLE` and `INSERT` statements for the old,
four-column tables, but not the `idx_clicks_source` index. To restore, drop
whatever is there, replay the file, and recreate the index:

```sh
npx wrangler d1 execute attribution-gap --remote --command "DROP TABLE IF EXISTS clicks; DROP TABLE IF EXISTS bot_hits; DROP TABLE IF EXISTS clicks_005; DROP TABLE IF EXISTS bot_hits_005; DROP TABLE IF EXISTS migration_005_applied"
npx wrangler d1 execute attribution-gap --remote --file ~/stackarchitect-d1-backups/<export>.sql
npx wrangler d1 execute attribution-gap --remote --command "CREATE INDEX IF NOT EXISTS idx_clicks_source ON clicks (source, day)"
```

Clicks recorded between the export and the restore are lost. The new code
keeps redirecting throughout, and writes through the fallback again once the
old tables are back.
