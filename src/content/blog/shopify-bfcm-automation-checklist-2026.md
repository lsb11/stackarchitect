---
title: "Shopify BFCM Automation Checklist 2026 — 14 Things to Set Up Before Black Friday"
description: "The complete Shopify Black Friday Cyber Monday automation checklist for 2026. Tracking verification, inventory prep, email flows, Make.com operations budget, and server-side tracking — everything to set up before November."
publishDate: "2026-04-21"
updatedDate: "2026-04-21"
category: "automation"
badge: "BFCM 2026"
badgeType: "urgent"
readTime: 14
canonical: "https://stackarchitect.xyz/blog/shopify-bfcm-automation-checklist-2026/"
faqs:
  - question: "When should I start preparing my Shopify store's automation for BFCM 2026?"
    answer: "Start in August or September at the latest. Server-side tracking needs 60–90 days of learning data before Smart Bidding and Advantage+ Shopping can optimise effectively for Black Friday traffic. Email list warm-up and deliverability preparation should begin 8 weeks before your first BFCM campaign. Inventory automation setup needs to be stable before your pre-BFCM stock arrives."
  - question: "What is the biggest automation mistake Shopify stores make before BFCM?"
    answer: "The biggest mistake is running paid ads with broken conversion tracking during the highest-spend period of the year. Stores spending $10,000–$100,000+ on Black Friday ads with browser-only tracking are optimising their campaigns on 60–75% of real conversion data at best. Every mis-attributed conversion during BFCM corrupts Smart Bidding models right when they matter most. Setting up server-side tracking via Make.com before BFCM is the highest-ROI automation task for most Shopify stores."
  - question: "How many Make.com operations does a Shopify store use during BFCM?"
    answer: "During BFCM, a typical Shopify store processes 3–10x its normal daily order volume. If your store averages 50 orders per day and processes 300 orders on Black Friday, and each order consumes 4 Make.com operations across CAPI Shield, TikTok CAPI, Stocky Swap, and P&L Auto, that is 1,200 operations on Black Friday alone — already over the free tier's 1,000 monthly limit. For BFCM, upgrade to Make.com Core ($9/month, 10,000 operations) in October and downgrade in January."
  - question: "Should I use Klaviyo or Systeme.io for my BFCM email campaigns?"
    answer: "For BFCM broadcast campaigns, both work. The key consideration is your contact list size and sending volume. Systeme.io's free plan supports 2,000 contacts with unlimited sends — sufficient for most small stores. For stores with 5,000+ contacts running complex abandoned cart and browse abandonment sequences during BFCM, Klaviyo's advanced segmentation may justify its cost during the peak period. Either way, set up your abandonment sequences at least 6 weeks before BFCM to allow time for testing."
  - question: "How do I make sure my Google Ads and Meta Ads tracking is accurate during BFCM?"
    answer: "Deploy server-side tracking before BFCM. Set up CAPI Shield for Meta Conversions API and Google Enhanced Conversions via Make.com — this ensures every purchase event is captured server-to-server regardless of iOS restrictions or ad blockers. During BFCM, 35–50% of purchases on typical Shopify stores are made on iOS devices. Without server-side tracking, your ad platforms are optimising on fewer than half your real conversions during your highest-spend period."
relatedGuides:
  - title: "CAPI Shield — Free server-side tracking"
    href: "/capi-shield"
    badge: "Set up now"
  - title: "Free Shopify Google Ads Conversion Tracking"
    href: "/shopify-google-ads-conversion-tracking"
    badge: "Set up now"
  - title: "Stocky Swap — Free inventory management"
    href: "/stocky-swap"
    badge: "Urgent — Aug 2026"
  - title: "Replace Klaviyo Free"
    href: "/replace-klaviyo-free"
  - title: "Complete Kit — All 4 automations"
    href: "/pro"
    badge: "$29"
---

# Shopify BFCM Automation Checklist 2026 — 14 Things to Set Up Before Black Friday

Black Friday Cyber Monday 2026 starts in approximately 7 months. That sounds like plenty of time. It isn't — not if you want your tracking, inventory, email, and automation infrastructure to be fully calibrated before you start spending serious money on ads.

This checklist covers the 14 automation tasks every Shopify store should complete before BFCM 2026, ordered by urgency. The first three items need to happen now. Everything else has a deadline.

---

## Part 1 — Tracking (Complete Before September)

Your ad platforms need 60–90 days of clean conversion data to optimise effectively. If you set up server-side tracking in October, it will not be calibrated in time for Black Friday.

### ✅ 1. Deploy server-side Meta Conversions API

**Deadline: Now — August at the latest**

If you are running Meta Ads without server-side tracking, your Advantage+ Shopping campaigns and Manual campaigns are optimising on incomplete data right now — and that problem compounds exponentially during BFCM when iOS-heavy mobile traffic peaks.

[CAPI Shield](/capi-shield) sends purchase events directly from Shopify's server to Meta Conversions API via Make.com webhook. It takes 6 minutes to deploy and costs $0/month. Every day you delay is a day of corrupted bidding signals.

**What to do:** Deploy CAPI Shield. Verify in Meta Events Manager → Test Events that server Purchase events appear alongside browser events. Check your Event Match Quality score reaches 7.0+ before September.

### ✅ 2. Deploy server-side Google Enhanced Conversions

**Deadline: Now — August at the latest**

Google Smart Bidding and Performance Max need conversion history to optimise. During BFCM, you will spend your highest ad budgets of the year — likely 3–10x your normal daily spend. If your Google Ads conversion data is missing 25–40% of real purchases due to iOS and Safari restrictions, you are feeding bad signals into the algorithm at the worst possible time.

[Free Shopify Google Ads Conversion Tracking](/shopify-google-ads-conversion-tracking) via Make.com recovers these lost conversions server-side. Same webhook as CAPI Shield — add it as a second branch in your existing Make.com scenario.

**What to do:** Add Google Enhanced Conversions to your Make.com scenario. Verify in Google Ads → Conversions → Diagnostics. Allow 30+ days of data before BFCM for Smart Bidding to incorporate the new signals.

### ✅ 3. Set up server-side TikTok Events API

**Deadline: September**

If you advertise on TikTok, the same iOS tracking problem applies — arguably worse, because TikTok's audience skews younger and more iOS-heavy than Meta. [TikTok Events API](/tiktok-events-api-shopify) via Make.com adds TikTok server-side tracking as a third branch on the same Shopify webhook. No additional Shopify setup required.

### ✅ 4. Verify your attribution windows before BFCM

**Deadline: October**

BFCM is when attribution window mismatches cause the most confusion. Check:
- Meta: are you using 7-day click, 1-day view? Confirm this is your reporting window across all campaigns
- Google Ads: is your conversion window set to 30 days? Extend to 90 days for BFCM if you sell considered-purchase products
- Shopify Analytics: understand the difference between Shopify's attribution model and Meta/Google — they will never match exactly, but the gap should be under 15% with server-side tracking

---

## Part 2 — Inventory (Complete Before October)

### ✅ 5. Deploy Stocky Swap before the August 31 shutdown

**Deadline: August 31, 2026 — this is a hard deadline**

Shopify is permanently closing Stocky on August 31, 2026. All data is deleted after that date. If you rely on Stocky for inventory tracking, you must migrate before this date.

[Stocky Swap](/stocky-swap) deploys in 4 minutes — a Make.com JSON blueprint that logs every order to Google Sheets in real time. It captures stock levels, SKU data, fulfilment status, and full order history. The Complete Kit includes the pre-built JSON file you can import in 60 seconds.

**For BFCM specifically:** Having real-time inventory data in Google Sheets during BFCM is essential for preventing overselling on high-demand SKUs. The Sheets dashboard gives you live visibility across all variants without needing to refresh Shopify admin constantly.

### ✅ 6. Pre-build your BFCM inventory Google Sheets dashboard

**Deadline: October**

Add a BFCM tab to your Stocky Swap Sheets that flags SKUs at risk of stockout. Use conditional formatting to highlight any variant with under 20 units (or whatever your threshold is). Set up a COUNTIF formula that tracks daily velocity and projects days-to-stockout based on your BFCM order rate forecast.

### ✅ 7. Audit your Make.com operations budget

**Deadline: October — upgrade before BFCM**

The Make.com free tier covers 1,000 operations per month. During BFCM, your order volume may multiply 5–10x. Each order triggers 3–5 operations across your automation stack.

**Calculate your BFCM operations budget:**
- Forecast your Black Friday order count (use last year × 1.2 as a baseline)
- Multiply by 4 operations per order (CAPI Shield + Google CAPI + Stocky Swap + P&L Auto)
- If the result exceeds 1,000, upgrade to **Make.com Core ($9/month, 10,000 operations)** in October

Downgrade back to free in January. The $27 cost for three months of Core tier during BFCM is worth it.

---

## Part 3 — Email (Complete Before October)

### ✅ 8. Build your BFCM email sequence structure

**Deadline: September**

Before you write a single BFCM campaign email, document your sequence architecture:

- **Pre-BFCM warm-up** (2 weeks before): tease upcoming deals, build exclusivity with your list
- **VIP early access** (48 hours before Black Friday): reward engaged subscribers with early access
- **Black Friday launch** (send at midnight or 6am): main offer email
- **Abandoned cart recovery** (1 hour, 24 hours, 48 hours after abandonment): automated, not manual
- **Cyber Monday** (Monday): separate angle, different creative, genuine reason to send again
- **Last chance** (Tuesday): closes the window, real urgency

This architecture works identically on Klaviyo and Systeme.io. Build it in September so you have time to test every trigger.

### ✅ 9. Warm up your email list before BFCM

**Deadline: October**

If your list has been quiet — low send frequency, high dormancy — a sudden spike in BFCM email volume will trigger spam filters and tank your deliverability exactly when you need it most.

From October onwards: send at least one email per week to your full list. Clean unengaged contacts (no open in 90+ days) before BFCM to protect your sender reputation. A list of 5,000 engaged contacts will out-perform a list of 20,000 with 60% dormancy every time.

### ✅ 10. Set up your abandoned cart automation now

**Deadline: September**

Abandoned cart sequences are the highest-ROI email automation for BFCM — typically recovering 5–15% of abandoned carts. Set yours up now so it accumulates revenue through October and is fully tested before November.

On Systeme.io: create an automation triggered by a tag that fires when someone adds to cart but doesn't purchase within 1 hour. Sequence: 1 hour, 24 hours, 48 hours. Include the product image, price, and a direct link back to cart.

---

## Part 4 — P&L and Profitability (Complete Before October)

### ✅ 11. Deploy P&L Auto before BFCM

**Deadline: October**

BFCM is when stores make expensive profitability mistakes — running promotions that look profitable in Shopify Analytics but are actually loss-making when COGS, transaction fees, and ad spend are included.

[P&L Auto](/shopify-profit-loss-automation) logs every order's revenue, COGS, Shopify fees, and estimated ad spend to a Google Sheets dashboard in real time. During BFCM, you can see your actual net profit per order as orders come in — not weeks later when you reconcile.

### ✅ 12. Pre-load your COGS data before November

**Deadline: October**

The P&L Auto scenario uses a COGS lookup table in Google Sheets — a tab where you map each Variant_ID to its cost price. Pre-populate this table before BFCM so every order is automatically profit-calculated from the first sale. Check your supplier invoices and update costs if they have changed for BFCM stock.

---

## Part 5 — Stability and Monitoring (Complete Before November)

### ✅ 13. Add Make.com error notifications

**Deadline: October**

Set up Make.com to email or Slack-notify you if any scenario errors out. During BFCM, you will not be watching your Make.com dashboard — you will be managing orders, customer service, and ad spend. An error notification means you catch a tracking failure within minutes, not days.

In Make.com: go to each scenario → Settings → Error Handling → add an email notification for any failed execution. Route to an email you check on your phone.

### ✅ 14. Run a full end-to-end test order in October

**Deadline: October**

Before BFCM, place a real paid test order (then immediately refund it) and verify:
- ✓ Meta Events Manager shows a server-side Purchase event within 5 minutes
- ✓ Google Ads Conversions diagnostics shows an Enhanced Conversion event
- ✓ TikTok Events Manager shows a CompletePayment event (if applicable)
- ✓ Stocky Swap Google Sheet adds a new row with correct stock data
- ✓ P&L Auto Google Sheet adds a new row with correct revenue and COGS data
- ✓ Your abandoned cart sequence does NOT trigger (test order should complete)

If all five fire correctly, your automation stack is BFCM-ready.

---

## The Fastest Path to BFCM-Ready

If you have not set up any of the above, the Complete Kit gives you four Make.com JSON blueprints — CAPI Shield, TikTok CAPI, Stocky Swap, and P&L Auto — ready to import in 10 minutes instead of building each one from scratch.

**[Get the Complete Kit — $29 →](/pro)**

Deploy all four automations today. Run the test order checklist in October. Enter BFCM with a complete, verified automation stack.

---

## BFCM Automation Timeline Summary

| Task | Deadline | Priority |
|---|---|---|
| Deploy Meta CAPI Shield | **Now** | Critical |
| Deploy Google Enhanced Conversions | **Now** | Critical |
| Deploy Stocky Swap | **Aug 31** | Hard deadline |
| Deploy TikTok Events API | September | High |
| Build email sequence architecture | September | High |
| Set up abandoned cart automation | September | High |
| Verify attribution windows | October | Medium |
| Warm up email list | October | High |
| Audit Make.com operations budget | October | Medium |
| Deploy P&L Auto | October | High |
| Pre-load COGS data | October | Medium |
| Add Make.com error notifications | October | Medium |
| Upgrade Make.com to Core tier | October | Medium |
| Run full end-to-end test order | October | Critical |
