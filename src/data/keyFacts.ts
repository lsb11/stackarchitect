// src/data/keyFacts.ts
//
// One self-contained, sourced sentence per fact, rendered by
// <KeyFacts /> on every route listed against it, and published as open data
// at /downloads/key-facts.json (CC BY 4.0).
//
// Rules (held by tests/key-facts.test.js):
// - `read` is the date a person read the fact on the source page. Never stamp
//   today's date on a fact nobody re-read: change the text, the source and the
//   date together, as with prices in priceSources.ts.
// - Every source is the vendor's own page, never this site or a third party.
// - A sentence must stand alone: an assistant quoting one line out of the list
//   must still be quoting something true.

export interface FactSource {
  title: string;
  publisher: string;
  url: string;
  read: string; // YYYY-MM-DD
}

export interface KeyFact {
  id: string;
  text: string;
  source: keyof typeof SOURCES;
  routes: string[];
}

export const SOURCES = {
  shopifyWebhooks: {
    title: 'Troubleshooting webhooks',
    publisher: 'Shopify',
    url: 'https://shopify.dev/docs/apps/build/webhooks/troubleshooting-webhooks',
    read: '2026-10-19',
  },
  shopifyStocky: {
    title: 'Migrating from Stocky to Shopify inventory management',
    publisher: 'Shopify Help Center',
    url: 'https://help.shopify.com/en/manual/products/inventory/transitioning-from-stocky',
    read: '2026-10-19',
  },
  shopifyMetaSharing: {
    title: 'Facebook data sharing',
    publisher: 'Shopify Help Center',
    url: 'https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing',
    read: '2026-10-19',
  },
  shopifyAbandoned: {
    title: 'Recovering abandoned checkouts',
    publisher: 'Shopify Help Center',
    url: 'https://help.shopify.com/en/manual/orders/abandoned-checkouts',
    read: '2026-10-19',
  },
  shopifyFlow: {
    title: 'Shopify Flow',
    publisher: 'Shopify Help Center',
    url: 'https://help.shopify.com/en/manual/shopify-flow',
    read: '2026-10-19',
  },
  metaDedup: {
    title: 'Deduplicate Pixel and Server Events',
    publisher: 'Meta for Developers',
    url: 'https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events',
    read: '2026-10-19',
  },
  metaGraphChangelog: {
    title: 'Graph API Changelog',
    publisher: 'Meta for Developers',
    url: 'https://developers.facebook.com/docs/graph-api/changelog/',
    read: '2026-10-19',
  },
  googleYouTubeApp: {
    title: 'Set up conversion tracking with the Google & YouTube app on Shopify',
    publisher: 'Google Ads Help',
    url: 'https://support.google.com/google-ads/answer/13494537',
    read: '2026-10-19',
  },
  googleDataManager: {
    title: 'Changes to offline click conversion imports',
    publisher: 'Google Ads Developer Blog',
    url: 'https://ads-developers.googleblog.com/2026/05/changes-to-offline-click-conversion.html',
    read: '2026-10-19',
  },
  appsScriptQuotas: {
    title: 'Quotas for Google Services',
    publisher: 'Google for Developers',
    url: 'https://developers.google.com/apps-script/guides/services/quotas',
    read: '2026-10-19',
  },
  appleLtp: {
    title: 'Apple announces powerful new privacy and security features',
    publisher: 'Apple Newsroom',
    url: 'https://www.apple.com/newsroom/2023/06/apple-announces-powerful-new-privacy-and-security-features/',
    read: '2026-10-19',
  },
} satisfies Record<string, FactSource>;

const STOCKY = [
  '/stocky-alternative/',
  '/blog/shopify-stocky-data-export-before-shutdown/',
  '/stocky-swap/',
  '/stocky-migration-risk-scorer/',
  '/stocklog/',
  '/blog/the-ultimate-guide-to-shopify-inventory-management/',
];
const WEBHOOK_PAGES = [
  '/blog/the-complete-guide-to-reliable-shopify-automations/',
  '/make-com-shopify/',
  '/shopify-google-sheets-automation/',
  '/ultimate-shopify-automation-guide/',
];
const META_PAGES = [
  '/capi-shield/',
  '/blog/shopify-server-side-tracking-complete-setup-guide/',
  '/blog/meta-one-click-conversions-api-shopify/',
  '/blog/shopify-meta-roas-dropped-2026-fix/',
];
const APPS_SCRIPT = [
  '/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/',
  '/autocrat-quota-fix/',
  '/blog/google-sheets-custom-function-errors/',
  '/shopify-google-sheets-automation/',
  '/blog/when-to-upgrade-free-make-google-workspace/',
];

export const KEY_FACTS: KeyFact[] = [
  {
    id: 'webhook-retries',
    text: 'Shopify retries a failed webhook delivery up to eight times over four hours, and removes the webhook subscription if the failures continue.',
    source: 'shopifyWebhooks',
    routes: WEBHOOK_PAGES,
  },
  {
    id: 'webhook-timeout',
    text: 'A Shopify webhook delivery counts as failed if the receiving app does not respond within five seconds.',
    source: 'shopifyWebhooks',
    routes: WEBHOOK_PAGES,
  },
  {
    id: 'stocky-end',
    text: 'Shopify Stocky stopped being available on 31 August 2026, and Shopify gives read-only access to export Stocky data for at least 90 days after that date, without publishing an end date.',
    source: 'shopifyStocky',
    routes: STOCKY,
  },
  {
    id: 'stocky-earliest-close',
    text: 'Counting 90 days from 31 August 2026, the earliest date Stocky’s read-only export window can close is 29 November 2026.',
    source: 'shopifyStocky',
    routes: STOCKY,
  },
  {
    id: 'stocky-exports',
    text: 'Shopify lists three kinds of Stocky record you can export through Stocky’s own reports: completed purchase order reports as CSV files, stocktake history, and historical cost data.',
    source: 'shopifyStocky',
    routes: ['/stocky-alternative/', '/blog/shopify-stocky-data-export-before-shutdown/', '/stocky-swap/'],
  },
  {
    id: 'stocky-suppliers',
    text: 'Shopify states that suppliers cannot be exported from Stocky, so supplier contacts and terms have to be copied out by hand.',
    source: 'shopifyStocky',
    routes: STOCKY,
  },
  {
    id: 'stocky-delisted',
    text: 'Stocky was delisted from the Shopify App Store on 2 February 2026.',
    source: 'shopifyStocky',
    routes: ['/stocky-alternative/', '/blog/shopify-stocky-data-export-before-shutdown/'],
  },
  {
    id: 'meta-sharing-capi',
    text: 'In Shopify’s Facebook & Instagram app, the Enhanced and Maximum customer data sharing levels both send events through Meta’s Conversions API as well as the Meta pixel; the Standard level uses the pixel only.',
    source: 'shopifyMetaSharing',
    routes: [...META_PAGES, '/blog/how-to-fix-shopify-conversion-tracking-after-ios-updates/', '/shopify-vs-meta-attribution-gap-calculator/'],
  },
  {
    id: 'meta-dedup',
    text: 'Meta deduplicates a pixel event and a Conversions API event only when the event name and the event ID match, and it discards a repeat that arrives within 48 hours of the first.',
    source: 'metaDedup',
    routes: [...META_PAGES, '/meta-capi-payload-validator/'],
  },
  {
    id: 'meta-graph-v19',
    text: 'Meta’s Graph API v19.0 was available until 21 May 2026, so a Conversions API request still written against v19.0 is on a retired version; v26.0 was released on 29 July 2026.',
    source: 'metaGraphChangelog',
    routes: ['/capi-shield/', '/meta-capi-payload-validator/', '/blog/shopify-server-side-tracking-complete-setup-guide/'],
  },
  {
    id: 'google-enhanced-toggle',
    text: 'In Shopify’s Google & YouTube app, enhanced conversions are turned on under Settings, then Google Ads settings, then Enhanced conversions, after agreeing to Google’s customer data terms.',
    source: 'googleYouTubeApp',
    routes: ['/shopify-google-ads-conversion-tracking/', '/blog/shopify-server-side-tracking-complete-setup-guide/', '/blog/how-to-fix-shopify-conversion-tracking-after-ios-updates/'],
  },
  {
    id: 'google-default-actions',
    text: 'When a Google Ads account is linked through Shopify’s Google & YouTube app, purchase, add to cart and checkout started are the suggested default conversion actions.',
    source: 'googleYouTubeApp',
    routes: ['/shopify-google-ads-conversion-tracking/'],
  },
  {
    id: 'google-data-manager',
    text: 'On 15 May 2026 Google announced that offline click conversion imports are moving from the Google Ads API to the Data Manager API, and from 15 June 2026 the Google Ads API stopped accepting new adopters of that import.',
    source: 'googleDataManager',
    routes: ['/shopify-google-ads-conversion-tracking/', '/blog/shopify-server-side-tracking-complete-setup-guide/'],
  },
  {
    id: 'apps-script-runtime',
    text: 'A Google Apps Script execution can run for at most 6 minutes on both consumer and Google Workspace accounts, and a custom function for at most 30 seconds.',
    source: 'appsScriptQuotas',
    routes: APPS_SCRIPT,
  },
  {
    id: 'apps-script-daily',
    text: 'Google Apps Script allows 90 minutes of total trigger runtime and 20,000 URL Fetch calls a day on a consumer account, against 6 hours and 100,000 calls on a Google Workspace account.',
    source: 'appsScriptQuotas',
    routes: APPS_SCRIPT,
  },
  {
    id: 'flow-plans',
    text: 'Shopify Flow is a free app on the Basic, Grow, Advanced and Plus plans, but its Send HTTP Request action is limited to Grow, Advanced and Plus.',
    source: 'shopifyFlow',
    routes: ['/ultimate-shopify-automation-guide/', '/make-com-shopify/', '/shopify-automation-guides/', '/blog/the-complete-guide-to-reliable-shopify-automations/'],
  },
  {
    id: 'abandoned-definition',
    text: 'Shopify counts a checkout as abandoned when it stays incomplete for more than ten minutes after the customer has entered their email, and automated recovery emails are set up in the Shopify Messaging app.',
    source: 'shopifyAbandoned',
    routes: ['/blog/shopify-abandoned-cart-recovery-free-2026/', '/replace-klaviyo-free/'],
  },
  {
    id: 'apple-ltp',
    text: 'Apple’s Link Tracking Protection, announced in June 2023 with iOS 17, removes tracking parameters from links in Mail, Messages and Safari Private Browsing.',
    source: 'appleLtp',
    routes: ['/blog/how-to-fix-shopify-conversion-tracking-after-ios-updates/', '/blog/shopify-server-side-tracking-complete-setup-guide/', '/blog/shopify-meta-roas-dropped-2026-fix/', '/shopify-ios-attribution-gap-benchmark/'],
  },
];

export function factsFor(route: string): (KeyFact & { src: FactSource })[] {
  const r = route.endsWith('/') ? route : route + '/';
  return KEY_FACTS.filter((f) => f.routes.includes(r)).map((f) => ({ ...f, src: SOURCES[f.source] }));
}

export function formatReadDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
