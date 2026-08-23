## Status: Consolidation Release v1 is SHIPPED. The URL set is FROZEN.

Spec: docs/RUNBOOK-consolidation-v1.md — read it before any structural change.
That runbook is a record of completed work, **not a to-do list**. Do not re-cut
pages it describes; they are already cut.

Verified against the build on 2026-08-17:

| Metric | Value |
|---|---|
| HTML pages built | 120 |
| `noindex` pages | 60 (54 × `/apps/*`, 3 × `/embed/*`, privacy/terms/refund) |
| **Indexable pages** | **59** |
| **URLs in sitemap-0.xml** | **58** |

The runbook's 88 → 58 target is met. An earlier version of this file said the cut
was still to be made; that was stale and caused wasted work.

### Where the indexing problem actually stands

Do not assume thin content is still the cause — it was measured and it is not.
Exactly one indexable page is under 800 words (`/apps/`, 696). 49 of 59 exceed
1,500 words; 21 exceed 3,000. Canonicals: zero mismatches. robots.txt, sitemap
chain, redirects and internal links all verified clean.

Real GSC data, 14 Aug 2026: **1 page indexed, 236 not indexed.** Of those, 177
are "Crawled – currently not indexed", attributed to *Google systems*, and a
validation attempt failed on 8 Aug. The 24 "Not found" and 19 "Redirect error"
URLs were all traced and **every one now resolves 200** — they are stale reports
from before the 23 Jul redirect fix, and their validation has been stuck on
"Started" for months.

**Correction, 23 Aug: "Bing indexes the site normally" was wrong.** That claim
was load-bearing here and it does not survive Bing's own data. Bing Webmaster
Tools, 23 Feb – 21 Aug 2026 (180 days): **5 clicks, 129 impressions**, and
**53 consecutive days of zero impressions** ending at the export. Bing's Site
Explorer lists three URLs. Monthly: Mar 4, Apr 8, May 25, Jun 92, **Jul 0,
Aug 0**.

Bing is not surfacing this site either. Pages may still sit in its index, but
"indexes normally" is not a supportable reading of a 53-day flatline, and the
inference built on it — *Bing is fine, therefore the cause is Google-specific
trust* — has no support. Do not repeat it.

What the data does support, and it is dated rather than inferred: the 6-month
GSC export shows **11,470 impressions in April and 12 in May**, with the last
day above 1,000 on **9 April** — the eve of the 10–11 Apr migration that ran
without redirects until 23 Jul. Both engines went quiet after that migration;
Google immediately, Bing by July. On a domain that was DR 0 until recently
(DR 4.1 / DA 6 as of 17 Aug).

Caveat on the GSC impression figures: desktop CTR across those six months is
**0.03%** (18,476 impressions, 5 clicks) against **3.86% on mobile**, and the
query list is dominated by 40+ verbose permutations of one Apps Script question
plus a literal rank-tracker operator string. Most of that volume is machine
retrieval, not people. Treat "recover the 11,000 impressions" as a bad goal.

Full analysis lives in the StackArchitect project doc `gsc-indexing-diagnosis.md`.

### Hard rules — still in force

- **The URL set is frozen until roughly 21 Oct 2026 (60 days from the cut).**
  No new pages. No new redirects. No renamed routes. A URL set that moves
  restarts Google's reassessment. Content improvements to existing pages are
  permitted and encouraged; new URLs are not.
- Merging content means DEDUPLICATING, never concatenating. A 4,500-word page
  assembled by stapling four 1,100-word posts together is still four thin pages.
- Never emit a schema.org Offer without both priceVerifiedDate and priceSourceUrl.
- Zero internal links may point at a path on the left-hand side of public/_redirects.
- Organization @id is always #org, never #organization.
- Person name is always "Luke Sandelands", never "Luke".
- Every indexable page opens with a self-contained 40–60 word answer paragraph.
- **Pages Functions have no trailing slash.** `trailingSlash: 'always'` governs
  pages, not `functions/`. Fetch `/api/gap-stats`, never `/api/gap-stats/`. A
  trailing slash there returns a Cloudflare 502, silently. This shipped twice.
- **The `tools.` and `audit.` subdomain redirects are 301 and were checked on
  23 Aug — do not "fix" them.** Cloudflare Redirect Rules 2, 4 and 6 all emit
  301, and the second hop (`/app-audit/` → `/shopify-app-stack-kill-or-keep-auditor/`)
  is a 301 in `public/_redirects` line 242. A summarising HTTP fetcher reported
  these as "302" and it was wrong: the Location it returned was the *second*
  hop's target, which means it had followed the chain and synthesised a status
  rather than reading the first response. Verify with
  `curl -sI https://audit.stackarchitect.xyz/ | head -3` before believing any
  tool that claims otherwise.
- **`/go/*` affiliate cloaks are revenue-critical.** Both slash variants must be
  declared in `public/_redirects`, both 302, and `functions/_middleware.js` must
  keep exempting `/go/*` from slash-adding. Audited 17 Aug: 9 cloaks, 18 rules,
  no extra hop, tracking params preserved.

### Highest-leverage open work

1. Get the iOS Attribution Gap Benchmark to N ≥ 10 real submissions so it
   publishes a first-party figure. Its contribution form was silently discarding
   every submission until 17 Aug (trailing-slash bug above). Until it holds a
   number that exists nowhere else, it is a synthesis of other people's figures
   and Google has no reason to prefer it.
2. Backlinks / domain authority. On current evidence this is the dominant
   remaining variable and the only one that addresses the actual cause.
