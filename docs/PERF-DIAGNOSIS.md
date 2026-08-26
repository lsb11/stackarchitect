# PERF-DIAGNOSIS.md

**26 August 2026. Diagnosis only — no performance changes made.**

## Headline: do not optimise against the numbers in AUDIT.md §9

The Lighthouse run those numbers came from served `dist/` over Python's
`http.server`, **which does not compress anything**. Production does. The
measured CSS payload was **128 KB transferred**; the same files served by
Cloudflare are **~25–31 KB**. Every metric downstream of transfer — FCP, LCP,
Speed Index — is inflated by roughly 100 KB of uncompressed CSS plus
uncompressed HTML that no real visitor ever receives.

Verified against production, 26 Aug 2026:

```
curl -sI -H 'Accept-Encoding: br, gzip' https://stackarchitect.xyz/_astro/global.CPW7QTiK.css
  HTTP/2 200
  content-encoding: br
  cache-control: public, max-age=31536000, must-revalidate, immutable
  cf-cache-status: HIT
```

Brotli, immutable, cache hit. The hosting layer is doing its job.

**The FCP figures of 3.1–4.2s are substantially a harness artifact.** They are
not evidence of a production problem, and acting on them would be optimising a
synthetic number.

## 1. Document size — not the cause

The hypothesis was that 1,000–2,300-line `.astro` files produce very large
documents, making parse time explain FCP.

| Template | Source lines | HTML raw | gzip | **brotli** |
|---|---|---|---|---|
| `/` | 2,054 | 173 K | 43 K | **32 K** |
| `/best-free-shopify-apps-2026/` | 1,353 | 203 K | 39 K | **27 K** |
| `/capi-shield/` | 1,171 | 132 K | 33 K | **24 K** |
| `/blog/shopify-server-side-tracking-complete-setup-guide/` | 1,368 | 129 K | 37 K | **28 K** |
| `/shopify-app-cost-calculator/` | 946 | 103 K | 24 K | **19 K** |

19–32 KB over the wire. Large `.astro` sources are not producing large
documents — the markup is verbose but compresses ~6:1. **Hypothesis rejected.**
Parse time on a 173 KB document is single-digit milliseconds on mobile silicon;
it cannot account for a 3.5s FCP.

## 2. The critical shell — not the cause

The `@layer sa-shell` block added in v12 inlines **675 bytes** into every
document head. Total inline CSS per page is 0–6 KB.

That is a well-sized critical shell. It is doing exactly what it was added for
at negligible cost. **Leave it alone.**

## 3. CSS delivery — the one real finding

Every page loads **3–4 render-blocking stylesheets**:

| Template | Stylesheets | Raw | Brotli (production) |
|---|---|---|---|
| `/` | 3 | 127 K | ~31 K |
| `/best-free-shopify-apps-2026/` | 4 | 104 K | ~27 K |
| `/capi-shield/` | 4 | 109 K | ~29 K |

The split is `global.css` (62 K raw → **16 K brotli**), `Base.css` (25 K → 9 K),
plus a per-page stylesheet (2–6 K brotli).

`global.css` at 16 KB brotli is the single largest render-blocking resource on
every page, and it is shared, so it is cached after first visit. This is
**worth looking at, but it is a second-visit-free cost and a modest first-visit
one** — not a 3-second one.

Note Lighthouse's own `render-blocking-resources` audit computed **0 ms of
available savings** on all three templates. It does not think this is the
problem either.

## 4. Fonts — the most likely real contributor

6–7 font files per page, **112–177 KB**, and **zero fonts preloaded in the head**.

The site self-hosts three families via `@fontsource`: Inter, Sora, JetBrains
Mono — 29 `.woff2` files totalling 408 KB in `dist/_astro/`.

The problem is the discovery chain. Fonts are referenced from inside
`global.css`, so the browser cannot start fetching them until:

```
HTML arrives → global.css fetched → global.css parsed → @font-face discovered → font fetched → text painted
```

That is three serial round trips before any real text renders. On a throttled
mobile connection this is the classic cause of a late FCP, and unlike the CSS
size it is **not** fixed by compression — `.woff2` is already compressed.

This is where I would look first, and the fix is cheap: `<link rel="preload">`
for the two or three faces actually used above the fold. But it is a change,
and this document is diagnosis only.

## 5. LCP element — could not be identified

Lighthouse returned no `largest-contentful-paint-element` on any of the three
templates I re-ran with that audit explicitly enabled. I am not going to guess
which element it is.

Getting this properly needs a run against **production**, not localhost, which
also solves the compression artifact in §0. That is the right next measurement
and I have not taken it.

## 6. Field data — almost certainly does not exist

I could not retrieve CrUX data:

- The PageSpeed Insights API without a key returned `Quota exceeded for quota
  metric 'Queries' ... per day`.
- Search Console's Core Web Vitals report needs authentication. `gsc-coverage.mjs`
  expects a service-account key at `gsc-key.json`, which is **not in the repo**.

**Inference, not measurement:** CrUX only reports an origin once it has enough
real-user samples. Against Bing's 5 clicks / 129 impressions in 180 days and
GSC's 1 indexed page, this origin is very unlikely to clear that threshold, so
the Core Web Vitals report is probably empty rather than bad.

If that is right, **there is no field data to optimise toward**, and lab numbers
from a compressing origin are the best signal available — which makes §0 the
whole point: measure production, not localhost.

## What I would do next, in order

1. **Re-run Lighthouse against `https://stackarchitect.xyz/`**, not localhost.
   Everything above §3 is provisional until that exists.
2. **Confirm whether GSC's Core Web Vitals report is empty or populated.** One
   look settles §6 and decides whether any of this matters yet.
3. Only then consider font preloading (§4), which is the one hypothesis the
   static evidence actually supports.

Nothing in §1, §2 or §3 justifies a change today.
