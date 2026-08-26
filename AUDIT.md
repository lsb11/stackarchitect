# AUDIT.md — Phase 0, read-only

**Date:** 26 August 2026 · **Method:** `npm run build`, then static analysis of `dist/` (120 HTML files), not source.
**Scope:** 120 emitted pages · 61 `noindex` (54 `/apps/*`, 3 `/embed/*`, privacy/terms/refund, 404) · **59 indexable** · **58 in `sitemap-0.xml`**.

Nothing was changed. One item (Core Web Vitals) could not be completed — see §9.

---

## Falsified hypotheses — read this before proposing any of them again

Three explanations for the indexing collapse have now been **measured and ruled out**. They are recorded here so they are not re-litigated. Re-opening one requires new evidence, not a new intuition.

| # | Hypothesis | Test | Result | Measured |
|---|---|---|---|---|
| 1 | Thin content / low boilerplate ratio is suppressing indexing | 8-word shingle analysis across all 59 indexable pages; boilerplate = shingles present on ≥50% of pages | **FALSE.** Worst page is **63% unique**, median 80%. The flag threshold was 40%. Nothing is close. Min page length 850 words; 49 of 59 exceed 1,500 | 26 Aug 2026 |
| 2 | Keyword cannibalisation / near-duplicate pages | Pairwise containment of non-boilerplate shingles, all 1,711 page pairs | **FALSE.** Max overlap between any two pages is **16.1%**. Only 2 pairs exceed 15%; **zero** exceed 25%. Genuine cannibalisation runs 40–70% | 26 Aug 2026 |
| 3 | The April migration repair is incomplete / redirects still broken | Reconstructed the rule set from git, walked all 248 rules for chains, loops and dead targets, verified survivors against production with `curl -sI` | **FALSE.** 0 chains, 0 loops, 0 duplicate LHS, 0 homepage dumps. Of 4 rules lost since 3 Jul, 2 still resolve 200 in 2 hops and 1 is a truncated slug that was never a real page | 26 Aug 2026 |

**Caveat on #2, and it matters.** Shingle overlap measures *text* duplication, not *query* competition. Two pages at 16% textual overlap can still compete for one SERP. What is falsified is near-duplicate content; intent overlap is a separate question that `dist/` cannot answer, and it remains open pending query-level GSC data.

**Note on #3's method.** Git cannot reconstruct the pre-migration URL set — this repo held only 10 pages on 9 Apr 2026, so the pre-migration site lived elsewhere. `public/_redirects` is its only surviving record. The rule count history (186 on 3 Jul → 18 on 15 Jul → 168 restored on 17 Jul, 248 today) is the evidence trail.

Also ruled out in the same pass: commercial density (median 0.7 `/go/*` links per 1,000 unique words), crawlability, duplicate titles/descriptions (zero), invalid schema (zero across 120 pages).

**What this leaves.** The remaining explanations are domain authority / link equity and the April→July trust damage — both largely off-page. That is why the emphasis has moved to the backlink profile and GSC query data. The on-page work still worth doing is claims integrity and evidence, neither of which is a ranking lever so much as a precondition for being worth citing.

---

## Headline: three of the brief's premises do not survive measurement

The brief asks me to argue when the repo evidence points elsewhere. It does, on three points.

| Brief's premise | Measured result | Verdict |
|---|---|---|
| "Boilerplate ratio under 40% is the strongest predictor here — expect to find it" | **Worst page on the site is 63% unique.** Median 80%. Nothing is remotely close to 40%. | **Rejected** |
| "I expect heavy overlap — Klaviyo, Stocky, CAPI, TikTok cannibalisation" | Max non-boilerplate overlap between *any* two pages is **16.1%**. Only 2 pairs exceed 15%; **zero** exceed 25%. | **Rejected** |
| "The hero video is the obvious LCP suspect" | `preload="metadata"`, `poster` set, no `autoplay`, `controls`. It downloads a few KB of headers until clicked. | **Rejected** |

Phase 1 (consolidate + 301) is built on premises 1 and 2. **The content it would consolidate does not exist.** It would also break `CLAUDE.md`'s hard rule that the URL set is frozen until ~21 Oct 2026 — and per the runbook the 88 → 58 cut has already been executed. Re-cutting is the wasted-work failure mode that file was written to prevent.

My recommendation is to **skip Phase 1 entirely** and go straight to Phases 2/3/5, which the evidence does support. Detail in §10.

---

## 1. URL inventory

Full machine-readable inventory: 120 rows with title, description, canonical, robots, H1, word counts, `/go/*` counts and JSON-LD types. Summary of the 59 indexable pages:

- **Titles:** 59 unique, zero duplicates.
- **Meta descriptions:** 59 unique, zero duplicates, zero missing.
- **H1:** exactly one per page, on all 59.
- **Canonicals:** all 59 self-canonical, zero mismatches. The only three non-self canonicals are `/embed/*`, which point at their parent tools deliberately and are `noindex` anyway. Correct.
- **JSON-LD:** parses on all 120 pages. Zero invalid blocks.

Word counts run 850 → 8,016 unique words. Distribution below.

## 2. Boilerplate ratio

I did not trust the `<main>` wrapper for this, because **7 indexable pages emit no `<main>` element at all** (`/stack/`, `/pro/`, `/stocky-shutdown/`, `/sitemap-page/`, `/shopify-app-cost-calculator/`, and 2 blog posts) — `Base.astro` does not provide the landmark, each page does. That is a real accessibility finding (missing main landmark; §7) but it makes wrapper-based ratios meaningless.

Instead I measured boilerplate empirically: 8-word shingles appearing on ≥50% of the 59 indexable pages are boilerplate by definition. Unique ratio = 1 − (boilerplate shingles ÷ total shingles).

| Unique ratio | Pages |
|---|---|
| 90%+ | 7 |
| 80–90% | 22 |
| 70–80% | 21 |
| 63–70% | 9 |
| **<40% (brief's flag threshold)** | **0** |

Lowest five: `/apps/` 63.1%, `/shopify-app-stack-kill-or-keep-auditor/` 63.9%, `/sitemap-page/` 63.9%, `/make-vs-zapier-cost-calculator/` 64.4%, `/klaviyo-to-systeme-migration-savings-calculator/` 65.2%. These are the shortest pages, so shared nav/footer occupies a larger fraction — that is arithmetic, not a content problem.

**There is no boilerplate problem on this site.**

## 3. Cannibalisation map

Titles overlap on topic. The *text* does not. Pairwise containment of the smaller page's non-boilerplate shingles in the larger, all 1,711 pairs:

| Overlap | Pair |
|---|---|
| 16.1% | `/stocky-migration-risk-scorer/` <> `/stocky-shutdown/` |
| 15.1% | `/stocky-migration-risk-scorer/` <> `/stocky-swap/` |
| 9.4% | `/capi-shield/` <> `/tiktok-events-api-shopify/` |
| 7.1% | `/stocky-shutdown/` <> `/stocky-swap/` |
| 6.4% | `/make-vs-zapier-cost-calculator/` <> `/shopify-vs-meta-attribution-gap-calculator/` |

Everything else is below 6%. For context, genuine cannibalisation on an affiliate site typically shows 40–70% containment. **Nothing here is a near-duplicate.**

The highest pair (16%) is a risk scorer sharing shutdown-date facts with the page about the shutdown — appropriate shared context, not duplication.

Two pairs have confusingly similar *titles* while having distinct bodies, which is a SERP-clarity issue rather than a cannibalisation issue, fixable by retitling without touching URLs:

- `/shopify-google-ads-conversion-tracking/` "Fix Shopify Google Ads Tracking — Free Setup 2026" vs `/blog/how-to-fix-shopify-google-ads-conversion-tracking-2026/` "Fix Shopify Google Ads Conversion Tracking 2026 — Free" (bodies overlap 4.8%)
- `/tidio-shopify-guide/` vs `/blog/tidio-for-shopify-complete-setup-guide/` (review vs setup guide — distinct, but the titles don't say so)

**Recommended cluster table: no URL should be retired.** Two titles should be rewritten to state the differing intent. That is the whole of the consolidation work the data justifies.

## 4. Thin / derivative pages

Exactly one indexable page is under 1,000 unique words: `/apps/` at 850. It is a legitimate index page over 53 noindexed detail pages, and it carries `CollectionPage` + `ItemList`.

The six calculators sit at 984–1,203 unique words. Per the brief's own test — "enough surrounding substance (methodology, worked examples, what the number means, what to do next)" — **five of six already pass**: they render a full worked example server-side with real default numbers, plus FAQ and methodology. See §8 for the one that does not.

**No thin-page problem either.**

## 5. Commercial density

Affiliate CTAs measured as `/go/*` links per 1,000 unique words:

| Page | `/go/*` links | per 1k unique words |
|---|---|---|
| `/` | 20 | 3.4 |
| `/klaviyo-to-systeme-migration-savings-calculator/` | 3 | 2.9 |
| `/stack/` | 6 | 2.3 |
| `/make-vs-zapier-cost-calculator/` | 2 | 2.0 |
| `/stocky-swap/` | 9 | 1.8 |
| *median across 59 pages* | — | **0.7** |
| 22 pages | 0 | 0.0 |

A density of ~1 affiliate link per 1,400 words is low for the category. `rel="sponsored"` is injected sitewide via the rehype plugin, disclosure is present, and `/go/` is `Disallow`ed in robots.txt.

The homepage at 3.4 is the outlier and worth trimming, but this is **not** a site whose commercial density would trip a quality assessment.

## 6. Claim verification

This is where the audit finds real, actionable damage.

`npm run pricing-audit` reports **2,796 price claims, 2,662 with no verification date at all (95%)**. Breakdown of the unverified:

| Source | Unverified claims | Cause |
|---|---|---|
| `.astro` pages | **2,291** | Only **3 of 38** page files pass `verifiedDate` to `<Base>` |
| Blog posts | **319** | `src/content.config.ts` has **no `verifiedDate` field in the schema** — structurally impossible to set |
| `apps.json` | 52 | Entries with `priceVerifiedDate: null` |

So the site *has* the verification machinery, and 95% of pages are not wired into it. `apps.json` is the well-behaved exception (verified 2026-08-23, 0 stale).

`/index.astro` alone — the one page Google *does* index — carries price claims for Elevar ($225/mo), Stape ($29+/mo), Littledata ($159+/mo), WeltPixel ($39/mo), Analyzify ($145–$275/mo), plus "$500–$1,600/month" and "$145–$650/month" ranges, **with no `verifiedDate` and no inline source links**.

### Unsupported equivalence and magnitude claims

These are the assertions most likely to read as unsubstantiated. All are on `/` unless noted:

| Claim | Location | Problem |
|---|---|---|
| "CAPI Shield achieves **identical Event Match Quality scores (7–8.5)** at $0" [vs Elevar at $225/mo] | `index.astro:1349` | Asserts measured equivalence with a named commercial product. No sample, no source, no methodology link. The strongest single trust liability on the site. |
| "achieving EMQ scores of 6–8 **in most Shopify deployments**" | `index.astro:1358` | "most deployments" claims a population the site has never sampled. |
| "Browser-only tracking loses an **estimated 20–40%** of purchase events" | `index.astro:1346` | Uncited magnitude, load-bearing for the whole value proposition. |
| "the **same technical outcome** as paid alternatives" (×4) | `index.astro:82,1343,1346,1358` | Blanket equivalence assertion. |
| "**Equivalent to Klaviyo**" | `blog/shopify-abandoned-cart-recovery-free-2026.md:166` | Same pattern. |
| "**guaranteed**" (×3) | `shopify-google-sheets-automation.astro:146,487,781` | Absolute reliability language on a free-tier stack. |
| Shopify reported Google Ads conversions "**15–40% lower** than reality" | `index.astro:1355` | Uncited. |

Note that `llms.txt` handles exactly this problem *correctly* — it labels the $510–$2,146 figure as "sum of published vendor list prices, not a measured saving" and annual figures as "arithmetic, not measured outcomes." **The honesty discipline already exists in this repo; the homepage does not follow it.**

## 7. E-E-A-T surface

**Strong:** "Luke Sandelands" appears on **59 of 59** indexable pages. `Person` + `Organization` schema present sitewide (`@id: #org` per convention). `/how-we-test/` exists. 57 of 59 pages carry a reviewed/verified date string (missing: `/gorgias-shopify-guide/`, `/sitemap-page/`).

**The gap — and it is large.** Across all 59 indexable pages the site contains **two content images total**:

- `/images/stocklog-app.webp` (1 page)
- `/diagrams/tiktok-events-api-shopify-flow-2026.svg` (1 page)

plus `/luke.jpg` (the author headshot, repeated on 34 pages). The entire repo holds 26 raster assets, of which 9 are favicons/icons, 13 are generated OG cards, and 2 are video posters.

**There is not one screenshot of a Make.com scenario, a Meta Events Manager EMQ readout, a Google Sheet, or a store dashboard anywhere on this site.** Every claim of first-hand operation is text asserting first-hand operation. A quality rater — or a reader in the industry — has nothing to look at.

The iOS Attribution Gap Benchmark, the one page positioned to be a primary source, still contains **"Placeholder"** strings and publishes no N.

## 8. Technical checks

**Clean:** zero broken internal links · zero non-`/go/` internal links to a redirect LHS (the `/go/*` cloaks are linked by design and exempted correctly) · canonicals correct · robots.txt correct, and its 2026-08-17 note on *not* blocking tracking parameters is right · sitemap 58 URLs, all indexable, none redirected or noindexed · AI crawlers explicitly allowed by name (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended, Applebot, cohere-ai, MistralAI-User, meta-externalagent).

**Findings:**

1. **`/sitemap-page/` is orphaned and absent from the sitemap.** Zero inbound internal links from anywhere, including the footer. The HTML sitemap the brief asks for in Phase 6 already exists — it is just unreachable. Cheapest win on this list.
2. **`/blog/shopify-ai-playbook-2026/` has 1 inbound internal link; `/blog/shopify-agentic-storefronts-setup-guide-2026/` has 2.** Everything else is ≥3.
3. **JS-dependency: five of six calculators are fine.** `/make-vs-zapier-cost-calculator/`, `/shopify-vs-meta-attribution-gap-calculator/`, `/shopify-app-cost-calculator/`, `/stocky-migration-risk-scorer/`, `/shopify-app-stack-kill-or-keep-auditor/` all render a labelled worked example with real numbers in static HTML. **`/meta-emq-score-estimator/` is the exception** — it ships `Estimated EMQ Score 0.0 / Calculating… / Match Rate 0% / Missing Attribution --`. To a non-executing crawler that page's core output is a zero and the word "Calculating". Fix by pre-rendering a default worked example, matching its five siblings.
4. **7 indexable pages have no `<main>` landmark** (listed in §2).
5. **28 pages have H2/H3 headings with no `id` anchor.** Worst: `/blog/shopify-server-side-tracking-complete-setup-guide/` **46 of 46 missing** — the longest page on the site, 8,016 unique words, entirely unlinkable at passage level; `/blog/shopify-agentic-storefronts-setup-guide-2026/` 18/18; `/` 25/38; `/make-com-shopify/` 18/29. Directly blocks the Phase 5 passage-citation goal.
6. **`llms.txt` is a static file in `public/`, not generated.** Content quality is genuinely good, but it will silently drift from the sitemap. Phase 5 asks for it to share a source of truth; it does not.
7. All `<img>` tags have `alt`. No missing-alt findings.

## 9. Core Web Vitals — NOT COMPLETED

Lighthouse is not installed in this repo and I did not install it, since Phase 0 is read-only. **I am not going to estimate CWV numbers I did not measure.** To finish this item, say the word and I will `npx lighthouse` the five templates.

What I could measure statically, which argues against the brief's suspicion:

- **Hero video is well configured** — `preload="metadata"`, `poster="/videos/poster-16x9.jpg"`, `playsinline`, `controls`, no `autoplay`. It is not an LCP candidate and does not download its 3.8 MB until a user clicks.
- **JS is very light** — largest bundle is Astro's own 16 KB ClientRouter; every page script is ≤8 KB; `dist/_astro` totals 1.8 MB across all 120 pages.
- HTML 104–204 KB uncompressed per page; 3–4 stylesheet links; a `@layer sa-shell` critical-CSS fallback is inlined in `<head>`.
- The 7 videos in `public/` total ~20 MB but none autoplay.

Nothing here looks like a CWV problem, but that is an inference, not a measurement.

---

## 10. Diagnosis — why is one page indexed out of 59?

Ranked by likely impact.

### 1. Domain authority / link equity — dominant (high confidence)

DR 4.1, DA 6 as of 17 Aug 2026, on a young `.xyz`. `CLAUDE.md` already identifies this as the dominant remaining variable and I agree. 177 URLs sit in "Crawled – currently not indexed", attributed to *Google systems* — the classic signature of "we fetched it, we understood it, we don't think it's worth an index slot." That is a site-level worth-it judgement, and the primary input Google has for it on a 4-month-old domain is external corroboration, which is near zero.

### 2. The unrepaired April migration (high confidence)

The dated evidence is the strongest thing in this repo: **11,470 impressions in April → 12 in May**, last day above 1,000 on **9 April**, migration 10–11 April, redirects not fixed until **23 July** — fourteen weeks of 404s. Both engines went quiet. Bing has since flatlined for 53 consecutive days. A site-level reassessment triggered in April is still running, and validation attempts have been stuck or failing since (a failed validation on 8 Aug, "Not found"/"Redirect error" validations stuck on "Started" for months despite every URL now returning 200).

This also means **the URL freeze in `CLAUDE.md` is the correct call and Phase 1 would actively harm the site.** Moving URLs again is precisely the thing that restarts the clock that has already been running since April.

### 3. Unverifiable claims on the only indexed page (medium confidence, cheapest to fix)

95% of price claims carry no verification date, and the specific page Google *has* indexed asserts measured equivalence with named paid products — "identical Event Match Quality scores (7–8.5)" against Elevar's $225/mo — with no source, no sample, no methodology link. If a rater sampled one page, they sampled that one. This is the highest-value-per-hour item on the list, and the repo already proves it can be done right, because `llms.txt` does it right.

### 4. Assertion without demonstration (medium confidence)

Two content images across 59 pages. The site's entire differentiation is "I actually ran these systems," and it presents zero artifacts of having run them. This is simultaneously the top E-E-A-T gap and, per the brief's own Phase 5 reasoning, the top GEO gap — screenshots and honest limitation sections are exactly the information vendor pages don't contain.

### 5. The benchmark isn't yet a primary source (medium confidence, highest ceiling)

It still says "Placeholder" and publishes no N. Until it holds a number that exists nowhere else, the site is a summariser of other people's figures. `CLAUDE.md` open item #1, and I agree with its priority.

### Explicitly NOT the cause — measured and ruled out

Thin content (min 850 words, 49 of 59 over 1,500) · boilerplate ratio (min 63%, threshold 40%) · cannibalisation (max 16% overlap) · commercial density (median 0.7 `/go/` links per 1k words) · crawlability (zero broken links, correct canonicals, clean sitemap, AI crawlers allowed) · duplicate titles/descriptions (zero) · invalid schema (zero).

**Adding more schema markup — the brief's Phase 4 — will not move any of the top five causes.** The JSON-LD is already extensive and valid on all 120 pages.

---

## Recommended plan, revised against the evidence

| Brief | My recommendation |
|---|---|
| **Phase 1 — Consolidate** | **Drop.** No cannibalisation to consolidate; violates the URL freeze; the 88 → 58 cut is already done. Keep only: retitle the 2 confusable title pairs, in place, no URL change. |
| **Phase 2 — Per-page quality** | **Do, reordered.** Start with the claims register + `verifiedDate` wiring (§6), then the "honest limitation" sections, then screenshots. Homepage first — it is the only indexed page. |
| **Phase 3 — Entity/authorship** | **Partly done already.** Author on 59/59, `Person`+`Organization` sitewide. Remaining real work: strengthen `/how-we-test/` into something the equivalence claims can cite. |
| **Phase 4 — Schema** | **Defer.** Already valid and extensive on 120/120 pages. Lowest expected return on this list. |
| **Phase 5 — GEO** | **Do the concrete parts:** anchor IDs on 28 pages, pre-render `/meta-emq-score-estimator/`, generate `llms.txt` from the sitemap source, get the benchmark to real N with a CSV and licence. |
| **Phase 6 — Indexing** | **Do the cheap part now:** link `/sitemap-page/` from the footer and add it to the sitemap. Then `GSC-PLAYBOOK.md`. |
| **Phase 7 — Perf/a11y** | **Measure first.** Add the missing `<main>` landmarks (7 pages) regardless. Note `npm run a11y` must pass before any CSS change ships. |

### If I had to pick five things, in order

1. Wire `verifiedDate` through `<Base>` on all 38 page files and add the field to the blog content schema; source or delete the equivalence claims on `/`. (§6)
2. Add real screenshots — Make.com scenario, EMQ readout, the Sheet — to `/capi-shield/`, `/stocky-swap/`, `/replace-klaviyo-free/`. (§7)
3. Get the benchmark to N ≥ 10 and remove "Placeholder". (§7)
4. Anchor IDs on all H2/H3; footer-link `/sitemap-page/`; pre-render the EMQ estimator. (§8)
5. Backlinks. Nothing on this list beats it, and nothing else addresses cause #1.

**Stopping here as instructed. No files other than this one have been created or modified.**
