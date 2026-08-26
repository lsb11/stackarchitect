# EVIDENCE-NEEDED.md

**26 August 2026.** A shot list. Each row is one screenshot, where it goes, and the claim it substantiates.

## Why this exists

Across 59 indexable pages the site contains **two content images**: one product `.webp` and one SVG diagram, plus the author headshot repeated on 34 pages. Every assertion of first-hand operation is text asserting first-hand operation.

The component is already built and unused. `src/components/Evidence.astro` takes `src`, `alt`, `caption`, `capturedOn` and `source`, renders a proper `<figure>`/`<figcaption>`, and emits `ImageObject` (or `VideoObject`) schema crediting Luke Sandelands. Pass `videoSrc` + `poster` instead of `src` for a recording.

```astro
import Evidence from '../components/Evidence.astro';
import emqShot from '../assets/proof/emq-after-capi-shield.png';

<Evidence
  src={emqShot}
  alt="Meta Events Manager showing EMQ 7.2 on the Purchase event after CAPI Shield deploy"
  caption="Meta Events Manager, live store, 14 days after deploying CAPI Shield. EMQ on Purchase: 7.2/10."
  capturedOn="2026-08-30"
  source="Meta Events Manager"
/>
```

Assets go in `src/assets/proof/`. The component's own doc comment carries the rules and they are the point: **real UI only, no mockups or recreations; leave real timestamps and dates visible; blur only store names and PII; the caption states what tool, which store context, and when.**

## Priority 1 — pages where a claim was just removed

These pages had a number taken out during the 26 Aug claims sweep. Each now has a gap where a figure used to be, and a screenshot is what fills it *properly* — with something checkable rather than a restored assertion.

| # | Page | Removed claim | Artefact needed | Placement |
|---|---|---|---|---|
| 1 | `/capi-shield/` | "typically reaches EMQ scores of 7.0–8.5, compared to roughly 4.0–6.0 with Shopify's native CAPI" | **Meta Events Manager → Data Sources → your dataset → Purchase event, showing the Event Match Quality figure with the date range visible.** The single highest-value asset on this list. | Directly under the "Event Match Quality" H2, replacing the removed comparison |
| 2 | `/capi-shield/` | — | **Meta Events Manager → Purchase event → "Additional conversions reported" panel**, which is the metric the page tells readers to look at | Beside the paragraph that names that metric |
| 3 | `/tiktok-events-api-shopify/` | "EMQ scores of 6–8 in most Shopify stores" | **TikTok Events Manager showing the CompletePayment event received server-side**, event name column legible | Under the CompletePayment naming section — it also proves the naming point the page leads on |
| 4 | `/shopify-google-ads-conversion-tracking/` | "recovers 15–40% of lost conversions" (×11) | **Google Ads → Conversions → your Enhanced Conversions action showing status "Recording conversions"**, plus the diagnostics panel | Under the setup steps, where the recovery figure used to sit |
| 5 | `/blog/shopify-server-side-tracking-complete-setup-guide/` | "EMQ 7–8 is the realistic ceiling"; "stores at EMQ 8+ report 12–28% lower cost-per-purchase" | **The Make.com scenario canvas, all modules visible**, for the three-platform router the guide builds | Under the architecture diagram at the top |

## Priority 2 — core product pages, central claim unproven

| # | Page | Central claim | Artefact needed | Placement |
|---|---|---|---|---|
| 6 | `/stocky-swap/` | "logs every Shopify order to Google Sheets in real time", "deploys in 4 minutes" | **The actual Google Sheet with real order rows**, timestamps visible, store name blurred | Under "What you get", above the first CTA |
| 7 | `/stocky-swap/` | Setup takes 4 minutes | **Make.com scenario history panel showing successful runs with durations and timestamps** | Under the deploy steps |
| 8 | `/replace-klaviyo-free/` | Systeme.io free plan covers the automations described | **The Systeme.io automation builder showing a live abandoned-cart sequence**, plus the plan/contact-count indicator proving it is the free tier | Under the migration walkthrough |
| 9 | `/shopify-profit-loss-automation/` | "net profit within 60 seconds of payment" | **The live P&L Sheet with formulas visible**, and a Make.com run log timestamp next to the corresponding row | Under the formula explanation |
| 10 | `/autocrat-quota-fix/` | The quota fix works | **The Apps Script execution log showing the "Service invoked too many times" error, and a second showing clean runs after the fix.** A before/after pair is far stronger than either alone | Under the failure-mode section |

## Priority 3 — honest limitation, the thing vendors will not publish

Per the brief: the most credible content this site can add is where the free stack is *worse*. Each of these is a screenshot of a real failure, and they are cheap because you have almost certainly already hit them.

| # | Page | Artefact needed | What it proves |
|---|---|---|---|
| 11 | `/capi-shield/` | **Make.com "out of credits" / operations-exhausted state on the free tier** | The real ceiling of the free plan, in the vendor's own words |
| 12 | `/stocky-swap/` | **A Make.com scenario error — a failed webhook, a rate-limit, a malformed payload** | That the author has run this long enough to break it |
| 13 | `/make-com-shopify/` | **The Make.com free-plan limits page: 1,000 credits, 2 active scenarios** | Sources the constraint the whole site is built on |
| 14 | `/how-we-test/` | **The test store's Shopify admin — order volume and date range** | Substantiates "working configurations, built as published" sitewide, and every "tested" badge depends on it |

## Priority 4 — the benchmark

| # | Page | Artefact needed | Notes |
|---|---|---|---|
| 15 | `/shopify-ios-attribution-gap-benchmark/` | **Nothing photographic — this one needs data, not a screenshot.** It still contains "Placeholder" strings and publishes no N | Highest ceiling on the site: it is the only page where Stack Architect would be the source rather than a summariser. Blocked on submissions, not on you |

## Notes

- **One good EMQ readout (#1) is worth more than rows 6–14 combined.** It substantiates the claim the site was most exposed on, on the page most likely to be assessed, and it is the number that was removed from the homepage.
- Rows 1–5 are ordered so that shooting them in order retires the largest trust gaps first.
- If a screenshot cannot be taken because the thing does not exist or does not work as described, that is a finding, not a blocker — say so and the page copy should change to match.
