---
title: "Fix Shopify Google Ads Conversion Tracking 2026 — Free"
description: "Google Enhanced Conversions for Shopify via Make.com — no GTM, no paid app, no code. Recovers 20–40% of missing purchase events. Free setup in 6 minutes."
publishDate: "2026-04-16"
updatedDate: "2026-04-16"
category: "tracking"
badge: "Free Fix"
badgeType: "urgent"
readTime: 14
canonical: "https://stackarchitect.xyz/blog/how-to-fix-shopify-google-ads-conversion-tracking-2026/"
faqs:
  - question: "How do I set up Google Ads conversion tracking on Shopify for free?"
    answer: "The free approach is two-layer: install the Google & YouTube sales channel from the Shopify App Store for basic GA4 and Google Ads purchase event tracking (2 minutes, no cost), then add Google Enhanced Conversions via Make.com webhook for server-side coverage (6 minutes, no cost). The Make.com approach sends purchase events directly from Shopify's server to Google's Conversions API, bypassing browser restrictions, iOS tracking limitations, and ad blockers. No Google Tag Manager required."
  - question: "What is Google Enhanced Conversions for Shopify?"
    answer: "Google Enhanced Conversions is a server-side conversion tracking method that supplements your standard Google Ads pixel by sending hashed customer data (email address, phone number) alongside purchase events directly to Google's API. This allows Google to match conversions to signed-in Google accounts even when cookies are blocked or iOS has cleared attribution data. For Shopify stores, it recovers 15-35% of purchase events the browser pixel misses."
  - question: "Do I need Google Tag Manager for Shopify conversion tracking?"
    answer: "No. The free Make.com approach sends Google Enhanced Conversions events directly to Google's Conversions API endpoint via HTTP request — no Google Tag Manager container required. GTM is one implementation method; direct API calls via Make.com is another, and for Shopify stores it is simpler and more reliable because it operates entirely server-side with no browser dependency."
  - question: "Why is my Google Ads showing fewer conversions than Shopify in 2026?"
    answer: "Three causes account for most Google Ads attribution gaps on Shopify in 2026: iOS Link Tracking Protection stripping gclid click IDs from URLs opened in Private Browsing, Mail, and Messages; Safari Intelligent Tracking Prevention clearing attribution cookies before the purchase completes; and ad blockers preventing the Google Ads pixel from loading. Server-side Google Enhanced Conversions fixes all three because events travel from Shopify's server to Google directly, bypassing browsers entirely."
  - question: "How much does it cost to fix Google Ads conversion tracking on Shopify?"
    answer: "The complete free setup costs $0/month. The Google & YouTube sales channel is free. Make.com's free plan (1,000 operations per month) covers the server-side Enhanced Conversions layer for stores processing under 500 orders per month. Above that, Make.com Core at $9/month covers 10,000 operations. Every paid alternative — Stape ($29+/month), Littledata ($99+/month), Analyzify ($99+/month) — charges a monthly subscription for the same server-side outcome."
  - question: "What is the difference between Google Ads conversion tracking and Google Enhanced Conversions?"
    answer: "Standard Google Ads conversion tracking uses a browser-based pixel (gTag) that fires when the customer's browser loads your order confirmation page. It is subject to iOS restrictions, ad blockers, and cookie clearing. Google Enhanced Conversions is a supplementary layer that sends hashed customer data server-to-server, independently of browser state. Running both simultaneously — browser pixel plus server-side Enhanced Conversions — gives Google the most complete picture of your actual purchase volume."
relatedGuides:
  - title: "CAPI Shield — Free Meta + Google Server-Side Tracking"
    href: "/capi-shield"
    badge: "Deploy Free"
  - title: "Shopify Server-Side Tracking — Complete Setup Guide"
    href: "/blog/shopify-server-side-tracking-complete-setup-guide"
  - title: "Shopify Meta ROAS Dropped 2026 — The Free Fix"
    href: "/blog/shopify-meta-roas-dropped-2026-fix"
  - title: "How to Fix Shopify Conversion Tracking After iOS Updates"
    href: "/blog/how-to-fix-shopify-conversion-tracking-after-ios-updates"
---

# How to Fix Shopify Google Ads Conversion Tracking in 2026 — Free Server-Side Setup (No GTM Required)

If your Google Ads dashboard shows significantly fewer purchases than your Shopify order count, your conversion tracking is broken. In 2026, browser-based Google Ads pixels miss 20–40% of real purchases on most Shopify stores. The fix is server-side Enhanced Conversions — and it costs nothing.

This guide covers the complete free setup: the native Google & YouTube channel layer (2 minutes), and the Make.com server-side Enhanced Conversions layer (6 minutes). No Google Tag Manager. No paid apps. No code.

## Why Google Ads Conversion Tracking Breaks on Shopify

Google Ads conversion tracking on Shopify works by firing a browser-based pixel when the customer's browser loads the order confirmation page. When the pixel loads successfully, it sends a purchase event to Google. When it doesn't load — for any of several reasons — the conversion is invisible to Google Ads and your campaigns optimise on incomplete data.

**The three causes of broken Google Ads tracking in 2026:**

**iOS Link Tracking Protection (iOS 17 and later)** strips Google's `gclid` click identifier from URLs when links are opened from Private Browsing mode, Mail, and Messages. Without `gclid`, Google's pixel cannot match the purchase to the original ad click. The purchase fires as an unattributed conversion — or doesn't fire at all if the pixel fails to load.

**Safari Intelligent Tracking Prevention (ITP)** limits the lifespan of first-party cookies. A customer who clicks a Google ad on Monday and purchases on Wednesday or Thursday may fall outside the cookie attribution window. The pixel fires on purchase but cannot trace it back to the ad click.

**Ad blockers and privacy browsers** block the Google Ads pixel script entirely. Brave, Firefox with Enhanced Tracking Protection, and Safari with ad blockers all prevent `gtag.js` from loading. No pixel load means no conversion event regardless of what the customer does.

The cumulative effect: on a typical Shopify store in 2026, 20–40% of purchases from Google Ads never appear in Google Ads Manager.

## What Google Enhanced Conversions Actually Does

Google Enhanced Conversions is a supplementary tracking layer that sends hashed customer data (SHA-256 hashed email address, and optionally phone number and address) alongside purchase events directly to Google's Conversions API. This is a server-to-server connection — your server calls Google's API, no browser is involved.

Google uses the hashed data to match purchases to signed-in Google accounts via their own first-party data. A customer who clicked a Google ad while logged into Gmail, then purchased on a different device or after cookies were cleared, can still be matched and attributed — because Google recognises the hashed email against their own account records.

The result: conversions that were invisible to the browser pixel — because iOS blocked the click ID, ITP cleared the cookie, or an ad blocker prevented the pixel from firing — are recovered via the server-side match.

**What Enhanced Conversions recovers:**
- Purchases where iOS stripped `gclid` from the ad link
- Purchases where ITP cleared the attribution cookie before the purchase completed
- Purchases in browsers where the pixel was blocked
- Cross-device purchases (clicked on mobile, purchased on desktop) where cookies don't transfer

**What Enhanced Conversions cannot recover:**
- Purchases from customers who never clicked a Google ad
- Purchases from customers with no Google account
- Purchases where the customer explicitly opted out of all tracking and provided no contact data at checkout

## Layer 1 — Google & YouTube Sales Channel (2 Minutes, Free)

Before adding server-side Enhanced Conversions, ensure the native Shopify layer is active. This gives Google basic purchase event data and is a prerequisite for Enhanced Conversions to work correctly.

**Step 1 — Install the Google & YouTube channel**

In Shopify Admin: **Sales channels → Add sales channel → Google & YouTube**. If already installed, skip to Step 2.

**Step 2 — Connect your Google Ads account**

In the Google & YouTube channel: **Settings → Google Ads → Connect account**. Select your Google Ads account. This links Shopify's native purchase tracking to your Google Ads property.

**Step 3 — Verify conversion tracking is active**

In Google Ads: **Goals → Summary**. You should see a "Purchase (Shopify)" conversion action with status "Recording conversions". If the status shows "No recent conversions" or "Inactive", the basic pixel layer is not firing — verify the Google & YouTube channel is connected and your Google Ads account is linked.

**Step 4 — Note your Conversion ID and Conversion Label**

In Google Ads: **Goals → Summary → [Purchase conversion] → Tag setup → Use Google Tag Manager**. Copy the Conversion ID (format: `AW-XXXXXXXXXX`) and Conversion Label. You will need these for the Make.com setup below.

## Layer 2 — Google Enhanced Conversions via Make.com (6 Minutes, Free)

This is the server-side layer. Every time a Shopify order is paid, Make.com sends a formatted purchase event with hashed customer data directly to Google's Conversions API — completely independent of the customer's browser.

**Step 1 — Create your Make.com account**

Go to [Make.com](/go/make) and sign up on the free plan. No credit card required.

**Step 2 — Set up your Shopify webhook (skip if already done)**

If you have CAPI Shield or Stocky Swap running, your Shopify webhook to Make.com already exists — add a new branch to your existing scenario and skip to Step 5. If starting fresh:

In Make.com: **Create a new scenario → Add a Webhooks module → Custom webhook → Add → copy the URL**.

In Shopify Admin: **Settings → Notifications → Webhooks → Create webhook**
- Event: **Order payment**
- Format: **JSON**
- URL: paste your Make.com webhook URL

Save. Place a test order in Shopify (use a 100% discount code). In Make.com, click **Run once** — you should see your order data appear in the webhook module.

**Step 3 — Add an HTTP module for Google Enhanced Conversions**

In your Make.com scenario, after the webhook trigger, add an **HTTP → Make a request** module with these settings:

- **URL:** `https://googleads.googleapis.com/v17/customers/CUSTOMER_ID:uploadClickConversions`
  (replace `CUSTOMER_ID` with your 10-digit Google Ads customer ID, no hyphens)
- **Method:** POST
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_ACCESS_TOKEN`
- **Body type:** Raw
- **Content type:** JSON (application/json)

**Step 4 — Format the request body**

Use this JSON structure, mapping your Shopify webhook fields:

```json
{
  "conversions": [
    {
      "gclid": "{{webhook.landing_site_ref}}",
      "conversionAction": "customers/CUSTOMER_ID/conversionActions/CONVERSION_LABEL",
      "conversionDateTime": "{{formatDate(webhook.created_at, 'YYYY-MM-DD HH:mm:ssZ')}}",
      "conversionValue": {{webhook.total_price}},
      "currencyCode": "{{webhook.currency}}",
      "orderId": "{{webhook.order_number}}",
      "userIdentifiers": [
        {
          "hashedEmail": "{{sha256(lowercase(webhook.email))}}"
        }
      ]
    }
  ],
  "partialFailure": true
}
```

**Step 5 — Add a Router for multi-branch scenarios**

If you are running this alongside CAPI Shield (Meta), add a Router module after the webhook trigger. Each branch operates independently — if the Google branch fails temporarily, the Meta branch still executes, and vice versa.

**Step 6 — Test the scenario**

Place a test order in Shopify. In Make.com, run the scenario and check that the HTTP module returns a `200 OK` response. In Google Ads, go to **Goals → Summary → [Purchase conversion] → Diagnostics** — Enhanced Conversions should show as active within 24–48 hours.

## Verifying Your Setup Is Working

**In Google Ads — Enhanced Conversions status:**

Goals → Summary → [Your purchase conversion] → Settings → Enhanced conversions. Status should show "Active" within 24–48 hours of your first server-side event.

**In Google Ads — Conversion comparison:**

After 7–14 days, compare your Google Ads reported conversions against your Shopify order count for the same period. A healthy Enhanced Conversions setup reduces the gap from 20–40% down to 10–20%. The residual gap (orders from non-Google-account users, opted-out customers) is not recoverable by any tool.

**What to check if it's not working:**
- Conversion ID and Label format: must be `AW-XXXXXXXXXX` and the exact label string from Google Ads, not paraphrased
- Customer ID: 10 digits, no hyphens
- Access token: OAuth tokens expire — use a service account with a refresh token for production use
- Email hashing: must be SHA-256, lowercase first, all whitespace stripped

## The Multi-Platform Scenario — Meta + Google + TikTok in One

If you already have Meta CAPI running or want to add TikTok Events API at the same time, the architecture is:

```
Shopify Order Payment webhook
    ↓
Make.com receives order data
    ↓
Router module (branches simultaneously):
    ├── Branch 1 → Meta Conversions API (Purchase event)
    ├── Branch 2 → Google Enhanced Conversions API (Purchase event)
    └── Branch 3 → TikTok Events API (CompletePayment event)
```

Three platforms. One webhook. One Make.com scenario. $0/month.

[CAPI Shield](/capi-shield) covers the Meta and Google setup simultaneously if you prefer a guided implementation. The [TikTok Events API guide](/tiktok-events-api-shopify) covers the TikTok branch — including the critical `CompletePayment` event name that every other guide gets wrong.

## The No-GTM Advantage

Every other guide for Shopify Google Enhanced Conversions requires Google Tag Manager — a server-side GTM container, hosting costs ($10–$30/month), and a technically complex setup involving container tags, triggers, and variables.

The Make.com approach calls Google's Conversions API directly via HTTP. No GTM container. No container hosting. No tag configuration. The webhook receives the Shopify order, the HTTP module sends it to Google. Two modules, one scenario, $0/month in infrastructure.

For stores already running Make.com for CAPI Shield or Stocky Swap, the Google Enhanced Conversions branch takes approximately 6 minutes to add to an existing scenario.

## What Changes After Full Setup

| Metric | Before | After (14 days) |
|---|---|---|
| Google Ads vs Shopify gap | 20–40% | 10–20% |
| Enhanced Conversions status | Inactive | Active |
| Campaign optimisation data | Partial | Near-complete |
| iOS purchase attribution | Mostly missing | Mostly recovered |

The campaign performance improvement typically follows 2–4 weeks after implementation as Google's Smart Bidding and Performance Max algorithms adjust to the more complete conversion dataset. Stores running ROAS-based bidding often see ROAS improvement as more real conversions surface — the same budget is now training on more accurate signal.

Start with the [Make.com free account](/go/make) and follow the steps above. If you want the complete cross-platform setup covering Meta and TikTok simultaneously, [CAPI Shield](/capi-shield) covers all three in a single guided implementation.
