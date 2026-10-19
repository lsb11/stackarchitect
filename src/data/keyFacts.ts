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
  tiktokDedup: {
    title: 'About event deduplication',
    publisher: 'TikTok Ads Help Center',
    url: 'https://ads.tiktok.com/help/article/event-deduplication',
    read: '2026-10-19',
  },
  metaCustomerParams: {
    title: 'Customer Information Parameters',
    publisher: 'Meta for Developers',
    url: 'https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters',
    read: '2026-10-19',
  },
  metaServerEvent: {
    title: 'Server Event Parameters',
    publisher: 'Meta for Developers',
    url: 'https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event',
    read: '2026-10-19',
  },
  metaDatasetQuality: {
    title: 'Dataset Quality API',
    publisher: 'Meta for Developers',
    url: 'https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api',
    read: '2026-10-19',
  },
  shopifyAgentic: {
    title: 'Agentic storefronts',
    publisher: 'Shopify Help Center',
    url: 'https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts',
    read: '2026-10-19',
  },
  shopifyAppBilling: {
    title: 'App charges on your Shopify bills',
    publisher: 'Shopify Help Center',
    url: 'https://help.shopify.com/en/manual/your-account/manage-billing/your-invoice/apps',
    read: '2026-10-19',
  },
  shopifyRevShare: {
    title: 'Revenue share',
    publisher: 'Shopify',
    url: 'https://shopify.dev/docs/apps/launch/distribution/revenue-share',
    read: '2026-10-19',
  },
  zapierTasks: {
    title: 'How is task usage measured in Zapier?',
    publisher: 'Zapier Help Center',
    url: 'https://help.zapier.com/hc/en-us/articles/8496196837261-How-is-task-usage-measured-in-Zapier',
    read: '2026-10-19',
  },
  makeCredits: {
    title: 'Credits',
    publisher: 'Make Help Center',
    url: 'https://help.make.com/credits',
    read: '2026-10-19',
  },
  tidioPricing: {
    title: 'Pricing',
    publisher: 'Tidio',
    url: 'https://www.tidio.com/pricing/',
    read: '2026-10-19',
  },
  gorgiasPricing: {
    title: 'Pricing',
    publisher: 'Gorgias',
    url: 'https://www.gorgias.com/pricing',
    read: '2026-10-19',
  },
  shopifyGa4: {
    title: 'Setting up Google Analytics 4',
    publisher: 'Shopify Help Center',
    url: 'https://help.shopify.com/en/manual/reports-and-analytics/google-analytics/google-analytics-setup',
    read: '2026-10-19',
  },
  googleShopifyTag: {
    title: 'Shopify: Set up your Google tag',
    publisher: 'Google Analytics Help',
    url: 'https://support.google.com/analytics/answer/12183125',
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
  {
    id: 'tiktok-dedup',
    text: 'TikTok deduplicates a Pixel event and an Events API event only when both carry the same event name and the same event_id, and it matches duplicates within 48 hours of the first event.',
    source: 'tiktokDedup',
    routes: ['/tiktok-events-api-shopify/', '/blog/shopify-server-side-tracking-complete-setup-guide/', '/shopify-attribution-tools-compared/'],
  },
  {
    id: 'meta-hashing',
    text: 'Meta’s Conversions API requires email, phone, name, date of birth, gender, city, state, postcode and country to be SHA-256 hashed, with email trimmed and lowercased first, and requires client IP address, user agent, fbc and fbp to be sent unhashed.',
    source: 'metaCustomerParams',
    routes: ['/meta-capi-payload-validator/', '/capi-shield/', '/meta-emq-score-estimator/', '/blog/shopify-server-side-tracking-complete-setup-guide/', '/tools/'],
  },
  {
    id: 'meta-event-time',
    text: 'Meta’s Conversions API expects event_time as a Unix timestamp in seconds, and rejects the whole request if any event in it is more than 7 days old.',
    source: 'metaServerEvent',
    routes: ['/meta-capi-payload-validator/', '/capi-shield/', '/blog/shopify-server-side-tracking-complete-setup-guide/'],
  },
  {
    id: 'meta-emq',
    text: 'Meta’s Event Match Quality is a score out of 10, calculated from which customer information parameters your server sends, how good that information is, and how many events match a Meta account.',
    source: 'metaDatasetQuality',
    routes: ['/meta-emq-score-estimator/', '/meta-capi-payload-validator/', '/capi-shield/'],
  },
  {
    id: 'agentic-channels',
    text: 'Shopify’s agentic storefronts list products in AI channels including ChatGPT, Google AI Mode and Gemini, Microsoft Copilot and Meta, are active by default for eligible stores, and are managed under Sales channels, then Agentic.',
    source: 'shopifyAgentic',
    routes: ['/blog/shopify-ai-playbook-2026/', '/best-ai-tools-shopify/', '/'],
  },
  {
    id: 'app-billing',
    text: 'Shopify bills app subscriptions on their own 30-day cycle, separate from the plan’s, and uninstalling an app stops future cycles but does not cancel a charge already generated.',
    source: 'shopifyAppBilling',
    routes: ['/apps/', '/shopify-app-cost-calculator/', '/shopify-app-stack-kill-or-keep-auditor/', '/best-free-shopify-apps-2026/', '/', '/tools/'],
  },
  {
    id: 'app-revshare',
    text: 'Shopify takes 0% of the first US$1,000,000 of lifetime gross app revenue and 15% of revenue beyond that, and an app built for a single merchant does not have to be registered on the Shopify App Store.',
    source: 'shopifyRevShare',
    routes: ['/shopify-app-development-cost/'],
  },
  {
    id: 'zapier-tasks',
    text: 'Zapier counts a task for each successful action; triggers, Filter and Paths steps and Formatter steps do not use tasks.',
    source: 'zapierTasks',
    routes: ['/make-vs-zapier-cost-calculator/', '/make-com-shopify/', '/stack/', '/ultimate-shopify-automation-guide/'],
  },
  {
    id: 'make-credits',
    text: 'Make charges one credit per module operation by default, and modules that use Make’s own AI provider connection also charge for the tokens they use.',
    source: 'makeCredits',
    routes: ['/make-vs-zapier-cost-calculator/', '/make-com-shopify/', '/stack/', '/blog/when-to-upgrade-free-make-google-workspace/', '/pro/'],
  },
  {
    id: 'tidio-lyro',
    text: 'Tidio’s Free plan includes 50 Lyro AI conversations for the lifetime of the account, not per month; refreshing them monthly needs the Lyro AI Agent plan.',
    source: 'tidioPricing',
    routes: ['/blog/tidio-for-shopify-complete-setup-guide/', '/blog/tidio-vs-gorgias-shopify/'],
  },
  {
    id: 'gorgias-ai',
    text: 'Gorgias offers its AI Agent on every plan and charges for it only when it resolves a conversation; its helpdesk is priced by monthly ticket volume, not per agent.',
    source: 'gorgiasPricing',
    routes: ['/gorgias-shopify-guide/', '/blog/tidio-vs-gorgias-shopify/'],
  },
  {
    id: 'ga4-connect',
    text: 'Shopify connects Google Analytics 4 through the Google & YouTube sales channel, which adds the Google tag to the store.',
    source: 'shopifyGa4',
    routes: ['/blog/shopify-google-analytics-4-setup-free-2026/', '/blog/shopify-conversion-rate-optimisation-free-2026/'],
  },
  {
    id: 'ga4-events',
    text: 'Through the Google & YouTube app, viewing a collection sends a view_item_list event to GA4, viewing the cart sends view_cart, removing an item sends remove_from_cart, and entering shipping details sends add_shipping_info.',
    source: 'googleShopifyTag',
    routes: ['/blog/shopify-google-analytics-4-setup-free-2026/', '/blog/shopify-conversion-rate-optimisation-free-2026/'],
  },
];

// Facts that also belong on pages outside their topic cluster.
const EXTRA: Record<string, string[]> = {
  'webhook-retries': ['/blog/shopify-bfcm-automation-checklist-2026/', '/shopify-profit-loss-automation/', '/pro/'],
  'webhook-timeout': ['/blog/shopify-bfcm-automation-checklist-2026/'],
  'stocky-earliest-close': ['/blog/shopify-bfcm-automation-checklist-2026/', '/'],
  'abandoned-definition': ['/blog/shopify-bfcm-automation-checklist-2026/', '/blog/shopify-conversion-rate-optimisation-free-2026/'],
  'apps-script-runtime': ['/shopify-profit-loss-automation/', '/tools/'],
  'meta-sharing-capi': ['/shopify-attribution-tools-compared/', '/', '/pro/'],
  'meta-dedup': ['/shopify-attribution-tools-compared/'],
  'apple-ltp': ['/shopify-attribution-tools-compared/'],
  'google-enhanced-toggle': ['/'],
  'flow-plans': ['/stack/'],
};
for (const f of KEY_FACTS) {
  f.routes = [...new Set([...f.routes, ...(EXTRA[f.id] ?? [])])];
}

export function factsFor(route: string): (KeyFact & { src: FactSource })[] {
  const r = route.endsWith('/') ? route : route + '/';
  return KEY_FACTS.filter((f) => f.routes.includes(r)).map((f) => ({ ...f, src: SOURCES[f.source] }));
}

export function formatReadDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
