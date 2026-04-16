---
title: "When to Upgrade Free Make.com to Google Workspace — Shopify"
description: "7 signals it's time to upgrade from free Make.com to Google Workspace for Shopify automation. The \$21/month cost calculation and zero-downtime migration."
publishDate: "2026-03-25"
updatedDate: "2026-04-14"
category: "automation"
badge: "Decision Guide"
badgeType: "new"
readTime: 14
canonical: "https://stackarchitect.xyz/blog/when-to-upgrade-free-make-google-workspace"
faqs:
  - question: "How many operations does Make.com give you for free?"
    answer: "Make.com's free plan gives 1,000 operations per month. A 4-5 branch Shopify automation scenario uses approximately 5-6 operations per order. This covers roughly 160-200 orders per month on the full automation stack before needing to upgrade to Make.com Core at $9/month."
  - question: "What does Google Workspace cost for one user?"
    answer: "Google Workspace Business Starter costs $6/user/month billed monthly, or $6/user/month billed annually. For a solo operator, the total is $6/month. The main benefit for Shopify automation is the increase in Google Apps Script quotas — 30-minute execution time vs 6 minutes on consumer accounts, and 6 hours of daily runtime vs 90 minutes."
  - question: "Do I need Google Workspace for Make.com to work?"
    answer: "No. Make.com works with any Google account including free Gmail. Google Workspace is only needed when Google Apps Script quota limits are causing automation failures — typically scripts hitting the 6-minute consumer execution ceiling or the 90-minute daily runtime limit."
  - question: "What is the combined cost of Make.com Core plus Google Workspace?"
    answer: "Make.com Core at $9/month plus Google Workspace Business Starter at $6/month equals $15/month total. This is the upgrade cost that makes sense for stores exceeding free plan limits. At 500+ orders per month with a multi-branch automation stack, this combination pays for itself in saved manual time within the first week."
  - question: "When should I upgrade Make.com from free to paid?"
    answer: "Upgrade Make.com when you consistently hit the 1,000 operations/month limit. Signs include: scenarios failing with 'operations limit exceeded' errors, having to disable some automation branches to stay within the limit, or processing more than 160-200 orders per month on the full automation stack."
relatedGuides:
  - title: "Make.com for Shopify — Complete beginner's guide"
    href: "/blog/make-com-shopify-automation-guide"
  - title: "Google Apps Script quotas explained 2026"
    href: "/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations"
  - title: "Zapier vs Make vs Shopify Flow — Honest comparison"
    href: "/blog/zapier-vs-shopify-flow-vs-make"
  - title: "Stocky Swap — Free inventory automation"
    href: "/stocky-swap"
---

# When to Upgrade from Free Make.com to Google Workspace — Shopify Operator's Guide 2026

The free stack — Make.com free + Gmail + Google Sheets on a consumer account — covers most Shopify stores indefinitely. The upgrade to Make.com Core ($9/month) and Google Workspace ($6/month) makes sense at specific trigger points. This guide covers the 7 signals, the $21/month decision, and how to migrate with zero downtime.

## The Free Stack and Its Limits

The free automation stack runs on:

- **Make.com free:** 1,000 operations/month, webhook triggers included, multi-branch scenarios supported
- **Gmail/Google account (consumer):** Google Apps Script execution limited to 6 minutes per run, 90 minutes total daily runtime, 250 document creates/day
- **Google Sheets (consumer):** No meaningful limits for most stores

For stores under approximately 200 orders/month on a 5-branch scenario, this covers everything. The limits only become relevant as order volume increases or as you add more complex automations.

## The 7 Upgrade Signals

### Signal 1 — Make.com operations limit exceeded

You start receiving "Operations limit exceeded" errors in your Make.com scenario history. This means you've consumed 1,000 operations in the current calendar month and Make.com has paused the scenario until the next month.

**What to do:** Upgrade to Make.com Core ($9/month, 10,000 operations). This covers stores up to approximately 2,000 orders/month on the full 5-branch stack.

### Signal 2 — Google Apps Script timing out mid-run

If you have any automations using Google Apps Script (Autocrat, custom Sheets scripts, document generation), and they're stopping mid-execution with "Exceeded maximum execution time", you've hit the 6-minute consumer ceiling.

**What to do:** Upgrade to Google Workspace ($6/month). Workspace accounts get 30-minute execution time — 5× the headroom.

### Signal 3 — Scripts working in the morning but failing in the afternoon

This is the daily runtime quota signal. Consumer accounts get 90 minutes of combined Apps Script runtime per day. Once exhausted, all scripts stop until midnight Pacific Time.

**What to do:** Upgrade to Google Workspace. Workspace accounts get 6 hours of daily runtime — 4× more headroom. This symptom almost always means you've outgrown the consumer quota, not that your scripts have bugs.

### Signal 4 — Document generation becoming unreliable

If you use Autocrat or any document generation workflow and documents are being skipped, partially generated, or failing on busy days, you've hit the 250 document creates per day limit (consumer) or the document service call rate limit.

**What to do:** Upgrade to Google Workspace (1,500 document creates/day) or move document generation off Apps Script entirely into a Make.com scenario calling the Google Docs API directly — covered in the [Autocrat quota fix guide](/autocrat-quota-fix).

### Signal 5 — You need multiple team members accessing automations

Consumer Google accounts are single-user. If a second person needs to edit Make.com scenarios, view Google Sheets dashboards with proper permissions, or access Tidio / other tools from a shared business account, Google Workspace becomes necessary for organisational reasons.

**What to do:** Upgrade to Google Workspace. Add users at $6/user/month each.

### Signal 6 — Email deliverability matters for automation-triggered emails

Consumer Gmail accounts have lower sending limits and worse deliverability for business email than Google Workspace accounts. If your Make.com scenarios send transactional emails (order confirmations, shipping notifications, custom triggers), Google Workspace provides better deliverability and a professional sender domain.

**What to do:** Upgrade to Google Workspace and use your custom domain email (you@yourdomain.com) as the sender for automation-triggered emails.

### Signal 7 — You want Google's 99.9% uptime SLA

Consumer Google accounts have no SLA — if Gmail or Sheets goes down, your automations stop and there's no obligation on Google's part. Google Workspace includes a 99.9% uptime SLA with financial credits for downtime.

**What to do:** Upgrade to Google Workspace if your automations are mission-critical for revenue (server-side tracking, order logging, inventory sync) and you need contractual uptime guarantees.

## The $21/Month Decision

The typical upgrade is Make.com Core + Google Workspace Business Starter for a single user:

- Make.com Core: $9/month
- Google Workspace Business Starter: $6/month
- **Total: $15/month** (not $21 — the $21 figure includes a second Workspace user)

For a solo operator: $15/month.

**What this gets you:**
- 10,000 Make.com operations/month (covers ~2,000 orders/month on the full stack)
- 30-minute Google Apps Script execution per run
- 6 hours of daily Apps Script runtime
- 1,500 document creates per day
- Custom domain email
- Google Workspace SLA

**The payback calculation:**

At 500 orders/month with a 5-branch scenario running server-side tracking, inventory, and P&L reporting:

- Time saved by automated inventory vs manual logging: approximately 2 hours/week
- Time saved by automated P&L vs manual calculation: approximately 1 hour/week
- At a conservative operator value of £25/hour: 3 hours × £25 × 4.3 weeks = £322.50/month saved

The $15/month upgrade pays for itself in under 2 days of saved manual time.

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

Stay on the free stack until one of the 7 signals appears. When it does, the $15/month upgrade (Make.com Core + Google Workspace) is straightforward to justify. The [Make.com beginner's guide](/blog/make-com-shopify-automation-guide) covers the initial setup, and the [Google Apps Script quota guide](/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations) covers the specific limits you'll hit as volume grows.
