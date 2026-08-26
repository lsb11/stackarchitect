# DIAGNOSIS.md

**26 August 2026.** What was tested, what was found, what was ruled out — with the measurement behind each ruling.

**Read this before proposing on-page work to fix indexing.** Five hypotheses have been measured and falsified. They are recorded here so the next person — including the person who wrote them — does not spend another five rounds re-testing them.

## The question

Google indexes **1 page out of 59 indexable**. 236 not indexed, of which 177 are "Crawled – currently not indexed", attributed to *Google systems*. Bing is also flat: 5 clicks and 129 impressions in 180 days, with 53 consecutive zero-impression days to 21 Aug.

## Ruled out

| Hypothesis | Test | Result |
|---|---|---|
| **Thin content / boilerplate ratio** | 8-word shingle analysis, all 59 indexable pages; boilerplate = shingles on ≥50% of pages | **Rejected.** Worst page **63% unique**, median 80%. Flag threshold was 40%. Shortest page 850 words; 49 of 59 over 1,500 |
| **Cannibalisation** | Pairwise containment of non-boilerplate shingles, all 1,711 page pairs | **Rejected.** Max overlap between any two pages **16.1%**. Two pairs over 15%, none over 25%. Real cannibalisation runs 40–70% |
| **Migration integrity** | Rebuilt the rule set from git, walked all rules for chains/loops/dead targets, verified against production with `curl` | **Rejected.** **250 rules, 0 chains, 0 loops, 0 duplicate LHS, 0 homepage dumps**, all targets resolving |
| **Schema validity** | Parsed every JSON-LD block in `dist/` | **Clean across 120 pages.** Zero invalid blocks, zero duplicate titles or descriptions, one H1 per page, all canonicals self-referencing |
| **Document weight** | Raw / gzip / brotli for five templates | **Rejected.** **19–32 KB brotli.** Verbose markup compresses ~6:1; parse time cannot explain a slow FCP |
| **Core Web Vitals** | Attempted CrUX via PSI; checked GSC prerequisites | **No field data exists.** ~5 clicks/180 days is below CrUX's sampling threshold. **Workstream closed** — see `AUDIT.md` §9 |

Also measured and clean: commercial density (median **0.7** `/go/*` links per 1,000 unique words), crawlability, robots.txt, sitemap chain, internal links (zero broken, zero pointing at a redirect LHS).

**One caveat that keeps the cannibalisation result honest.** Shingle overlap measures *text* duplication, not *query* competition. Two pages at 16% textual overlap can still compete for one SERP. Near-duplicate content is falsified; intent overlap is a separate question that `dist/` cannot answer and remains open pending query-level GSC data.

## Real defects found and fixed

| Defect | Evidence | Status |
|---|---|---|
| **Unsupported equivalence claims** | The one indexed page asserted "identical Event Match Quality scores (7–8.5)" against Elevar at $225/mo, with no test behind it. Plus "in most Shopify deployments", an unsourced "15–40%", and "12–28% lower cost-per-purchase" | **Fixed.** ~70 occurrences removed across 13 files, two SVG diagrams and multiple JSON-LD blocks |
| **Claims plumbing** | 2,662 of 2,796 price claims undated. Blog frontmatter had **no `verifiedDate` field**, so posts could not carry one; only 3 of 38 pages passed it | **Fixed structurally.** Schema field added, `PriceClaim` component, build fails on undated third-party prices |
| **Schema/page drift** | "EMQ 6–8" survived in JSON-LD after removal from prose — invisible to readers, visible to Google | **Fixed.** `schema-visible-guard` fails the build on any numeric claim in JSON-LD absent from the page. Quarantine now empty |
| **Duplicate font loading** | 13 pages loaded a `fonts.googleapis.com` stylesheet for Inter and JetBrains Mono — already self-hosted — pulling **78 KB** of duplicate fonts | **Fixed** |
| **Lost redirect variants** | Two no-slash rules dropped in the 15 Jul rule collapse (186 → 18), resolving in 2 hops | **Fixed** |
| **Orphaned HTML sitemap** | `/sitemap-page/` has zero inbound links and is absent from the sitemap | **Open** — trivial |
| **Missing `<main>` landmark** | 7 indexable pages emit no `<main>` | **Open** |
| **Unlinkable headings** | 28 pages have H2/H3 with no `id`, including **46 of 46** on the 8,016-word tracking guide | **Open** — blocks passage-level citation |

## Real gaps, not yet closed

**Claims integrity.** 48 files still carry **1,210 undated price claims**, quarantined and ranked in `CLAIMS-BURNDOWN.md`: 23 indexed files with heavy comparison against named products (941 claims) lead the list. The build cannot regress — new offenders fail it — but the backlog is human work. Prices must not be machine-read; vendor pages are geo- and cohort-varied, and a fetched price recorded as human-verified reintroduces the whole problem.

**Evidence.** Across 59 indexable pages the site holds **two content images**. There is not one screenshot of a Make.com scenario, an Events Manager EMQ readout, or a Sheet. Every claim of first-hand operation is text asserting first-hand operation. `EVIDENCE-NEEDED.md` specifies 15 artefacts; `Evidence.astro` was already built and unused. Awaiting capture.

**The benchmark.** `/shopify-ios-attribution-gap-benchmark/` still contains "Placeholder" and publishes no N. It is the only page where this site would be the source rather than a summariser.

## Conclusion

**The codebase is not what is suppressing indexing.**

Every on-page hypothesis that could be tested locally has been tested and rejected. Content is long and substantially unique, pages do not duplicate each other, redirects resolve cleanly, schema is valid across 120 pages, documents are light, and page experience cannot be the cause on a site with no measurable users. What was genuinely wrong — unsupported claims — has been fixed and is now enforced by two build-time guards that make regression impossible rather than unlikely.

The remaining candidates are **the link profile and domain age**, and neither lives in this repository. DR 4.1 / DA 6 on a domain that was DR 0 until recently, four months old, carrying a migration that ran without redirects from 10 April to 23 July. Impressions went **11,470 in April to 12 in May**, last day above 1,000 on **9 April** — the eve of that migration. Both engines went quiet afterwards, Google at once and Bing by July. A site-level reassessment that began in April is the best-supported explanation on the evidence available, and the inputs that would resolve it are external corroboration and time.

The right next moves are off-repo: backlinks, and the query-level GSC data that would settle the open intent-overlap question. The on-page work still worth doing — the claims burn-down and the evidence capture — is not a ranking lever. It is what makes the site worth citing once something else brings people to it.
