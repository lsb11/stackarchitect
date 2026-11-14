---
title: "Reliable Shopify Automations: Make Failures Visible"
heading: "Reliable Shopify Automations: How to Make Every Failure Visible"
description: "Why Make.com Shopify automations fail silently, and how to stop it: error handlers that keep failed runs, order-ID deduplication and a daily count check."
answer: "A Shopify automation is reliable when every failure is either retried or reported, never silently skipped. In Make.com that means error handlers that store failed runs instead of ignoring them, independent branches so one dead API cannot block the rest, deduplication on order ID, and a daily check that your log's order count matches Shopify's."
publishDate: "2026-03-25"
updatedDate: "2026-11-14"
verifiedDate: "2026-10-15"
category: "workflow"
badge: "Architecture Guide"
badgeType: "new"
readTime: 11
canonical: "https://stackarchitect.xyz/blog/the-complete-guide-to-reliable-shopify-automations/"
faqs:
  - question: "Why do Make.com Shopify automations fail without anyone noticing?"
    answer: "Usually because the failure is being hidden on purpose. An error handler set to Ignore, or an HTTP module told not to treat error responses as errors, makes a rejected request finish as a successful run. The scenario history stays green while nothing reaches its destination. Check the output of a real run, not just its status."
  - question: "How many times does Shopify retry a failed webhook?"
    answer: "Shopify's developer documentation says it waits five seconds for a response and retries a failed webhook up to eight times over four hours. If failures continue, the webhook subscription can be removed, after which it receives nothing until it is created again. An automation that is down for an afternoon can therefore stop for good."
  - question: "What is webhook deduplication and why does it matter for Shopify?"
    answer: "Shopify asks receivers to handle duplicate webhook deliveries, so the same order can arrive more than once. Without a check, one order can write two spreadsheet rows or send two purchase events to an ad platform. Deduplication means looking up the order ID before acting and skipping it if it has already been processed."
  - question: "Which Make.com error handler should I use for Shopify automations?"
    answer: "For calls to outside services that can fail temporarily, such as ad platform APIs, use the Retry error handler (older guides call it Break) with Store incomplete executions set to Yes in the scenario settings, so a failed run is kept and retried rather than lost. Use Ignore only where losing the data truly does not matter, and never on a step whose failure you would want to know about."
  - question: "How do I know my Shopify automation missed an order?"
    answer: "Compare counts. Once a day, count yesterday's paid orders in Shopify and the rows your automation logged for the same day. If they differ, an order was missed or duplicated. This check catches every kind of failure, including ones that never produce an error, which is why it matters more than any single error handler."
relatedGuides:
  - title: "Make.com for Shopify: free automation guide"
    href: "/make-com-shopify/"
  - title: "When to upgrade from free Make.com to Google Workspace"
    href: "/blog/when-to-upgrade-free-make-google-workspace/"
  - title: "Shopify to Google Sheets automation"
    href: "/shopify-google-sheets-automation/"
---

Getting a Make.com scenario to run once is easy. The hard part is knowing, a month later, that it is still doing what you think. The dangerous failures are not the ones that stop a scenario with a red error. They are the ones that let it finish green while nothing reaches the destination.

## What we got wrong, and what it taught us

This site's own CAPI Shield blueprint is the clearest example we have. Its request to Meta was written against a specific Graph API version. Meta retires versions about two years after release, and once that version was retired every request returned an error. Nobody saw it for about four months, because three settings combined to hide it:

1. The HTTP module was told **not to treat error responses as errors**, so a rejected request looked like a successful one.
2. The step had an **Ignore** error handler, so even a real error would have been discarded.
3. **Storing incomplete executions was off**, so there was no record of failed runs to retry or inspect.

Each of those settings is common advice for keeping a scenario "running smoothly". Together they made a broken integration look healthy. The blueprint now uses a current version and visible failures, and the rest of this guide is built around not repeating that.

We found the same pattern a second time on 11 November 2026, in the two free scenarios this site shares publicly on Make. Both CAPI Shield and Stocky Swap still sent their outside calls to an Ignore route, and neither stored incomplete executions. We changed both that day. The screenshots in Pattern 1 are from that change, in our own Make account.

The next day we found the fix had been incomplete. On the CAPI Shield and TikTok requests, the HTTP module's **Return error if HTTP request fails** setting was still **No**. With that setting off, Make treats a 400 or 500 reply as a successful run, so the new Retry handler had nothing to catch: a rejected token would still have finished green. Both are now set to **Yes**. Adding an error handler is only half the job; the step has to report the error first.

## The four ways Shopify automations fail

**A hidden failure.** As above: the run is green, the destination received nothing. The only defence is checking outcomes, not statuses.

**A blocked branch.** In Make.com, if a module fails with no error handler, the run stops there. Later steps never execute, including unrelated ones such as logging the order to a spreadsheet.

**A missed event.** Shopify's developer documentation says it waits five seconds for a webhook response and retries a failed delivery up to eight times over four hours. If failures continue, the subscription can be removed entirely ([Shopify: troubleshooting webhooks](https://shopify.dev/docs/apps/build/webhooks/troubleshooting-webhooks)). So if your scenario is switched off, out of credits or erroring for an afternoon, you can lose orders, and possibly the webhook itself.

**A duplicate event.** Shopify tells receivers to handle duplicate deliveries. One order arriving twice can write two rows or send two purchases to an ad platform.

## Pattern 1: Choose error handlers by what a failure costs

Make.com offers several error handlers, and its editor has renamed two of them: when we opened our own scenarios on 11 November 2026 the handler list read Skip, Retry, Resume, Commit and Rollback. Older guides, including earlier versions of this one, call Retry "Break" and Skip "Ignore". They behave very differently:

| Handler | What it does | Use it for |
|---|---|---|
| **Retry** (formerly Break) | Saves the failed bundle as an incomplete execution, retries it automatically a set number of times, then keeps it for you to review | Calls to outside services that fail temporarily: Meta, TikTok, Google, Sheets |
| **Resume** | Carries on using a substitute output you define | Steps where a default value is genuinely acceptable |
| **Skip** (formerly Ignore) | Discards the bundle that caused the error and carries on | Only steps whose failure you would never want to know about |
| **Rollback / Commit** | Stops the run, marking it failed or successful | Rarely needed for Shopify order flows |

To make Retry useful, open **Scenario settings** (the gear in the editor's bottom toolbar) and set **Store incomplete executions** to **Yes**. Failed runs then appear under the scenario's incomplete executions, where they can be retried once the outside service is back.

<figure class="sa-evidence">
<img src="/screens/make-retry-handler-2026-11-11.webp" width="520" height="480" loading="lazy" decoding="async" alt="Make's Flow Control panel for a Retry error handler: Retry automatically Yes, 3 retries, 15 minutes between retries, with Make's note that failed bundles are saved as incomplete executions.">
<figcaption>The Retry handler on the Meta request in our shared CAPI Shield scenario, as set on 11 November 2026: three automatic retries, 15 minutes apart. Make's own note: failed bundles are saved as incomplete executions to retry automatically or review later.</figcaption>
</figure>

<figure class="sa-evidence">
<img src="/screens/make-store-incomplete-executions-2026-11-11.webp" width="465" height="500" loading="lazy" decoding="async" alt="Make's Scenario settings panel with Store incomplete executions set to Yes.">
<figcaption>Scenario settings in the same scenario, 11 November 2026. Store incomplete executions was No until that day; without it, a Retry handler has nowhere to keep the failed run.</figcaption>
</figure>

<figure class="sa-evidence">
<img src="/screens/make-capi-shield-retry-2026-11-11.webp" width="1483" height="600" loading="lazy" decoding="async" alt="The CAPI Shield scenario in Make: Webhook, Tools, Router and an HTTP request to Meta, with the HTTP module's error route going to a Retry handler.">
<figcaption>The shared CAPI Shield scenario after the change: the Meta request's error route now goes to Retry. The Google Ads branch it used to carry was removed the same day.</figcaption>
</figure>

On HTTP modules, open **Show advanced settings** and set **Return error if HTTP request fails** to **Yes** (Make describes it as: "The module will treat 4xx and 5xx responses as errors"). If a 400 or 500 response is allowed through as a success, no error handler will ever see it.

One gap remains even then. Some APIs report a rejected event with HTTP 200 and an error inside the reply. TikTok's Events API can answer with a non-zero `code`, and Make counts that as success. For those, read the reply of a test run, or add a filter that stops the run when `code` is not 0.

## Pattern 2: Keep branches independent

Put a **Router** straight after the webhook and give each destination its own branch, each with its own error handler:

```
Shopify webhook (orders/create)
    ↓
Router
    ├── Branch 1: Meta Conversions API    → Retry handler
    ├── Branch 2: TikTok Events API       → Retry handler
    ├── Branch 3: Google Sheets order log → Retry handler
    └── Branch 4: P&L sheet               → Retry handler
```

A failing Meta branch then cannot stop the order being logged. Put the cheapest, most important branch (usually the order log) first, because a Router runs its branches in order.

## Pattern 3: Deduplicate on order ID

Before acting on an order, check whether you have already processed it:

```
Webhook receives order
    ↓
Google Sheets: Search rows where order_id = this order's ID
    ↓
Filter: continue only if no rows were found
    ↓
Process the order
```

This costs one extra credit per order. For ad platforms, also send a stable event ID (the Shopify order ID works) with every purchase. Meta and TikTok use it to merge a browser event and a server event for the same purchase, so even if a duplicate slips through, it is counted once.

If your scenario writes to shared sheets and several orders can arrive at once, consider turning on **sequential processing** in the scenario settings so runs happen one at a time.

## Pattern 4: A daily count check

This is the one pattern that catches every failure, including the silent kind:

1. Create a second scenario, scheduled once each morning.
2. Ask Shopify for yesterday's paid orders. Make.com's Shopify app can search orders by date; if you call the Admin API directly, use a currently supported API version, because Shopify retires versions on a published schedule.
3. Count the rows your order log recorded for yesterday.
4. If the two numbers differ, email yourself both.

When the check finds a gap, look at the scenario's history and incomplete executions for that day. For ad platforms, a missed purchase can often be sent late: Meta's Conversions API accepts events up to seven days old, so a gap found the next morning can still be filled.

## Pattern 5: Watch the things that switch automations off

- **Credits.** When a Make.com account runs out of credits, scenarios stop. Check usage weekly and before busy periods; the [BFCM checklist](/blog/shopify-bfcm-automation-checklist-2026/) covers budgeting for a peak.
- **Webhook subscriptions.** After any outage of more than a few hours, open **Settings → Notifications → Webhooks** in Shopify and confirm your webhooks still exist.
- **Pinned API versions.** If a scenario calls an API with a version in its URL (`/v21.0/`, `/2025-01/`), write down the vendor's retirement date for that version and set a reminder months ahead. This is exactly the failure described at the top.
- **Error emails.** Make.com can email you when scenarios fail. Make sure those go to an address you actually read.

## Before you call a scenario finished

- [ ] Each destination is on its own Router branch.
- [ ] Outside API calls use the Retry handler, and incomplete executions are stored.
- [ ] Every HTTP module has Return error if HTTP request fails set to Yes.
- [ ] You have tested a failure on purpose: a copy of the scenario with a wrong token should end in a warning, not a success.
- [ ] Order ID is checked before processing; ad platform events carry a stable event ID.
- [ ] A daily scenario compares Shopify's paid order count with your log.
- [ ] Any pinned API version has its retirement date written down.
- [ ] You have tested with a real order and inspected each destination, not just the green tick.

The [Make.com for Shopify guide](/make-com-shopify/) covers first-time scenario setup, and the [Google Apps Script quotas guide](/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/) covers the limits that apply if any of your automation runs in Apps Script.
