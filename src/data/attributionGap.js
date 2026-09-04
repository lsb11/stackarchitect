// Single source of truth for the iOS Attribution Gap Benchmark data.
// The page, the CSV endpoint and the JSON endpoint all import from here,
// so the downloadable data can never drift from the published table.
// ── Sourced data points (every row links to a real, named source) ──
export const dataPoints = [
  {
    metric: "iOS users who declined app tracking (opt-out) — 2021 launch",
    value: "~75–80%",
    detail: "In the months after the April 2021 ATT prompt, most iOS users declined app tracking; early panels put opt-in in the low-20s%. Note: opt-in has since risen — AppsFlyer's global panel reported ~50% opt-in by 2024–2025 — so current app-tracking loss is lower than the 2021 launch figure. Web pixel loss (the basis of this benchmark) is driven by Safari ITP, ad blockers and consent rejection in addition to ATT.",
    source: "AppsFlyer — ATT opt-in rate data (2021 launch vs 2024–25 anniversary)",
    sourceUrl: "https://www.appsflyer.com/company/newsroom/pr/post-att-growth/",
    sourceDate: "Apr 2025"
  },
  {
    metric: "Share of Shopify traffic that is mobile",
    value: "74–78%",
    detail: "Mobile devices drive roughly three-quarters of Shopify store traffic — the exact segment most affected by iOS/Safari tracking restrictions.",
    source: "Shopify Mobile Commerce Statistics 2026",
    sourceUrl: "https://easyappsecom.com/guides/shopify-mobile-commerce-statistics",
    sourceDate: "Apr 2026"
  },
  {
    metric: "Attributable conversions lost relying on platform SDK alone (no CAPI)",
    value: "~40%",
    detail: "A documented case found a brand losing approximately 40% of attributable conversions by relying solely on the platform's SDK without a server-side Conversions API complement.",
    source: "021 Newsletter — Do You Still Need an MMP in 2025?",
    sourceUrl: "https://www.021newsletter.com/p/do-you-still-need-an-mmp-in-2025",
    sourceDate: "Jul 2025"
  },
  {
    metric: "Meta's own estimated 2022 revenue impact from ATT",
    value: "~$10B",
    detail: "On Meta's Q4 2021 earnings call (Feb 2022), CFO David Wehner told analysts the iOS ATT headwind was 'on the order of $10 billion' for 2022 — roughly 8% of annual revenue. Meta reaffirmed the ~$10B order of magnitude on its Q2 2022 call.",
    source: "Meta Q4 2021 earnings call (David Wehner), via MacRumors",
    sourceUrl: "https://www.macrumors.com/2022/02/03/facebook-10-billion-in-2022-apple-measures/",
    sourceDate: "Feb 2022"
  },
  {
    metric: "Safari ITP: first-party cookie lifetime cap",
    value: "7 days",
    detail: "Safari's Intelligent Tracking Prevention caps script-writable first-party cookies at 7 days and blocks third-party cookies entirely — structurally degrading browser-based attribution for the ~50%+ of Shopify mobile traffic on iOS Safari, independent of ATT opt-in trends.",
    source: "WebKit — Tracking Prevention (Apple)",
    sourceUrl: "https://webkit.org/tracking-prevention/",
    sourceDate: "Ongoing"
  }
];

// ── Export versioning ──
// The JSON download is versioned so an automated consumer can tell a
// deliberate change in the payload from a broken one. v1 was the implicit,
// unversioned shape that carried a `headline` field. v2 removes it. Without a
// version and the record below, `headline` simply disappeared from the payload
// between one deploy and the next, which is precisely the silent change a
// downstream consumer has no way to interpret.
// Bump this whenever a field is added to or removed from the export.
export const EXPORT_VERSION = 2;
export const EXPORT_VERSION_DATE = '2026-09-04';

// Figures this benchmark has published and later withdrawn. A retraction needs
// somewhere to land that a machine can read, not only a paragraph on the page.
// Entries are append-only: a withdrawn figure stays listed so that anyone who
// cached or cited the old payload can find out what happened to it.
export const retractions = [
  {
    field: 'headline',
    value: '20–40% of purchase-conversion signal lost, rising toward 50% on mobile-heavy stores',
    publishedUntil: '2026-09-04',
    removedInVersion: 2,
    reason:
      'Withdrawn, not revised. No row in this dataset measured the quantity the headline asserted; ' +
      'the rows measure ATT opt-out rates, mobile traffic share, a cookie lifetime cap and Meta revenue, ' +
      'which are inputs to that quantity rather than observations of it. Exactly one row was denominated ' +
      'in it — the ~40% attributable-conversion loss without CAPI — and that row is a single documented ' +
      'case (n=1) reported at second hand. The lower bound of 20% has no derivation in any surviving row. ' +
      'The loss is in any case store-specific: rows 2 and 5 establish that it is driven by a store\'s own ' +
      'mobile/iOS traffic mix and its consent rate, so no single industry figure describes a given store.',
    supersededBy:
      'A first-party figure computed from real store submissions, published once N >= 10 approved ' +
      'submissions exist. Until then this dataset asserts no gap magnitude.',
    record: 'https://stackarchitect.xyz/how-we-test/#the-20-40-figure',
  },
];

// Identity and licence only. No headline figure lives here: the 20–40% synthesis
// was retracted — it was a range assembled from other people's numbers, and this
// benchmark asserts a figure only once /api/gap-stats has N ≥ 10 first-party
// submissions to compute one from. See `retractions` above for the record.
export const benchmarkMeta = {
  name: 'Shopify iOS Attribution Gap Benchmark',
  canonical: 'https://stackarchitect.xyz/shopify-ios-attribution-gap-benchmark/',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  licenseName: 'CC BY 4.0',
  creator: 'Stack Architect (stackarchitect.xyz)',
};
