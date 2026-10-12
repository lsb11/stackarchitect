# StockLog: App Store listing copy and submission notes

Written 12 Oct 2026. The App Store listing is the one distribution channel
open to this project that does not depend on stackarchitect.xyz ranking: App
Store search has its own index, and a new app with no backlinks can be found
there on day one. The site has 51 pages and one of them is indexed by Google;
the app has none and could be found by a merchant this month.

Everything below is copy to paste. Field names and character limits change, so
match them to whatever the Partner Dashboard form shows and trim from the end:
each line is written so the first words carry the meaning.

**Nothing here claims a capability the app does not have.** Every sentence maps
to a behaviour checked against the app source on 23 Sep 2026 and recorded in
the header comment of `src/pages/stocklog.astro`. If you change the app, change
this file and that page together.

---

## App name

Shopify App Store search weighs the app name heavily, and "StockLog" on its own
matches nothing a merchant types. Keep the brand, add the term they search.

```
StockLog: Inventory History
```

Fallback if the name is taken or too long: `StockLog ‑ Stock History`

## App card subtitle

Shown under the name in search results. This is the line that wins or loses the
click, so it names the moment the merchant is in, not the feature set.

```
See every stock change, with the order and the reason behind it
```

## App introduction

```
A stock ledger for Shopify. Every order, cancellation and restocked refund is
written down with its reason, so when a number looks wrong you can see why.
```

## App details

```
Shopify tells you what your stock is now. StockLog tells you how it got there.

Install it, press Sync stock from Shopify, and your ledger opens at today's
on-hand quantity for every variant. From then on each order, cancellation and
restocked refund is recorded as Shopify reports it, timestamped in your store's
own timezone, with the reason attached. When a count looks wrong, filter the
movement history to that variant and read every change from the opening
balance onward.

Moving off Stocky? Import your Stocky CSV export and those movements join the
same ledger, so the history you built up is not lost.

StockLog asks only for read access to your orders and products. It never
changes your Shopify stock levels: Shopify stays the source of truth, and
StockLog is the record of what happened to it.
```

## Key benefits

Three, each a title and a line. Titles first, because they are what gets read.

**1. Every order counted once**
> Shopify sometimes retries a notification. StockLog checks the ledger before
> it writes, so a repeat changes nothing and your counts stay right.

**2. Refunds and cancellations handled properly**
> A restocked refund adds the units back. A refund marked no-restock does not,
> and units a cancellation already returned are never credited twice.

**3. Your Stocky history, imported**
> Bring your Stocky CSV export in and those movements sit in the same ledger
> as the new ones, each with its reason and date.

## What it does not do

Shopify's reviewers and your reviewers both reward this. Put it in the details
or a final benefit; it is already on the site and it reduces refund requests.

```
StockLog does not change your stock levels, forecast demand or raise purchase
orders. It is a ledger: it tells you what happened and flags what is low.
```

## Category

Store management → Inventory management. Secondary, if the form allows one:
Reporting or Analytics.

## Search terms

If the form has a keywords or search terms field, use these. If it does not,
work the same phrases into the subtitle and the details, naturally and once
each:

```
stock history, inventory history, stock ledger, inventory log, stock movement,
audit trail, stocky alternative, stocky replacement, inventory tracking
```

`stocky alternative` is the highest-intent term on the list and the one with a
deadline on it: Stocky closed on 31 August 2026 and the merchants displaced by
it are shopping now. That demand decays. It is the reason to submit this month
rather than next quarter.

## Screenshots

Five already exist, cropped to the StockLog card so they read on a phone:
`src/assets/stocklog/` (movement-history, dashboard, refunds-restocks,
inventory-reorder, import-sync). Order them so the first screenshot answers
"what will I see?": movement history first, dashboard second.

Shopify wants the first screenshot to carry the value on its own, because it is
the one shown in search. Consider a caption burned into it: *Every stock change,
with the order behind it.*

---

## Before you submit, check these

Approval is where this stalls, so settle each one first.

1. **Order history depth.** Shopify's Orders API returns roughly the last 60
   days unless the app holds the `read_all_orders` scope, which Shopify grants
   on request and reviews. An app whose whole promise is history needs to know
   which side of that line it sits on. If you do not have the scope, either
   request it with a short justification, or say plainly in the listing that
   the ledger opens at install and builds from there. Do not leave it
   ambiguous: it is the first thing a reviewer and a merchant will both test.

2. **Mandatory privacy webhooks.** `shop/redact` exists. Shopify also requires
   `customers/data_request` and `customers/redact`, and rejects apps that do
   not respond to all three. Confirm all three are registered and return 200.

3. **Billing through the Shopify Billing API.** The listing says billed through
   Shopify; the app has to actually use the Billing API, with the trial
   declared there rather than handled in your own code.

4. **Hosting.** `stocklog.onrender.com` on a free Render instance sleeps when
   idle, and a cold start on a reviewer's first click reads as a broken app.
   Move to a paid instance or a platform that does not sleep before submitting.
   This is the cheapest thing on this list and the most likely to fail you.

5. **Privacy policy and support email** on reachable URLs. `/privacy/` on the
   site covers the former.

6. **Price.** `STOCKLOG_PRICE` is $7.99/month. Comparable single-purpose
   Shopify inventory apps sit between $9.99 and $29.99, and a B2B tool priced
   under $10 reads as unsupported rather than good value. At $7.99 you need
   roughly 42 paying installs to reach £3,000 a year; at $14.99, roughly 22.
   The work to get the twenty-third install is far less than the work to get
   the forty-second. Change it in `src/data/products.ts` and re-run the build:
   the site and the schema both read that constant.

## The day it is approved

One line changes:

```ts
// src/data/products.ts
export const STOCKLOG_APP_STORE_URL = 'https://apps.shopify.com/<your-handle>';
```

That flips every install button on `/stocklog/` and in `StockLogPromo` from
the waitlist to the listing, and `tests/stocklog-cta.test.js` checks it is a
real listing URL rather than the App Store root. Then:

```bash
npm run build && npm test
node scripts/page-updated.mjs --touch /stocklog/ /stocky-alternative/
git commit -am "StockLog is live on the App Store" && git push
node scripts/indexnow.mjs --submit
```

And tell the people already on the waitlist, who are the warmest audience this
project has.
