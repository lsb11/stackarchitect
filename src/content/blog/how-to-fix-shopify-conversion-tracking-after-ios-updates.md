---
title: "Fix Shopify Conversion Tracking After iOS Updates 2026"
heading: "Which iOS Privacy Changes Break Shopify Conversion Tracking, and What Each One Stops"
description: "App Tracking Transparency, Safari ITP and Link Tracking Protection each stop a different part of Shopify conversion tracking. Which one affects you, and the fix for each."
answer: "Three Apple privacy features break Shopify conversion tracking in different ways: App Tracking Transparency limits tracking inside apps, Safari's Intelligent Tracking Prevention shortens cookie lifetimes, and Link Tracking Protection strips click IDs from some links. This guide takes each in turn and gives the fix for each. The common fix is sending purchases server-side."
publishDate: "2026-03-15"
updatedDate: "2026-10-15"
verifiedDate: "2026-10-15"
category: "tracking"
badge: "Fix Guide"
badgeType: "urgent"
readTime: 14
canonical: "https://stackarchitect.xyz/blog/how-to-fix-shopify-conversion-tracking-after-ios-updates/"
faqs:
  - question: "Why did iOS updates break Shopify conversion tracking?"
    answer: "Apple introduced App Tracking Transparency (ATT) in iOS 14.5, keeps tightening Safari's Intelligent Tracking Prevention (ITP), and added Link Tracking Protection in iOS 17, which strips click identifiers such as Meta's fbclid from some links. Each update progressively reduced the ability of browser-based pixels to track conversions. The cumulative effect is that browser pixels now miss purchase events for stores with significant iOS traffic, in proportion to that traffic and to how many of those visitors decline tracking."
  - question: "Does iOS 17 Link Tracking Protection affect all Safari traffic?"
    answer: "No. iOS 17 Link Tracking Protection strips click identifiers (fbclid, gclid, ttclid) when links are opened from Private Browsing mode, Mail app, and Messages app. In ordinary Safari browsing it is not on by default, including in Safari 26 according to independent testing, unless the user turns on advanced protection for all browsing. The impact is highest for stores that drive traffic through email and messages."
  - question: "What is the free fix for iOS conversion tracking on Shopify?"
    answer: "The free fix is server-side tracking via the Conversions API (CAPI). Server-side events are sent directly from Shopify's server to Meta, Google, and TikTok: bypassing the browser entirely. iOS restrictions, ad blockers, and ITP cannot interfere with server-to-server communication. For Meta, the simplest free route is Shopify's Facebook & Instagram app with data sharing set to Enhanced or Maximum; CAPI Shield is a free Make.com alternative."
  - question: "How do I know if iOS updates have broken my Shopify tracking?"
    answer: "Compare Shopify order count against Meta Ads Manager reported purchases for the same 30-day period using the same attribution window. A gap that is large, or growing month to month, points to a tracking problem. You can also check Meta Events Manager: a falling Event Match Quality score for the Purchase event means fewer match keys are reaching Meta."
  - question: "What is Shopify's pixel data sharing optimisation and how does it affect tracking?"
    answer: "Shopify's changelog for 13 January 2026 says it switched on automatic data sharing optimisation for all active marketing pixels. When Shopify sees zero signals from a pixel over days or weeks, it pauses that pixel's data sharing until signals return. To keep full sharing regardless, set the pixel to Always on in Settings, Customer events."
  - question: "Does server-side tracking completely fix the iOS tracking problem?"
    answer: "Server-side tracking significantly reduces the tracking gap but does not eliminate it entirely. Browser pixels handle the first-party tracking layer including page views, add-to-cart, and checkout events. Server-side CAPI handles the purchase conversion event reliably regardless of browser settings. Running both simultaneously with proper deduplication is the standard approach. A residual gap remains even then (orders from visitors who denied ATT and arrived with no click ID, which Meta genuinely cannot match) and its size is a property of your own traffic, not a figure we can quote for you."
relatedGuides:
  - title: "Meta EMQ estimator: check which match keys you send"
    href: "/meta-emq-score-estimator/"
  - title: "Shopify iOS attribution gap benchmark"
    href: "/shopify-ios-attribution-gap-benchmark/"
  - title: "Set up Google Analytics 4 on Shopify free"
    href: "/blog/shopify-google-analytics-4-setup-free-2026/"
---

Apple's privacy changes do not break tracking in one way. Each one stops a different part of it, and the fix depends on which one is costing you. This guide sets out what each change does, how to measure your own gap, and the fixes in the order worth doing them. How large your gap is depends on your store: the share of visitors on Apple devices, how many decline tracking, and where your traffic comes from.

If the symptom you are chasing is a fall in Meta ROAS rather than tracking in general, the [Meta ROAS diagnosis](/blog/shopify-meta-roas-dropped-2026-fix/) starts there.

## What each change stops

| Change | When | What it stops |
|---|---|---|
| **App Tracking Transparency (ATT)** | iOS 14.5, April 2021 | Apps must ask before tracking a person across other companies' apps and sites. People who tap "Ask App Not to Track" inside the Facebook or Instagram app are much harder for Meta to follow from ad click to your checkout. |
| **Intelligent Tracking Prevention (ITP)** | Safari, tightened repeatedly since 2017 | Limits how long cookies written by scripts last, so a click on Monday may no longer be linked to a purchase the following week. Applies to every Safari user, whatever they chose in ATT. ([WebKit](https://webkit.org/tracking-prevention/)) |
| **Link Tracking Protection** | iOS 17, September 2023 | Removes click identifiers such as `fbclid` and `gclid` from links opened in Mail, Messages and Safari Private Browsing. |
| **Safari 26 changes** | iOS 26, September 2025 | Apple extended Advanced Fingerprinting Protection to all browsing. A beta also filtered click identifiers in ordinary browsing, but independent tests of the released version found Link Tracking Protection still off by default outside Private Browsing ([Able CDP](https://www.ablecdp.com/blog/does-safari-strip-click-ids-gclid-fbclid)). Treat claims that iOS 26 strips every `fbclid` with caution. |

One change that is not Apple's also matters. **Shopify's changelog for 13 January 2026** says it switched on automatic data sharing optimisation for all active marketing pixels: when Shopify sees zero signals from a pixel over days or weeks, it pauses that pixel's data sharing until signals return ([Shopify changelog](https://changelog.shopify.com/posts/new-default-setting-for-pixel-data-sharing)). A pixel that is working normally keeps sharing; one Shopify judges inactive can stop without you noticing.

## Measure your own gap first

1. **Shopify orders:** Analytics → Reports → Sales over time, last 30 complete days.
2. **Meta purchases:** Ads Manager, the same 30 days, with the attribution setting you normally use.
3. **Gap:** (Shopify orders − Meta purchases) ÷ Shopify orders.

Meta only claims purchases it can link to an ad, so it will never match Shopify exactly, and some of your orders did not come from ads at all. That makes the trend more useful than the figure: a gap that has widened since last quarter, or since a theme or app change, is the signal to act. No published source sets a "normal" gap.

Also open Meta Events Manager and check the Purchase event's **Event Match Quality**. It reflects which customer details reach Meta with each event; the [EMQ estimator](/meta-emq-score-estimator/) shows which match keys you are sending.

## The fixes, in order

### 1. Check Shopify is not pausing your pixel

In **Settings → Customer events**, find your Facebook & Instagram pixel and look at its data sharing setting. If you rely on it, set it to **Always on** so Shopify's optimisation cannot pause it.

### 2. Turn on Shopify's own server-side connection to Meta

In Shopify admin, open **Sales channels → Facebook & Instagram → Settings → Data sharing settings**, turn on customer data sharing and choose a level. Shopify's help centre describes **Standard** as the Meta pixel only, and both **Enhanced** and **Maximum** as using Meta's Conversions API as well as the pixel, noting that server-to-server data cannot be blocked by browser ad blockers ([Shopify Help Center](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing)). For a store that only advertises on Meta, this is the simplest free server-side route, and it needs no other accounts.

Meta also offers its own one-click Conversions API; the [one-click CAPI guide](/blog/meta-one-click-conversions-api-shopify/) explains how it differs.

### 3. Or send purchases from an order webhook

A Make.com scenario that receives Shopify's order webhook and posts the purchase to Meta's Conversions API does not depend on the browser at all, and the same trigger can feed TikTok. [CAPI Shield](/capi-shield/) is a free version of this on [Make.com's free plan](/go/make/?source=how-to-fix-shopify-conversion-tracking-after-ios-updates-body). Use one server-side route for Meta, not two, or you risk sending each purchase twice.

Server-side delivery means Meta **receives** the purchase. Whether Meta can **attribute** it to an ad still depends on matching: send hashed email and phone and, where available, the `fbc` and `fbp` values, so Meta can connect the order to the person who clicked.

### 4. Deduplicate browser and server events

If the browser pixel and a server connection both send the purchase, both must carry the same `event_id`, or Meta counts two purchases. Shopify's own connection handles this for you. With a webhook scenario, use the Shopify order ID in both. Check in Events Manager that the Purchase event shows events from both browser and server with deduplication applied.

### 5. Verify your domain

In Meta Business Settings, verify your store's domain. Since Meta's 2023 changes to Aggregated Event Measurement, you no longer need to rank eight priority events, and domain verification is no longer tied to that configuration; it remains worth doing because it confirms you control the domain your ads link to.

## TikTok and Google

The same browser limits affect both.

- **TikTok:** the server-side route is the Events API. Its purchase event is `CompletePayment`, not `Purchase`. See the [TikTok Events API guide](/tiktok-events-api-shopify/).
- **Google Ads:** Enhanced Conversions sends hashed customer details with your conversions. See the [Google Ads conversion tracking guide](/shopify-google-ads-conversion-tracking/), which also covers the click identifier it needs.

## What to expect afterwards

A gap remains even with everything above in place, because some purchases genuinely cannot be linked to an ad click. Judge the fixes against your own baseline from the measurement step: compare the same 30-day gap a month later, and check Meta's reporting for the share of purchase events arriving from the server. If the gap narrows suddenly to nothing, check for duplicate events before celebrating.

## Checklist

- [ ] Measure the 30-day gap and note Event Match Quality.
- [ ] Set the Facebook & Instagram pixel to Always on in Customer events.
- [ ] Turn on Enhanced or Maximum data sharing in Shopify's Facebook & Instagram app, or run one webhook-based server connection instead.
- [ ] Confirm browser and server events share an `event_id`.
- [ ] Verify your domain in Meta Business Settings.
- [ ] Re-measure the gap after 30 days.
