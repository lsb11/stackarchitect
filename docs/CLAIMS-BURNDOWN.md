# CLAIMS-BURNDOWN.md

**Generated 2026-08-26 by `npm run claims:burndown`. Do not edit by hand.**

Verification order for the quarantined price claims. Work top-down.

**How to clear a row.** Open each vendor's own pricing page, read the figure, and pass the date you read it as `verifiedDate` to `<Base>` (pages) or in frontmatter (posts). Use `<PriceClaim>` for prices in prose. Then remove the file from `docs/claims-unverified.json` — the build fails if you forget, and fails again if you remove a row that still has undated claims.

**Do not machine-read these prices.** Vendor pricing pages vary by geography and cohort, and a fetched price recorded as human-verified reintroduces exactly what the ratchet prevents.

| Tier | Files | Claims |
|---|---|---|
| A — indexed, heavy comparison | 23 | 939 |
| B — indexed, some comparison | 20 | 266 |
| C — indexed, no named vendor | 2 | 2 |
| D — not indexed | 3 | 3 |

## Tier A — indexed, heavy comparison

| # | Page | Claims | Named products compared |
|---|---|---|---|
| 1 | `/best-free-shopify-apps-2026/` | 112 | Elevar, Triple Whale, Northbeam, Klaviyo, Stape, Littledata, +14 |
| 2 | `/shopify-app-cost-calculator/` | 94 | Elevar, Triple Whale, Northbeam, Klaviyo, Analyzify, Gorgias, +10 |
| 3 | `/blog/the-lean-shopify-tech-stack-2026/` | 50 | Elevar, Triple Whale, Northbeam, Klaviyo, Analyzify, WeltPixel, +10 |
| 4 | `/` | 54 | Elevar, Triple Whale, Northbeam, Klaviyo, Stape, Littledata, +8 |
| 5 | `/shopify-automation-guides/` | 28 | Elevar, Triple Whale, Northbeam, Klaviyo, Stape, Littledata, +7 |
| 6 | `/stack/` | 22 | Elevar, Triple Whale, Northbeam, Klaviyo, Analyzify, WeltPixel, +7 |
| 7 | `/pro/` | 60 | Elevar, Triple Whale, Northbeam, Klaviyo, Stape, Littledata, +5 |
| 8 | `/shopify-app-stack-kill-or-keep-auditor/` | 20 | Elevar, Triple Whale, Northbeam, Klaviyo, Tidio, Stocky, +5 |
| 9 | `/replace-klaviyo-free/` | 68 | Elevar, Triple Whale, Northbeam, Klaviyo, Analyzify, WeltPixel, +4 |
| 10 | `/ultimate-shopify-automation-guide/` | 32 | Elevar, Triple Whale, Northbeam, Klaviyo, Analyzify, Gorgias, +4 |
| 11 | `/best-ai-tools-shopify/` | 77 | Elevar, Triple Whale, Northbeam, Klaviyo, Analyzify, Gorgias, +3 |
| 12 | `/tools/` | 24 | Elevar, Triple Whale, Northbeam, Klaviyo, Gorgias, Tidio, +3 |
| 13 | `/make-com-shopify/` | 16 | Elevar, Triple Whale, Klaviyo, Stape, Littledata, Analyzify, +3 |
| 14 | `/shopify-profit-loss-automation/` | 58 | Elevar, Triple Whale, Northbeam, Klaviyo, Analyzify, Gorgias, +2 |
| 15 | `/shopify-google-ads-conversion-tracking/` | 21 | Elevar, Triple Whale, Northbeam, Klaviyo, Stape, Littledata, +2 |
| 16 | `/autocrat-quota-fix/` | 8 | Elevar, Triple Whale, Northbeam, Klaviyo, Analyzify, WeltPixel, +2 |
| 17 | `/tiktok-events-api-shopify/` | 25 | Elevar, Triple Whale, Northbeam, Klaviyo, Analyzify, WeltPixel, +1 |
| 18 | `/blog/tidio-vs-gorgias-shopify/` | 51 | Elevar, Triple Whale, Gorgias, Tidio, Zendesk, Stocky |
| 19 | `/capi-shield/` | 22 | Elevar, Triple Whale, Northbeam, Klaviyo, Analyzify, Stocky |
| 20 | `/about/` | 10 | Elevar, Triple Whale, Klaviyo, Gorgias, Tidio, Stocky |
| 21 | `/how-we-test/` | 1 | Elevar, Triple Whale, Klaviyo, Stape, Littledata, Stocky |
| 22 | `/stocky-swap/` | 61 | Klaviyo, Stocky, Inventory Planner, Prediko, Qoblex |
| 23 | `/stocky-alternative/` | 25 | Stocky, Inventory Planner, Prediko, Katana, Qoblex |

## Tier B — indexed, some comparison

| # | Page | Claims | Named products compared |
|---|---|---|---|
| 1 | `/blog/how-to-fix-shopify-google-ads-conversion-tracking-2026/` | 5 | Stape, Littledata, Analyzify, Stocky |
| 2 | `/gorgias-shopify-guide/` | 98 | Gorgias, Tidio, Zendesk |
| 3 | `/blog/when-to-upgrade-free-make-google-workspace/` | 23 | Tidio, Stocky, Zapier |
| 4 | `/stocky-shutdown/` | 4 | Stocky, Inventory Planner, Prediko |
| 5 | `/blog/shopify-ai-playbook-2026/` | 3 | Klaviyo, Tidio, Stocky |
| 6 | `/blog/shopify-stocky-data-export-before-shutdown/` | 2 | Stocky, Inventory Planner, Prediko |
| 7 | `/tidio-shopify-guide/` | 88 | Gorgias, Tidio |
| 8 | `/blog/shopify-automation-stack-for-small-stores/` | 9 | Tidio, Stocky |
| 9 | `/klaviyo-to-systeme-migration-savings-calculator/` | 8 | Klaviyo, Zapier |
| 10 | `/blog/shopify-bfcm-automation-checklist-2026/` | 4 | Klaviyo, Stocky |
| 11 | `/blog/shopify-conversion-rate-optimisation-free-2026/` | 2 | Tidio, Stocky |
| 12 | `/blog/shopify-email-marketing-free-2026/` | 6 | Klaviyo |
| 13 | `/blog/the-ultimate-guide-to-shopify-inventory-management/` | 4 | Stocky |
| 14 | `/blog/scalable-google-sheets-automation-for-high-volume-workflows/` | 3 | Stocky |
| 15 | `/make-vs-zapier-cost-calculator/` | 2 | Zapier |
| 16 | `/stocky-migration-risk-scorer/` | 1 | Stocky |
| 17 | `/blog/meta-one-click-conversions-api-shopify/` | 1 | Stape |
| 18 | `/blog/recover-lost-shopify-conversions-capi-shield/` | 1 | Stocky |
| 19 | `/blog/shopify-google-analytics-4-setup-free-2026/` | 1 | Stocky |
| 20 | `/blog/shopify-meta-roas-dropped-2026-fix/` | 1 | Stocky |

## Tier C — indexed, no named vendor

| # | Page | Claims | Named products compared |
|---|---|---|---|
| 1 | `/shopify-ios-attribution-gap-benchmark/` | 1 | — |
| 2 | `/blog/how-to-fix-service-invoked-too-many-times-in-google-apps-script/` | 1 | — |

## Tier D — not indexed

| # | Page | Claims | Named products compared |
|---|---|---|---|
| 1 | `/privacy/` | 1 | Gorgias, Tidio |
| 2 | `/refund-policy/` | 1 | — |
| 3 | `/terms/` | 1 | — |

## Why this order

An undated price is only a live liability if the page can be indexed, so sitemap membership leads. Within that, a page comparing itself to a named commercial product on price is asserting something about a third party that a reader can check in one click and a rater will check first — those rank above pages that merely mention costs. Claim volume only breaks ties: 50 undated figures on a page nobody can reach matter less than three on a page that ranks.

Total: **48 files**, **1210 claims**, of which **45 files** are in the sitemap.
