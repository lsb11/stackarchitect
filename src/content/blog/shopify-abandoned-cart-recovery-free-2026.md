---
title: "Free Shopify Abandoned Cart Recovery: Two Routes"
heading: "Free Shopify Abandoned Cart Recovery: Shopify's Own Email, or a Multi-Email Sequence"
description: "Two free ways to recover abandoned Shopify checkouts: Shopify Messaging's built-in automation, or a Make.com and Systeme.io sequence, with the logic that stops emails reaching people who already bought."
answer: "The simplest free abandoned cart recovery on Shopify is the Abandoned checkout emails by Shopify automation in the Shopify Messaging app, which includes 10,000 free emails a month. For a sequence of several different emails, a Make.com and Systeme.io setup works on free plans, provided a completed order removes the buyer from the sequence before the next email sends."
publishDate: "2026-04-21"
updatedDate: "2026-10-15"
verifiedDate: "2026-10-15"
category: "email"
badge: "Free Setup"
badgeType: "new"
readTime: 9
canonical: "https://stackarchitect.xyz/blog/shopify-abandoned-cart-recovery-free-2026/"
faqs:
  - question: "Does Shopify send abandoned checkout emails for free?"
    answer: "Yes. Shopify sends them through the Shopify Messaging app, using an automation called Abandoned checkout emails by Shopify. You choose who receives it and how long after abandonment it sends. Shopify Messaging includes 10,000 free emails a month and then charges from $1 per 1,000, according to its App Store listing on 15 October 2026."
  - question: "Is there a Shopify webhook for abandoned checkouts?"
    answer: "No. Shopify's checkout webhooks are checkouts/create, checkouts/update and checkouts/delete. None of them means a checkout was abandoned: checkouts/create fires as soon as a checkout starts, including for people who go on to pay. Any setup built on those webhooks has to stop the sequence when an order arrives, or it will email buyers."
  - question: "Can Shopify Flow send abandoned checkouts to Make.com?"
    answer: "Shopify Flow has a Customer abandons checkout trigger, but the Send HTTP request action needed to pass that data to Make.com is only available on the Shopify Plus, Advanced and Grow plans, according to Shopify's Flow documentation read on 15 October 2026. On other plans, use Shopify Messaging or the webhook approach in this guide."
  - question: "Is Systeme.io's free plan enough for an abandoned cart sequence?"
    answer: "Possibly, but check before building. On 15 October 2026 systeme.io's pricing page listed the free plan at 2,000 contacts, unlimited emails, one email campaign and one automation rule. One campaign covers this sequence, but it is the only one the free plan allows. Confirm in your own account that you can build it with delays and a purchase check before connecting Shopify."
  - question: "How many abandoned cart emails should I send?"
    answer: "A common pattern is three: one within a few hours while the purchase is still on the shopper's mind, one the next day, and a final one two or three days later. No sequence length suits every store. Start with Shopify's single automated email, measure how many checkouts it recovers, and add more emails only if each one recovers more than it costs you in unsubscribes."
relatedGuides:
  - title: "Free Shopify conversion rate optimisation"
    href: "/blog/shopify-conversion-rate-optimisation-free-2026/"
  - title: "Replace Klaviyo free with Systeme.io"
    href: "/replace-klaviyo-free/"
  - title: "Make.com for Shopify: free automation guide"
    href: "/make-com-shopify/"
---

Most started checkouts are never completed. Baymard Institute puts the average documented cart abandonment rate at 70.22%, across 50 studies of ecommerce in general rather than Shopify alone ([baymard.com](https://baymard.com/lists/cart-abandonment-rate), read 25 September 2026). Some of those shoppers will come back if reminded, and on Shopify the reminder can be free.

There are two free routes. Start with the first. Move to the second only if you want several different emails and are willing to maintain a small automation.

## Route 1: Shopify's own abandoned checkout email

Shopify sends abandoned checkout emails through the **Shopify Messaging** app (previously Shopify Email). The automation is called **Abandoned checkout emails by Shopify**. In it you choose:

- **Who receives it**: everyone who abandoned with an email address, or only customers subscribed to marketing.
- **When it sends**: how long after abandonment the email goes out.

([Shopify Help Center: abandoned checkouts](https://help.shopify.com/en/manual/orders/abandoned-checkouts))

**Cost.** Shopify Messaging includes 10,000 free emails a month, then charges from $1 per 1,000 ([App Store listing](https://apps.shopify.com/shopify-email), read 15 October 2026). Abandoned checkout emails are a small share of that for most small stores.

**Why start here.** Shopify knows when an order is completed, so its email never reaches someone who has already paid. It needs no other accounts, no webhook and no maintenance. Its limit is that Shopify's help page describes a single recovery email, not a series with different content.

**Before you switch it on:**

1. Edit the email so it sounds like your store, not a template. Keep the checkout button prominent.
2. Choose the delay deliberately. A shorter delay reaches shoppers while they still remember the product. A longer one avoids pestering people who were only comparing prices.
3. Check **Orders → Abandoned checkouts** after two weeks. Shopify marks which ones were recovered, which gives you your own recovery rate to judge any further work against.

## Route 2: A multi-email sequence with Make.com and Systeme.io

Use this route if you want, for example, a reminder after an hour, a different message the next day and a final email after three days.

### First, the trap in most tutorials

Shopify has **no abandoned checkout webhook**. Its checkout webhooks are `checkouts/create`, `checkouts/update` and `checkouts/delete` ([Shopify webhook reference](https://shopify.dev/docs/api/webhooks)). `checkouts/create` fires the moment a checkout starts, including for shoppers who pay a minute later.

So a setup that sends `checkouts/create` straight into an email sequence emails your buyers "you left something behind". An earlier version of this guide made exactly that mistake, and many free tutorials still do.

The fix is in the logic: a shopper enters the sequence when they start checkout with an email address, and **a completed order takes them out of it** before each email sends, including the first.

### How the pieces fit

| Piece | Job |
|---|---|
| Shopify webhook: `checkouts/update` | Tells Make.com a checkout now has an email address |
| Make.com scenario A | Creates or updates the contact in Systeme.io and adds the tag `abandoned-cart` |
| Systeme.io sequence | Waits, checks for the tag `purchased`, sends email 1; repeats for emails 2 and 3 |
| Shopify webhook: `orders/create` | Tells Make.com an order was completed |
| Make.com scenario B | Adds the tag `purchased` to that customer in Systeme.io |

Use `checkouts/update` rather than `checkouts/create` because a checkout often starts before the shopper has typed an email address. In Make.com, add a filter so the scenario continues only when the email field is not empty.

If you already run an `orders/create` scenario, such as [CAPI Shield](/capi-shield/) for Meta server-side tracking, add scenario B's step as an extra branch there instead of building a second scenario.

### Check your free plan limits first

All three limits below were read on the vendors' pricing pages on 15 October 2026.

- **[Make.com free](/go/make/?source=shopify-abandoned-cart-recovery-free-2026-n2)**: up to 1,000 credits a month and 2 active scenarios ([make.com/pricing](https://www.make.com/en/pricing)). Every checkout update and every order uses credits. `checkouts/update` can fire several times for one checkout, so watch the credit counter for the first week and drop the sequence back to Route 1 if it runs out.
- **[Systeme.io free](/go/systeme/?source=shopify-abandoned-cart-recovery-free-2026-n1)**: 2,000 contacts, unlimited emails, one email campaign and one automation rule ([systeme.io/pricing](https://systeme.io/pricing), FAQ). One campaign is enough for this one sequence, but it uses the free plan's only campaign. Before connecting Shopify, confirm in your account that you can build the sequence with delays and a tag check.
- **Shopify**: webhooks are available on every plan, under **Settings → Notifications → Webhooks**.

### Building it

**In Systeme.io**

1. Create two tags: `abandoned-cart` and `purchased`.
2. Create the sequence, triggered when the tag `abandoned-cart` is added to a contact.
3. Before each email, add a condition: if the contact has the tag `purchased`, end the sequence.
4. Write three short emails. Include the checkout link in each, which you will store in a custom contact field (for example `checkout_url`). If you use social proof, use only figures that are true for your store.

**In Make.com, scenario A**

1. Trigger: **Webhooks → Custom webhook**. Copy its URL.
2. Filter: continue only if the checkout's email is not empty.
3. Use Make.com's systeme.io app to create or update the contact with the email, first name and `abandoned_checkout_url` from the payload.
4. Add the tag `abandoned-cart`. systeme.io's tag step expects the **contact ID** returned by the previous step, not the email address; mapping the email here is a common cause of failed runs.

**In Make.com, scenario B (or a branch of an existing orders scenario)**

1. Trigger on the `orders/create` webhook.
2. Find the contact in systeme.io by the order's email and add the tag `purchased`.

**In Shopify**

Under **Settings → Notifications → Webhooks**, create one webhook for **Checkout update** pointing at scenario A's URL, and one for **Order creation** pointing at scenario B's (skip the second if you added a branch to an existing orders scenario). Use JSON format.

### Testing it

1. Start a checkout on your store with an email address you control, then close the tab. Within a few minutes, scenario A should show a run and the contact should carry the `abandoned-cart` tag.
2. Start a second checkout with a different address and complete the order. That contact should receive the `purchased` tag, and **no** recovery email.
3. Leave both for a day and confirm only the first address received anything.

The second test is the one that matters. Do not switch the sequence on for real customers until it passes.

## Which route to choose

| | Route 1: Shopify Messaging | Route 2: Make.com + Systeme.io |
|---|---|---|
| Emails | One, per Shopify's help page | As many as you build |
| Never emails buyers | Yes, Shopify knows the order state | Only if the purchase check is built and tested |
| Accounts needed | None beyond Shopify | Make.com and Systeme.io |
| Maintenance | None | Watch credits; re-test after changes |
| Cost | Free up to 10,000 emails a month | Free within both free plans' limits |

For most small stores, Route 1 recovers most of what a sequence would, with none of the risk. Measure its recovery rate for a month first. If it is recovering orders and you think more emails would add to that, build Route 2.

Recovery only works on checkouts that were already lost. Stopping shoppers leaving in the first place is the other half; the [free conversion rate optimisation guide](/blog/shopify-conversion-rate-optimisation-free-2026/) shows how to find the step where they leave.
