---
title: "Shopify Inventory in Google Sheets 2026"
heading: "The Ultimate Guide to Shopify Inventory Management 2026 — Free Systems That Scale"
description: "Send Shopify orders to Google Sheets free in 2026 and build stock counts, reorder flags and alerts on top. What replaces the order record Stocky kept, and what it does not."
answer: "You can run Shopify inventory tracking free by sending each paid order into Google Sheets through Make.com. That gives you an order ledger you own. Stock counts, reorder flags and low-stock alerts are formulas and extra scenarios you add yourself. Shopify Stocky shut down on 31 August 2026, and paid replacements start around $29 a month."
publishDate: "2026-03-28"
updatedDate: "2026-09-24"
category: "inventory"
badge: "Complete Guide"
badgeType: "new"
readTime: 18
faqs:
  - question: "What is the best free Shopify inventory management system in 2026?"
    answer: "For most small stores it is Shopify Admin itself, plus a Make.com webhook that logs every paid order to a Google Sheet you own in real time. That combination replaces the order record Stocky kept. It does not replace demand forecasting, automated reordering or bundle tracking. Stores that rely on those need a paid app. Stocky itself shut down on 31 August 2026."
  - question: "Does Shopify have free inventory management?"
    answer: "Yes. Shopify Admin tracks stock levels per variant and location, handles transfers and adjustments, and lets you track and receive purchase orders from suppliers. Low-stock alerts come through Shopify Flow. What it does not give you is a copy of every order in a system you own, or sales velocity and reorder calculations. A Make.com and Google Sheets ledger covers those at no cost."
  - question: "What replaces Shopify Stocky after August 2026?"
    answer: "Shopify Admin is the replacement Shopify names for purchase orders, transfers and adjustments. For the order record, Stocky Swap is a free Make.com scenario that logs every paid Shopify order to a Google Sheet. It deploys in about 4 minutes and works on every Shopify plan. It does not manage purchase orders, forecast demand or calculate stock on hand. Stocky was removed from the Shopify App Store on February 2, 2026 and stopped functioning entirely on August 31, 2026. (Source: Shopify, \"Transitioning from Stocky\", help.shopify.com/en/manual/products/inventory/transitioning-from-stocky, read 10 September 2026.)"
  - question: "How do I track Shopify inventory in Google Sheets for free?"
    answer: "Create a Make.com account, set up a Shopify Order Payment webhook, and configure a Google Sheets module to append a row for every order. Each row captures: order ID, date, product title, variant, quantity, price, customer name, fulfilment status, and any custom fields. Setup takes approximately 20 minutes and requires no code."
  - question: "How do I get low stock alerts for Shopify for free?"
    answer: "Shopify Flow can send low-stock alerts from Shopify Admin at no cost. If you keep your own ledger in Google Sheets, use a formula to calculate running stock from your order log and a conditional formatting rule to highlight rows below your threshold. Then add a daily scheduled Make.com scenario that checks the sheet and sends an email or Slack message. Stocky Swap does not do this for you. You build it on top of its order log."
  - question: "What is the difference between Shopify inventory tracking and inventory management?"
    answer: "Shopify's built-in inventory tracking records stock levels and deducts quantities when orders are placed. Inventory management goes further. It tracks the full product lifecycle from supplier purchase order through receiving, storage, sales velocity analysis, reorder point calculation, and multi-location management. A Make.com and Google Sheets ledger covers order logging, velocity and reorder points at zero cost. It does not cover forecasting, bundles or barcode receiving."
relatedGuides:
  - title: "Stocky Swap — Free Shopify Stocky Replacement (Deploy in 4 Minutes)"
    href: "/stocky-swap/"
  - title: "Make.com for Shopify — Complete Beginner's Guide"
    href: "/make-com-shopify/"
  - title: "Shopify P&L Automation — Live Profit Reporting Free"
    href: "/shopify-profit-loss-automation/"
  - title: "The Recommended Free Shopify Stack"
    href: "/stack/"
---

Most Shopify inventory management guides end with a recommendation to pay $29–$199/month for an app. This one doesn't. Every system described here costs $0 and runs on tools you likely already have access to.

This guide covers the complete inventory management layer for Shopify stores, from basic order logging through supplier management, stock alerts, velocity analysis, and multi-location tracking. It also covers what to do now that **Shopify Stocky has shut down. It stopped working on 31 August 2026.**

> **Don't want to build the order log yourself?** I've already built that part. It's called Stocky Swap. It's free, it runs on Make.com, and you can deploy it to your store in about 4 minutes. It logs every paid order to your sheet. The stock counts, reorder flags and alerts below are still yours to add.  
> 👉 [Get Stocky Swap for free here](/stocky-swap/).

## What Shopify's Built-In Inventory Actually Covers

Before building anything additional, understand what Shopify already provides:

**What Shopify tracks natively:**
- Current stock levels per variant per location
- Stock deductions when orders are placed
- Transfers between locations and adjustments to quantities
- Purchase orders from suppliers, tracked and received in Shopify Admin
- Low-stock alerts through Shopify Flow
- Inventory history per product
- CSV import and export for bulk updates
- Multi-location inventory (on all plans except Starter)

Shopify's own migration guide for former Stocky users lists transfers, purchase orders, adjustments and Flow alerts as the native route. ([Shopify, "Transitioning from Stocky"](https://help.shopify.com/en/manual/products/inventory/transitioning-from-stocky), read 10 September 2026.)

**What Shopify does not provide:**
- Automatic order logging to an external system you own
- Real-time inventory ledger with running calculations
- Sales velocity analysis (how fast products are selling)
- Reorder point calculations based on lead time
- Inventory valuation (COGS tracking per unit)
- Automated low-stock notifications via Slack, email, or SMS

The free Make.com and Google Sheets system fills part of that gap: the order ledger, velocity and reorder points. It does this without an app that could shut down, change pricing, or lose your historical data. It does not forecast demand, track bundles or handle barcode receiving.

## The Core System — Make.com + Google Sheets

The foundation of free Shopify inventory management is a single Make.com scenario connected to a Google Sheets inventory ledger. Every time an order is paid in Shopify, Make.com captures the order data and appends a row to your sheet automatically.

**What this gives you:**
- A permanent, portable record of every order you own completely
- Stock level calculations via spreadsheet formulas that you add (see Sheet 2 below)
- Full order history that survives any app or platform change
- The foundation for every advanced feature described below

**Setup overview** (full step-by-step at [Stocky Swap](/stocky-swap/)):

1. Create a free Make.com account at [make.com — free, 1,000 ops/month](/go/make/?source=the-ultimate-guide-to-shopify-inventory--n1)
2. Create a new scenario with a Webhooks module as the trigger
3. Copy the webhook URL and add it to Shopify: **Settings → Notifications → Webhooks → Order payment**
4. Add a Google Sheets module to append a row for each incoming order
5. Map the fields: order ID, date, product title, variant, SKU, quantity, price, fulfilment status, customer name
6. Activate the scenario

From this point forward, every paid order in Shopify writes a new row to your sheet within seconds. That order log is what Stocky Swap does, and all it does. Stock counts, supplier tracking and alerts are the layers you build on top of it in the sections below. Stocky's end of service was 31 August 2026.

## The Google Sheets Inventory Ledger Structure

The sheet structure matters. A well-designed ledger supports every advanced feature below without rebuilding from scratch.

**Sheet 1 — Orders Log (auto-populated by Make.com)**

| Column | Data | Source |
|---|---|---|
| A | Order ID | Make.com |
| B | Date | Make.com |
| C | Product title | Make.com |
| D | Variant | Make.com |
| E | SKU | Make.com |
| F | Quantity sold | Make.com |
| G | Unit price | Make.com |
| H | Fulfilment status | Make.com |
| I | Customer name | Make.com |
| J | Location (only if your order payload carries one) | Make.com |

**Sheet 2 — Product Inventory (manually maintained, formula-calculated)**

| Column | Data | Source |
|---|---|---|
| A | SKU | Manual |
| B | Product name | Manual |
| C | Opening stock | Manual |
| D | Units received | Manual |
| E | Units sold (formula) | =SUMIF(Orders!E:E, A2, Orders!F:F) |
| F | Current stock | =C2+D2-E2 |
| G | Reorder point | Manual |
| H | Reorder status | =IF(F2<=G2,"REORDER NOW","OK") |
| I | Supplier | Manual |
| J | Lead time (days) | Manual |

Column E calculates total units sold for each SKU by summing the Orders Log. Column F gives current stock, and Column H flags which products need reordering. Both update every time Make.com adds an order row.

Column F only knows about paid orders and the units you enter in Column D. Refunds, returns, damaged stock and manual adjustments in Shopify never reach the sheet, so the figure drifts from Shopify's own count until you enter them by hand. Stocky Swap does not calculate stock on hand for you, and neither does this sheet on its own. Treat Shopify Admin as the count of record and reconcile against it.

**Sheet 3 — Supplier Purchase Orders**

A simple table for tracking what you've ordered from suppliers, expected delivery dates, and quantities received. When stock arrives, manually update Column D (Units received) in Sheet 2 — stock levels update automatically.

## Stock Alerts — Free Automated Notifications

With the inventory ledger in place, you can trigger alerts when stock falls below reorder points without checking the sheet manually.

**Option 1 — Email alert via Make.com (simplest)**

Add a second branch to your existing Make.com scenario: after logging the order to Google Sheets, check if the current stock level for that product is at or below the reorder point. If yes, send an email to your nominated address with the product name, current stock, and reorder point.

**Option 2 — Scheduled daily check (more reliable)**

Create a separate Make.com scenario that runs every morning at 8am. It reads your Sheet 2, filters rows where Column H = "REORDER NOW", and sends a consolidated email listing every product that needs reordering. This catches situations where stock dropped outside of order events (damaged goods, manual adjustments).

**Option 3 — Google Sheets email alert (no Make.com needed)**

In Google Sheets, use **Extensions → Apps Script** to write a simple Apps Script function that sends an email when triggered. Set it to run daily via a time-based trigger. This works without Make.com if you prefer to keep everything in Google's ecosystem, but be aware of the [Google Apps Script quota limits](/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/) on consumer accounts.

## Sales Velocity Analysis

Understanding how fast products sell tells you when to reorder before you run out — not after. With your Orders Log populated, add these calculations to Sheet 2:

**30-day velocity** (units sold in last 30 days):
```
=COUNTIFS(Orders!E:E, A2, Orders!B:B, ">="&TODAY()-30)
```

**Days of stock remaining** (at current velocity):
```
=IF(F2=0, "OUT OF STOCK", IF(velocity=0, "SLOW MOVER", ROUND(F2/velocity, 0)))
```

**Recommended reorder date** (based on lead time):
```
=IF(days_remaining<=lead_time, "ORDER NOW", TODAY()+(days_remaining-lead_time))
```

These formulas give you a live view of which products are running low based on actual sales rate — not arbitrary stock level thresholds.

## Multi-Location Inventory

Shopify's native multi-location tracking records stock per location, and for most stores it is the place to manage it. Stocky Swap's ledger has no location column. The order payment webhook fires before an order is fulfilled, so an online order may not carry a fulfilment location at that point. Check a few real payloads in Make before you build on that field.

If your orders do carry a location, create a Sheet 4 with one column per location and SUMIF formulas that calculate sold quantities per SKU per location. Current stock per location = opening stock + received - sold, by location. The same caveat as Sheet 2 applies: returns and adjustments have to be entered by hand.

## After the Stocky Shutdown

Shopify removed Stocky from the App Store on February 2, 2026. On August 31, 2026, Stocky stopped functioning entirely, and its APIs stopped the same day with no grace period. Purchase order history, stocktake records and inventory data held in Stocky are not deleted with it: Shopify says read-only access to export them continues for at least 90 days after that date, and it has published no deletion date. ([Shopify, "Transitioning from Stocky"](https://help.shopify.com/en/manual/products/inventory/transitioning-from-stocky), read 10 September 2026.)

**If you used Stocky:**

1. Export what you can now. Open Stocky in Shopify Admin and, if it still opens, export your purchase order history and stocktake records as CSV. Store the files in Google Drive. The read-only window has a floor of 90 days and no published end, so do not count on it lasting.
2. Move purchase orders, transfers and adjustments into Shopify Admin, which is where Shopify now handles them.
3. If you want your own copy of every order, deploy Stocky Swap. The [Stocky Swap setup](/stocky-swap/) takes about 4 minutes. It logs forward from the moment you switch it on and cannot fill in orders placed before then.
4. Rebuild any supplier tracking you kept in Stocky using Sheet 3 above, or in Shopify's purchase orders.

**If you never used Stocky:** Shopify Admin already tracks your stock. The Make.com and Google Sheets ledger is worth adding if you want an order record you own and the velocity and reorder views that Shopify does not calculate.

## Integrating Inventory with P&L Reporting

Once your inventory ledger is running, connecting it to profit and loss reporting costs nothing additional. It is a second branch on your existing Make.com scenario.

When each order arrives, Make.com writes to both your inventory sheet (quantity, fulfilment) and your P&L sheet (revenue, an estimated processing fee, COGS from your own cost table, and gross profit). Ad spend and other overheads are not in it, so it is gross profit per order, not net profit. The [Shopify P&L Automation](/shopify-profit-loss-automation/) guide covers the full P&L setup. If you deploy both together, you have an order ledger and a per-order profit sheet in one Google Sheets workbook.

## When to Consider a Paid Inventory App

The free system described here handles most Shopify stores well. The genuine limitations appear at:

- **10+ locations** — managing more than 3–4 locations via formula-based sheets becomes operationally complex
- **1,000+ SKUs** — SUMIF calculations across thousands of SKUs can slow sheet performance; a database-backed system handles this better
- **Complex bundling** — products that combine multiple SKUs (bundles, kits) require more sophisticated inventory logic than SUMIF can cleanly handle
- **Barcode scanning for receiving** — if your warehouse team scans items into stock, you need purpose-built receiving software

Below these thresholds, Shopify Admin plus the Make.com and Google Sheets ledger covers what most small stores used Stocky for. It is not equivalent to a paid inventory app: it has no forecasting, and its stock figures need the manual reconciliation described above. It is free, owned by you, and exportable at any time.

## Deploying Your Free Inventory System Today

The average store is paying anywhere from $29 to $500 a month for inventory management.

> **Don't want to build the order log yourself?** I've already built that part. It's called Stocky Swap. It's free, it runs on Make.com, and you can deploy it to your store in about 4 minutes. It logs every paid order to your sheet. The stock counts, reorder flags and alerts below are still yours to add.  
> 👉 [Get Stocky Swap for free here](/stocky-swap/).

1. **Deploy Stocky Swap.** The [setup](/stocky-swap/) takes about 4 minutes and gets order logging running from the next paid order.
2. **Set up the sheet structure.** Use the three-sheet layout above and copy the SUMIF formulas into Sheet 2.
3. **Add stock alert notifications.** Build a second Make.com scenario or branch for email alerts on low stock, or use Shopify Flow.
4. **Export Stocky data** if Stocky still opens in your admin. Its end of service was 31 August 2026. Shopify says read-only export access continues for at least 90 days after that date and has published no end date.
5. **Add P&L tracking.** A third branch on the same scenario, no additional setup cost.

Every step above is free. The only ongoing cost is Make.com's Core plan at $9/month if your order volume outgrows the free plan's 1,000 credits a month.


---

## Get the Stocky Swap files

The Complete Kit includes the Stocky Swap Make.com JSON blueprint. Import it and it logs one row per order line to your sheet from the next paid order. It does not record restocks, returns or adjustments; you add those as rows by hand. The kit also includes CAPI Shield (Meta purchase events), TikTok CAPI and P&L Auto. $19.99 one-time.

**[Get the Complete Kit — $19.99 →](/pro/)**


## Related App Alternatives
- [Stocky Pricing & Alternatives](/apps/stocky/)
