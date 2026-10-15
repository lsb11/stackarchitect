# Evidence checklist: what only Luke can add

Written 15 Oct 2026, after the content quality pass in PR #63.

Google crawls 141 of these pages and declines to index them. The pass fixed
what could be fixed from documentation: broken instructions, outdated vendor
facts, unsupported numbers, the kit pitch on every post. What is left is the
thing no rewrite can supply: **proof that the author did the work**. Across
51 pages there were 16 phrases like "I tested" or "in my store". A reader, and
Google, cannot tell this site from one written by someone who never opened
Make.com.

Each item below is something to capture once, from your own accounts. Send
the raw material (screenshots, numbers, a few sentences of what happened)
and it gets written into the page. Never stage or invent any of it: an
honest "we have not tested this" beats a made-up result, and the site
already says that where it applies.

## How to capture

- **Screenshots:** full window, real data, blur customer names, emails and
  order numbers before sending. PNG.
- **Numbers:** the figure, the date range, and where it came from (which
  screen). "Make.com scenario history, 1–30 Sep, 212 runs, 9.4 credits per
  run" is usable. "About 10 credits" is not.
- **Stories:** what you tried, what broke, how you found out, what fixed it.
  Three sentences is enough.

## Priority 1: pages with the most to gain

These match live demand (Stocky shutdown, BFCM, tracking) and carry tools
you built.

### /capi-shield/ and /blog/shopify-server-side-tracking-complete-setup-guide/
- [ ] Screenshot: the CAPI Shield scenario in Make.com, whole canvas.
- [ ] Screenshot: Meta Events Manager, Purchase event, showing browser and
      server events with deduplication. Date visible.
- [ ] Number: credits used by one real order in the scenario history
      (single-item order and multi-item order).
- [ ] Story: the v19.0 retirement (already written into the reliability
      guide). Confirm you are happy for it to stay public.
- [ ] Number, if you have one: Meta purchases before vs after, same 30 days,
      same attribution setting. Only if measured on a real store.

### /stocky-swap/ and /stocky-alternative/
- [ ] Screenshot: the order log sheet with a week of real (anonymised) rows.
- [ ] Screenshot: the Make.com scenario.
- [ ] Time it: import the blueprint into a fresh Make account and connect it.
      Record the real minutes. Several pages say "4 minutes"; replace with
      what you measured.
- [ ] If you used Stocky yourself: a screenshot of its export screen while
      read-only access lasts (earliest close 29 Nov 2026).

### /stocklog/
- [ ] Screenshots of the app running on a dev store: dashboard, movement
      history, reorder view.
- [ ] Story: why you built it and what Stocky did that Shopify Admin still
      does not.

### /blog/the-complete-guide-to-reliable-shopify-automations/
- [ ] Screenshot: a Break error handler with incomplete executions stored,
      from one of your scenarios.
- [ ] Screenshot: the incomplete executions list after a forced failure.

### /blog/shopify-bfcm-automation-checklist-2026/
- [ ] Run the test order in step 2 on your own store. Screenshot what each
      platform showed, and note anything that did not fire. Time-sensitive:
      before 13 Nov.

## Priority 2: guides rewritten in PR #63

### /blog/shopify-conversion-rate-optimisation-free-2026/
- [ ] Screenshot: Shopify's Conversion rate breakdown report (any store you
      can show, numbers may be blurred).
- [ ] Screenshot: a Clarity recording list filtered to rage clicks.

### /blog/shopify-abandoned-cart-recovery-free-2026/
- [ ] If you have built Route 2: screenshots of both scenarios and the
      Systeme.io sequence, and the result of the buyer-exclusion test.
- [ ] Confirm whether Systeme.io's free plan allowed the multi-step sequence
      in your account. Its pricing page now lists one automation rule; the
      guide asks readers to check, and your answer settles it.

### /blog/shopify-google-analytics-4-setup-free-2026/
- [ ] Screenshot: the Google & YouTube app's Google Analytics 4 connection.
- [ ] Number: GA4 purchases vs Shopify orders for the same 30 days on a store
      you run.

### /blog/tidio-for-shopify-complete-setup-guide/ and /blog/tidio-vs-gorgias-shopify/
- [ ] Have you run Tidio on a store? If yes, screenshots of the knowledge
      base and a week of Lyro conversations (anonymised). If no, the pages
      already say so and should stay that way.

## Priority 3: claims to confirm or correct

Found during the pass and left unchanged because only you can settle them.

- [ ] **/best-ai-tools-shopify/** says you rebuilt Klaviyo's welcome,
      abandoned cart and post-purchase flows on Systeme.io's free plan.
      Systeme.io's pricing page (15 Oct 2026) lists the free plan with one
      automation rule. Was this a different plan, a workflow feature not
      counted as a rule, or before a plan change?
- [ ] **/best-ai-tools-shopify/** and **/make-com-shopify/** say the kit fits
      "roughly 160–250 orders a month" on Make's free plan. CLAUDE.md records
      10 credits for a two-item order in FILE_00, which gives about 100
      two-item orders. State which order size the range assumes.
- [ ] **/best-ai-tools-shopify/** is titled "AI tools" but one of five
      entries is an AI product. Either retitle around what it is (free tools
      you run) or add AI tools you have actually used.
- [ ] Deploy-time claims ("deploys in 4 minutes", "under 6 minutes", "under
      10 minutes") appear on the homepage, /stack/, /tools/ and others.
      Replace each with a time you measured, or remove it.
- [ ] Two pages state publish dates of 1 Jan 2026 (/shopify-profit-loss-automation/,
      /stocky-swap/) and the homepage 1 Feb 2026. If you know when each first
      went live, use that; six pages dated 2025-01-01 were moved to
      2026-04-05, the first commit in this repo.
