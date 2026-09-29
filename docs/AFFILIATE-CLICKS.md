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
| Crawler test | `functions/go/_bots.js` (`isLikelyBot`) |
| Tables | `clicks` (`schema/003-affiliate-clicks.sql`), `bot_hits` (`schema/004-bot-hits.sql`) |
| Since | `clicks` 10 Sep 2026 (`166d3f0`); `bot_hits` 21 Sep 2026 (`cf1daed`) |

Both tables have one row per `(day, slug, source, landing)` and a counter `n`:

- `day`: UTC calendar day, `yyyy-mm-dd`.
- `slug`: the cloak, e.g. `make`, `tidio-pricing`.
- `source`: the `?source=` placement tag on the link, or `(none)`.
- `landing`: the path of our page the click came from, query and fragment
  dropped. `(external)` for a Referer from another site (which site is not
  kept). `(none)` for no Referer.

**Not recorded, on purpose:** IP address, User-Agent, cookies, the full
referring URL, any query string other than `source`, and any time finer than
the day. Two clicks from one person are two clicks. The count is clicks, not
visitors, because counting visitors needs the identifier this design refuses to
store. The User-Agent is read once to decide which table to write to, then
discarded.

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
