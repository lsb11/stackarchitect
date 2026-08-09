# Consolidation Release v1 — "One Cut, Then Freeze"
**Target:** 88 indexable URLs → **58**, shipped as a single atomic release
**Then:** 60-day URL freeze. No new pages. No new redirects.

---

## The rule that governs this release

Everything below ships **in one deploy**. Not a wave per week. A site whose URL set changes every seven days never completes reassessment, because Google restarts the evaluation each time the structure moves. One decisive cut, then stillness, is strictly better than four careful ones.

If a task on this list isn't done by release day, **cut the task, not the release date**.

---

## 1. Final URL map

### 1.1 KEEP — substantial, no structural change (30)

| URL | Why it survives |
|---|---|
| `/` | 3,445w — primary entity page |
| `/capi-shield/` | 92KB flagship product page |
| `/stocky-swap/` | 110KB flagship product page |
| `/tiktok-events-api-shopify/` | Unique topic, no competitor coverage |
| `/replace-klaviyo-free/` | 2,220w — becomes the Klaviyo pillar (§1.3) |
| `/shopify-profit-loss-automation/` | 2,898w |
| `/autocrat-quota-fix/` | 3,291w |
| `/shopify-google-ads-conversion-tracking/` | 1,503w |
| `/shopify-google-sheets-automation/` | 2,653w |
| `/shopify-automation-guides/` | 4,507w — primary hub |
| `/tools/` | 1,959w — tools hub |
| `/apps/` | New comparison hub (shipped) |
| `/stack/` | 794w |
| `/pro/` | 2,546w — commercial |
| `/about/` | 1,185w — E-E-A-T anchor |
| `/how-we-test/` | 778w — methodology anchor |
| `/stocky-shutdown/` | 2,273w |
| `/shopify-ios-attribution-gap-benchmark/` | Flagship citable dataset |
| `/shopify-app-cost-calculator/` | 1,712w |
| `/shopify-app-development-cost/` | 2,111w |
| `/meta-emq-score-estimator/` | 1,527w |
| `/gorgias-shopify-guide/` | 3,672w |
| `/tidio-shopify-guide/` | 2,854w |
| `/make-com-shopify/` | Becomes the Make pillar (§1.3) |
| `/best-free-shopify-apps-2026/` | Becomes the app-cost pillar (§1.3) |
| `/best-ai-tools-shopify/` | Distinct topic |
| `/ultimate-shopify-automation-guide/` | Distinct topic |
| `/blog/shopify-server-side-tracking-complete-setup-guide/` | Core technical guide |
| `/blog/google-apps-script-quotas-explained.../` | Top impression-earner in GSC |
| `/blog/shopify-agentic-storefronts-setup-guide-2026/` | Forward-looking, uncontested |

### 1.2 KEEP — calculators (5)

`/shopify-vs-meta-attribution-gap-calculator/` · `/make-vs-zapier-cost-calculator/` · `/stocky-migration-risk-scorer/` · `/shopify-app-stack-kill-or-keep-auditor/` · `/klaviyo-to-systeme-migration-savings-calculator/`

All 678–819w. Each must gain a `WebApplication` node and a 40–60 word answer paragraph above the tool (see §3).

### 1.3 CONSOLIDATE — 5 new/rebuilt pillars

**A. `/shopify-attribution-tools-compared/` — NEW.** Absorbs six URLs currently 88–93% textually identical:

```
/elevar-alternative/            → 301
/triple-whale-alternative/      → 301
/northbeam-alternative/         → 301
/analyzify-alternative/         → 301
/shopify-tracking-tools-pricing/→ 301
/shopify-tracking-hub/          → 301
/elevar-audiense-what-happened/ → 301
```
Target 2,500w+. **Must be genuinely distinct per vendor** — real pricing tiers, what each does differently, who each suits, where each fails. If it reads as one template with names swapped, it reproduces the exact defect being fixed.

**B. `/stocky-alternative/` — REBUILT as the Stocky pillar.** Currently 173w. Absorbs:

```
/stocky-migration-hub/                                  → 301
/stocky-migration-checklist/                            → 301
/blog/stocky-vs-prediko/                        673w    → 301
/blog/stocky-vs-inventory-planner/              730w    → 301
/blog/what-happens-to-stocky-purchase-orders/   689w    → 301
/blog/replace-shopify-stocky-with-a-0-inventory-system/ 1,417w → 301
```
Merged source: ~3,500w. **Ship before 31 August** — the shutdown is the single best-timed traffic event of the quarter.

**C. `/replace-klaviyo-free/` — absorbs the Klaviyo cluster** (~4,534w of source):

```
/klaviyo-vs-systeme-io/                          130w  → 301
/blog/klaviyo-pricing-uk-2026/                 1,103w  → 301
/blog/klaviyo-vs-getresponse-shopify-2026/     1,094w  → 301
/blog/free-klaviyo-alternative-shopify-2026/   1,129w  → 301
```

**D. `/best-free-shopify-apps-2026/` — absorbs the app-cost cluster** (~3,338w):

```
/blog/how-much-shopify-apps-really-cost.../     1,112w → 301
/blog/shopify-apps-that-are-a-waste-of-money/   1,299w → 301
/blog/free-shopify-apps-replace-paid-2026/        927w → 301
```

**E. `/make-com-shopify/` — absorbs the Make cluster** (~3,562w):

```
/blog/make-com-shopify-automation-guide/        1,025w → 301
/shopify-flow-vs-make/                            382w → 301
/blog/zapier-vs-shopify-flow-vs-make/           1,193w → 301
```

### 1.4 REDIRECT — no merge needed (4)

```
/research/ios-attribution-gap-benchmark/  → /shopify-ios-attribution-gap-benchmark/
/shopify-app-pricing-index/               → /apps/
/app-audit/                               → /shopify-app-stack-kill-or-keep-auditor/
/shopify-automation-scanner/              → /shopify-app-stack-kill-or-keep-auditor/
```

### 1.5 NOINDEX (3)

`/privacy/` · `/terms/` · `/refund-policy/`

Currently indexable and sitting in the Crawled–not-indexed bucket, consuming assessment for zero possible search value. `noindex, follow` — they stay reachable and still function as trust signals; Google doesn't need them indexed to see them. Already excluded from the sitemap.

### 1.6 Remaining blog posts — keep (18)

All 1,200w+ and topically distinct. Do not touch them in this release.

### Net result

| | Before | After |
|---|---|---|
| Astro pages indexable | 54 | 37 |
| Blog posts indexable | 33 | 18 |
| App detail pages | 53 (noindexed) | 53 (noindexed) |
| **Total indexable** | **88** | **58** |
| New 301s added | — | 27 |

---

## 2. Nav and footer — mandatory, same release

**Five footer links point at pages that become 301s.** Sitewide internal links into redirected URLs waste every crawl and dilute the signal you're trying to concentrate. This is not cosmetic.

### 2.1 Footer — remove

```
/shopify-tracking-hub/        → replace with /shopify-attribution-tools-compared/
/shopify-flow-vs-make/        → replace with /make-com-shopify/
/shopify-app-pricing-index/   → replace with /apps/
/stocky-migration-checklist/  → remove (folded into /stocky-alternative/)
/stocky-alternative/          → keep (now the pillar)
/sitemap-page/                → remove (noindexed utility page)
```

### 2.2 Footer — add

`/how-we-test/` is already there — **promote it**. It currently has 2 inbound links sitewide and it substantiates every pricing claim you make. Give it its own labelled position, not a legal-row afterthought.

### 2.3 Nav — one change

Nav currently links `/`, `/about/`, `/apps/`, `/pro/`, `/shopify-automation-guides/`, `/stack/`, `/stocky-shutdown/`, `/tools/`. All survive. **After 31 August**, swap `/stocky-shutdown/` → `/stocky-alternative/` — the shutdown page goes retrospective, the alternative page stays evergreen.

### 2.4 Rule

Grep the whole `src/` tree for every 301'd path after the rewrite. **Zero internal links may point at a redirected URL.** Add this as a check in `seo-audit.mjs` so it can never regress.

---

## 3. Survivor quality pass — only these, only survivors

1. **Answer block.** Every one of the 58 opens with a self-contained, quotable 40–60 word answer to its target question. This is the unit an LLM lifts verbatim. Highest-value AI-citation change in the release.
2. **Titles ≤60 chars.** Drop the ` | Stack Architect` suffix wherever it pushes past 60. Brand recognition at DR 0 is worth nothing.
3. **Descriptions ≤160 chars.**
4. **Schema on the survivors that lack it:** `/tools/` and `/apps/` → `CollectionPage` + `ItemList`; `/how-we-test/` → `WebPage` + `about` → `#org`; the 5 calculators → `WebApplication`.
5. **Verify `BlogPost.astro` emits `Article`.** If not, all 18 surviving posts lack Article markup.

---

## 4. Ten-minute fixes — do them in this release

| Fix | File |
|---|---|
| `>` → `#` on the first 3 lines | `public/robots.txt` |
| `#organization` → `#org` (4 files) | `stocky-shutdown`, `stocky-swap`, `about`, `stocky-migration-checklist` |
| `"Luke"` → `"Luke Sandelands"` (4 files) | incl. `index.astro:174` |
| `logo_url` → `/icon-512.png`; `/terms` → `/terms/` | `public/.well-known/ai-plugin.json` |
| Correct the false sourcing sentence (§5) | `public/llms.txt` |
| Rewrite URL list to the 58 survivors | `public/llms.txt`, `llms-full.txt` |
| Add `SITEMAP_OPTIONAL` for the 3 legal pages | `seo-audit.mjs` |
| Delete unused `AppCard.astro` | `src/components/` |

---

## 5. The llms.txt correction

Current text asserts:

> *"Every technical and pricing claim is sourced against vendor pricing pages and platform documentation."*

**3 of 53 app prices carry a verification date. That is 5%.** Replace with:

> *"Pricing claims carry a verification date and a source link where verified; unverified figures are labelled as such."*

And gate `Offer` emission on `priceVerifiedDate` — no verified date, no structured-data price. A model that checks your claim against your own data currently finds you overstating, which is a worse citation outcome than publishing nothing.

---

## 6. Execution

All prompts live in **Appendix A** at the end of this document. Run them in
order, one per Claude Code session, committing after each.

## 7. Release day and freeze

**Ship, then immediately:**
1. Run `node scripts/indexnow.mjs` once — full sitemap.
2. GSC → Sitemaps → resubmit.
3. GSC → **Security & Manual Actions** → confirm clean.
4. Bing Webmaster Tools → verify domain, submit sitemap.
5. **Do not request individual URL indexing.** Re-requesting pages Google has already judged does nothing.

**Then freeze for 60 days.** Permitted during the freeze: pricing verification backlog (50 apps), the post-Stocky-shutdown content on the *existing* `/stocky-alternative/` URL, the `schema.ts` refactor, HARO, npm publish, GitHub cadence. **Not permitted:** new URLs, new redirects, structural changes.

**Watch:** `gsc-coverage.yml` runs Mondays and inspects every sitemap URL via the Inspection API. That is your instrument — survivors flipping to Indexed will show there before Search Console's UI catches up. Expect the "Crawled – not indexed" count to **rise** first as merged URLs get recrawled. That is the redirects being discovered, not failure.

---

## 8. What this release does not fix

Nothing here creates external authority. The sequence that actually resolves 176 is: **contract → reassess → external links arrive → indexation granted.** Steps one and two are this release. Step three is HARO, and it has the longest lead time of anything on your board.

If the freeze arrives and no links have landed, the freeze will look like it failed when in fact the third input was never supplied. Run the HARO pipeline in parallel starting now, pointed at the domain root and `/shopify-ios-attribution-gap-benchmark/` — not at blog posts.

---
---

# APPENDIX A — Complete prompt pack

**Goal, in priority order:** (1) full GSC indexation of 58 pages, (2) maximum AI citation, (3) rankings.

**How to use this:** one prompt per Claude Code session. Commit after each. Run `/clear` between sessions so context stays clean. All work happens on the `consolidation-v1` branch — nothing reaches production until you merge at the end.

**Escape hatches at any point:**
| Situation | Action |
|---|---|
| Claude heading the wrong way mid-response | `Esc` (not Ctrl+C) — it keeps work already done |
| Want to roll back several steps | `Esc Esc` on empty prompt, or `/rewind` → choose restore code / conversation / both |
| Running low on context mid-phase | `/rewind` → "Summarize from here" |
| Start the phase over cleanly | `git reset --hard` then `/clear` |
| Phase went badly, keep earlier phases | `git reset --hard HEAD~1` |

---

## PHASE 0 — Setup (terminal, no Claude Code)

```bash
cd /path/to/stackarchitect
git checkout -b consolidation-v1
mkdir -p docs
mv ~/Downloads/RUNBOOK-consolidation-v1.md docs/
git add docs/ && git commit -m "docs: consolidation release v1 runbook"
```

Then start Claude Code and run **Prompt 0**.

---

### PROMPT 0 — Establish context

```
Read docs/RUNBOOK-consolidation-v1.md in full.

Then create or append to CLAUDE.md in the repo root with this section:

## Active work: Consolidation Release v1
Spec: docs/RUNBOOK-consolidation-v1.md — read it before any structural change.

Context: 176 pages sit in GSC "Crawled – currently not indexed". The cause is a
site-level quality assessment: too many thin and near-duplicate URLs on a
low-authority domain. We are cutting 88 indexable URLs to 58 in ONE deploy,
then freezing the URL set for 60 days.

Hard rules on this branch:
- Merging content means DEDUPLICATING, never concatenating. A 4,500-word page
  assembled by stapling four 1,100-word posts together is still four thin pages.
- Never emit a schema.org Offer without both priceVerifiedDate and priceSourceUrl.
- Zero internal links may point at a path on the left-hand side of public/_redirects.
- Organization @id is always #org, never #organization.
- Person name is always "Luke Sandelands", never "Luke".
- Every indexable page opens with a self-contained 40–60 word answer paragraph.

Confirm you have read the runbook by listing the 5 consolidation clusters and the
final indexable page count. Then stop — do not make any other changes.
```

**Check before continuing:** it should list clusters A–E and say 58.

---

## PHASE 1 — Mechanical fixes (low risk, no content)

### PROMPT 1

```
Read docs/RUNBOOK-consolidation-v1.md.

Execute ONLY section §4 (ten-minute fixes) and §1.5 (noindex legal pages):

1. public/robots.txt — change the three leading ">" lines to "#". They are
   Markdown blockquote syntax and are invalid in robots.txt.
2. Replace "#organization" with "#org" everywhere. Affected files:
   stocky-shutdown.astro, stocky-swap.astro, about.astro, stocky-migration-checklist.astro
3. Replace '"name": "Luke"' with '"name": "Luke Sandelands"' everywhere,
   including index.astro line ~174. Add alternateName: "Luke" to the Person node.
4. public/.well-known/ai-plugin.json — logo_url currently points at
   StackArchitectUpdatedLogo.png which does not exist. Point it at
   https://stackarchitect.xyz/icon-512.png. Change legal_info_url from
   /terms to /terms/ (trailing slash).
5. public/llms.txt — replace the sentence "Every technical and pricing claim is
   sourced against vendor pricing pages and platform documentation." with
   "Pricing claims carry a verification date and a source link where verified;
   unverified figures are labelled as such." Only 3 of 53 app prices are
   currently verified, so the original sentence is false.
6. Add noindex={true} to /privacy/, /terms/, /refund-policy/ and add them to
   NOINDEX_OK in seo-audit.mjs.
7. Add a SITEMAP_OPTIONAL list in seo-audit.mjs for those three pages so the
   "built page missing from sitemap" warnings stop firing.
8. Delete src/components/AppCard.astro — it is now unused.

Do NOT touch content, redirects, nav or footer yet.
Run `npm run build && npm run seo:audit`, confirm exit 0, then stop.
```

**Check:** `curl -s localhost:4321/robots.txt | head -3` shows `#` not `>`. Then commit:
```bash
git commit -am "fix: entity consistency, robots syntax, legal noindex, llms.txt accuracy"
```

---

## PHASE 2 — The five content merges

Run these **one at a time**, in this order. Each is a separate session with `/clear` between.

### PROMPT 2A — Attribution pillar (the hard one)

```
Read docs/RUNBOOK-consolidation-v1.md §1.3 item A.

Create a new page at src/pages/shopify-attribution-tools-compared.astro.

This replaces six pages that are currently 88–93% textually identical to each
other — elevar-alternative, triple-whale-alternative, northbeam-alternative,
analyzify-alternative, shopify-tracking-tools-pricing, shopify-tracking-hub,
plus elevar-audiense-what-happened.

CRITICAL: the failure mode here is writing one template with vendor names
swapped. That reproduces the exact defect we are fixing. Each vendor section
must contain facts that are true only of that vendor.

For each of Elevar, Triple Whale, Northbeam and Analyzify write a distinct
section covering:
- Actual pricing tiers and what triggers a jump between them
- The specific technical capability that differentiates it (not generic
  "server-side tracking" — what does THIS tool do that the others don't)
- The store profile it genuinely suits
- Where it concretely falls short

Then add:
- One comparison table across all four
- A section: "When the free CAPI Shield route is the better call" linking
  to /capi-shield/
- A 40–60 word answer paragraph at the very top, self-contained and quotable

Target 2,500+ words of real prose.

Schema: CollectionPage + ItemList + per-vendor SoftwareApplication. Emit Offer
ONLY where src/data/apps.json has both priceVerifiedDate and priceSourceUrl for
that vendor. Currently that is Elevar, Northbeam and Analyzify only — Triple
Whale gets no Offer node.

Title ≤60 chars. Description ≤160 chars.

Do NOT add redirects or delete the old pages yet.
Show me your section outline before writing the full page.
```

**Check yourself — this is the one to read manually.** Do the four vendor sections say genuinely different things? If not, push back before moving on.

```bash
git commit -am "feat: attribution tools comparison pillar"
```

### PROMPT 2B — Stocky pillar (deadline-critical)

```
Read docs/RUNBOOK-consolidation-v1.md §1.3 item B.

Rebuild src/pages/stocky-alternative.astro as the Stocky pillar. It is currently
173 words. Merge the substantive content from these six sources, deduplicating
rather than concatenating:

- src/pages/stocky-migration-hub.astro
- src/pages/stocky-migration-checklist.astro
- src/content/blog/stocky-vs-prediko.md (673w)
- src/content/blog/stocky-vs-inventory-planner.md (730w)
- src/content/blog/what-happens-to-stocky-purchase-orders.md (689w)
- src/content/blog/replace-shopify-stocky-with-a-0-inventory-system.md (1,417w)

Structure it so it stays useful AFTER the 31 August 2026 shutdown — this page
must not read as retrospective on 1 September. Include a clear "you did not
export in time" path alongside the migration path.

Target 3,000+ words. 40–60 word answer paragraph at the top.
Schema: Article + FAQPage + HowTo, author = #luke, publisher = #org.
Title ≤60 chars. Description ≤160 chars.

Do NOT add redirects or delete sources yet.
```

```bash
git commit -am "feat: Stocky pillar consolidation"
```

### PROMPT 2C — Klaviyo cluster

```
Read docs/RUNBOOK-consolidation-v1.md §1.3 item C.

Expand src/pages/replace-klaviyo-free.astro (currently 2,220w) by merging the
substantive content from:

- src/pages/klaviyo-vs-systeme-io.astro (130w)
- src/content/blog/klaviyo-pricing-uk-2026.md (1,103w)
- src/content/blog/klaviyo-vs-getresponse-shopify-2026.md (1,094w)
- src/content/blog/free-klaviyo-alternative-shopify-2026.md (1,129w)

Deduplicate, do not concatenate. The merged page should cover: Klaviyo's real
pricing including the Feb 2025 active-profile billing change, UK-specific
pricing, the Systeme.io alternative, the GetResponse alternative, and the
migration path.

40–60 word answer paragraph at top. Title ≤60 chars. Description ≤160 chars.
Do NOT add redirects or delete sources yet.
```

```bash
git commit -am "feat: Klaviyo cluster consolidation"
```

### PROMPT 2D — App-cost cluster

```
Read docs/RUNBOOK-consolidation-v1.md §1.3 item D.

Expand src/pages/best-free-shopify-apps-2026.astro by merging the substantive
content from:

- src/content/blog/how-much-shopify-apps-really-cost-and-how-to-cut-your-app-bill-in-half.md (1,112w)
- src/content/blog/shopify-apps-that-are-a-waste-of-money.md (1,299w)
- src/content/blog/free-shopify-apps-replace-paid-2026.md (927w)

Deduplicate, do not concatenate. Cross-link to /apps/ and
/shopify-app-cost-calculator/ rather than duplicating their content.

40–60 word answer paragraph at top. Title ≤60 chars. Description ≤160 chars.
Do NOT add redirects or delete sources yet.
```

```bash
git commit -am "feat: app-cost cluster consolidation"
```

### PROMPT 2E — Make cluster

```
Read docs/RUNBOOK-consolidation-v1.md §1.3 item E.

Expand src/pages/make-com-shopify.astro (currently 1,130w) by merging the
substantive content from:

- src/content/blog/make-com-shopify-automation-guide.md (1,025w)
- src/pages/shopify-flow-vs-make.astro (382w)
- src/content/blog/zapier-vs-shopify-flow-vs-make.md (1,193w)

Deduplicate, do not concatenate. The merged page covers: what Make.com does for
Shopify, free-tier limits, Make vs Zapier vs Shopify Flow, and when to upgrade.
Cross-link to /make-vs-zapier-cost-calculator/.

40–60 word answer paragraph at top. Title ≤60 chars. Description ≤160 chars.
Do NOT add redirects or delete sources yet.
```

```bash
git commit -am "feat: Make cluster consolidation"
```

---

## PHASE 3 — Redirects, deletions, nav and footer

### PROMPT 3

```
Read docs/RUNBOOK-consolidation-v1.md §1.3, §1.4 and §2.

1. Add all 27 redirects to public/_redirects. Both slash variants for each.
   They MUST be placed before the /faq/* wildcard and before the
   /tools/:slug placeholder rules at the bottom of the file, because first
   match wins.

   Cluster A -> /shopify-attribution-tools-compared/:
     /elevar-alternative/, /triple-whale-alternative/, /northbeam-alternative/,
     /analyzify-alternative/, /shopify-tracking-tools-pricing/,
     /shopify-tracking-hub/, /elevar-audiense-what-happened/

   Cluster B -> /stocky-alternative/:
     /stocky-migration-hub/, /stocky-migration-checklist/,
     /blog/stocky-vs-prediko/, /blog/stocky-vs-inventory-planner/,
     /blog/what-happens-to-stocky-purchase-orders/,
     /blog/replace-shopify-stocky-with-a-0-inventory-system/

   Cluster C -> /replace-klaviyo-free/:
     /klaviyo-vs-systeme-io/, /blog/klaviyo-pricing-uk-2026/,
     /blog/klaviyo-vs-getresponse-shopify-2026/,
     /blog/free-klaviyo-alternative-shopify-2026/

   Cluster D -> /best-free-shopify-apps-2026/:
     /blog/how-much-shopify-apps-really-cost-and-how-to-cut-your-app-bill-in-half/,
     /blog/shopify-apps-that-are-a-waste-of-money/,
     /blog/free-shopify-apps-replace-paid-2026/

   Cluster E -> /make-com-shopify/:
     /blog/make-com-shopify-automation-guide/, /shopify-flow-vs-make/,
     /blog/zapier-vs-shopify-flow-vs-make/

   Standalone:
     /research/ios-attribution-gap-benchmark/ -> /shopify-ios-attribution-gap-benchmark/
     /shopify-app-pricing-index/ -> /apps/
     /app-audit/ -> /shopify-app-stack-kill-or-keep-auditor/
     /shopify-automation-scanner/ -> /shopify-app-stack-kill-or-keep-auditor/

2. Delete every source .astro and .md file that was merged above.

3. Rewrite src/components/Footer.astro:
   - Remove links to /shopify-tracking-hub/, /shopify-flow-vs-make/,
     /shopify-app-pricing-index/, /stocky-migration-checklist/, /sitemap-page/
   - Add /shopify-attribution-tools-compared/
   - Keep /stocky-alternative/ (now the pillar)
   - Promote /how-we-test/ to its own labelled position, not in the legal row.
     It currently has only 2 inbound links sitewide and it substantiates every
     pricing claim on the site.

4. src/components/Nav.astro: no changes needed now. Add a code comment noting
   that after 31 August 2026, /stocky-shutdown/ should be swapped for
   /stocky-alternative/.

5. Grep ALL of src/ and fix every internal link pointing at any path now on the
   left-hand side of _redirects.

6. Add a check to seo-audit.mjs that fails the build if any internal href in the
   built output matches a left-hand side in public/_redirects.

Run `npm run build && npm run seo:audit`. Report the sitemap URL count.
```

**Check:** sitemap should be at or near 58.

```bash
git commit -am "refactor: 27 redirects, source deletion, nav and footer rewrite"
```

---

## PHASE 4 — Survivor quality pass (the AI-citation phase)

### PROMPT 4

```
Read docs/RUNBOOK-consolidation-v1.md §3.

Apply the survivor quality pass to every page in the built sitemap:

1. ANSWER BLOCKS — highest priority. Every indexable page must open with a
   self-contained 40–60 word paragraph that directly answers the page's target
   question. It must make sense quoted in isolation with no surrounding context,
   because that is the unit an LLM lifts verbatim. Wrap each in
   <p id="answer"> so it is addressable. Report which pages already had one and
   which you added.

2. Titles ≤60 characters. Drop the " | Stack Architect" suffix wherever it
   pushes past 60. Known offenders were the competitor-alternative pages, most
   of which no longer exist.

3. Descriptions ≤160 characters.

4. Schema gaps on survivors:
   - /tools/ -> CollectionPage + ItemList
   - /how-we-test/ -> WebPage with about pointing at #org
   - /shopify-vs-meta-attribution-gap-calculator/,
     /make-vs-zapier-cost-calculator/, /stocky-migration-risk-scorer/,
     /shopify-app-stack-kill-or-keep-auditor/,
     /klaviyo-to-systeme-migration-savings-calculator/ -> WebApplication

5. Verify src/layouts/BlogPost.astro emits Article schema. If it does not, add
   it — otherwise all 18 surviving blog posts have no Article markup.

6. Rewrite public/llms.txt and public/llms-full.txt so every URL listed exists
   in the final sitemap. Remove all links to consolidated pages, add
   /shopify-attribution-tools-compared/.

Run `npm run build && npm run seo:audit`.
```

```bash
git commit -am "feat: answer blocks, schema gaps, metadata limits, llms.txt refresh"
```

---

## PHASE 5 — Final verification before merge

### PROMPT 5

```
Final pre-merge verification. Build the site, then check and report each of
these as PASS or FAIL with evidence:

1. Sitemap contains exactly the intended survivor set. List the count and any
   URL you did not expect.
2. Zero internal links in the built output point at a path that appears on the
   left-hand side of public/_redirects.
3. No redirect chain exceeds one hop. Trace every new redirect through
   functions/_middleware.js AND public/_redirects together — middleware runs
   first and normalises host, protocol and trailing slash.
4. The /tools/:slug and /faq/* wildcard rules are still last in _redirects.
5. Every JSON-LD block on every page parses as valid JSON.
6. Organization @id is #org everywhere; zero occurrences of #organization.
7. Person name is "Luke Sandelands" everywhere; zero bare "Luke" as a name value.
8. No schema.org Offer exists without both a price and a source URL.
9. Every page in the sitemap has an answer paragraph.
10. No page in the sitemap has a title over 60 chars or description over 160.
11. npm run seo:audit exits 0.

Do not fix anything yet — report first.
```

Then fix whatever failed, and merge:

```bash
git checkout main
git merge consolidation-v1
git push
```

---

## PHASE 6 — Release day (terminal + browser, no Claude Code)

1. Confirm the Cloudflare Pages deploy succeeded.
2. Spot-check five redirects in a browser — each should be a single 301.
3. `node scripts/indexnow.mjs` — once, full sitemap.
4. GSC → Sitemaps → resubmit `sitemap-index.xml`.
5. GSC → **Security & Manual Actions** → confirm clean. Do this even though it
   is probably fine; if there is a manual action, everything else changes.
6. Bing Webmaster Tools → verify domain, submit sitemap. This matters more than
   it looks: ChatGPT's retrieval layer leans heavily on Bing's index, so Bing
   indexation is the shortest path to AI citation.
7. **Do not request individual URL indexing.** Re-requesting pages Google has
   already judged achieves nothing.

---

## PHASE 7 — During the 60-day freeze

**Permitted.** No new URLs, no new redirects, no structural change.

### PROMPT 7A — Pricing verification (do this first, it is the differentiator)

```
Read src/data/apps.json. Only 3 of 53 apps have a priceVerifiedDate. Work
through the unverified 50: visit each vendor's official pricing page, record
the real entry-level monthly price, and populate monthlyCost,
priceVerifiedDate (today's date) and priceSourceUrl (the exact vendor pricing
URL, not a comparison site).

Rules:
- Vendor's own pricing page only. Never a review site or aggregator.
- If a price cannot be confirmed on the vendor's site, leave priceVerifiedDate
  null and flag it in your summary. Do not guess.
- Update scripts/pricing-audit.mjs to fail the build when any app lacks a
  priceVerifiedDate, so the backlog can never reopen.

Once all 53 are verified, re-enable Offer emission for every app on /apps/.
```

This turns 53 dated, sourced vendor prices into an asset no competitor has and no model can synthesise. It is the single strongest AI-citation play available to the site.

### PROMPT 7B — Centralised entity graph

```
Build src/lib/schema.ts exporting one canonical Organization node
(@id: https://stackarchitect.xyz/#org), one Person node
(@id: .../#luke, name "Luke Sandelands", alternateName "Luke"), one WebSite
node, and typed helpers: articleSchema(), softwareAppSchema(), faqSchema(),
howToSchema(), breadcrumbSchema(), datasetSchema().

Refactor every page to import and compose from it rather than hand-writing
JSON-LD. Do not change any rendered visual output or any URL. Validate every
emitted graph parses as valid JSON-LD before finishing.
```

### PROMPT 7C — Post-Stocky-shutdown content

Before 31 August, on the **existing** `/stocky-alternative/` URL — no new page:

```
Shopify Stocky shuts down on 31 August 2026. Update /stocky-alternative/ so it
reads correctly on 1 September without any further edit. Add a section for
merchants who did NOT export in time: what is recoverable, what is permanently
gone, and what to do next. Check the whole site for countdown components and
date-relative language that will break after the deadline, and fix them.
Do not create a new URL.
```

### Also permitted during the freeze

- HARO / digital PR — **the highest-leverage activity on the board.** Point links
  at the domain root and `/shopify-ios-attribution-gap-benchmark/`, not blog posts.
- Publish `shopify-capi-validator` to npm (llms.txt already claims it is there).
- GitHub commit cadence on both public repos.
- Substantive Reddit participation in r/shopify and r/PPC.
- Collecting real submissions for the attribution gap benchmark via the existing
  D1 endpoint. Getting to n≥50 real stores turns a synthesis into primary data.

---

## What success looks like

Watch `gsc-coverage.yml` (runs Mondays, inspects every sitemap URL via the
Inspection API). It will show survivors flipping to Indexed before Search
Console's UI catches up.

**Expect "Crawled – currently not indexed" to RISE first** as the 27 merged URLs
get recrawled and discovered as redirects. That is the mechanism working, not
failing. The number to watch is how many of the 58 survivors are indexed, not
the total in the bucket.

If 60 days pass and nothing has moved, the missing input is almost certainly
external authority, not on-site work. That is what the HARO pipeline is for, and
it is the reason to start it now rather than after.
