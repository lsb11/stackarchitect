# 2A Research Brief — Attribution Tools Comparison

**Purpose:** raw material for `/shopify-attribution-tools-compared/`. Researched externally because the four source pages are 88–93% identical and contain no per-vendor differentiation to extract.

**Research date:** 10 August 2026. All figures below are third-party reported and **must be re-verified against each vendor's own pricing page before publishing** — see §6.

---

## 1. The spine of the page — use this as the organising idea

**All four price on a different axis. That, not feature lists, is what determines cost.**

| Vendor | Priced on | Entry point |
|---|---|---|
| **Elevar** | Monthly **order volume** × number of **destinations** | ~$225/mo |
| **Triple Whale** | Store **GMV** | ~$129/mo |
| **Northbeam** | **Traffic / data volume** (pageviews), not revenue | ~$1,500/mo |
| **Analyzify** | **Flat annual fee**, capped by order volume | ~$749–945/yr |

The consequence, and the most useful thing the page can say: two stores with identical ad spend can receive quotes an order of magnitude apart depending on which axis they happen to sit high on. A high-traffic, low-AOV store is punished by Northbeam. A low-traffic, high-AOV store is punished by Triple Whale. A store sending to many ad platforms is punished by Elevar's destination count.

**Worked example to include — a store at 5,000 orders/month, ~$500k monthly GMV:**
- Elevar: ~$650/mo (10k order tier, 4 destinations)
- Triple Whale: $129–749/mo depending which features it actually needs
- Northbeam: ~$1,500/mo, and that's the bottom of their range
- Analyzify: ~$62–79/mo equivalent

---

## 2. Per-vendor facts

### ELEVAR

**Corporate:** Sold through **Audiense since July 2025**; the Shopify listing now reads "Elevar by Audiense". This is why `/elevar-audiense-what-happened/` exists — fold that content in here.

**Pricing (reported verified 27 Jul 2026 against the Audiense-hosted pricing page):**
- $225/mo — up to 2,000 orders, 2 destinations
- $650/mo — up to 10,000 orders, 4 destinations
- $1,250/mo — up to 30,000 orders, 10 destinations
- Tiers continue from $3,000

**Price conflict — must resolve before publishing.** A separate May 2026 source reports a different structure entirely: $200/1,000 orders, $450/10,000, $950/50,000, with per-order overages of $0.15 / $0.04 / $0.03. The Shopify App Store listing says from $225/mo. `apps.json` currently holds $225 verified 2026-08-08, consistent with the listing. **Resolve against the live vendor page and record which structure is current.**

**What is genuinely only Elevar's:** *Session Enrichment* — stitching events, sessions and channel attribution to recognise returning anonymous users and connect behaviour across separate visits. None of the other three do this. Also: a managed server-side GTM container, and a Chrome-extension no-code event builder for defining custom events without touching theme code.

**Positioning:** Shopify preferred checkout-extensibility partner; reported to power tracking for 6,500+ DTC brands. Rated 4.6 from 138 reviews on the App Store.

**Where it concretely falls short:**
- Built on server-side GTM, so there is a Google Cloud tagging server to provision and maintain
- Advanced tag configuration needs real GTM knowledge, or paid setup services
- **Destination count is a pricing lever** — adding ad platforms moves you up a tier, which is unusual and catches people out
- Reported communication gaps around breaking changes

**Suits:** stores where the tracking *pipeline* itself is the problem, with in-house or agency GTM capability, roughly $5k+/mo ad spend.

---

### TRIPLE WHALE

**Pricing:** GMV-tiered. Growth from **$129/mo**; **Professional $749/mo** is where full Media Mix Modelling and advanced BI unlock. A separate source cites $179/mo on annual billing for the dashboard tier.

**What is genuinely only Triple Whale's:** a Shopify-native first-party pixel combined with **post-purchase surveys** — asking the customer directly where they heard about you, then blending that with pixel data. It is an ecommerce operating dashboard with attribution inside it, not a tracking pipeline.

**Where it concretely falls short:**
- **The $129 tier excludes creative analytics, customer journey reporting, and survey-based features** — i.e. most of the reasons people buy it. This is the single most useful warning on the page.
- The "Total Impact" model has been criticised for over-counting: a customer who clicks a Meta ad then a Google search ad can have both channels credited in certain views, producing inflated confidence
- Gives **blended CAC, not per-channel CAC** — a real limitation against Northbeam

**Suits:** Shopify-first DTC operators who want one daily dashboard. Below roughly $30k/mo paid media, the free plan is the honest recommendation.

---

### NORTHBEAM

**Pricing:** Starter from **$1,500/mo**, scaling to roughly $2,500/mo. Annual contracts. **Priced on traffic and data volume, not revenue** — and it generally does not sell below ~$500k monthly GMV.

**Price conflict:** one source reports the floor at ~$1,000/mo rather than $1,500. Resolve before publishing.

**What is genuinely only Northbeam's:** the **Clicks + Deterministic Views** model — server-side ingestion plus multi-touch attribution that credits view-through deterministically rather than by inference, with MMM available on upper tiers. It reports **per-channel CAC**, which Triple Whale does not.

**Where it concretely falls short:**
- The price floor excludes most Shopify stores outright
- Analyst-led — the models need someone whose job is to use them; the depth is dead weight for a lean team
- Annual contract, no monthly escape
- Does not work as a Shopify-only stack the way the other three do

**Suits:** $10M+ annual revenue, multi-channel mixes that include TV, podcast or influencer, with an analyst on staff.

---

### ANALYZIFY

**Pricing:** **flat annual fee, $749–$945/year** — roughly $62–79/mo equivalent — with order-volume caps. Top tier covers up to 10,000 orders/month.

**Price conflict — significant.** `apps.json` currently records $145–$275, verified 2026-08-08, which does not reconcile with a $749–945 annual figure. Both may be true (monthly vs annual plans), but **this must be resolved before publishing**, and the page must be explicit about which billing basis it is quoting.

**What is genuinely only Analyzify's:** **done-for-you setup included at no extra cost** — managed onboarding, migration and professional implementation are bundled rather than sold as a service add-on. It is a service wrapped in an app. It also adds 10+ events and parameters GA4 doesn't get natively: collection views, coupon codes, variant IDs.

**Where it concretely falls short — this is the strongest original point available on this page:**
- The headline **99% purchase-tracking accuracy claim measures capture rate, not data quality.** It captures 99% of events; it does not filter what those events contain. Bot purchases, synthetic sessions and proxy traffic are all captured at 99% accuracy too. The figure is accurate about what it measures and misleading about what merchants assume it means.
- GA4-centric — if GA4 isn't your reporting layer, most of the value evaporates
- Commonly paired with Stape hosting, which can push true annual cost past $3,000

**Suits:** teams with no in-house analytics capability who want GA4 configured correctly once and then left alone. Reviewer base skews heavily small-business.

---

## 3. Comparison table — build from this

| | Elevar | Triple Whale | Northbeam | Analyzify |
|---|---|---|---|---|
| Priced on | Orders × destinations | GMV | Traffic volume | Flat annual, order-capped |
| Entry | ~$225/mo | ~$129/mo | ~$1,500/mo | ~$749/yr |
| Core job | Tracking pipeline | Operator dashboard | Measurement/modelling | Done-for-you GA4 |
| Unique capability | Session Enrichment | Post-purchase surveys | Deterministic views + per-channel CAC | Implementation included |
| CAC granularity | n/a (not a reporting tool) | Blended only | Per-channel | n/a |
| Infrastructure burden | sGTM container to maintain | None | None | None (often + Stape) |
| Practical floor | $5k/mo ad spend | Free under ~$30k/mo spend | ~$500k/mo GMV | Any size |

---

## 4. The CAPI Shield section

The honest framing: **three of these four are not really competing with CAPI Shield.** Northbeam and Triple Whale are measurement and reporting layers. Elevar and Analyzify are the two that overlap, because both are fundamentally about getting events reliably to Meta CAPI, GA4 and the rest.

So the section should say: if what you need is a dashboard or a media-mix model, none of this is what CAPI Shield does — buy Triple Whale or Northbeam. If what you need is events arriving reliably at the ad platforms, that is the overlap, and here is what the free route costs you in setup time versus what Elevar's $225–1,250/mo or Analyzify's annual fee buys you in convenience.

That framing is more credible than positioning against all four, and credibility is the entire point of the exercise.

---

## 5. Schema

`CollectionPage` + `ItemList` + per-vendor `SoftwareApplication`.

**Emit `Offer` only where `apps.json` has both `priceVerifiedDate` and `priceSourceUrl`.** Currently Elevar, Northbeam and Analyzify. Triple Whale gets a `SoftwareApplication` node with no `Offer`.

Do not put any third-party-reported figure from this brief into structured data. Structured data carries only what has been verified against the vendor's own page and recorded in `apps.json`.

---

## 6. Verification gate — do this before publishing

Three price conflicts are flagged above (Elevar structure, Northbeam floor, Analyzify billing basis). All figures here come from third-party comparison sites, which is exactly the sourcing standard `/how-we-test/` says the site doesn't accept.

**Before this page goes live:** open each vendor's own pricing page, confirm the current figures, and update `apps.json` with `priceVerifiedDate` and `priceSourceUrl`. Where a figure can't be confirmed on the vendor's own site, the page should say so plainly rather than quoting the third-party number as fact.

This is four vendor pages — twenty minutes — and it converts the page from a synthesis into the sourced comparison nobody else in the category publishes.
