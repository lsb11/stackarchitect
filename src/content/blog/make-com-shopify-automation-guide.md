---
title: "Make.com for Shopify: Free Automation Guide 2026"
description: "Connect Make.com to Shopify in 3 minutes. Run 4 scenarios every store needs — server-side tracking, inventory, P&L, and email. Free plan covers most."
publishDate: "2026-03-10"
updatedDate: "2026-04-14"
category: "automation"
badge: "Start Here"
badgeType: "new"
readTime: 16
canonical: "https://stackarchitect.xyz/blog/make-com-shopify-automation-guide/"
faqs:
  - question: "Is Make.com free for Shopify automation?"
    answer: "Make.com's free plan gives 1,000 operations per month — 10× more than Zapier's 100 free tasks — and includes webhook triggers and HTTP modules. Most Shopify stores under 250 orders per month run the complete automation stack free indefinitely."
  - question: "How do I connect Make.com to Shopify?"
    answer: "In Make.com, create a new scenario and add a Webhooks module as the trigger. Click Add to generate a webhook URL and copy it. In Shopify Admin, go to Settings → Notifications → Webhooks, click Create webhook, select Order payment as the event, paste your Make.com URL, set format to JSON, and save. The connection takes about 3 minutes."
  - question: "What is the difference between Make.com and Zapier for Shopify?"
    answer: "Make.com's free plan gives 1,000 operations vs Zapier's 100 tasks. Make.com supports multi-step scenarios with branching — one webhook fans out to multiple destinations simultaneously — which Zapier restricts to paid plans. At equivalent paid tiers, Make.com is approximately 4× cheaper per operation."
  - question: "Does Make.com work without coding?"
    answer: "Yes. Make.com is a visual drag-and-drop automation builder. No code is required to connect Shopify, send data to Google Sheets, Meta CAPI, TikTok Events API, or Systeme.io. Every module is configured through form fields in the visual editor."
  - question: "How many Shopify orders can Make.com handle on the free plan?"
    answer: "A 4-branch scenario uses approximately 5-6 operations per order. At 1,000 operations per month, the free plan covers roughly 160-200 orders per month on the full automation stack."
relatedGuides:
  - title: "Zapier vs Make vs Shopify Flow — Honest comparison 2026"
    href: "/blog/zapier-vs-shopify-flow-vs-make"
    badge: "Comparison"
  - title: "CAPI Shield — Free Meta + Google server-side tracking"
    href: "/capi-shield"
  - title: "Stocky Swap — Free inventory automation before Aug 2026"
    href: "/stocky-swap"
  - title: "Shopify P&L Auto — Live profit reporting free"
    href: "/shopify-profit-loss-automation"
---

# Make.com for Shopify: Complete Beginner's Guide to Free Store Automation 2026

Make.com is the automation engine behind every free tool on this site. One Shopify webhook, multiple parallel branches: Meta CAPI, Google Enhanced Conversions, TikTok Events API, Google Sheets inventory, and live P&L — simultaneously, at $0/month.

This guide starts from zero. What Make.com is, how to connect it to Shopify in 3 minutes, and the 4 scenarios every store should run.

## What Make.com Actually Is

Make.com (formerly Integromat) is a visual automation platform. You connect services by dragging modules onto a canvas and defining what data flows between them. No code required.

The key difference from Zapier: **one trigger can branch to multiple destinations simultaneously.** One Shopify Order Payment webhook fans out to Meta CAPI, Google Enhanced Conversions, TikTok Events API, Google Sheets inventory, and P&L reporting — five destinations, one trigger, $0/month on the free plan.

Make.com's free plan gives **1,000 operations per month** — 10× more than Zapier's 100 free tasks — and includes [webhook triggers and HTTP modules](https://www.make.com/en/help/tools/webhooks) at no cost. Most stores under 250 orders/month run the complete stack free indefinitely.

## How to Connect Make.com to Shopify in 3 Minutes

You do not need to install a Shopify app. The connection uses [native Shopify webhooks](https://shopify.dev/docs/api/admin-rest/2024-01/resources/webhook) — available on every plan including Basic.

**Step 1 — Create your Make.com account**

Go to [Make.com](/go/make) and sign up on the free plan. No credit card required.

**Step 2 — Create a new scenario and add a Webhooks module**

In Make.com, click **Create a new scenario**. Click the centre circle to add a module. Search for **Webhooks** and select **Custom webhook** as the trigger. Click **Add** — Make.com generates a unique URL. Copy it.

**Step 3 — Add the webhook in Shopify**

In Shopify Admin: **Settings → Notifications → Webhooks → Create webhook**

- Event: **Order payment**
- Format: **JSON**
- URL: paste your Make.com URL

Save. Your store will now send order data to Make.com every time an order is paid.

**Step 4 — Capture a real order payload**

In Make.com, click **Run once** to enter listening mode. Place a test order in Shopify (use a 100% discount code). Make.com captures the order and shows you all available fields — this is the data you'll map to in subsequent modules.

## The 4 Scenarios Every Shopify Store Should Run

### Scenario 1 — CAPI Shield (Meta + Google server-side tracking)

Routes order data to Meta Conversions API and Google Enhanced Conversions server-to-server, bypassing browsers and iOS restrictions. Recovers 20–40% of lost purchase events your browser pixel misses.

If you run Meta or Google Ads without server-side events, your ROAS data is incomplete and your campaigns are optimising blind. This is the highest-ROI automation on the list.

Full setup: [CAPI Shield — free server-side tracking](/capi-shield)

### Scenario 2 — Stocky Swap (Live inventory to Google Sheets)

Every Shopify order automatically writes a new row to your Google Sheets inventory tracker. Required before August 31, 2026 — Shopify Stocky shuts down permanently on that date.

Every paid alternative charges $29–$199/month. Stocky Swap does the same for $0.

Full setup: [Stocky Swap — free inventory automation](/stocky-swap)

### Scenario 3 — P&L Auto (Live profit reporting)

Every order auto-populates revenue, COGS, Shopify transaction fees, and net profit into a Google Sheets dashboard within 60 seconds of payment. Every P&L app charges $25–$299/month for this.

If Scenario 1 or 2 is already set up, P&L is a single additional branch on your existing scenario — under 3 minutes to add.

Full setup: [Shopify P&L Automation](/shopify-profit-loss-automation)

### Scenario 4 — TikTok Events API

If you advertise on TikTok, branch the same webhook to TikTok's Events API. Critical detail: TikTok uses **CompletePayment** (not "Purchase") as the event name. Wrong name means events go to the wrong category in Events Manager.

Full setup: [TikTok Events API for Shopify](/tiktok-events-api-shopify)

## The Multi-Branch Architecture

All four scenarios run from a single Make.com scenario:

```
Shopify Order Payment webhook
    ↓
Make.com receives order data
    ↓
Router module branches simultaneously:
    ├── Meta CAPI HTTP request
    ├── Google Enhanced Conversions HTTP request
    ├── TikTok Events API HTTP request
    ├── Google Sheets row (inventory)
    └── Google Sheets row (P&L)
```

Five destinations. One trigger. One scenario. One free account.

## Free Plan Limits

| Orders/month | Operations used | Plan needed |
|---|---|---|
| Under 160 | ~960 | **Free — $0/month** |
| 160–1,600 | ~9,600 | Core — $9/month |
| 1,600–10,000 | ~60,000 | Pro — $16/month |

The upgrade trigger and decision framework is covered in the [upgrade guide](/blog/when-to-upgrade-free-make-google-workspace).

## Three Mistakes to Avoid

**Using Zapier.** Zapier's free plan does not support webhook triggers. You cannot build this stack on Zapier's free plan at any combination of scenarios. [Full comparison here](/blog/zapier-vs-shopify-flow-vs-make).

**Not de-duplicating events.** When running browser pixels and server-side events simultaneously, include an `event_id` in both so platforms count one purchase, not two. The [CAPI Shield guide](/capi-shield) covers this in detail.

**Wrong TikTok event name.** The event is `CompletePayment`. Not `Purchase`, not `purchase`. The exact string matters — every other guide gets this wrong.

## Getting Started

1. [Create a free Make.com account](/go/make) — no credit card, instant
2. Connect Shopify using the steps above — 3 minutes
3. Deploy [CAPI Shield](/capi-shield) first — highest ROI
4. Add [Stocky Swap](/stocky-swap) — urgent before August 31, 2026
5. Add [P&L Auto](/shopify-profit-loss-automation) as a branch on the same scenario

The entire stack runs free for most Shopify stores. The [Zapier vs Make comparison](/blog/zapier-vs-shopify-flow-vs-make) has the full cost breakdown.


---

## Skip the build — get the pre-configured Make.com files

The Complete Kit gives you four production-ready Make.com JSON blueprints for Shopify: CAPI Shield (server-side tracking), TikTok CAPI, Stocky Swap (inventory), and P&L Auto. Import each in 60 seconds instead of building from scratch. $29 one-time.

**[Get the Complete Kit — $29 →](/pro)**
