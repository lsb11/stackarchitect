---
title: "Set Up Google Analytics 4 on Shopify Free 2026 — No Code"
description: "Free GA4 setup for Shopify in 2026. Google & YouTube channel for basic tracking, Make.com server-side events for complete data. No apps, no GTM, no fees."
publishDate: "2026-04-16"
updatedDate: "2026-04-16"
category: "tracking"
badge: "Free Setup"
badgeType: "new"
readTime: 16
canonical: "https://stackarchitect.xyz/blog/shopify-google-analytics-4-setup-free-2026"
faqs:
  - question: "How do I set up Google Analytics 4 on Shopify for free?"
    answer: "Install the Google & YouTube sales channel from the Shopify App Store (free) and connect your GA4 property during setup. Shopify automatically sends key ecommerce events — page_view, view_item, add_to_cart, begin_checkout, and purchase — to GA4 without any additional configuration. For more complete purchase data recovery, add a Make.com webhook that sends server-side purchase events to GA4's Measurement Protocol. The entire setup is free and requires no code or Google Tag Manager."
  - question: "Do I need Google Tag Manager to connect Shopify to GA4?"
    answer: "No. Shopify's native Google & YouTube sales channel connects directly to GA4 without Google Tag Manager. GTM is an option for stores that need custom event tracking beyond Shopify's standard ecommerce events, but for the standard purchase, add-to-cart, and checkout events that most stores need, the native integration is sufficient and requires no technical setup."
  - question: "What events does Shopify send to GA4 automatically?"
    answer: "When connected via the Google & YouTube sales channel, Shopify automatically sends the following GA4 events: page_view (every page load), view_item (product page views), add_to_cart (cart additions), begin_checkout (checkout started), add_payment_info (payment step), and purchase (order completed). These cover the complete ecommerce funnel without any additional configuration."
  - question: "Why is my GA4 showing fewer purchases than Shopify?"
    answer: "GA4 purchase events are sent by the browser-based Shopify pixel, which is subject to iOS tracking restrictions, ad blockers, and cookie limitations. Stores with significant iOS traffic, users of privacy browsers, and customers using ad blockers will show fewer purchases in GA4 than Shopify actually recorded. The server-side fix is Make.com sending purchase events to GA4's Measurement Protocol directly — bypassing browser restrictions entirely."
  - question: "Is Google Analytics 4 free for Shopify stores?"
    answer: "Yes. Google Analytics 4 is permanently free for standard use. There are no tier limits on the free version that would affect normal Shopify store analytics. Google Analytics 360 (the paid enterprise version) adds higher sampling thresholds and SLA guarantees — relevant only for extremely high-traffic stores. For the vast majority of Shopify stores, GA4 free provides complete analytics at no cost."
  - question: "What is the difference between GA4 and Google Ads conversion tracking for Shopify?"
    answer: "GA4 is an analytics platform that tracks user behaviour across your entire Shopify store — sessions, page views, product views, cart events, and purchases — for analysis and reporting. Google Ads conversion tracking is specifically for attributing purchases back to Google Ads clicks to measure campaign performance. They are separate systems. GA4 can be linked to Google Ads to import key events as conversions, but setting them up separately ensures each works correctly. This guide covers GA4; the Google Ads conversion tracking setup is covered in a separate guide."
  - question: "How long does it take to set up GA4 on Shopify?"
    answer: "The native GA4 setup via the Google & YouTube sales channel takes approximately 5 minutes. The additional server-side Make.com layer for complete purchase data recovery takes approximately 10 minutes. The full setup — native layer plus server-side layer plus verification — is complete in under 20 minutes with no technical skills required."
relatedGuides:
  - title: "How to Fix Shopify Google Ads Conversion Tracking Free 2026"
    href: "/blog/how-to-fix-shopify-google-ads-conversion-tracking-2026"
    badge: "Related"
  - title: "CAPI Shield — Free Meta + Google Server-Side Tracking"
    href: "/capi-shield"
  - title: "Shopify P&L Automation — Live Profit in Google Sheets Free"
    href: "/shopify-profit-loss-automation"
  - title: "Make.com for Shopify — Complete Beginner's Guide"
    href: "/blog/make-com-shopify-automation-guide"
---

# How to Set Up Google Analytics 4 on Shopify Free in 2026 — No Apps, No Code

Every Shopify store needs GA4. It tells you where your traffic comes from, which products get viewed most, where customers drop out of the checkout funnel, and what your actual conversion rate is. Without it, you're making every growth decision blind.

In 2026, setting up GA4 on Shopify is free and takes under 20 minutes. No apps to install. No Google Tag Manager required. No monthly fees. This guide covers the complete setup — native browser-side tracking and server-side purchase event recovery.

## What GA4 Tracks on Shopify

Before setting anything up, understand what GA4 gives you and what it doesn't.

**What GA4 tracks automatically on Shopify (via native integration):**

- Traffic sources — where every session came from (Google organic, Meta ads, direct, email, referral)
- Page views across every page of your store
- Product views — which products are being seen
- Add-to-cart events — which products are being added
- Checkout funnel — where customers drop out of the checkout process
- Purchase completions — orders and revenue
- User demographics — approximate location, device type, browser
- Session duration and bounce rates

**What GA4 does not track without additional setup:**

- Profit per order (revenue minus COGS and fees) — covered by [Shopify P&L Automation](/shopify-profit-loss-automation)
- Attribution to specific ad clicks for campaign optimisation — covered by Google Ads Enhanced Conversions (separate system)
- Customer lifetime value across multiple orders — requires GA4 User ID implementation or a CRM

For most Shopify stores — particularly those under $1M/year revenue — the native GA4 integration covers everything needed to make informed decisions about traffic, products, and funnel optimisation.

## What You Need Before Starting

- A Google account (free)
- A GA4 property (create one at analytics.google.com if you don't have one)
- Your Shopify Admin access
- Your GA4 Measurement ID (format: `G-XXXXXXXXXX`) — found in GA4 Admin → Data Streams → your stream → Measurement ID

That's it. No additional tools required for the basic setup.

## Step 1 — Create Your GA4 Property (5 Minutes)

If you already have a GA4 property connected to your Shopify store, skip to Step 2 to verify it's configured correctly.

**Create a new GA4 property:**

Go to [analytics.google.com](https://analytics.google.com). Click **Admin (gear icon) → Create → Property**.

- Property name: your store name
- Reporting time zone: your local time zone
- Currency: your store's currency (GBP for UK stores)

Click **Next**. Select **Ecommerce** as your business category. Select your business size. Click **Create**.

**Create a Web Data Stream:**

In your new property: **Admin → Data Streams → Add stream → Web**.

- Website URL: `stackarchitect.xyz` (your store URL without https://)
- Stream name: your store name

Copy your **Measurement ID** (`G-XXXXXXXXXX`). You'll need this in Step 2.

**Enable Enhanced Measurement:**

In your data stream settings, verify Enhanced Measurement is toggled on. This enables automatic tracking of scrolls, outbound clicks, site search, video engagement, and file downloads without any additional configuration.

## Step 2 — Connect Shopify to GA4 via Google & YouTube Channel (5 Minutes)

**Install the Google & YouTube sales channel:**

In Shopify Admin: **Sales channels (+ icon in left sidebar) → Google & YouTube**. If already installed, open it.

**Connect your Google account:**

Click **Connect Google account** and sign in with the Google account that owns your GA4 property.

**Connect your GA4 property:**

In the Google & YouTube channel: **Settings → Measurement → Google Analytics 4**. Select your GA4 property from the dropdown. Your Measurement ID (`G-XXXXXXXXXX`) should appear. Click **Connect**.

**Verify the connection:**

After connecting, the channel should show "Connected" next to your GA4 property. Shopify will now automatically send ecommerce events to GA4 on every customer interaction.

**What this enables:**

Shopify sends the following events to GA4 automatically from this point forward:
- `page_view` — every page load
- `view_item` — product page views
- `add_to_cart` — cart additions
- `view_cart` — cart page views
- `begin_checkout` — checkout started
- `add_shipping_info` — shipping details entered
- `add_payment_info` — payment details entered
- `purchase` — order completed with revenue, tax, and shipping

These cover the complete ecommerce event funnel without any further configuration.

## Step 3 — Verify Data Is Flowing (5 Minutes)

Before adding the server-side layer, verify the native integration is working.

**Real-time check:**

In GA4: **Reports → Realtime**. Open your Shopify store in another browser tab and navigate a few pages. Within 30 seconds, you should see yourself appear as an active user in GA4 Realtime with your page path showing.

**Purchase event verification:**

Place a test order in your Shopify store (use a 100% discount code on any product). In GA4 Realtime, look for a `purchase` event to appear within 30–60 seconds. If it appears, your native integration is working correctly.

**DebugView check:**

For more detail: In GA4, go to **Admin → DebugView**. In your browser, open your store URL with `?gtm_debug=x` appended. Browse and add to cart — you should see events appearing in DebugView in near-real-time.

If no events appear: verify the Google & YouTube channel shows "Connected" status, check that your GA4 property is in the same Google account as the channel connection, and ensure your store has at least one active product.

## Step 4 — Configure Your GA4 Ecommerce Settings (5 Minutes)

The default GA4 setup works, but three configuration changes significantly improve the quality of your data.

**Enable Google Signals:**

In GA4: **Admin → Data Settings → Data Collection → Google Signals**. Toggle on. This allows GA4 to combine anonymous behavioural data from signed-in Google users for demographic reporting and cross-device tracking. No personal data is exposed — Google aggregates it.

**Set your data retention to 14 months:**

In GA4: **Admin → Data Settings → Data Retention → Event data retention → 14 months**. The default is 2 months — too short for year-over-year comparison. 14 months is the maximum on the free tier.

**Connect GA4 to Google Search Console:**

In GA4: **Admin → Property Settings → Product Links → Search Console**. Connect your Search Console property. This brings Google organic search query data into GA4 — you can see exactly which search terms are driving traffic to your store, directly in GA4's reports.

**Mark your purchase event as a key event:**

In GA4: **Admin → Events → Mark as key event** next to the `purchase` event. This surfaces purchase data in GA4's conversion reports and makes it available for Google Ads import if you connect the two later.

## Step 5 — Server-Side Purchase Event Recovery via Make.com (10 Minutes)

The native GA4 integration sends events from the customer's browser. This means iOS tracking restrictions, ad blockers, and Safari ITP can prevent purchase events from reaching GA4 — creating a gap between your Shopify order count and your GA4 purchase count.

The server-side fix: Make.com receives the Shopify Order Payment webhook and sends a purchase event to GA4's Measurement Protocol directly from the server. Browser state is irrelevant.

**What you need:**

- Make.com account ([free plan](/go/make))
- Your GA4 Measurement ID (`G-XXXXXXXXXX`)
- Your GA4 API Secret — in GA4: **Admin → Data Streams → [your stream] → Measurement Protocol API secrets → Create**. Name it "Make.com" and copy the secret value.

**Setting up the Make.com scenario:**

If you already have a Make.com scenario running (CAPI Shield, Stocky Swap, or P&L Auto), add a new branch to your existing scenario. If starting fresh, set up the Shopify webhook first following the [Make.com beginner's guide](/blog/make-com-shopify-automation-guide).

**Add an HTTP module for GA4 Measurement Protocol:**

- **URL:** `https://www.google-analytics.com/mp/collect?measurement_id=G-XXXXXXXXXX&api_secret=YOUR_API_SECRET`
- **Method:** POST
- **Body type:** Raw
- **Content type:** JSON

**Request body:**

```json
{
  "client_id": "{{webhook.customer.id}}",
  "events": [
    {
      "name": "purchase",
      "params": {
        "transaction_id": "{{webhook.order_number}}",
        "value": {{webhook.total_price}},
        "currency": "{{webhook.currency}}",
        "tax": {{webhook.total_tax}},
        "shipping": {{webhook.total_shipping_price_set.shop_money.amount}},
        "items": [
          {
            "item_id": "{{webhook.line_items[].variant_id}}",
            "item_name": "{{webhook.line_items[].title}}",
            "quantity": {{webhook.line_items[].quantity}},
            "price": {{webhook.line_items[].price}}
          }
        ]
      }
    }
  ]
}
```

**Test:** Place a test order in Shopify. Run the Make.com scenario. In GA4 Realtime, you should see a `purchase` event arrive within 30 seconds tagged with your order details.

## Step 6 — Link GA4 to Google Ads (Optional, 2 Minutes)

If you run Google Ads, linking GA4 allows you to import GA4 key events as Google Ads conversions and build remarketing audiences from GA4 behavioural data.

**In GA4:** Admin → Product Links → Google Ads Links → Link.

Select your Google Ads account. Enable Personalised advertising (required for remarketing audiences). Click Submit.

Once linked: in Google Ads, go to **Goals → Conversions → Import → Google Analytics 4 properties** and import your `purchase` key event. This gives Google Ads campaigns access to GA4's more complete purchase data, particularly for stores using server-side Measurement Protocol events.

## Reading Your GA4 Data — The Reports That Matter for Shopify

Once data is flowing, these are the reports that give you actionable information:

**Reports → Acquisition → Traffic Acquisition**

Where your sessions come from — Google organic, Meta paid, direct, email, referral. This tells you which channels are actually driving traffic. Sort by "Sessions" to see volume, then by "Purchases" to see which channels convert.

**Reports → Engagement → Pages and screens**

Which pages get the most views. For a Shopify store, this shows you which products are being viewed most — and which product pages have high views but low add-to-cart rates (potential product page optimisation opportunities).

**Reports → Monetisation → Ecommerce purchases**

Product-level purchase data — which items are actually selling, at what quantity, generating what revenue. Compare this against your views data to find high-view low-purchase products.

**Reports → Monetisation → Checkout journey**

Where customers drop out of your checkout process. A high drop-off at the payment step suggests friction (payment method issues, trust signals, shipping cost shock). A high drop-off at address entry suggests checkout UX problems.

**Explore → Funnel exploration**

Build a custom funnel: `view_item` → `add_to_cart` → `begin_checkout` → `purchase`. This shows your end-to-end conversion rate at each step. For a Shopify store with healthy funnel health, expect: 20–40% of product views add to cart, 50–70% of add-to-carts begin checkout, 60–80% of checkouts complete purchase.

## The Complete Free Analytics Stack

GA4 covers the traffic and behaviour layer. Two additional free tools complete your analytics picture:

**[Shopify P&L Automation](/shopify-profit-loss-automation)** — GA4 shows revenue but not profit. P&L Auto writes COGS, Shopify transaction fees, and net profit for every order to a Google Sheet automatically. Revenue from GA4 plus profit from P&L Auto gives you a complete financial picture.

**[CAPI Shield](/capi-shield)** — If you run Meta or Google Ads, CAPI Shield sends server-side purchase events to Meta's Conversions API and Google's Enhanced Conversions simultaneously — giving your ad platforms the complete conversion data they need to optimise campaigns. This is the ad attribution layer that complements GA4's organic analytics layer.

**[Make.com](/go/make)** — the automation engine connecting all three. One Shopify Order Payment webhook fans out to: GA4 Measurement Protocol, Meta CAPI, Google Enhanced Conversions, and your P&L spreadsheet — simultaneously, at $0/month on the free plan for stores under 250 orders per month.

## What to Check After 7 Days

After your GA4 setup has been running for a week, verify these metrics to confirm everything is working:

- **Session count:** should broadly match your Shopify Analytics visitor count (within 10–20% variance is normal due to ad blockers and bot filtering)
- **Purchase count:** compare GA4 purchases to Shopify orders. A gap of 20–30% is normal with browser-only tracking. If you've deployed the Make.com server-side layer, this gap should narrow to 5–15%.
- **Average session duration:** under 30 seconds across the board indicates a configuration problem (bot traffic or misconfigured filters). Over 1 minute is healthy for a product-browsing store.
- **Bounce rate equivalent:** in GA4, look for "Engaged sessions" — sessions with more than 10 seconds, a conversion, or 2+ page views. Below 40% engaged sessions indicates landing pages need work.

If your purchase count in GA4 is significantly lower than Shopify order count after deploying the server-side layer, check: GA4 API Secret is correct, Measurement ID matches your live data stream (not a test property), and the Make.com scenario is actually running (check execution history for errors).

GA4 is now your analytics foundation. Every traffic decision, every product decision, every funnel optimisation decision has data behind it — and it costs nothing.
