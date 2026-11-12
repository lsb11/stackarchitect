---
title: "Shopify Stocky's export window can close on 29 November. Save these records before it does"
canonical_url: https://stackarchitect.xyz/stocky-alternative/
tags: shopify, ecommerce, productivity, tutorial
description: "Stocky's read-only export access runs for at least 90 days after 31 August 2026, so it can close as early as 29 November. What to export, what you have to copy by hand, and how to check you have it."
---

Shopify switched Stocky off on 31 August 2026. Its data didn't disappear that day: Shopify says you keep read-only access to export it for at least 90 days after that date. It has not published an end date.

Ninety days from 31 August is **29 November 2026**. That's the earliest the window can close, and it's the only date Shopify has given, so treat it as the deadline. If your store used Stocky, here's what to save, what you can't download and have to copy by hand, and how to check you actually have it.

## What still works, and what doesn't

Stocky's APIs stopped on 31 August with no grace period, so any tool wired into them stopped too. Nothing moved into Shopify Admin by itself. What's left is read-only access to Stocky's own reports.

Shopify's migration guide is blunt about what replaces it: "You now need to manage inventory in the Shopify admin and Shopify POS."

If you uninstalled Stocky after Shopify delisted it on 2 February 2026, you can't reinstall it, and the export steps below won't work for you. Skip to the last two sections.

## What you can export

Shopify lists three kinds of Stocky record you can export through Stocky's own reports. In your Shopify admin, go to **Apps → Stocky → Reports**.

1. **Completed purchase orders, as CSV.** Pick the purchase order report and set the date range to your full history. The default range cuts off older orders, and a partial archive looks complete right up until you need the missing year.
2. **Stocktake history**, plus the inventory adjustment log beside it, from the same Reports menu with the same full date range. These are your records of what you counted and what you corrected. Nothing else in your stack holds them.
3. **Historical cost data.** Before you archive it, check five SKUs against recent supplier invoices. A cost file you haven't checked is worse than none, because you'll trust it.

## What you can't export: copy it by hand

Shopify states that suppliers can't be exported from Stocky. There's no hidden export and no API route. Reorder points and safety-stock settings don't export either.

So while Stocky still opens, go through each supplier and copy these into a spreadsheet:

| Field | Why you'll want it later |
|---|---|
| Supplier name and contact | Nobody else has the list in one place |
| Lead time | Decides when you reorder |
| Minimum order quantity | Decides how much you reorder |
| Payment terms | Easy to forget, awkward to ask for again |
| Reorder point and safety stock, per priority SKU | Judgement you built up over time, not data you can look up again |

This is the slow part. It's also the only part nothing can recover for you after the window closes.

## Check that you actually have it

- Put every file in one dated folder in cloud storage: outside Shopify, and not on a single laptop.
- Open each CSV. The earliest date in the purchase order export should match when you started using Stocky.
- Compare row counts with what you'd expect: roughly how many purchase orders and stocktakes you've done.

An export you haven't opened is an assumption.

## After the export: what replaces Stocky

Shopify's own answer is Shopify itself. Its migration guide lists transfers between locations, tracking and receiving purchase orders, adjusting quantities and reporting on inventory history as built into the admin, with Shopify Flow for low-stock alerts and Sidekick to draft purchase orders.

The gap many stores notice is the running record of what sold, in a sheet they can sort and share. If that's what you miss, I publish a free [Make.com scenario that writes one Google Sheets row per order line item](https://stackarchitect.xyz/stocky-swap/): timestamp, SKU, quantity, order ID and product. It's an order log, not stock management. It doesn't see restocks, returns or manual adjustments. Since 11 November its Sheets step uses Make's Retry error handler, so a failed write is retried and then kept for you to re-run, instead of being dropped without a word.

If you're not sure how much of your history lives only in Stocky, the free [Stocky migration risk scorer](https://stackarchitect.xyz/stocky-migration-risk-scorer/) asks about your purchase orders, suppliers and stocktakes and tells you what to move first.

## The short version

- **Deadline:** treat 29 November 2026 as the last day. Shopify has given a minimum, not a date.
- **Export:** purchase orders over your full history, stocktakes and adjustments, cost data.
- **Copy by hand:** suppliers, lead times, minimum order quantities, payment terms, reorder points.
- **Check:** open every file before you trust it.

The full guide covers what Shopify Admin now does for free and what the paid replacements are worth: [Replacing Shopify Stocky: data, deadline and alternatives](https://stackarchitect.xyz/stocky-alternative/).

*Originally published at [stackarchitect.xyz](https://stackarchitect.xyz/stocky-alternative/) by Luke Sandelands.*
