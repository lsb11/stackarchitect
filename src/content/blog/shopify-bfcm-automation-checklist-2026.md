---
title: "Shopify BFCM 2026 Checklist: The Last Six Weeks"
heading: "Shopify BFCM 2026 Automation Checklist: What to Do in the Last Six Weeks"
description: "Black Friday is 27 November 2026. A week-by-week checklist for Shopify automations: test tracking, budget Make.com credits for peak volume, fix email deliverability and run one end-to-end test order."
answer: "Black Friday 2026 falls on 27 November and Cyber Monday on 30 November. With six weeks to go, the priority is not adding new tools but proving the ones you have work under load: test every tracking event with a real order, budget automation credits for peak volume, warm up your email list, and freeze changes a week before."
publishDate: "2026-04-21"
updatedDate: "2026-10-15"
verifiedDate: "2026-10-15"
category: "automation"
badge: "BFCM 2026"
badgeType: "urgent"
readTime: 9
canonical: "https://stackarchitect.xyz/blog/shopify-bfcm-automation-checklist-2026/"
faqs:
  - question: "When is Black Friday and Cyber Monday 2026?"
    answer: "Black Friday 2026 is Friday 27 November, the day after US Thanksgiving on Thursday 26 November. Cyber Monday is Monday 30 November. Many stores run offers across the whole weekend and the week before, so plan for higher volume from around 20 November."
  - question: "Is it too late to set up server-side tracking before BFCM 2026?"
    answer: "No, but test it properly. A server-side setup can be built in a day; the risk is a setup that looks live but silently fails or double-counts. Send a real test order, confirm the event appears in each ad platform with the same order ID as the browser event, and do it at least two weeks before Black Friday so there is time to fix problems."
  - question: "How many Make.com credits will my store use during Black Friday?"
    answer: "Open your scenario's history and note how many credits one order uses; each module that runs typically uses one. Multiply by the most orders you expect over the peak week. If that, plus your normal usage for the month, is over your plan's allowance, upgrade before the week starts. Make.com's free plan includes up to 1,000 credits a month."
  - question: "Should I change my store's apps or theme before Black Friday?"
    answer: "Make changes early and then stop. Any new app, theme edit or automation added in the final week has had no time to be tested under real traffic. Set a change freeze about a week before Black Friday, and keep a note of what you changed and when so you can undo it quickly if something breaks."
  - question: "What should I test with a Black Friday test order?"
    answer: "Place a real paid order and refund it. Check that it appears in Shopify, that each ad platform receives one purchase rather than two, that any spreadsheet or inventory log records it once, and that it does not trigger an abandoned checkout email. Repeat the test after any change you make before the freeze."
relatedGuides:
  - title: "Free abandoned cart recovery for Shopify"
    href: "/blog/shopify-abandoned-cart-recovery-free-2026/"
  - title: "Free Shopify conversion rate optimisation"
    href: "/blog/shopify-conversion-rate-optimisation-free-2026/"
  - title: "When to upgrade from free Make.com to Google Workspace"
    href: "/blog/when-to-upgrade-free-make-google-workspace/"
---

**Key dates:** Black Friday is **Friday 27 November 2026**. Cyber Monday is **Monday 30 November**. This checklist was revised on 15 October, six weeks out.

At this distance, the most expensive mistakes are not missing tools. They are tools that look switched on and quietly fail when order volume jumps: a tracking event that stops firing, an automation that runs out of credits on Friday afternoon, an email list that lands in spam because it has not been mailed since summer. This checklist is ordered by week, and almost every step is a test, not a new build.

## Six weeks out (from 16 October)

### 1. List every automation that touches an order

Write down everything that runs when an order is placed: ad platform pixels and server-side connections, Make.com or Shopify Flow scenarios, spreadsheet logs, inventory tools, email automations. For each, note where you would see it fail. This list is the basis of every later test.

### 2. Test conversion tracking with a real order

Place a real paid order on a live product and refund it. Then check each platform:

- **Meta**: Events Manager shows the Purchase. If you send it both from the browser and from the server (for example with [CAPI Shield](/capi-shield/)), both copies must carry the same event ID so Meta counts one purchase, not two.
- **Google Ads**: the conversion appears in the Conversions summary within the platform's normal reporting delay. The [Google Ads conversion tracking guide](/shopify-google-ads-conversion-tracking/) covers what to check.
- **TikTok**: Events Manager shows CompletePayment, if you advertise there. See the [TikTok Events API guide](/tiktok-events-api-shopify/).
- **GA4**: a `purchase` appears in Realtime. Compare GA4's purchase count with Shopify's order count over the last month and note the gap, so you can tell on Black Friday if it suddenly widens. The [GA4 guide](/blog/shopify-google-analytics-4-setup-free-2026/) explains why a gap is normal.

If anything is missing or doubled, you have time to fix it now. You will not on 27 November.

### 3. Check you are not running two of the same tag

Peak traffic magnifies double-counting. Look in **Settings → Customer events** and your theme code for a second copy of any pixel that an app or sales channel already installs. Two Meta pixels or two GA4 tags make every result look better than it is, and ad platforms will bid on the inflated figure.

## Five weeks out (from 23 October)

### 4. Budget automation credits for the peak

If you use Make.com, open each scenario's history, click one recent run and note the credits it used; each module that runs typically uses one. Then:

> **Credits needed for the peak week** = credits per order × the most orders you expect that week
> Add your normal usage for the rest of the month.

If the total is over your allowance, upgrade before 20 November. Make.com's free plan includes up to 1,000 credits a month ([make.com/pricing](https://www.make.com/en/pricing), read 15 October 2026); its Core plan was $9 a month for 10,000 credits when last read on 25 September 2026. When a scenario runs out of credits it stops, so orders placed afterwards are not tracked or logged until the next billing period or an upgrade.

### 5. Make failures reach you

Check that Make.com's error emails go to an address you read on your phone (your Make profile's notification settings). Open each scenario and confirm what happens on an error. A scenario set to ignore errors will show a successful run even when the request it made was rejected, so check one recent run's output, not just its green tick.

### 6. Check inventory before stock arrives

If you track stock in a spreadsheet alongside Shopify, check that the two agree for your top 20 products by sales. A discrepancy found now is a stock count; found on Black Friday it is an oversold order. Shopify Admin remains the record of stock on hand. If you were a Stocky user, the [Stocky export guide](/blog/shopify-stocky-data-export-before-shutdown/) covers getting your history out.

## Four weeks out (from 30 October)

### 7. Warm up your email list

If you have not emailed your whole list for a while, a sudden run of Black Friday emails can hurt deliverability. From now until Black Friday, send at least one genuinely useful email a week. Remove contacts who have not opened anything in several months before your big sends, or move them to a smaller re-engagement send first.

### 8. Write the Black Friday emails now

Draft every email you plan to send: early access, launch, reminder, Cyber Monday and last chance. Writing them in November, while answering customers, is how mistakes ship. Schedule what you can.

### 9. Check abandoned checkout recovery

Confirm your abandoned checkout email is switched on and sends at a delay you chose deliberately. If you use a multi-email sequence outside Shopify, re-run the buyer test from the [abandoned cart guide](/blog/shopify-abandoned-cart-recovery-free-2026/): complete an order and confirm no recovery email follows.

## Three weeks out (from 6 November)

### 10. Check your margins on the offer

Before the discount is final, calculate profit per order at the discounted price: price minus product cost, Shopify and payment fees, shipping and the ad cost you expect per order. A discount that is profitable at full-price ad costs may not be at Black Friday ad costs, which are often higher. If you log orders to a spreadsheet, pre-fill product costs now so every order on the day is costed automatically; the [P&L automation guide](/shopify-profit-loss-automation/) shows one way to do this.

### 11. Run the full test order again

Repeat step 2 with every automation from step 1 running. Also confirm the order appears exactly once in every log and does not trigger an abandoned checkout email.

## Two weeks out (from 13 November)

### 12. Prepare for support volume

More orders mean more "where is my order?" messages. Put delivery cut-off dates for Christmas on your shipping page and in order confirmation emails now. If you use a chat tool, add the answers to the questions you get most.

### 13. Write down how to undo things

For each automation, note how to pause it quickly. If a scenario starts failing on Black Friday, pausing it and catching up afterwards is better than letting it run half-broken.

## One week out (from 20 November)

### 14. Freeze changes

No new apps, theme edits or automation changes from here until after Cyber Monday unless something is broken. Anything added now has had no time to be tested under real traffic.

## During the weekend

- Check order counts against your tracking dashboards once in the morning and once in the evening. A sudden widening of the gap between Shopify orders and ad platform purchases means something has stopped firing.
- Watch your automation credit balance.
- Note anything that breaks, with the time. That note is the start of next year's checklist.

## Summary

| When | Task |
|---|---|
| From 16 Oct | List every order automation; test tracking with a real order; remove duplicate tags |
| From 23 Oct | Budget automation credits; route error alerts to your phone; reconcile stock |
| From 30 Oct | Warm up email list; draft every BFCM email; re-test abandoned checkout recovery |
| From 6 Nov | Check offer margins; full test order |
| From 13 Nov | Support answers and delivery cut-offs; write undo steps |
| From 20 Nov | Change freeze |
