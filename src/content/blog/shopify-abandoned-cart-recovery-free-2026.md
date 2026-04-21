---
title: "Shopify Abandoned Cart Recovery Free 2026 — Make.com + Systeme.io"
description: "Recover Shopify abandoned carts for free in 2026. Make.com webhook + Systeme.io email automation: no app required, no monthly fees. Recovers 5–15% of abandoned checkouts."
publishDate: "2026-04-21"
updatedDate: "2026-04-21"
category: "email"
badge: "Free Setup"
badgeType: "new"
readTime: 10
canonical: "https://stackarchitect.xyz/blog/shopify-abandoned-cart-recovery-free-2026/"
faqs:
  - question: "How do I set up abandoned cart recovery on Shopify for free?"
    answer: "The free method uses Make.com and Systeme.io. In Shopify Admin, create a webhook for the 'Checkout abandoned' event pointing to a Make.com scenario. Make.com receives the checkout data and sends it to Systeme.io via API, where a pre-built automation sequence sends the recovery emails. The complete setup takes approximately 30 minutes and costs $0/month on both platforms' free tiers. You do not need the Shopify abandoned checkout notification — this webhook fires on all abandoned checkouts regardless of whether the customer provided their email at checkout."
  - question: "Does Shopify have built-in abandoned cart recovery?"
    answer: "Yes, but with significant limitations. Shopify's built-in abandoned checkout notification sends one email to customers who reached the checkout and provided their email address. It has no sequence capability (only one email), no timing customisation beyond basic delays, and no segmentation. The Make.com + Systeme.io approach supports a full 3-email sequence with custom timing, subject line A/B testing, and segmentation by cart value or product category."
  - question: "How much revenue does abandoned cart recovery generate?"
    answer: "Most Shopify stores recover 5–15% of abandoned checkouts with a well-configured email sequence. On a store with 100 abandoned checkouts per month at an average order value of £80, a 10% recovery rate adds £800/month in additional revenue. The three-email sequence (1 hour, 24 hours, 72 hours) consistently outperforms single-email approaches in recovery rate."
  - question: "What is the difference between Shopify's abandoned cart email and server-side recovery?"
    answer: "Shopify's native abandoned checkout email fires only when a customer has provided their email address before abandoning. Make.com webhooks fire on all checkout abandonment events, including cases where Shopify has a pre-existing customer email on file from a previous order. This captures abandonment from returning customers even if they did not enter their email in the current checkout session."
  - question: "Is Systeme.io free for abandoned cart automation?"
    answer: "Yes. Systeme.io's free plan includes 2,000 contacts, unlimited email sends, full automation sequences with conditional logic, and API access. The abandoned cart sequence — three emails with conditional branching to stop sending after a purchase — runs entirely within the free tier for most Shopify stores."
  - question: "Do I need to install a Shopify app for abandoned cart recovery?"
    answer: "No. The Make.com + Systeme.io approach uses Shopify's native checkout abandonment webhook — a built-in feature available on every Shopify plan. No app installation is required on Shopify. Make.com receives the webhook and Systeme.io sends the emails. The entire system runs externally to Shopify with no app permissions required."
relatedGuides:
  - title: "Replace Klaviyo Free — Systeme.io Migration Guide"
    href: "/replace-klaviyo-free"
  - title: "Make.com for Shopify: Complete Beginner's Guide"
    href: "/blog/make-com-shopify-automation-guide"
  - title: "CAPI Shield — Free Meta + Google Server-Side Tracking"
    href: "/capi-shield"
  - title: "The Complete Free Shopify Automation Stack"
    href: "/"
---

# Shopify Abandoned Cart Recovery Free 2026 — No Apps, No Monthly Fees

The average Shopify store abandons 70–80% of checkouts. Most stores pay £30–£100/month to recover them via Klaviyo, Omnisend, or a dedicated cart recovery app. The free alternative — a Make.com webhook routing to a Systeme.io automation sequence — does the same job at $0/month.

This guide covers the complete free setup in 30 minutes.

## What the Free Stack Does

Before building it, understand exactly what you're getting:

- **Trigger:** Shopify fires a `checkouts/create` webhook the moment a checkout is abandoned — no app required, available on all Shopify plans
- **Router:** Make.com receives the webhook and extracts the customer email, cart contents, checkout URL, and order value
- **Sender:** Systeme.io sends a three-email recovery sequence with conditional logic that stops after purchase

The sequence: email 1 at 1 hour (soft reminder, cart contents shown), email 2 at 24 hours (add urgency or social proof), email 3 at 72 hours (final nudge, optionally with discount).

Recovery rate for this sequence: 5–15% of abandoned checkouts depending on your niche, average order value, and email quality.

## What You Need

- A [Systeme.io free account](https://stackarchitect.xyz/go/systeme) — 2,000 contacts, unlimited sends, free
- A [Make.com free account](https://www.make.com/en/register?pc=techie123) — 1,000 ops/month, free
- Your Shopify Admin access (Settings → Notifications → Webhooks)

## Step 1 — Create the Systeme.io Automation

Set up the email sequence in Systeme.io before configuring the webhook, so you have a destination ready.

**In Systeme.io:**

1. Go to **Automations → Create automation**
2. Set trigger: **Contact subscribes to a tag** — create a tag called `abandoned-cart`
3. Add Email step — delay: **1 hour** after trigger

**Email 1 subject:** `You left something behind...`

Write a short, personal email showing what they left in their cart. Include the checkout link. Keep it under 100 words. No hard sell — just a reminder.

4. Add **Condition** step: check if contact has made a purchase (use the `purchased` tag if you're tagging buyers). If yes → end automation.
5. Add **Email** step — delay: **24 hours** after trigger

**Email 2 subject:** `Still thinking about it?`

Add a line of social proof (e.g. "Over 500 customers bought this last month") or address a common objection. Include the checkout link again.

6. Add **Condition** step: same purchase check.
7. Add **Email** step — delay: **72 hours** after trigger

**Email 3 subject:** `Last chance — your cart expires soon`

Create gentle urgency. Optionally include a discount code if your margins support it. This is the last email — keep it short.

8. Save the automation. Note the **tag name** (`abandoned-cart`) — you'll use this in Make.com.

## Step 2 — Get Your Systeme.io API Key

In Systeme.io: **Profile icon → Settings → API keys → Generate new key**

Copy the key. You'll paste it into Make.com in the next step.

## Step 3 — Build the Make.com Scenario

**In Make.com:**

1. Create a new scenario
2. Add **Webhooks → Custom webhook** as the trigger
3. Copy the generated webhook URL

**The scenario needs two modules after the webhook trigger:**

**Module 2 — HTTP → Make a request**
- URL: `https://api.systeme.io/api/contacts`
- Method: POST
- Headers: `X-API-Key: [your Systeme.io API key]`
- Body (JSON):
```json
{
  "email": "{{email}}",
  "firstName": "{{first_name}}",
  "fields": [
    {"slug": "cart_value", "value": "{{total_price}}"},
    {"slug": "checkout_url", "value": "{{abandoned_checkout_url}}"}
  ],
  "tags": ["abandoned-cart"]
}
```

Map `email`, `first_name`, `total_price`, and `abandoned_checkout_url` from the Shopify webhook payload. Systeme.io creates or updates the contact and immediately triggers the `abandoned-cart` automation sequence.

**Module 3 — Filter (optional but recommended)**

Add a filter before Module 2: only proceed if `{{email}}` is not empty. This prevents failed runs when anonymous browsing creates checkouts without an email address.

Save the scenario and click **Run once** to activate the webhook listener.

## Step 4 — Add the Webhook in Shopify

In Shopify Admin: **Settings → Notifications → Webhooks → Create webhook**

- Event: **Checkout abandonment**
- Format: **JSON**
- URL: paste your Make.com webhook URL
- Save

[Shopify's checkout abandonment webhook documentation](https://shopify.dev/docs/api/admin-rest/2024-01/resources/webhook) confirms this event fires when a checkout has been created but not completed for longer than 10 minutes.

## Step 5 — Test the Sequence

1. On your store, add a product to cart, begin checkout, enter a real email address you control, then close the browser
2. Wait 10–15 minutes for Shopify to fire the abandonment webhook
3. Check Make.com → the scenario should show a successful run
4. Check Systeme.io → Contacts → find the email → verify it has the `abandoned-cart` tag
5. Check your inbox — the first email should arrive within the hour

If the Make.com run fails, check the webhook payload in Make.com's execution history to see the exact error. The most common issues are an empty email field (add the filter from Step 3) or an incorrect Systeme.io API key.

## What Recovery Rates to Expect

Recovery rate depends on four factors: email timing, subject lines, average order value, and your niche.

| Scenario | Typical recovery rate |
|---|---|
| High AOV (£150+), well-written emails | 10–15% |
| Mid AOV (£40–£150), standard emails | 5–10% |
| Low AOV (under £40), impulse products | 3–7% |
| No recovery emails at all | 0% |

The 1-hour email almost always has the highest open rate. Many stores see 30–40% of total recoveries from the first email alone. Don't skip it.

## Free vs Paid: Is This Actually Equivalent to Klaviyo?

Klaviyo's abandoned cart flow is more feature-rich: it supports dynamic product blocks showing the exact abandoned items with images, price drop triggers, and deep Shopify property access.

The free stack gives you: email content, checkout link, total cart value, and the customer's name. No product images in the email (unless you build them manually), no dynamic blocks. For most Shopify stores — particularly under £500k/year revenue — this difference does not materially affect recovery rates.

The sequence logic (timing, conditions, stopping after purchase) is functionally equivalent on Systeme.io's free plan.

## Connect It to Your Full Free Stack

This abandoned cart sequence uses the same Make.com scenario you're running for CAPI Shield and server-side tracking. Add the Systeme.io HTTP module as a parallel branch alongside your existing Meta CAPI and Google Enhanced Conversions branches — one Shopify webhook, abandoned cart recovery running simultaneously with server-side tracking at $0/month.

Full stack: [CAPI Shield](/capi-shield) + [Stocky Swap](/stocky-swap) + [P&L Auto](/shopify-profit-loss-automation) + abandoned cart recovery — all running from a single Make.com free account.

---

## Complete your free Shopify automation stack

While Make.com + Systeme.io handles abandoned cart recovery, the Complete Kit adds the rest of your automation layer — server-side tracking (CAPI Shield replaces Elevar), inventory management (Stocky Swap replaces Stocky before the August 31 shutdown), and live P&L reporting. Four pre-built Make.com JSON blueprints, $29 one-time, deploy in 10 minutes.

**[Get the Complete Kit — $29 →](/pro)**
