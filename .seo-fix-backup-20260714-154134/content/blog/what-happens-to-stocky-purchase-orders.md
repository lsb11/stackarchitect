---
title: "What Happens to Stocky Purchase Orders After August 31, 2026?"
description: "Your Stocky purchase order history is permanently deleted after Aug 31 2026 — Shopify won't migrate it. Exactly what's lost, how to export POs to CSV now, and how to rebuild the workflow in Shopify."
publishDate: "2026-06-25"
updatedDate: "2026-06-25"
category: "inventory"
badge: "Urgent"
badgeType: "urgent"
readTime: 5
canonical: "https://stackarchitect.xyz/blog/what-happens-to-stocky-purchase-orders/"
ogTitle: "What Happens to Stocky Purchase Orders After Aug 31, 2026?"
ogDescription: "All Stocky purchase order history is permanently deleted after Aug 31 2026 and Shopify won't migrate it. How to export it now and rebuild POs in Shopify."
faqs:
  - question: "Are Stocky purchase orders deleted permanently?"
    answer: "Yes. After August 31, 2026, all Stocky purchase order history is permanently deleted and does not migrate to Shopify automatically. Export it as CSV before the deadline or it is gone."
  - question: "Can I export Stocky purchase orders to CSV?"
    answer: "Yes. In Shopify admin go to Apps, then Stocky, then the Reports dropdown, select the purchase order report, set the full date range, and export as CSV. Suppliers attached to those POs, however, cannot be exported and must be documented manually."
  - question: "Does Shopify keep my Stocky purchase orders?"
    answer: "No. Shopify has confirmed historical Stocky data, including purchase orders, does not transfer to Shopify Admin automatically. Only data stored in Shopify itself — orders, products, customers — is unaffected."
  - question: "How do I create purchase orders after Stocky shuts down?"
    answer: "Shopify Admin now includes native purchase order creation, vendor records, and receiving for free. For automated, forecast-driven purchase orders, use a paid tool like Inventory Planner or Prediko."
relatedGuides:
  - title: "How to Export Stocky Data — Full Guide"
    href: "/blog/shopify-stocky-data-export-before-shutdown/"
    badge: "Urgent"
  - title: "Stocky Shutdown — What Happens Aug 31"
    href: "/stocky-shutdown/"
  - title: "Stocky Migration Checklist"
    href: "/stocky-migration-checklist/"
  - title: "All Stocky Alternatives Compared"
    href: "/stocky-alternative/"
---

# What Happens to Stocky Purchase Orders After August 31, 2026?
**All Stocky purchase order history — PO numbers, line items, costs, dates — is permanently deleted after August 31, 2026, and Shopify does not migrate it. To keep it, export your purchase orders as CSV from Stocky → Reports before the deadline. Suppliers attached to those POs cannot be exported and must be documented manually.**

If you've built up months or years of purchase order history in Stocky, this is the question that matters. This page explains exactly what's lost, what survives, how to save your PO history before the deadline, and how to rebuild the purchase-order workflow afterward — the specific data-loss question the general [shutdown guide](/stocky-shutdown/) doesn't have room to fully cover.

## Why this catches stores off guard

Two assumptions trip merchants up. The first is "Shopify owns Stocky, so my data will just move to Shopify." It won't — Shopify has explicitly said historical POs and stocktakes don't migrate automatically. The second is "I'll have read-only access after, so I can grab it later." Shopify does provide read-only access for an unspecified limited period, but the APIs stop on August 31 and no new export capability is promised. Counting on the read-only window is a gamble with no upside — exporting now takes five minutes.

## What's deleted vs what survives

**Deleted (lives inside Stocky):** all purchase orders and their line items, supplier records attached to POs, stocktake history, inventory adjustment logs, product cost data entered in Stocky, and reorder/safety-stock settings.

**Safe (lives in Shopify Admin):** your Shopify order history, product catalogue, customer records, current inventory levels, and financial reports. The Stocky shutdown doesn't touch any of these.

So your *sales* history is fine. It's your *purchasing* history — what you ordered, from whom, at what cost — that's at risk.

## How to export your purchase orders now (5 minutes)

1. Shopify admin → **Apps → Stocky**.
2. Open the **Reports** dropdown.
3. Select the **purchase order** report and set the date range to your full history (the default truncates older orders).
4. Export as **CSV** — it includes PO numbers, items, quantities, unit costs, and dates.
5. Save with a dated filename and store it in a cloud folder.

One catch worth repeating: **suppliers attached to those POs cannot be exported** — Stocky has no supplier export. You'll need to document supplier names, contacts, lead times, and terms manually. The full step-by-step, including the supplier workaround, is in the [Stocky export guide](/blog/shopify-stocky-data-export-before-shutdown/).

A reconciliation tip that's saved merchants real money: Stocky's stored cost prices can drift from Shopify Admin's. Before archiving, spot-check a few SKUs against recent supplier invoices — stores have found cost prices understated by thousands per container order during exactly this check.

## Rebuilding the purchase-order workflow after Stocky

Once your history is exported, you need a way to *create* POs going forward:

**Shopify Admin (free):** Shopify's native inventory now includes basic purchase order creation, supplier ("vendor") records, transfers, and receiving. For simple purchasing this covers it. The gaps are automated, velocity-based PO suggestions and advanced forecasting, which Shopify Admin doesn't replicate.

**A paid planning tool:** if you need automated reorder recommendations, multi-location POs with vendor constraints, or demand forecasting, a dedicated tool fills the gap. Compare the leaders — [Inventory Planner](/blog/stocky-vs-inventory-planner/) ($119.99+/mo) and [Prediko](/blog/stocky-vs-prediko/) ($119+/mo) — or see the [full alternatives page](/stocky-alternative/).

**Free tracking for everything else:** if POs were the only Stocky feature you needed and the rest was just order/stock tracking, handle tracking with the free [Stocky Swap](/stocky-swap/) and create the occasional PO directly in Shopify Admin. No subscription required.

Whatever you choose for going forward, the irreversible task is the export. Do it this week — work through the [migration checklist](/stocky-migration-checklist/) to make sure nothing else is left behind.
