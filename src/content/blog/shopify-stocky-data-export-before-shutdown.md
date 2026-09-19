---
title: "Shopify Stocky Data Export — the Read-Only Window"
heading: "Shopify Stocky Data Export — What You Can Still Get Out After the 31 August 2026 Shutdown"
description: "Shopify Stocky's end of service was 31 August 2026, but read-only export access continues for at least 90 days. What Stocky holds, how to get it out, and what is recoverable if the app will not open."
answer: "Shopify set 31 August 2026 as Stocky's end of service, and nothing inside the app was migrated to Shopify Admin. Shopify says read-only export access continues for at least 90 days, so purchase orders, stocktakes and supplier records may still be retrievable. Stocky's APIs are the exception: they stopped dead that day."
publishDate: "2026-04-16"
updatedDate: "2026-09-10"
verifiedDate: "2026-09-10"
category: "inventory"
badge: "Stocky — export window open"
badgeType: "urgent"
readTime: 10
canonical: "https://stackarchitect.xyz/blog/shopify-stocky-data-export-before-shutdown/"
faqs:
  - question: "What data did I lose when Shopify Stocky shut down?"
    answer: "Nothing is lost automatically on the shutdown date, and this is the distinction that decided outcomes. Stocky became unusable on August 31, 2026, and Stocky's APIs stopped dead the same day with no grace period — so any third-party tool wired into them broke instantly. The data itself moved to read-only: Shopify says export access continues for at least 90 days after that date, covering purchase orders (supplier names, quantities, costs, delivery dates), stocktake history, transfer records, demand forecasting data and supplier contacts. Shopify has published no deletion date, and \"at least 90 days\" is a floor rather than a deadline. Shopify's own inventory levels in the Shopify Admin were never affected. (Source: Shopify, \"Transitioning from Stocky\", help.shopify.com/en/manual/products/inventory/transitioning-from-stocky, read 10 September 2026.)"
  - question: "How do I export my data from Shopify Stocky now that it has shut down?"
    answer: "In Shopify Admin, open the Stocky app. Go to Purchase orders → select all purchase orders → Export as CSV. Repeat for Stocktakes → Export as CSV, and Transfers → Export as CSV. Download all exported files and save them to Google Drive or a local backup immediately. Read-only export access continues for at least 90 days after August 31, 2026, but Shopify has not published the date it ends, so do it in the session you are reading this."
  - question: "Does the Shopify Stocky data export include supplier information?"
    answer: "Yes, but incompletely. Stocky's purchase order exports include supplier names and order details. However, Stocky's supplier database (contact details, lead times, payment terms stored within Stocky) may not export fully via CSV. Manually copy all supplier contact information, payment terms, and lead time data from Stocky's supplier records into a separate spreadsheet while read-only access lasts."
  - question: "Were my Shopify inventory levels deleted when Stocky shut down?"
    answer: "No. Shopify's native inventory levels — the stock quantities shown in Shopify Admin under Products → Inventory — are separate from Stocky data and were not affected by the shutdown. Only the data stored within the Stocky app itself (purchase orders, stocktakes, transfers, supplier records) is stranded behind the read-only export window."
  - question: "What replaces Stocky now the August 2026 shutdown has happened?"
    answer: "Stocky Swap is the free replacement — a Make.com webhook that automatically logs every Shopify order to a Google Sheet you own entirely. It deploys in 4 minutes, costs $0/month, and works on every Shopify plan. It logs forward from the moment you switch it on; it does not pull your Stocky archive out, which you export from Stocky yourself. Unlike Stocky, the data lives in a Google Sheet you control permanently — no vendor lock-in and no shutdown risk. The complete free inventory management system is covered in the Ultimate Guide to Shopify Inventory Management."
  - question: "Was the Shopify Stocky shutdown confirmed, or was it a rumour?"
    answer: "The shutdown is confirmed and official, and it has happened. Shopify removed Stocky from the App Store on February 2, 2026 and ended the service on August 31, 2026; the app no longer functions for inventory management and its APIs stopped that day with no grace period. Shopify's own guidance states that read-only access to export your data continues for at least 90 days after the shutdown date. (Source: Shopify, \"Transitioning from Stocky\", help.shopify.com/en/manual/products/inventory/transitioning-from-stocky, read 10 September 2026.)"
relatedGuides:
  - title: "Stocky Swap — Free Shopify Stocky Replacement (Deploy in 4 Minutes)"
    href: "/stocky-swap"
    badge: "Free replacement"
  - title: "The Ultimate Guide to Shopify Inventory Management 2026"
    href: "/blog/the-ultimate-guide-to-shopify-inventory-management"
  - title: "Make.com for Shopify — Complete Beginner's Guide"
    href: "/make-com-shopify/"
  - title: "Shopify Automation Stack for Small Stores"
    href: "/blog/shopify-automation-stack-for-small-stores"
---

Shopify set August 31, 2026 as Stocky's end of service, and nothing held inside the app was migrated to Shopify Admin. [Shopify removed Stocky from the App Store on February 2, 2026](https://help.shopify.com/en/manual/products/inventory/transitioning-from-stocky) — the August 31 date is confirmed and it has passed.

What happened on that date came in two halves, and almost everything written about the shutdown collapses them into one. **Stocky's APIs stopped dead on August 31 with no grace period** — any third-party tool, dashboard or automation reading from them broke that day rather than degrading. **Your data did not go with them.** Shopify's own transition guidance says read-only access to export it continues for **at least 90 days** after the shutdown date. That is a floor Shopify stated, not an end date it published, so it cannot be turned into a deadline on your calendar — and it is a reason to export today, not a reason to relax. ([Shopify, "Transitioning from Stocky"](https://help.shopify.com/en/manual/products/inventory/transitioning-from-stocky), read 10 September 2026.)

Your Shopify inventory levels are safe — they live in Shopify Admin, not in Stocky. But years of purchase order history, stocktake records, supplier contacts and demand data exist only inside Stocky.

This guide tells you exactly what to export, how to export it, and what to do with the data afterwards.

## What Data Stocky Holds — and What Is Stranded

First, understand the distinction between Shopify-owned data and Stocky-owned data. They are stored separately.

**Data that lives in Shopify Admin (never affected by the Stocky shutdown):**
- Current inventory levels per variant per location
- Product details, SKUs, barcodes
- Order history in Shopify
- Customer records
- Shopify Analytics reports

**Data that lives in Stocky (export-only since August 31, 2026 — at least 90 days, end date unpublished):**

- **Purchase orders:** Every purchase order you've created in Stocky — supplier name, products ordered, quantities, unit costs, expected delivery dates, received quantities, outstanding balances. This is your entire supplier procurement history.
- **Stocktake records:** All historical stock counts you've recorded in Stocky. If you've been using Stocky to document periodic inventory counts, this history disappears entirely.
- **Transfer records:** Inventory movements between locations recorded via Stocky transfers.
- **Demand forecasting data:** Stocky's sales velocity analysis and forecasting data is proprietary to the app and is not exportable in a usable format.
- **Supplier database:** Contact information, lead times, and payment terms stored directly in Stocky's supplier records — not synced to Shopify.

## How to Export Your Stocky Data — Step by Step

Do this in the session you are reading this. Stocky is read-only now rather than closed, and read-only is enough to export — Shopify puts that window at "at least 90 days" past August 31, 2026 without naming the day it shuts.

### Export 1 — Purchase Orders

Purchase orders are your most valuable Stocky data. This is a complete record of what you've bought, from whom, at what price, and when.

**In Stocky:** Purchase orders → top-right menu → Export

Select date range: set to your earliest purchase order date through today. Export format: CSV. Download the file immediately.

**What the export contains:** purchase order ID, supplier name, product, variant, SKU, quantity ordered, quantity received, unit cost, total cost, creation date, delivery date, status (open, received, cancelled).

**What it doesn't contain in the CSV:** supplier contact details (email, phone, address) — these are in the supplier database and require a separate manual export.

**Save to:** Google Drive folder named `Stocky_Export_[date]`. Do not save only to local drive — if your laptop is damaged or replaced, you lose the backup.

### Export 2 — Stocktakes

Historical stock count records from Stocky. Important if you reconcile inventory periodically or have accounting requirements for stock valuation at period end.

**In Stocky:** Stocktakes → select each completed stocktake → Export

Stocky exports stocktakes individually, not as a batch. If you have many historical stocktakes, export the most recent 12–24 months as a priority, then work backwards.

**What the export contains:** stocktake date, product, variant, SKU, expected quantity, counted quantity, variance.

### Export 3 — Transfers

Inventory transfers between locations recorded in Stocky.

**In Stocky:** Transfers → Export

If your store uses multiple locations and has been recording transfers in Stocky, export this before shutdown. If you use single-location inventory, transfers may be empty.

### Export 4 — Supplier Database (Manual)

This is the step most merchants miss. Stocky's supplier records contain contact details, payment terms, and lead times that do not export cleanly via CSV.

**In Stocky:** Suppliers → open each supplier record

Manually copy to a Google Sheet: supplier name, contact name, email address, phone number, address, payment terms, typical lead time in days, minimum order value. This takes 5–30 minutes depending on how many suppliers you have, but this data may not exist anywhere else.

**Template columns:**
```
Supplier Name | Contact Name | Email | Phone | Address | Payment Terms | Lead Time (days) | MOQ | Notes
```

### Export 5 — Product Cost Data

If you have entered cost prices (COGS) into Stocky, verify these are also reflected in Shopify's native product cost fields while read-only access lasts.

**In Shopify Admin:** Products → select a product → Cost per item field.

Stocky and Shopify sync cost prices in most cases, but verify your top 20–30 SKUs by value have accurate costs in Shopify Admin. This matters for your P&L reporting going forward.

## What to Do With Your Exported Data

### Store It Permanently in Google Drive

Create a folder structure:
```
Stocky_Export_2026/
  ├── Purchase_Orders_AllTime.csv
  ├── Stocktakes_2024_2026.csv
  ├── Transfers_AllTime.csv
  └── Suppliers_Manual_Export.csv
```

Share this folder with anyone who manages procurement. Set it to "Anyone with link can view" as a minimum so it isn't lost if your Google account has access issues.

### Import Historical Purchase Orders Into Your New System

Your new inventory system — whether Stocky Swap's Google Sheets approach or a paid alternative — should have a record of opening stock positions. The most practical approach:

1. Open your Purchase Orders CSV export
2. For each product, find the most recent received quantity and reconcile against current Shopify inventory levels
3. Use this to set your opening stock figures in Sheet 2 of the Stocky Swap inventory ledger (Column C — Opening stock)

This gives your new system a starting point based on real historical data rather than estimates.

### Connect Your Supplier Data to Your New Workflow

Your manually exported supplier database becomes the `Config` sheet in your new Google Sheets inventory system. Add columns for reorder point and reorder quantity alongside the contact information. When the automated low-stock alert fires (from your Make.com scenario), you have the supplier contact immediately to hand in the same system.

## Deploy Your Replacement Before You Export

There is a tempting sequence error here: export first, then deal with the replacement. The problem is that after August 31, every Shopify order that arrives has no system logging it. The gap between Stocky shutdown and your new system going live means lost inventory data.

The correct sequence:

1. **Deploy Stocky Swap now** — [4-minute setup](/stocky-swap/). This starts logging every new order immediately.
2. **Export all Stocky data** — using the steps above. Do this within the next 30 days.
3. **Import historical data** — use your exports to populate the opening stock figures in your new Sheet.
4. **Cancel Stocky** — once your replacement is running and your historical data is exported.

Stocky Swap starts capturing every new order the moment it's live. Your exported Stocky data gives you the historical baseline. Together they give you complete continuity — no gap in your inventory records.

## If You Need More Than Basic Order Logging

Stocky Swap covers the core use case: every order automatically logged to a Google Sheet with live stock calculations. What it doesn't replace:

**Purchase order management** — creating and tracking supplier orders. For this, your exported supplier database becomes a manual Google Sheets purchase order tracker. Not as slick as Stocky's UI, but functional and free.

**Demand forecasting** — Stocky's algorithm-based forecasting has no direct free equivalent. The sales velocity analysis formulas in the [Ultimate Inventory Guide](/blog/the-ultimate-guide-to-shopify-inventory-management/) cover a manual approach using SUMIF formulas on your order log.

**Barcode scanning for stocktakes** — if your team physically scans items during stock counts, you'll need a paid app with barcode scanning support. Stocky Swap does not cover physical scanning workflows.

For stores where these advanced features are essential, paid alternatives worth evaluating include Prediko ($49+/month) and Inventory Planner ($99+/month). Both are significantly more capable than Stocky was in its final form. But for the majority of Shopify stores that primarily used Stocky to track order history and stock levels — Stocky Swap does that free, permanently, with no shutdown date.

## If you only do one thing

Shopify set **31 August 2026** as Stocky's end of service. The test that matters is not what today's date is — it is whether Stocky still opens in your admin. Read-only export access is meant to run for at least 90 days past that date, but stores that uninstalled after the 2 February 2026 delisting ([Shopify, "Transitioning from Stocky"](https://help.shopify.com/en/manual/products/inventory/transitioning-from-stocky), read 10 September 2026) could not reinstall it and were on the far side of this months early.

**If Stocky still opens, do this now:**

1. Open Stocky
2. Export your Purchase Orders as CSV
3. Save the file to Google Drive

That single action preserves your most valuable Stocky data. Everything else — deploying a replacement, importing historical data, setting up your new workflow — can follow. The export is the only step on a clock nobody outside Shopify can see the end of.

**If Stocky no longer opens,** rather more is reconstructible than most people assume: current stock levels, order history, products and customers all live in Shopify and were never at risk. The [Stocky recovery path](/stocky-alternative/) covers what survives, what is genuinely gone, and the order to rebuild it in.

[Deploy Stocky Swap in 4 minutes →](/stocky-swap/)


---

## Replace Stocky with Stocky Swap

After you export your data, deploy Stocky Swap to start capturing live inventory data immediately — no manual migration, no data loss. The Complete Kit includes the Stocky Swap Make.com JSON blueprint plus CAPI Shield, TikTok CAPI, and P&L Auto. $19.99 one-time.

**[Get the Complete Kit — $19.99 →](/pro/)**


## Related App Alternatives
- [Stocky Pricing & Alternatives](/apps/stocky/)
- [Inventory Planner Pricing & Alternatives](/apps/inventory-planner/)
- [Prediko Pricing & Alternatives](/apps/prediko/)
