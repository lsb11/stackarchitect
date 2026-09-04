---
title: "When to Upgrade Free Make.com to Google Workspace"
heading: "When to Upgrade from Free Make.com to Google Workspace — Shopify Operator's Guide 2026"
description: "7 signals it's time to upgrade from free Make.com to Google Workspace for Shopify automation — what the upgrade actually changes, and how to migrate with zero downtime."
answer: "Upgrade from the free Shopify automation stack when you hit a real ceiling, not on principle. The three signals are Make.com credits exhausted before month end, Apps Script runs exceeding six minutes, and daily trigger runtime running out. What you buy is quota headroom, not features, so the decision follows the symptom rather than the price."
publishDate: "2026-03-25"
updatedDate: "2026-09-04"
verifiedDate: "2026-08-29"
category: "automation"
badge: "Decision Guide"
badgeType: "new"
readTime: 14
canonical: "https://stackarchitect.xyz/blog/when-to-upgrade-free-make-google-workspace/"
faqs:
  - question: "How many operations does Make.com give you for free?"
    answer: "Make.com's free plan gives 1,000 credits per month. A 4-5 branch Shopify automation scenario uses approximately 5-6 operations per order. This covers roughly 160-200 orders per month on the full automation stack before needing to upgrade to Make.com Core at $9/month."
  - question: "What does upgrading to Google Workspace actually change?"
    answer: "It raises Google Apps Script daily quotas, and that is the whole reason to do it for automation. The 6-minute per-execution ceiling is identical on both consumer and Workspace accounts — upgrading does not change it. What Workspace raises is the daily headroom: trigger runtime goes from 90 minutes to 6 hours, UrlFetch calls from 20,000 to 100,000, document creates from 250 to 1,500, and email recipients from 100 to 1,500. Workspace is priced per seat, so a second person is a second full seat rather than a marginal add-on."
  - question: "Do I need Google Workspace for Make.com to work?"
    answer: "No. Make.com works with any Google account including free Gmail. Google Workspace is only needed when Google Apps Script quota limits are causing automation failures — typically scripts hitting the 6-minute consumer execution ceiling or the 90-minute daily trigger-runtime limit."
  - question: "Does upgrading to Google Workspace fix Apps Script timeouts?"
    answer: "No. The 6-minute per-execution ceiling is identical on consumer and Workspace accounts, so 'Exceeded maximum execution time' will keep happening after you pay. The fixes are structural: batch reads and writes so each run does less work, split the job into chunks that each finish inside 6 minutes and save progress with PropertiesService between runs, or move the heavy work onto Make.com, which has no per-execution time limit. Upgrading raises daily quotas, not the per-run ceiling."
  - question: "When should I upgrade Make.com from free to paid?"
    answer: "Upgrade Make.com when you consistently hit the 1,000 credits/month limit. Signs include: scenarios failing with 'operations limit exceeded' errors, having to disable some automation branches to stay within the limit, or processing more than 160-200 orders per month on the full automation stack."
relatedGuides:
  - title: "Make.com for Shopify — Complete beginner's guide"
    href: "/make-com-shopify/"
  - title: "Google Apps Script quotas explained 2026"
    href: "/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations"
  - title: "Zapier vs Make vs Shopify Flow — Honest comparison"
    href: "/make-com-shopify/"
  - title: "Stocky Swap — Free inventory automation"
    href: "/stocky-swap"
---

The free stack — Make.com free + Gmail + Google Sheets on a consumer account — covers most Shopify stores indefinitely. The upgrade to Make.com Core and Google Workspace makes sense at specific trigger points, and not before. This guide covers the 7 signals, what the upgrade actually changes, and how to migrate with zero downtime.

## The Free Stack and Its Limits

The free automation stack runs on:

- **Make.com free:** 1,000 credits/month, webhook triggers included, multi-branch scenarios supported
- **Gmail/Google account (consumer):** Google Apps Script execution limited to 6 minutes per run, 90 minutes total daily trigger runtime, 250 document creates/day
- **Google Sheets (consumer):** No meaningful limits for most stores

For stores under approximately 200 orders/month on a 5-branch scenario, this covers everything. The limits only become relevant as order volume increases or as you add more complex automations.

## The 7 Upgrade Signals

### Signal 1 — Make.com operations limit exceeded

You start receiving "Operations limit exceeded" errors in your Make.com scenario history. This means you've consumed 1,000 credits in the current calendar month and Make.com has paused the scenario until the next month.

**What to do:** Upgrade to Make.com Core ($9/month, 10,000 credits). This covers stores up to approximately 2,000 orders/month on the full 5-branch stack.

Before committing, work out whether the overrun is structural or seasonal, because the answer changes what you buy. Sustained growth justifies a permanent upgrade. A single spike does not: a store averaging 50 orders a day that processes 300 on Black Friday burns roughly 1,200 operations that day alone — past the free tier's monthly ceiling inside twenty-four hours — and then drops back to normal. That is an October upgrade and a January downgrade, not a plan change. The [BFCM automation checklist](/blog/shopify-bfcm-automation-checklist-2026/) sets out the full pre-season sequence and the deadline each piece has to be live by.

### Signal 2 — Google Apps Script timing out mid-run

If you have any automations using Google Apps Script (Autocrat, custom Sheets scripts, document generation), and they're stopping mid-execution with "Exceeded maximum execution time", you've hit the 6-minute consumer ceiling.

**What to do:** Upgrading to Google Workspace will *not* fix this — the 6-minute per-execution ceiling is identical on consumer and Workspace accounts. The real fixes are structural: batch your reads and writes so each run does less work, split the job into chunks that each finish inside 6 minutes (saving progress with PropertiesService between runs), or move the heavy work off Apps Script entirely onto Make.com, which has no per-execution time limit. See the [Scalable Google Sheets Automation guide](/blog/scalable-google-sheets-automation-for-high-volume-workflows/) for the batching and chunking patterns.

### Signal 3 — Scripts working in the morning but failing in the afternoon

This is the daily trigger-runtime quota signal. Consumer accounts get 90 minutes of trigger-driven Apps Script runtime per day (manual runs are not counted). Once exhausted, trigger-driven scripts stop until the quota resets 24 hours after the first request of the day — a rolling window, not a fixed midnight cutoff.

**What to do:** Upgrade to Google Workspace. Workspace accounts get 6 hours of daily runtime — 4× more headroom. This symptom almost always means you've outgrown the consumer quota, not that your scripts have bugs.

### Signal 4 — Document generation becoming unreliable

If you use Autocrat or any document generation workflow and documents are being skipped, partially generated, or failing on busy days, you've hit the 250 document creates per day limit (consumer) or the document service call rate limit.

**What to do:** Upgrade to Google Workspace (1,500 document creates/day) or move document generation off Apps Script entirely into a Make.com scenario calling the Google Docs API directly — covered in the [Autocrat quota fix guide](/autocrat-quota-fix/).

### Signal 5 — You need multiple team members accessing automations

Consumer Google accounts are single-user. If a second person needs to edit Make.com scenarios, view Google Sheets dashboards with proper permissions, or access Tidio / other tools from a shared business account, Google Workspace becomes necessary for organisational reasons.

**What to do:** Upgrade to Google Workspace. Note that it is priced per seat, so a second person is a second full seat, not a marginal add-on — the cost of this signal scales with headcount in a way the other six do not.

### Signal 6 — Email deliverability matters for automation-triggered emails

Consumer Gmail accounts have lower sending limits and worse deliverability for business email than Google Workspace accounts. If your Make.com scenarios send transactional emails (order confirmations, shipping notifications, custom triggers), Google Workspace provides better deliverability and a professional sender domain.

**What to do:** Upgrade to Google Workspace and use your custom domain email (you@yourdomain.com) as the sender for automation-triggered emails.

### Signal 7 — You want Google's 99.9% uptime SLA

Consumer Google accounts have no SLA — if Gmail or Sheets goes down, your automations stop and there's no obligation on Google's part. Google Workspace includes a 99.9% uptime SLA with financial credits for downtime.

**What to do:** Upgrade to Google Workspace if your automations are mission-critical for revenue (server-side tracking, order logging, inventory sync) and you need contractual uptime guarantees.

## The Upgrade Decision

The typical upgrade is Make.com Core plus Google Workspace Business Starter for a single user. We quote one of those prices and not the other, deliberately.

Make.com Core is **$9/month**, verified against [Make's own pricing page](https://www.make.com/en/pricing) on 29 August 2026. Make publishes a readable USD list price, so we can state it and tell you when we last read it.

Google Workspace we hold. Google's pricing page geo-locks to the country you load it from, and annual and flexible billing differ by roughly 20%, so there is no single figure that is true for every reader — quoting one would mean picking a currency and a billing term on your behalf and not saying so. Check [Google's pricing page](https://workspace.google.com/pricing.html) from where you actually are, on the billing term you would actually pick. A price we cannot source in the currency we would be quoting is a price we would rather not assert.

This is less of a problem than it sounds, because the number was never what the decision turned on. What you are buying is quota headroom, and that is fixed and checkable:

**What this gets you:**
- 10,000 Make.com credits/month (covers ~2,000 orders/month on the full stack)
- 6 hours of daily Apps Script trigger runtime (up from 90 minutes)
- 100,000 UrlFetch calls/day (up from 20,000)
- 1,500 document creates per day
- Custom domain email
- Google Workspace SLA

**The payback calculation:**

At 500 orders/month with a 5-branch scenario running server-side tracking, inventory, and P&L reporting:

- Time saved by automated inventory vs manual logging: approximately 2 hours/week
- Time saved by automated P&L vs manual calculation: approximately 1 hour/week
- At a conservative operator value of £25/hour: 3 hours × £25 × 4.3 weeks = £322.50/month saved

Against roughly £322/month of recovered time, a two-line subscription bill is not the deciding variable — which is the point. At this volume the upgrade is not a close call, and whatever Google is charging in your region this quarter does not change the answer. If it *is* a close call for you, that is the signal you have not actually hit a ceiling yet.

## Migration — Zero Downtime

Upgrading from consumer Google to Workspace requires migrating your Google account. This can be done without breaking your existing Make.com scenarios.

**Step 1 — Create your Google Workspace account**

Sign up for Google Workspace Business Starter at workspace.google.com. Verify your domain. Create your primary user (e.g., you@yourdomain.com).

**Step 2 — Move Google Sheets to the new account**

In your consumer Google account, go to each Sheets file used in your automation stack. Share it with your new Workspace email with Editor access. In the Workspace account, make a copy (File → Make a copy) so the Workspace account owns the file.

**Step 3 — Update Make.com connections**

In Make.com, go to **Connections** and reconnect your Google Sheets and Google Drive connections using the new Workspace account credentials. Update the file references in each module to point to the copied files.

**Step 4 — Move Google Apps Script projects**

In the Workspace account, create new Apps Script projects. Copy the script code from your consumer account. In the Workspace Apps Script project, set up the same triggers (time-based, form submission, etc.).

**Step 5 — Test with a live order**

Place a test order in Shopify and verify the entire scenario runs correctly: Make.com receives the webhook, all branches execute, Sheets rows are created, and any Apps Script automation runs to completion.

**Step 6 — Disable consumer account automations**

Once confirmed, delete or disable the triggers in your consumer Apps Script projects. This prevents duplicate automation runs during the transition.

The full migration takes 2–4 hours of active work and causes zero downtime if you keep both accounts running in parallel until you've verified the Workspace setup is working correctly.

## The Bottom Line

Stay on the free stack until one of the 7 signals appears. When it does, the upgrade (Make.com Core + Google Workspace) is straightforward to justify. The [Make.com beginner's guide](/make-com-shopify/) covers the initial setup, and the [Google Apps Script quota guide](/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/) covers the specific limits you'll hit as volume grows.


---

## Get the pre-built Make.com files while you're on the free tier

The Complete Kit is designed for Make.com's free tier — four JSON blueprints (CAPI Shield, TikTok CAPI, Stocky Swap, P&L Auto) that run within 1,000 credits/month for most Shopify stores. Import in 60 seconds each. $24 one-time.

**[Get the Complete Kit — $24 →](/pro/)**


## Related App Alternatives
- [Stocky Pricing & Alternatives](/apps/stocky/)
- [Zapier Pricing & Alternatives](/apps/zapier/)
