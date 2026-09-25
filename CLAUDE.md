# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status: Consolidation Release v1 is SHIPPED. The URL set is FROZEN.

Spec: docs/RUNBOOK-consolidation-v1.md — read it before any structural change.
That runbook is a record of completed work, **not a to-do list**. Do not re-cut
pages it describes; they are already cut.

Measured against the build on 2026-09-25:

| Metric | Value |
|---|---|
| HTML pages built | 120 |
| `noindex` pages | 69 (54 × `/apps/*`, 4 × `/pro/*/`, 4 × `/pro/*/success/`, 3 × `/embed/*`, the Klaviyo migration calculator, privacy/terms/refund) |
| **Indexable pages** | **51** |
| **URLs in sitemap-0.xml** | **49** |

The two indexable pages absent from the sitemap are `/404.html` and
`/sitemap-page/`, both deliberate. Reproduce the whole table with
`npm run build`, then count `<loc>` in `dist/sitemap-0.xml`.

The runbook's 88 → 58 target was met on 17 Aug at 120 pages / 58 URLs. The set
grew to 63 through freeze exceptions #1 and #2, then fell to 49 with exception
#3 on 24 Sep. See the freeze note below. An earlier
version of this file said the cut was still to be made; that was stale and caused
wasted work, which is why these figures now carry the date they were measured
and the command that reproduces them.

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
| `node scripts/word-count.mjs` | Per-page word count inside `<main>` over the sitemap (needs a build first). Reports; never fails. |
| `npm run schema:check` | Schema-vs-visible-text report without failing |
| `npm run seo:audit` / `npm run seo:crawl` | `seo-audit.mjs` over `dist/`; crawl audit against production |
| `npm run pricing-audit` | Cross-check asserted vendor prices |
| `npm run gsc:coverage` | GSC URL Inspection sweep (needs `GSC_KEY_JSON`) |
| `npm run gsc:weekly` | One tab-separated line appended to `gsc-weekly.tsv`: indexed, crawled-not-indexed, and impressions on any non-homepage URL over a 7-day window ending 3 days back. Needs `GSC_KEY_JSON`. |
| `npm run aff:check` | Fetch every `/go/*` destination, follow redirects, fail on non-2xx or a stripped referral credential. Not in the build. See `docs/AFFILIATES.md`. |
| `node scripts/redirect-smoke.mjs --parse-only` | Lint `public/_redirects` offline (chains, loops, truncation) |
| `node scripts/moderate-gap.mjs list\|approve\|reject\|stats` | Moderate D1 benchmark submissions via wrangler |
| `.venv-og/bin/python scripts/og/make_page_og.py` | Re-render the generated OG cards and their `og-images.json` entries (setup: `python3 -m venv .venv-og && .venv-og/bin/pip install -r scripts/og/requirements.txt`) |
| `npx wrangler d1 execute attribution-gap --remote --command "…"` | Read affiliate click counts. Queries are in `schema/003-affiliate-clicks.sql`. |

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
trailing slash — exempting `/api/*`, `/go/*` and anything with a file extension. **A second
trailing-slash redirect lives outside the repo**, in the Cloudflare dashboard as a zone Redirect
Rule ("enforce trailing slash"). It runs before the middleware and excludes `/api/*` and `/go/*`.
Those exclusions are what stop it from 301ing Function POSTs and adding a hop to affiliate
cloaks, and nothing in this repo shows they exist. Responses served
on a non-primary host get `X-Robots-Tag: noindex`. `public/_redirects` (290 lines) then handles
affiliate cloaks and legacy URLs. Redirect edits are covered by `.github/workflows/redirect-smoke.yml`
(parse-only on PR, live assertions after deploy, plus nightly).

**Build-time date branches need a scheduled build.** `isPostShutdown()` in
`src/utils/stockyDeadline.ts` resolves at build time — six files branch on it: `Nav.astro` plus
five page files (`index`, `pro`, `pro/[slug]` — four routes — `stocky-swap`
and `stocky-migration-risk-scorer`) — and a static build never re-evaluates itself.
`.github/workflows/scheduled-redeploy.yml` POSTs a Cloudflare Pages deploy hook
daily at 00:15 UTC so a date boundary is crossed by the build within a day.
Needs the repo secret `CF_PAGES_DEPLOY_HOOK`; without it the run fails loudly
rather than passing silently. **As of 18 Sep 2026 the secret was not set:** every
scheduled run from 11 to 18 Sep failed on that guard, and Cloudflare shows no
hook-triggered deploy at all, so the date branches were only re-evaluated when
someone pushed. Before relying on the daily build, check that the latest run of
this workflow succeeded, not just that the file exists.

**Pages Functions + D1.** `functions/api/{submit-gap,gap-stats,gap-badge}.js` back the iOS
Attribution Gap Benchmark, writing to the `attribution-gap` D1 database (`binding = "DB"`,
schema in `schema/`). The gap is computed server-side, submissions land `pending`, and
`/api/gap-stats` refuses to publish a figure below N=10. Moderation is a local wrangler script
by design — no admin endpoint exists. The page's *sourced* (non-first-party) rows live in
`src/data/attributionGap.js`, the single source shared by the page and the CSV/JSON download
endpoints.

**Analytics.** GA4 (`G-TE6Z6CW514`) is a single inline tracker in
`src/layouts/Base.astro`, between the `GA4_PLACEHOLDER` comments. It fires
`affiliate_click` on `/go/*`, `begin_checkout` on a Stripe Payment Link (with
`value`/`currency`/`items`) and `kit_click` on a move toward `/pro/*`. Its
data — the AI-referrer table and the Stripe-link-to-price map — lives in
`src/data/analytics.ts` and is interpolated into the page as JSON, because an
inline script cannot import and a price literal in a layout is exactly the
drift `claims.json` exists to stop. `tests/analytics-tracker.test.js` runs the
real tracker in a vm against a DOM stub; it is the only check on that script,
since no build guard reads it.

**Consent gates all of it.** Consent Mode v2 defaults all four signals to
`denied` before `config`, and gtag.js is not even requested until the visitor
presses Accept on the `#sa-consent` banner (end of `<body>` in `Base.astro`).
Consent Mode alone is not enough: a loaded gtag.js with `analytics_storage`
denied still sends cookieless pings. Accept grants `analytics_storage` only.
Events before Accept are dropped, not queued; `sa_attr` and `sa_landing` are
only stored with consent. Reject after Accept deletes the `_ga*`/`sa_attr`
cookies and reloads. The choice is `localStorage.sa_consent`; `/privacy/` has
the button that reopens the banner. The redirect in `functions/go/` does not
depend on any of this. `npm run consent:check` (after a build) proves it in a
real browser: no request to Google before consent or after Reject.

**Client-side only, on purpose.** The `/go/*` Function sees every hit and
could report more, but `functions/go/_bots.js` and the `clicks`/`bot_hits`
tables are the single source of truth for what is a crawler. A second,
differently-filtered count in GA4 would not reconcile with D1. GA4 measures
real browser clicks; D1 measures every request.

**Half of GA4 is not in this repo.** Key events, custom dimensions, the AI
assistant channel group and the internal-traffic filter are property settings
in the GA4 admin UI — the same category as the Cloudflare zone rules above.
Steps are in `docs/GA4-SETUP.md`. Until they are done the events are collected
and nothing is marked a conversion. Two traps that doc covers: custom
dimensions and data filters are both non-retroactive, and the Internal Traffic
filter ships in **Testing**, which means it is excluding nothing.

**Build guards** (`scripts/`, both wired into `npm run build`):
- `claims-guard.mjs` — a page asserting a third-party price with no `verifiedDate` fails the
  build unless it is quarantined in `docs/claims-unverified.json`. That quarantine may only
  shrink; a stale entry also fails. Clear one by reading the vendor's live pricing page and
  passing that date as `verifiedDate` — never by stamping today's date.
- `schema-visible-guard.mjs` — runs over `dist/` and fails when JSON-LD asserts a number that
  does not appear in the page's visible text. Since 19 Sep 2026 it also fails
  when a **third-party** Offer (non-zero, not ours) has no `priceVerifiedDate`,
  no vendor source URL (`priceSourceUrl` or `url`, off our domain), or a price
  not shown as a `$` figure within 600 characters of the product's name.
  Before that, no check looked at the ~30 competitor Offers at all: check 2
  skips them and a bare `"price": "145"` carries no `$` for check 1 to see.
  Quarantine: `thirdPartyOffers` in `docs/schema-claims-unverified.json`,
  same ratchet. It holds one entry, Analyzify on
  `/shopify-attribution-tools-compared/` (see the apps.json problems below).

**What neither guard checks — capability claims.** Both guards are about
numbers: third-party prices, the canonical figures in `claims.json`, numbers
in schema. Nothing checks a sentence that says what a product *does*, and a
passing build says nothing about those. Found 18 Sep 2026: `/pro/stocky-swap/`
says the buyer pays for "the error handling already wired in", but every step
that writes data out in the free blueprints is set to Make's `Ignore` error
handler, and the Meta and TikTok requests also set `stopOnHttpError: false`,
so a rejected call finishes as a green run. The guard missed it for two
separate reasons:
1. `claims-guard.mjs` only matches numbers in price or figure context. A
   sentence with no number in it can never trigger it.
2. Its file walker, `contentFiles()`, covers `src/pages`, `src/content`,
   `src/components`, `src/layouts` and `public`. It does **not** cover
   `src/data/`, and `src/data/products.ts` holds all the copy for the four
   `/pro/<slug>/` pages: FAQs, steps, taglines. Even a numeric claim there is
   only caught indirectly, through `schema-visible-guard` on the built page.

Until a check exists, a claim about what a blueprint does gets verified
against the blueprint JSON before it ships. The paid files are not in this
repo; the free versions are in `~/Downloads/*-blueprint-FREE.json`.

**One capability claim is now guarded: EMQ.** `claims.json` gained
`thirdParty.metaEmqScore` on 21 Sep 2026 — `retired` and `contexts` empty,
the work done entirely by `forbid`. It fails the build on any Event Match
Quality *number* presented as a score this site's setups produce, as a
benchmark to hit, or as a per-key point lift ("+3 EMQ"). Describing the 0–10
scale, naming the match keys the score is calculated from, and telling a
reader to read their own score all still pass.

Why it was needed: `/capi-shield/` retracted its EMQ figures in prose weeks
earlier, and the number carried on living in `public/llms.txt` ("typical EMQ
7–8.5"), `llms-full.txt`, `.well-known/ai-plugin.json`, a diagram `<desc>`,
the TikTok page's stat strip — which contradicted that same page's own FAQ —
and a fabricated per-event benchmark table on the EMQ estimator ("Purchase
8.8–9.3"). A prose retraction on one page is not a retraction.

Two lessons for the next `forbid` pattern:
- **Match HTML entities, not just dashes.** The first cut knew only `[-–—]`
  and so passed the entire EMQ section of
  `/blog/shopify-server-side-tracking-complete-setup-guide/`, where every
  range is written `4&ndash;5`. An `.astro` file is where a claim is most
  likely to be entity-encoded.
- **A code comment is content to the guard.** The comment in
  `capi-shield.astro` recording which tiles were removed quoted the retracted
  figure, and failed the build. It now describes them instead. That is the
  right outcome for a file that ships: the record of what a figure was
  belongs in `claims.json` and in this file, both of which the guard's
  walker deliberately does not read, and not in page source.

**A second retracted figure is now guarded: the 20–40% loss estimate.**
`claims.json` gained `thirdParty.attributionLossFigure` on 21 Sep 2026. Same
shape as the EMQ entry — empty `retired`/`contexts`, all the work in `forbid`
— and it fails the build on a quantified conversion-loss or recovery
percentage. The retraction was made on 4 Sep and was still not true of the
site on 21 Sep: `/capi-shield/`'s hero said 35%, `/tools/` said 40%,
`/make-com-shopify/` said 15–35%, and the server-side tracking guide carried
eleven separate figures.

`forbid` rules now take an optional **`unless`**: regexes checked against the
line a match sits on, which suppress it. This site has to be able to name the
figure in order to retract it — `/about/`, `/how-we-test/`, the benchmark page
and `attributionGap.js`'s `retractions[]` all state "20–40%" precisely to say
it is gone — and a guard that fires on the retraction notice pushes you to
delete the record. The exemptions were first written as negative lookarounds
inside the patterns and became unreadable; a named list is reviewable in a
diff. The soft spot is deliberate and documented in the entry: "documented
case" beside a number passes, because the benchmark's one sourced n=1 row has
to stay published. The guard stops a retracted figure creeping back; it cannot
certify a new one.

**`contentFiles()` now also reads root-level `*.md`.** Everything at root is
scanned except a named RECORDS list (`CLAUDE.md`, `README.md`, `AUDIT.md`,
`STACKARCHITECT_PRO_BUILD_BRIEF.md`) whose job is to state what a figure used
to be. The default is "scan" on purpose: a draft named something nobody
predicted still gets checked, where an include-list keyed on `dev_to_*` or on
`published:` front matter would quietly skip it.

This is how the syndication drafts were found. They are not served by this
site, so nothing checked them, and on 21 Sep 2026 `dev_to_sst_guide.md` — a
dev.to post with `canonical_url` pointing back here — still led with "Recover
20–40% of invisible Shopify conversions", carried the EMQ figures retracted
that same week, claimed "stores at EMQ 8+ consistently report 12–28% lower
cost-per-purchase", and priced **Make Core at $12 in four places**. That last
one is the drift `claims.json` was built to stop, sitting in a file the guard
could not see. `video-build-prompt.md` still said "$29 Complete Kit" and
"EMQ 8+". Publishing either would have re-seeded every figure this repo had
just removed, on a domain with more authority than ours. Both are corrected.

### Shipped blueprints that pin a third-party API version need a recurring check

**What happened.** CAPI Shield's Meta request, in both `FILE_00` and
`Blueprint 01`, was hardcoded to `graph.facebook.com/v19.0/`. Meta's changelog
says v19.0 was released 23 Jan 2024 and available until 21 May 2026. From then
on every Meta request returned 400. Nobody saw it for four months, because
three settings hid it: `stopOnHttpError: false`, the `Ignore` error handler,
and `dlq: false`, which means a failed run is not stored for retry. Found
18 Sep 2026. The blueprints now use v25.0. In the same review, the Google
branch was found reading `{{1.gclid}}`, a field Shopify's order payload does
not have, with both consent fields hardcoded to `GRANTED`; consent now ships
as `UNSPECIFIED`.

**Rules for page copy.** Never write a pinned version number in prose. It
goes stale without anyone noticing. Say that the blueprint names a version in
its URL, that Meta retires versions about two years after release, and point
the buyer at Meta's Graph API changelog. Code samples that need a real URL
are the exception, and they belong in the registry below.

**Proposal, not yet built.** Make the pins testable the way prices are:
1. A registry, `src/data/pinned-apis.json`, with one entry per pin: API
   name, pinned version, the shipped files that contain it, the vendor's
   published retirement date, the changelog URL, and the date a human read
   that changelog. That last date means the same as `verifiedDate` for
   prices: a date someone actually read it, never today's date stamped on.
2. `tests/pinned-apis.test.js`, run by `npm test`, fails when any entry is
   within 90 days of its retirement date, or has no retirement date or source.
   **Do not put it in `npm run build`.** A check that fails on a date would
   block every deploy, including the daily redeploy, on a day nobody is
   watching.
3. A weekly GitHub Actions workflow runs that test by itself, so a failure
   arrives as a failed-run email with no push needed. This is the recurring
   part.
4. `scripts/check-blueprint-pins.mjs <dir>` extracts every versioned endpoint
   (`graph.facebook.com/vNN`, `open_api/vN.N`, `googleads.googleapis.com/vNN`)
   from a folder of blueprint JSON and compares them with the registry. The
   paid files are not in this repo, so run it by hand whenever a blueprint is
   changed or re-exported.

The registry should start with: Meta Graph API (the CAPI Shield blueprints
and the free public scenario), TikTok Events API v1.3 (TikTok CAPI), and
the versions written into guide code samples. As of 18 Sep 2026 those are
`graph.facebook.com/v24.0` in
`src/pages/blog/shopify-server-side-tracking-complete-setup-guide.astro`, and
`googleads.googleapis.com/v25` in
`src/content/blog/how-to-fix-shopify-google-ads-conversion-tracking-2026.md`
(Google lists its sunset as August 2027). That sample was on v17 until
18 Sep 2026. Google sunset v17 on 4 June 2025, so the sample had been
failing on every request for about 15 months before anyone noticed. It is
the second case of this failure, after the Meta v19.0 one.

**Third case, and a wider one: the upload method itself is being retired, not
just a version.** Found 18 Sep 2026 in the warning on Make's Google Ads
Conversions module, then checked against Google's sources. On 15 May 2026
Google announced that offline click conversion import, including enhanced
conversions for leads, is moving from the Google Ads API
(`ConversionUploadService.UploadClickConversions`) to the **Data Manager API**.
From 15 June 2026, a developer token that had not uploaded click conversions
between Dec 2025 and May 2026 gets `CUSTOMER_NOT_ALLOWLISTED_FOR_THIS_FEATURE`.
Tokens that were already uploading keep working for now. Google calls that
access transitional and has **not published an end date**. A version bump does
not fix this, so the v25 sample above is on a current version of a method that
is being retired. It is exactly what a first-time reader would hit.
CAPI Shield's Google branch uses the same method through Make's module, so it
now has two separate faults: no gclid in Shopify's payload, and an upload path
that is being retired. Both are stated on `/capi-shield/` and
`/pro/capi-shield/`.

For the registry, this means an entry has to be able to pin a **method**, not
just a version. Put `UploadClickConversions` in as its own entry, with the
15 May 2026 announcement as its source. Leave the retirement date empty, and
make the test report "retiring, no date" as its own state, not a pass. The
Data Manager API is on `datamanager.googleapis.com/v1`.
Sources: ads-developers.googleblog.com/2026/05/changes-to-offline-click-conversion.html
(the allowlist error and date window are as reported by ppc.land; the blog body
did not render for a fetch),
developers.google.com/data-manager/api/devguides/events/send-events.

Remember that the `/pro/<slug>/` copy lives in `src/data/products.ts`, and
`claims-guard`'s file walker does not read that directory (see above). A
version number or capability claim written there gets no automated check
at all.

**`apps.json` prices have three states, not two.** `statusOf()` in
`src/data/appsIndex.js` is the definition; `/apps/`, both
`/downloads/shopify-app-pricing-index.*` endpoints and `seo-audit.mjs` all read
it (the audit restates it, because `appsIndex.js` imports JSON the Vite way and
will not load in plain node — `seo-audit.test.mjs` pins the two together).

| State | Test | Count, 5 Sep 2026 |
|---|---|---|
| `verified` | both `priceVerifiedDate` and `priceSourceUrl` | 27 |
| `held` | `priceHeldReason` — checked, deliberately not priced | 3 |
| `unchecked` | neither — nobody has looked | 24 |

Until 5 Sep the page and the audit both said "27 verified, 27 unverified",
which hid the holds inside the unchecked count. A hold is a decision with a
reason attached and an absence is not; do not collapse them again. Enforcement
does not care about the distinction — only `verified` may back a published
figure, and that has always been the rule — but the reporting does.

Every count on `/apps/` is derived from `apps.json`, never typed. The bug that
rule exists to prevent shipped sitewide: `Nav.astro` read "All 53 apps" on all
128 pages from 14 Aug to 5 Sep, after `apps.json` went to 54.

**apps.json data problems — logged 19 Sep 2026 for a later pass, not fixed.**
Each needs someone to read the vendor's page. Do not settle them by editing
the JSON to make a guard pass.
- **Elevar.** `priceSourceUrl` points at audiense.com. It was reported as a
  different company. The record's own `brandChange` note says getelevar.com
  redirects to Audiense and the page is titled "Audiense Online Pricing —
  Powered by Elevar", which would make it a rebrand. Settle which it is, and
  whether $225 is an Elevar price, before the Offer stays.
- **Triple Whale.** `apps.json` says `$219+`, and so does the schema.
  `/shopify-attribution-tools-compared/` shows `~$129/mo` in one table and
  `$219–$749/mo` in another.
- **Analyzify.** `apps.json` and the schema say `$145–$275`. The page says
  `~$749/yr` and `~$62–$79/mo equivalent`, and its own "billing basis"
  paragraph says the figures do not reconcile. This is the quarantined
  third-party Offer; clearing it means resolving this.

Root-level `*.patch` files, `.archived-pages/`, `.*-backup*/` and the loose `.py`/`.cjs` scripts
are historical artefacts, not live tooling.

### Pricing: two products, two constants

Since 18 Sep 2026 there are exactly two things to buy: one blueprint at
`SINGLE_PRICE` ($9.99) or the Complete Kit at `KIT_PRICE` ($19.99), both in
`src/data/products.ts`. The kit was $29 until 29 Aug and $24 until 18 Sep; both
are `retired` in `claims.json`, so `claims-guard` fails the build on either
figure next to the kit's name anywhere it scans, code comments included. The
$14 single → kit upgrade was removed rather than repriced: it never had a
Stripe link, and at a $19.99 kit it would have cost a single buyer more than
the kit.

- `.astro` files render the constants (`formatPrice(KIT_PRICE)`), never a
  literal. Raw `<script type="application/ld+json">` blocks cannot
  interpolate, so they either move into `<Base schema={...}>` or leave the
  price out.
- Markdown, `public/llms.txt`, `public/.well-known/ai-plugin.json` and
  `public/videos/hero-long.vtt` cannot import, so they carry the literal and
  rely on the retired-price ratchet. A price change means sweeping those by hand.
  It also means re-running `scripts/og/make_page_og.py`, which draws
  `KIT_PRICE` into `og-complete-kit.png` (see Images below); `npm test` fails
  until you do.
- **Do not sell the kit on saving.** Two singles cost $19.98 against a $19.99
  kit. The reason to buy it is that `FILE_00` is one scenario instead of four:
  it fits Make's free plan with a slot to spare and uses about a third fewer
  credits per order (kit README, credits table: 10 vs 15 for a two-item order,
  which matches the module counts in `FILE_00` against `FILE_01`–`04`).
- The 30-day guarantee covers singles as well as the kit. The single pages
  promised it from 29 Aug, and `/refund-policy/` was widened to match on
  18 Sep. `/terms/` was widened the same day.

**The hero video's audio is stale.** `hero-long` says "$24" out loud. The
caption (`hero-long.vtt`) and the on-page transcript in `index.astro` say
$19.99, because a wrong caption is worse than one that does not match the audio.
The video needs re-recording.

### Images carry claims that no text check reads

Found 19 Sep 2026: `og-complete-kit.png` still said **"$29 one-time"** three
weeks after the kit left $29, and `og-capi-shield.png` still said **"Meta &
Google"** after every page had dropped Google. Both are `og:image`s, so every
social share showed them. The per-page cards in `public/og/` were drawn on
14 Jul (`0e928b0`) by a script that never entered the repo. With no way to
re-render them and no way for a grep to read them, they went stale without
anyone seeing it.

- **`scripts/og/og-images.json` lists every raster image** under `public/` and
  `src/assets/`, with the text each one carries. `tests/og-images.test.js`
  (in `npm test`) fails when:
  - an image has no entry;
  - a generated card no longer matches its recorded sha256;
  - a card that `depicts` a constant (today `KIT_PRICE`) shows a value
    `products.ts` no longer has;
  - any image states a retired kit price near the kit (the same
    `retired-near-anchor` rule claims-guard uses);
  - any image states a withdrawn tracking claim ("no gclid needed", or
    CAPI Shield with Meta + Google).
- **`scripts/og/make_page_og.py` renders `og-capi-shield.png` and
  `og-complete-kit.png`** onto `scripts/og/card-template.png` and rewrites
  their manifest entries. Setup:
  `python3 -m venv .venv-og && .venv-og/bin/pip install -r scripts/og/requirements.txt`.
  Never edit a generated PNG or its entry by hand; change `cards()` and
  re-run.
- **Every other card is still a 14 Jul bitmap.** Its entry is a hand
  transcription dated when someone read it. Adding a card to `cards()` is the
  way to bring it under the generator; after that, change its text with a
  re-run.
- **SVGs are not the gap.** SVG text is plain text, so a grep does find it (`shopify-server-side-tracking-flow-2026.svg` said
  "no gclid needed" until 19 Sep 2026 and nobody looked). PNG, JPG and WebP
  text is invisible to every check except this manifest.

**Known problems in image text, recorded 19 Sep 2026 and not fixed.** Each one
is also listed under `concerns` in the manifest.
- `og-tiktok-events-api.png`: "Recover 20–40% of lost TikTok conversions", the
  figure `/how-we-test/#the-20-40-figure` says the site does not publish.
- `og-home.png`: "$514–$1,895/mo" and "Save $6,168–$22,740 / year", against
  "$321–$1,887/month" in the homepage schema.
- `og-how-we-test.png`: "Every number on this site has a source and a date",
  while claims-guard is quarantining 43 claims.
- `og-server-side-tracking-guide.png`: "$149–$399/mo", which appears nowhere on
  the site.
- `og-stocky-swap.png`, `og-stocky-shutdown.png`: future tense after 31 Aug.
  `isPostShutdown()` branches the pages, but it cannot change a bitmap.
  `og-stocky-shutdown.png` is not referenced by any page, but it is still
  served.
- `public/videos/poster-*.jpg`: the mock billing rows sum to **$847.32**, but
  the "Total this month" reads **$702.47**. Elevar is shown at $199, while the
  site cites $225.
- The struck "was" ranges on the other cards (`$49–$99`, `$19–$299`,
  `$150–$400`, `$29–$99`, `$29–$199`, `$39–$299`) have not been reconciled
  with their pages.

### Where the indexing problem actually stands

Do not assume thin content is still the cause — but the "no page under 800
words" line is no longer true, and it was never measured over the whole set.

Re-measured 10 Sep 2026 with `node scripts/word-count.mjs` (build first), which
is now the method rather than a description of one: words inside `<main>` with
`<script>`, `<style>` and comments stripped, over all 62 sitemap URLs. **Floor
510. Four pages under 800, all four the single-product routes:**
`/pro/pnl-auto/` 510, `/pro/tiktok-capi/` 518, `/pro/capi-shield/` 535,
`/pro/stocky-swap/` 547. 53 of 62 exceed 1,500 words and 21 exceed 3,000.

**Update, 18 Sep 2026:** the four `/pro/<slug>/` pages gained prerequisites, a
click-by-click setup, failure modes and a "which one is right for you" block,
and now measure 1,517–1,817 words. **Floor 950, none under 800**; 57 of 62
exceed 1,500. The paragraph below is the history of the 10 Sep reading.

Those four are not new thin pages and they did not shrink. They had no `<main>`
until 10 Sep, so the method could not see them at all — the 5 Sep reading of
"smallest is `/shopify-app-stack-kill-or-keep-auditor/` at 933" was taken over
the 52 of 62 sitemap URLs that happened to have a `<main>` — 10 were missing
from the sample, including `/stack/` and `/stocky-shutdown/`, two of the larger
money pages. A method that silently drops the pages it cannot parse reports the
floor of its sample, not of the site.

The auditor page measures 886 under this method and 933 under the one used on
5 Sep. **That gap is extraction drift, not lost content** — an earlier commit
message here said it was a real loss from `0020349`, and that was wrong:
`0020349` changed only `<script>` code on that page, which both methods strip.
The 5 Sep method was a plain whitespace split with HTML entities left as text,
so it counted 47 punctuation-only tokens — em dashes, arrows, middots — as
words. `scripts/word-count.mjs` drops any token with no letter or digit in it.
Reconciled across all 62 URLs: the old method gives floor 529 / 4 under 800 /
53 over 1,500 / 21 over 3,000; this one gives 510 / 4 / 53 / 21. **The four
sub-800 pages are sub-800 under either method** — that finding does not depend
on the choice. `/apps/` was the sole
sub-800 page at 696 on 17 Aug and is now 2,886 — it did not gain filler, it
gained the provenance the table always had and never showed. Canonicals: zero
mismatches. robots.txt, sitemap chain, redirects and internal links all
verified clean.

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

### IndexNow: deliberately silent until the freeze lifts (~21 Oct 2026)

Bing's IndexNow export (checked 18 Sep 2026) shows **~55,000 URLs submitted since
22 Apr for a 62-page site**. Peaks were 4,886 (23 Jul), 2,508 (22 Jul),
2,392 (21 Jul), 1,929 (29 Jul) and 1,208 (6 Jul), with a baseline still at
20–77 a day. Bing indexed **33** URLs in that whole period, all before 24 Jul,
and has indexed or crawled nothing for eight weeks. Two submitters caused this,
and neither is in `main`:

1. **The `astro-indexnow` integration, 28 Apr – 6 Aug 2026** (`aa4f25d` added
   it; `6ce7f4e` removed it and its key file `b953….txt`). On `astro:build:done`
   it submitted every `index.html` in `dist/` as an apex trailing-slash URL,
   which meant the full built set: noindex pages, and pages that are now
   legacy redirect sources. It never sent slashless URLs. It ran on **every
   Cloudflare Pages build, preview builds included**, and preview builds sent
   the production URLs. Its change detection never worked in CI: it keeps a
   hash cache in `.astro-indexnow-cache.json` in the project root, which is
   gitignored, so every CI build started from a fresh clone with an empty cache
   and re-sent every page. There were 355 successful builds between 28 Apr and
   6 Aug, about 50 of them previews of `google-labs-jules[bot]` branches. At
   roughly 80–190 URLs per build that accounts for the total, and the peaks
   match build clusters. Those bot branches still exist on `origin` with the
   integration in `astro.config.mjs`. That is why preview deploys are now
   limited to `main`.
2. **Cloudflare Crawler Hints**, a zone setting outside the repo, enabled
   2026-04-21 10:44 UTC (the Bing export starts the next day). It sends IndexNow
   notices whenever Cloudflare sees cached content change, based on the URLs
   traffic requests rather than the sitemap. Every deploy changes the HTML, so
   it kept firing. It was the only live submitter after 6 Aug and explains the
   baseline. **It was turned off in the dashboard (Caching → Configuration) on
   18 Sep 2026.** Check with the zone flag
   `GET /zones/<id>/flags/products/cache/changes` (`crawlhints_enabled`).

The slashless legacy URLs that Bing Site Explorer lists did **not** come from
either submitter. The integration only ever sent trailing-slash URLs. The
likely source is pre-April history and backlinks.

**Decision, 18 Sep 2026: submit nothing until the freeze lifts.** Zero
submissions is the right state while Bing's trust recovers. Do not add a
submitter, integration, workflow step or hook before then.
`scripts/indexnow.mjs` (key `5da5f….txt`, which is live) stays **manual-only**.
Do not wire it to a build, a workflow or a cron. After ~21 Oct it gets
rebuilt with these rules:
- **URLs:** only the canonical trailing-slash URLs in `dist/sitemap-0.xml` (49
  today). Never legacy redirect sources, noindex pages, `/go/*` or `/embed/*`.
- **Change detection:** a URL counts as changed when its sitemap `lastmod`
  differs from the live production sitemap. Do not hash the HTML: every build
  changes it, and a cache stored on the CI runner does not survive between
  builds.
- **Runs:** on production deploys only, with a hard cap per run, and every URL
  sent is logged.

### Hard rules — still in force

- **The URL set is frozen until roughly 21 Oct 2026 (60 days from the cut).**
  No new pages. No new redirects. No renamed routes. A URL set that moves
  restarts Google's reassessment. Content improvements to existing pages are
  permitted and encouraged; new URLs are not.
  **The freeze was broken once, on 29 Aug 2026** (`7d23e60`, "unbundle into four
  single products with dedicated routes"): `/pro/[slug]/` added four indexable
  URLs and `/pro/[slug]/success/` four noindexed ones, taking the sitemap from
  58 to 62. Recorded here so it is documented rather than rediscovered as a
  discrepancy. It is not a precedent and it is not to be repeated — but do not
  "fix" it by deleting the routes either, since removing a live URL costs the
  same reassessment as adding one. The freeze still runs to roughly 21 Oct 2026.
  **It was broken a second time, by decision, on 23 Sep 2026: `/stocklog/`.**
  One indexable URL, sitemap 62 → 63. StockLog needed a home on this domain
  that the App Store listing and press pitches could link to, and the owner
  chose to ship it before the freeze lifted rather than wait four weeks.
  `tests/legacy-redirects.test.js` pins the sitemap count and was moved to 63
  in the same commit; that pin is the tripwire, so moving it is the record.
  Two exceptions are two too many. The next new URL waits for ~21 Oct.
- URL freeze exception #3, 24 Sep 2026: consolidation of unindexed pages per
  content audit 2026-09-24 (sitemap 63 to 49; see tests/retired-urls.test.js
  and src/data/noindex-routes.json).
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
- **Pages Functions are written without a trailing slash.** `trailingSlash: 'always'`
  governs pages, not `functions/`. Fetch `/api/gap-stats`, not `/api/gap-stats/`.
  A trailing slash there used to fail silently (a Cloudflare 502, and before
  that a 301 that turned a POST into a GET), which shipped twice. Checked live
  15 Sep 2026: `/api/gap-stats/` now returns 200, and a POST to
  `/api/capture-email/` reaches the Function (400 on an empty body) with no
  redirect. That is because the zone-level trailing-slash rule excludes `/api/*`
  (see Edge behaviour). Keep writing the slashless form anyway, so nothing
  depends on that exclusion.
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
  link/button on all 49 sitemap URLs with proper alpha and gradient
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
  tracking params preserved. That audit's "no extra hop" was true of the repo
  but not of the edge: the Cloudflare "enforce trailing slash" Redirect Rule
  also matched `/go/*` and added a 301 before the 302. That rule now excludes
  `/go/*`. Checked live 15 Sep 2026: `/go/make` and `/go/make/` are each a
  single 302 to the vendor. If a cloak ever shows two hops, check that
  Redirect Rule before `_redirects`.
- **The `/go/*` crawler gate only catches crawlers that identify themselves.**
  `functions/go/_bots.js` gates a request when its User-Agent is missing, or
  when it sends no Referer *and* its User-Agent matches a known crawler token.
  A bot that spoofs an ordinary browser User-Agent passes straight through, is
  redirected to the affiliate destination and is counted in `clicks` like a
  reader. That is the deliberate trade-off: the gate is allowed to miss a bot
  and is not allowed to eat a reader, because a stripped Referer is normal for
  real people (Safari's cross-site policy, privacy extensions, in-app
  browsers). How much it leaves on the table is measurable rather than
  guessed — compare `bot_hits.n` with `clicks.n` over the same days (the query
  is in `schema/004-bot-hits.sql`) over the next few weeks. Widen the token
  list only with a real User-Agent string someone has actually seen.

### Highest-leverage open work

1. Get the iOS Attribution Gap Benchmark to N ≥ 10 real submissions so it
   publishes a first-party figure. Its contribution form was silently discarding
   every submission until 17 Aug (trailing-slash bug above). Until it holds a
   number that exists nowhere else, it is a synthesis of other people's figures
   and Google has no reason to prefer it.
2. Backlinks / domain authority. On current evidence this is the dominant
   remaining variable and the only one that addresses the actual cause.
