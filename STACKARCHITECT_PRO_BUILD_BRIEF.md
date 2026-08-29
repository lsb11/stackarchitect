# Stack Architect — /pro/ rebuild + product unbundling

Implementation brief. Hand this to Claude Code in the repo root.
Repo: `lsb11/stackarchitect` · Primary file: `src/pages/pro.astro` (1452 lines)

---

## 0. Goals, in priority order

1. Capture the single-problem buyer who currently bounces (unbundle to $9.99 units).
2. Remove the claims that talk visitors out of buying, and the ones that are factually wrong.
3. Make the page survive 31 Aug 2026 without going stale.
4. Instrument every CTA so the next iteration is evidence-based, not guesswork.
5. Cut page length ~40% while adding proof.

---

## 1. Single source of truth — create `src/data/products.ts`

Everything downstream reads from this. No hardcoded prices or Stripe URLs anywhere else.

```ts
export const KIT_PRICE = 24;          // alt: 29 — one-line change
export const SINGLE_PRICE = 9.99;

export interface Product {
  slug: string;
  name: string;
  blueprint: string;        // "Blueprint 03"
  tagline: string;
  problem: string;          // the question the buyer is asking
  files: string[];
  replaces: { name: string; price: string }[];
  savingRange: string;
  guideUrl: string;
  stripeUrl: string;
  accent: 'green' | 'sky' | 'tiktok' | 'amber';
  deployTime: string;
}

export const PRODUCTS: Product[] = [ /* four entries, below */ ];
export const KIT_STRIPE_URL = 'https://buy.stripe.com/00wfZa7w1a3Bfo55tnfrW00';
```

### Product entries (copy verbatim)

**stocky-swap** — `Blueprint 03` · accent `sky` · guide `/stocky-swap/` · deploy `~4 min`
- name: `Stocky Swap`
- tagline: `Live inventory to Google Sheets`
- problem: `Stocky is gone and I have no inventory tracking.`
- files: `Blueprint 03_Stocky_Swap_Inventory.json`, `SA_Template_1_Stocky_Swap_Inventory.xlsx`
- replaces: Shopify Stocky (retired), Linnworks, Skubana, Inventory Planner
- savingRange: `$29–$199/mo`

**capi-shield** — `Blueprint 01` · accent `green` · guide `/capi-shield/` · deploy `~6 min`
- name: `CAPI Shield`
- tagline: `Meta Conversions API + Google Ads Enhanced Conversions, server-side`
- problem: `iOS and ad blockers are eating my Meta and Google conversions.`
- files: `Blueprint 01_CAPI_Shield.json`
- replaces: Elevar ($225/mo), Triple Whale (GMV-based), Stape ($29+/mo), Littledata ($159+/mo)
- savingRange: `$29–$225/mo`

**tiktok-capi** — `Blueprint 02` · accent `tiktok` · guide `/tiktok-events-api-shopify/` · deploy `~6 min`
- name: `TikTok CAPI`
- tagline: `TikTok Events API v1.3 CompletePayment, server-side`
- problem: `My TikTok ads report fewer purchases than Shopify does.`
- files: `Blueprint 02_TikTok_CAPI.json`
- replaces: WeltPixel ($39+/mo), Analyzify ($145–$275/mo)
- savingRange: `$39–$275/mo`

**pnl-auto** — `Blueprint 04` · accent `amber` · guide `/shopify-profit-loss-automation/` · deploy `~8 min`
- name: `P&L Auto`
- tagline: `Per-order revenue, fees, COGS and gross profit into Google Sheets`
- problem: `I don't know which orders actually make money.`
- files: `Blueprint 04_P_and_L_Auto.json`, `SA_Template_2_PnL_Auto.xlsx`
- replaces: TrueProfit ($19+/mo), BeProfit ($29+/mo), Glew.io
- savingRange: `$19–$99/mo`

`stripeUrl` — leave as `''` with a `// TODO` until the four Payment Links exist (see §9). Any card whose `stripeUrl` is empty renders its CTA as a disabled button reading `Coming this week` rather than linking to a broken URL.

---

## 2. New route — `src/pages/pro/[slug].astro`

Static-generates four pages from `PRODUCTS` via `getStaticPaths()`. Canonical: `https://stackarchitect.xyz/pro/{slug}/`.

Section order (keep it short — these are single-offer pages, target under 700 words of body copy):

1. **Breadcrumb** — `~/HOME / Complete Kit / {name}`
2. **Hero** — H1 is the *problem*, not the product name.
   - H1: `{problem}` (e.g. "Stocky is gone and I have no inventory tracking.")
   - Sub: `{name} is the finished Make.com blueprint that fixes it. Import the file, paste your credentials, live in {deployTime}. ${SINGLE_PRICE} once.`
   - Price block: `$9.99` · `one-time · instant access · no subscription`
   - Primary CTA: `Get {name} — $9.99 →`
   - Secondary, quieter: `Build it yourself free →` → `{guideUrl}`
3. **Screenshot** — Make canvas for that scenario + the resulting Sheet/Events Manager confirmation. See §7.
4. **What you get** — the `files[]` list, verbatim filenames.
5. **How it works** — 3 steps max, specific to this blueprint. Reuse the README text.
6. **Replaces** — table of `replaces[]` with prices, ending on `{savingRange} saved`.
7. **Bundle upsell block** — mandatory, do not omit:
   > **Fixing more than one thing?** All four blueprints, both Sheets templates and the setup PDF: **${KIT_PRICE}**. Two singles cost $19.98. → `Get the Complete Kit — $24`
8. **FAQ** — 4 questions, product-specific, `FAQPage` JSON-LD.
9. **Guarantee strip + final CTA.**

JSON-LD: `Product` with `offers.price = 9.99`, `MerchantReturnPolicy` 30 days, `BreadcrumbList`. Copy the shape already in `pro.astro`.

Also add `/pro/[slug]/success.astro` (or one shared `/pro/thanks/`) — the Stripe redirect target. Contents: Drive folder link, 3-line "next steps", then the upgrade offer: **`Add the other three blueprints for $14 →`** (create a fifth Stripe link for this). This recovers most of the bundle margin from single buyers.

---

## 3. `src/pages/pro.astro` — restructure

### 3a. DELETE outright

| What | Why |
|---|---|
| Bottom-CTA line `Prefer to build it yourself? Free step-by-step guides here →` | It is the last thing before checkout and it tells them not to buy. Move this link to the *top* of the comparison section instead, where it reads as confidence. |
| The `hl-box` "the honest summary" text as written | Rewrite — see 3c. |
| Exit-intent popup (`#exit-popup` + its script) | Replace with nothing, or with a one-line offer of the free guide. It reads as low-trust to a technical buyer. |
| Orphan sentence in the SEO prose: `It was previously invisible to their ad platforms.` | Broken fragment. |
| `1.3 days payback period` (all instances: stat strip, CTA strip, savings section) | Reads as marketer noise. |
| `$8,300+ saved year one` / `$696+/mo` in the hero price block and bottom CTA | See 3c — recalibrate. |
| Duplicate CTA strip #2 (`7 files. $29 one-time.`) | Redundant with the chooser + bottom CTA. |
| "Also included / bonus" grid | Fold the two Sheets templates and the PDF into the file list; they are contents, not bonuses. |

### 3b. ADD — new section 2, immediately below the hero (highest-impact change)

Component: `src/components/ProductChooser.astro`, heading **`Which problem are you fixing?`**

Four cards from `PRODUCTS`, each showing: `{problem}` as the card headline, `{name}` + `{tagline}`, `{savingRange}`, and a `$9.99 →` button linking to `/pro/{slug}/`.

Below the grid, one line, visually emphasised:
> **All four — $24.** Cheaper than three singles. Includes both Sheets templates, the setup PDF and one support question. → `Get the Complete Kit — $24`

This section is the page's primary interactive element and its main dwell-time driver. It must appear above the fold on desktop or immediately on first scroll.

### 3c. REWRITE — copy changes, verbatim

**Hero H1** (replaces the current one):
> Your Shopify backend, already built.
> **Import the file. Live in ten minutes.**

**Hero sub:**
> Four finished Make.com blueprints — server-side Meta, Google and TikTok tracking, live inventory, and per-order profit. Every module and field mapping is built; you paste your own API credentials and switch it on. **$24 once, or $9.99 for the one you actually need.** No subscription.

Note the honesty fix: "every field is pre-mapped and every API connected" contradicts the README's `PASTE_YOUR_..._HERE` instruction. The wording above is accurate and still strong.

**Savings recalibration.** Replace `$696+/mo` / `$8,300+/year` everywhere with:
> **Most stores replace $60–$180/mo of apps.** Heavy ad spenders on Elevar or Analyzify replace far more.

Keep the per-scenario savings table — those figures are sourced and defensible. It is the aggregate hero claim that is aimed at a buyer who would never spend $24.

**The comparison section** — keep the table, but change the framing so the kit wins on something other than time. New `hl-box` beneath it:

> **What you're actually paying for.** The free guides produce the same scenario — build from them if you want to learn how every module works, and the result will be identical on day one. What you get here is the finished file, the error handling already wired in (a failed row never stalls the queue), the hashing normalisation that's easy to get subtly wrong, and updated blueprints when Meta bumps the Graph API version or TikTok moves off v1.3. Silent tracking failure after an API deprecation is the expensive part, and it's the part a static guide can't help with.

Add a row to the comparison table: **`Updated when APIs change`** → Free Guides: `— you re-follow the guide` · Kit: `✓ updated blueprints` · Paid Apps: `✓`.

**Make.com free-tier claim — this is a factual correction, not copy polish.** Make's free plan is capped at **two active scenarios**. The page currently says all four run free, in the hero trust row, the "for you if" list, and the FAQ. A buyer who imports four and can't switch them on will refund. Verify against make.com/pricing, then change every instance to:

> Runs on Make's free tier — any two scenarios free (Make's free plan allows two active scenarios). All four needs Make Core, about $9/mo.

Also reconcile: page FAQ says Core is $12/mo, README says ~$9. Pick one figure, use it in both, and date the claim.

### 3d. Deadline handling — must ship before 31 Aug 2026

Add `src/utils/stockyDeadline.ts` exporting `isPostShutdown()` (compares `Date.now()` to `2026-08-31T23:59:59Z`) and render at build time, not client-side, so crawlers see the right copy.

**Pre-deadline** — current copy stands.

**Post-deadline** — swap to:
- Band label: `SHOPIFY STOCKY — SERVICE ENDED 31 AUG 2026`
- Body: `Stocky's data was deleted, not migrated to Shopify Admin. Stocky Swap starts logging from your next order — timestamp, SKU, quantity, order ID and product, straight into Google Sheets. No migration to do, because there's nothing left to migrate.`
- Countdown box → replaced by: `Ended 31 Aug 2026` + `Every day without it is inventory history you're not capturing.`
- Remove `before shutdown` / `shuts down in` phrasing everywhere.
- Site-wide banner in the layout: change `end of service 31 Aug 2026. Export, recover and replace it free →` to `Stocky has shut down. Recover what you can and replace it free →`.

Grep the whole repo for `shuts down`, `shutting down`, `before its August`, `31 Aug 2026` — this phrasing is in the layout banner, several guide pages and the JSON-LD, not just `pro.astro`.

### 3e. Trim

Target: `pro.astro` under ~900 lines. The value proposition currently restates "$29 · 10 minutes · no subscription" roughly twelve times. Keep three CTA moments: hero, after the chooser, bottom. Every other repetition goes.

---

## 4. Guide-page offer blocks — highest revenue lever

Create `src/components/InlineOffer.astro`, props: `slug`.

Renders a bordered inline block with the accent colour of that product:
> **Skip the build.** {name} as a finished Make.com blueprint — import it, paste your credentials, done in {deployTime}. **$9.99**, one-time.
> `[Get {name} — $9.99 →]`  ·  small grey text: `Or keep reading — this guide builds the same thing free.`

Insert **twice** per guide page: once after the guide's first major H2 (i.e. after the reader has confirmed the guide covers their problem, before the long build steps), and once at the very end.

| Page | slug |
|---|---|
| `/stocky-swap/` | `stocky-swap` |
| `/stocky-alternative/` | `stocky-swap` |
| `/capi-shield/` | `capi-shield` |
| `/shopify-google-ads-conversion-tracking/` | `capi-shield` |
| `/tiktok-events-api-shopify/` | `tiktok-capi` |
| `/shopify-profit-loss-automation/` | `pnl-auto` |

These pages carry warm, problem-specific traffic and currently push a four-product bundle. Fixing this mismatch is likely worth more than the entire `/pro/` redesign.

---

## 5. Tracking — do this or the next iteration is guesswork

Every Stripe URL gets `?client_reference_id={source}` where source identifies the exact CTA:

`pro_hero`, `pro_chooser_{slug}`, `pro_compare`, `pro_bottom`, `pro_sticky`, `single_{slug}_hero`, `single_{slug}_bottom`, `single_{slug}_bundle_upsell`, `guide_{page}_inline_top`, `guide_{page}_inline_end`, `thanks_{slug}_upgrade`.

Add a `buildStripeUrl(product, source)` helper in `products.ts`. `client_reference_id` surfaces in the Stripe dashboard against every payment, so attribution needs no analytics setup. Wire `AttributionTracker` (already imported in `pro.astro`, currently unused) to fire a click event with the same source string.

---

## 6. Schema updates

- `pro.astro`: change `Product` → `ProductGroup` with four `hasVariant` entries plus the kit, or add an `ItemList` of the four single-product pages. Update `offers.price` to `KIT_PRICE`.
- Add `AggregateOffer` with `lowPrice: 9.99`, `highPrice: 24`, `offerCount: 5`.
- Each `/pro/{slug}/` page gets its own `Product` + `FAQPage` + `BreadcrumbList`.
- Add the four new URLs to the sitemap.
- `dateModified` → build date.

---

## 7. Proof assets — Luke supplies these, they are not optional

The page currently asks for card details from an unknown seller with a bullet list of filenames as evidence. Add, at minimum:

1. Make.com canvas screenshot per scenario (4 images) — `/public/proof/scenario-{slug}.png`
2. Meta Events Manager screenshot showing a received server event + match quality
3. TikTok Events Manager showing the 200 / test event
4. The inventory Sheet with real rows populating
5. The P&L Dashboard tab with live totals

Redact IDs and tokens. Build the components with `<img>` tags pointing at these paths and a neutral placeholder so the layout is done before the images land.

Also surface existing credibility above the fold, not just in the footer author card:
> Built by the author of the open-source `shopify-capi-validator` npm package. Every blueprint runs in a production store.

Do **not** add testimonials until real customers exist. That decision in the current page was correct.

---

## 8. Restraint pass

Keep: sticky bar, guarantee badges, the Stocky urgency band (post-deadline variant).
Remove or soften: exit-intent popup, `pulse` animation on every button (keep it on the hero CTA only), the red `⚠ TIME-SENSITIVE` treatment on more than one element per screen.

The buyer is a technical store owner. Stacked pressure UI reads as a low-trust info product and works against a $9.99–$24 impulse purchase that depends entirely on credibility.

---

## 9. Manual work outside the repo (Luke)

1. **Test the existing funnel end to end with a real card.** Confirm the Stripe redirect fires, and that the Drive folder opens for a signed-out user in an incognito window. With zero sales to date, a silently broken funnel is a live possibility and outranks every change in this document.
2. Create four Payment Links at $9.99 + one upgrade link at $14. Each redirects to its `/pro/{slug}/success/` page. Paste the URLs into `products.ts`.
3. Enable Apple Pay / Google Pay / Link on all Payment Links.
4. Four separate Drive folders, one per single, plus the existing kit folder.
5. Verify Make's free-plan active-scenario limit on make.com/pricing before shipping §3c.
6. Fire a test event through `FILE_01_CAPI_Shield.json` — the README marks it "pre-built" rather than "tested", and it is the headline product.

---

## 10. Order of execution

1. Deadline-aware copy (§3d) — ships before 31 Aug.
2. `products.ts` + `/pro/[slug].astro` + success pages (§1, §2).
3. `InlineOffer` on the six guide pages (§4).
4. `ProductChooser` + the deletions and rewrites on `pro.astro` (§3a–3c, §3e).
5. Tracking (§5), schema (§6).
6. Proof images (§7), restraint pass (§8).

Ship 1–3 first. They are where the revenue is.

---

## Prompt for Claude Code

> Read `STACKARCHITECT_PRO_BUILD_BRIEF.md` in the repo root and implement sections 1 through 6 in the order given in section 10. Work in one branch, one commit per numbered section, and run the build after each. Before touching `src/pages/pro.astro`, grep the whole repo for Stocky shutdown phrasing and list every file that needs the deadline-aware copy from §3d. Do not invent prices, savings figures or testimonials — every number must come from `products.ts` or already exist in the current page. Where the brief says a claim needs verifying (Make free-tier scenario limit, Core price), leave a `{/* VERIFY */}` comment and flag it in your summary rather than guessing.
