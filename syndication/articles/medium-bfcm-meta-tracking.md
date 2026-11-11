---
title: "Before Black Friday, check these three Meta tracking settings on your Shopify store"
subtitle: "Shopify counts every order. Meta only counts what it can trace to an ad. Here is how to see the gap, close the part you can, and stop it from cutting campaigns that work."
canonical: https://stackarchitect.xyz/blog/shopify-meta-roas-dropped-2026-fix/
---

Shopify counts every order. Meta counts only the purchases it can trace back to an ad. When that trace breaks, Ads Manager reports a lower return on ad spend than you're really getting, and Meta's delivery system learns from fewer purchases than actually happened.

That's an annoyance most of the year. In the weeks before Black Friday, when budgets are set from what Ads Manager says is working, it's how a store ends up cutting the campaigns that are actually selling.

Here are three settings to check before your biggest week, and one number to use instead of Meta's.

## First, measure your gap

Take the last 30 complete days.

1. **Shopify:** Analytics → Reports → Sales over time. Note the order count.
2. **Meta Ads Manager:** the Campaigns view, with the 7-day click, 1-day view attribution window. Note the purchases reported.
3. **The gap:** (Shopify orders − Meta purchases) ÷ Shopify orders × 100.

Not every Shopify order came from a Meta ad, so the gap is never zero, and part of it isn't lost tracking at all. Nobody publishes a "normal" figure for it. What matters is the trend: a gap that widened when nothing else about your marketing changed is the signal.

## Setting 1: your Meta pixel's data sharing

On 13 January 2026, Shopify changed the default data sharing setting for app pixels from **Always on** to **Optimized**. Shopify's changelog says it watches each marketing pixel, and when it sees zero signals from one over days or weeks, it pauses that pixel's data sharing until signals return. A pixel that's working keeps sharing. The risk is a pixel Shopify judges inactive, which then stops without telling you.

**The check:** Settings → Customer events → App pixels → the Data column. Set the Facebook & Instagram pixel to **Always on**.

## Setting 2: whether purchases also reach Meta from a server

A browser pixel loses some purchases to things you can't control. Since iOS 17, Apple's Link Tracking Protection strips click identifiers from links opened in Mail, Messages and Safari Private Browsing, and Safari limits how long tracking cookies last. Ad blockers and shoppers declining tracking take more.

Meta's Conversions API sends the purchase from a server instead, where none of that applies. For many Shopify stores it's already one setting away: in the Facebook & Instagram sales channel, Shopify's help centre says the **Enhanced** and **Maximum** data sharing levels use Meta's Conversions API as well as the pixel. **Standard** is the pixel only.

**The check:** Sales channels → Facebook & Instagram → Settings → Data sharing settings. If you're on Standard, that's the gap.

## Setting 3: that you're not sending every purchase twice

If you've also set up a webhook-based connection, through Make.com, a tag server or an app, check you aren't running it *and* Shopify's Conversions API for Meta. Two server routes can each send the same purchase.

Meta merges a browser event and a server event into one purchase only when the event name and the event ID match. If they don't, each purchase can be counted twice, which flatters your numbers in exactly the week you most need them to be right.

**The check:** pick one Meta server route. Then in Meta Events Manager, look at the Purchase event and confirm browser and server events are being deduplicated.

## The number to use instead: blended ROAS

Meta's reported ROAS is inflated by attribution overlap and deflated by tracking loss at the same time. Neither direction is reliable.

**Blended ROAS = total Shopify revenue ÷ total ad spend across every channel**, for the same period and currency. If you spent 5,000 across all channels and Shopify recorded 25,000 in revenue, your blended ROAS is 5.

It uses Shopify's own order data, which counts every sale whatever happened to the tracking. Calculate it before you pause anything this month. The most expensive mistake during a tracking problem is switching off a campaign that's working because Meta can't see its sales.

## What to expect after you fix it

Your Shopify-to-Meta gap should narrow toward the part that was never Meta's to begin with. Meta's Event Match Quality score should reflect the customer details you now send; read your own score rather than chasing someone else's target. Judge the result by comparing the same 30-day gap a month after the change.

The full guide covers all three causes, the six-step fix, the webhook route for stores that also advertise on TikTok, and how to check deduplication and match quality in Events Manager: [Shopify Meta ROAS dropped in 2026? Why, and the free fix](https://stackarchitect.xyz/blog/shopify-meta-roas-dropped-2026-fix/). To put your own figures in, there's a free [Shopify vs Meta attribution gap calculator](https://stackarchitect.xyz/shopify-vs-meta-attribution-gap-calculator/).

*Originally published at [stackarchitect.xyz](https://stackarchitect.xyz/blog/shopify-meta-roas-dropped-2026-fix/) by Luke Sandelands.*
