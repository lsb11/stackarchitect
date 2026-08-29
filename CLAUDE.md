# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server on `localhost:4321` |
| `npm run build` | `claims-guard` → `astro build` → `schema-visible-guard`. Both guards exit non-zero and fail the build. |
| `npm run preview` | Serve `dist/` locally |
| `npm test` | `node --test` — runs `tests/*.test.js` and `functions/api/*.test.js` |
| `node --test tests/ios-attribution-gap-benchmark.json.test.js` | Single test file |
| `npm run a11y` | Playwright contrast audit over `dist/` (needs a build first). Mandatory before any CSS/token change. |
| `npm run claims` / `npm run claims:burndown` | List unverified price claims / burndown report |
| `npm run claims:register` | Regenerate `docs/CLAIMS-REGISTER.md` |
| `npm run schema:check` | Schema-vs-visible-text report without failing |
| `npm run seo:audit` / `npm run seo:crawl` | `seo-audit.mjs` over `dist/`; crawl audit against production |
| `npm run pricing-audit` | Cross-check asserted vendor prices |
| `npm run gsc:coverage` | GSC URL Inspection sweep (needs `GSC_KEY_JSON`) |
| `node scripts/redirect-smoke.mjs --parse-only` | Lint `public/_redirects` offline (chains, loops, truncation) |
| `node scripts/moderate-gap.mjs list\|approve\|reject\|stats` | Moderate D1 benchmark submissions via wrangler |

`seo-audit.mjs` has its own tests (`seo-audit.test.mjs`), also picked up by `npm test`.

## Architecture

Astro 6, `output: 'static'`, `trailingSlash: 'always'`, Tailwind 4 via `@tailwindcss/vite`,
deployed to Cloudflare Pages (project `stackarchitect2`, `dist/`).

**Routing.** `src/pages/**` are the routes — one `.astro` file per money page. Blog posts are
a content collection (`src/content/blog/*.md`, schema in `src/content.config.ts`) rendered by
`src/pages/blog/[slug].astro`; three posts are hand-built `.astro` files under `src/pages/blog/`
instead. `src/pages/apps/[app].astro` generates 54 noindexed detail pages from
`src/data/apps.json`; `/apps/` itself is the canonical hub. `src/pages/og/[...route].ts` renders
OG images with `astro-og-canvas`.

**`src/layouts/Base.astro` is the single SEO surface.** It forces the canonical to
apex + trailing slash regardless of what a page passes, emits JSON-LD, and picks `dateModified`
from `verifiedDate` when that is newer than `updatedDate` (`verifiedDate` = a human re-checked
the factual claims; `updatedDate` = the content changed). Change SEO behaviour here, not per page.

**`astro.config.mjs` does more than config.** At load it walks `src/content/blog/` and
`src/pages/`, resolving a real `lastmod` per URL (frontmatter date → `git log -1 --format=%cI`
→ build time) into a cache the sitemap `serialize()` reads; the build logs
`[sitemap] indexed N URL(s)`. Its `filter()` is what keeps `/apps/*`, `/embed/*` and the legal
pages out of the sitemap. It also defines the `rehypeSponsorAffiliateLinks` plugin, which stamps
`rel="sponsored noopener"` on every `/go/*` link in Markdown — so blog affiliate links are
disclosed by the pipeline, not by hand.

**Edge behaviour, in order.** `functions/_middleware.js` runs first: https, strip `www.`,
redirect any non-primary host (including `*.pages.dev` previews) to the apex, then add a
trailing slash — exempting `/api/*`, `/go/*` and anything with a file extension. Responses served
on a non-primary host get `X-Robots-Tag: noindex`. `public/_redirects` (290 lines) then handles
affiliate cloaks and legacy URLs. Redirect edits are covered by `.github/workflows/redirect-smoke.yml`
(parse-only on PR, live assertions after deploy, plus nightly).

**Pages Functions + D1.** `functions/api/{submit-gap,gap-stats,gap-badge}.js` back the iOS
Attribution Gap Benchmark, writing to the `attribution-gap` D1 database (`binding = "DB"`,
schema in `schema/`). The gap is computed server-side, submissions land `pending`, and
`/api/gap-stats` refuses to publish a figure below N=10. Moderation is a local wrangler script
by design — no admin endpoint exists. The page's *sourced* (non-first-party) rows live in
`src/data/attributionGap.js`, the single source shared by the page and the CSV/JSON download
endpoints.

**Build guards** (`scripts/`, both wired into `npm run build`):
- `claims-guard.mjs` — a page asserting a third-party price with no `verifiedDate` fails the
  build unless it is quarantined in `docs/claims-unverified.json`. That quarantine may only
  shrink; a stale entry also fails. Clear one by reading the vendor's live pricing page and
  passing that date as `verifiedDate` — never by stamping today's date.
- `schema-visible-guard.mjs` — runs over `dist/` and fails when JSON-LD asserts a number that
  does not appear in the page's visible text.

Root-level `*.patch` files, `.archived-pages/`, `.*-backup*/` and the loose `.py`/`.cjs` scripts
are historical artefacts, not live tooling.

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
- **Never emit a schema.org Offer for a THIRD-PARTY price without both
  priceVerifiedDate and priceSourceUrl.** The rule is about somebody else's
  number: it needs a source and the date a human read it there. First-party
  offers — the Complete Kit, the four single blueprints, the upgrade,
  StockLog — are prices we set, so there is no external source to cite and no
  verification to date. They come from `src/data/products.ts` and are pinned
  in `src/data/claims.json`, which `scripts/claims-guard.mjs` enforces: a page
  stating one of them with a retired value fails the build. That is the
  guarantee those offers carry instead.
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
- **Run `npm run a11y` before any CSS or colour-token change ships.** It builds
  nothing — run `npm run build` first — then measures every text node and every
  link/button on all 58 indexable pages with proper alpha and gradient
  compositing. It must exit 0. Two bug classes it exists to catch, both found
  live on 23 Aug 2026:
  - **Dark Tailwind tokens used as text on a dark ground.** `#15803d`
    (green-700), `#6d28d9` (violet-700) and `#2f3733` are designed for white
    backgrounds. On `/tools/` the trust microcopy ("No credit card · No monthly
    fees") measured **1.38:1 at 9px** — not rendered, in practice. Use the site
    accent `#34d377` and the `--text-2/3/4` ramp (`#b6c0ba` / `#93a09a` /
    `#7f8b85`) for text on dark.
  - **Page-scoped link resets repainting filled buttons.** Astro compiles a
    page's `a { color: inherit }` into `a[data-astro-cid-xxxx]`, specificity
    (0,1,1), which beats `.cta-primary` (0,1,0). Six `/go/*` CTAs on `/stack/`
    were rendering white-on-green at **1.72:1**, and the GetResponse button on
    `/replace-klaviyo-free/` was green-on-green at **1:1** — invisible. The
    `!important` on `.cta-primary`/`.cta-secondary` ink and fill in global.css
    is the fix. **Do not remove it.**
- **Never add `max-width` to the `body > *` block in global.css.** That block is
  unlayered, and unlayered CSS beats every rule inside Tailwind's
  `@layer utilities` regardless of specificity. A `max-width` there overrides
  `max-w-3xl` on the blog layout's `<main>` and widens every post from 768px to
  the full viewport. This shipped in `00f8f3f` and was live until 23 Aug. The
  viewport clamp belongs in the `@media (max-width:700px)` block.
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
