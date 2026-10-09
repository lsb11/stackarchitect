/**
 * Every indexable page on the site, grouped, with a plain label.
 *
 * WHY (9 Oct 2026): the homepage is the only page Google has indexed, which
 * makes it the one page whose links Google is known to follow. Ten sitemap
 * pages had no link from it at all, and the HTML sitemap (/sitemap-page/) was
 * linked from nowhere, omitted the agentic guide (the page third parties cite
 * most) and the Gorgias review, and claimed "140+ pages indexed" when one was.
 * This list renders on both, so every indexable page is one click from the
 * homepage. tests/site-index.test.js fails when it and the built sitemap
 * disagree, in either direction.
 *
 * Labels are nav copy, not titles: short, descriptive, and free of em dashes
 * (content-quality-guard rule 10 applies to src/data strings).
 */
export interface SiteIndexEntry {
  href: string;
  label: string;
}
export interface SiteIndexGroup {
  name: string;
  pages: SiteIndexEntry[];
}

export const SITE_INDEX: SiteIndexGroup[] = [
  {
    name: 'Ad tracking and attribution',
    pages: [
      { href: '/blog/shopify-server-side-tracking-complete-setup-guide/', label: 'Shopify server-side tracking setup, step by step' },
      { href: '/capi-shield/', label: 'CAPI Shield: free Meta Conversions API setup' },
      { href: '/shopify-google-ads-conversion-tracking/', label: 'Fix Shopify Google Ads conversion tracking' },
      { href: '/tiktok-events-api-shopify/', label: 'TikTok Events API for Shopify' },
      { href: '/blog/shopify-meta-roas-dropped-2026-fix/', label: 'Why Shopify Meta ROAS dropped in 2026' },
      { href: '/blog/meta-one-click-conversions-api-shopify/', label: "Meta's one-click Conversions API: what it fixes" },
      { href: '/blog/how-to-fix-shopify-conversion-tracking-after-ios-updates/', label: 'Which iOS privacy changes break Shopify tracking' },
      { href: '/blog/shopify-google-analytics-4-setup-free-2026/', label: 'Set up Google Analytics 4 on Shopify free' },
      { href: '/shopify-attribution-tools-compared/', label: 'Shopify attribution tools compared' },
      { href: '/shopify-ios-attribution-gap-benchmark/', label: 'iOS attribution gap benchmark (open data)' },
    ],
  },
  {
    name: 'AI and agentic commerce',
    pages: [
      { href: '/blog/shopify-agentic-storefronts-setup-guide-2026/', label: 'Shopify Agentic Storefronts: eligibility and limits per channel' },
      { href: '/blog/shopify-ai-playbook-2026/', label: 'The Shopify AI playbook' },
      { href: '/best-ai-tools-shopify/', label: 'Best AI tools for Shopify, ranked by use' },
    ],
  },
  {
    name: 'Inventory, Stocky and P&L',
    pages: [
      { href: '/stocky-alternative/', label: 'Replacing Shopify Stocky: data, deadline, alternatives' },
      { href: '/stocky-swap/', label: 'Free Stocky replacement in Google Sheets' },
      { href: '/blog/shopify-stocky-data-export-before-shutdown/', label: 'Exporting your Stocky data in the read-only window' },
      { href: '/blog/the-ultimate-guide-to-shopify-inventory-management/', label: 'Shopify inventory management in Google Sheets' },
      { href: '/shopify-google-sheets-automation/', label: 'Shopify orders and inventory to Google Sheets' },
      { href: '/shopify-profit-loss-automation/', label: 'Shopify P&L that updates itself' },
      { href: '/stocklog/', label: 'StockLog: stock history for Shopify' },
    ],
  },
  {
    name: 'Email, support and conversion',
    pages: [
      { href: '/replace-klaviyo-free/', label: 'Replace Klaviyo free: Systeme.io and GetResponse' },
      { href: '/blog/shopify-abandoned-cart-recovery-free-2026/', label: 'Free abandoned cart recovery' },
      { href: '/blog/tidio-for-shopify-complete-setup-guide/', label: 'Tidio for Shopify: setup, and when free is enough' },
      { href: '/blog/tidio-vs-gorgias-shopify/', label: 'Tidio vs Gorgias vs Zendesk' },
      { href: '/gorgias-shopify-guide/', label: 'Gorgias review: when it is worth it' },
      { href: '/blog/shopify-conversion-rate-optimisation-free-2026/', label: 'Shopify conversion rate optimisation with free tools' },
      { href: '/blog/shopify-bfcm-automation-checklist-2026/', label: 'BFCM automation checklist' },
    ],
  },
  {
    name: 'Automation, Make.com and Apps Script',
    pages: [
      { href: '/ultimate-shopify-automation-guide/', label: 'Shopify automation guide: the whole stack' },
      { href: '/make-com-shopify/', label: 'Make.com for Shopify: free setup' },
      { href: '/blog/the-complete-guide-to-reliable-shopify-automations/', label: 'Reliable Shopify automations: architecture' },
      { href: '/blog/when-to-upgrade-free-make-google-workspace/', label: 'When to upgrade free Make.com or Google Workspace' },
      { href: '/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/', label: 'Google Apps Script quotas: every limit and error' },
      { href: '/blog/google-sheets-custom-function-errors/', label: 'Google Sheets custom function errors fixed' },
      { href: '/autocrat-quota-fix/', label: 'Autocrat stopping mid-merge: the quota fix' },
    ],
  },
  {
    name: 'Free tools and calculators',
    pages: [
      { href: '/tools/', label: 'All free tools' },
      { href: '/meta-capi-payload-validator/', label: 'Meta Conversions API payload validator' },
      { href: '/meta-emq-score-estimator/', label: 'Meta EMQ match-key checker' },
      { href: '/shopify-vs-meta-attribution-gap-calculator/', label: 'Shopify vs Meta attribution gap calculator' },
      { href: '/make-vs-zapier-cost-calculator/', label: 'Make.com vs Zapier cost calculator' },
      { href: '/shopify-app-cost-calculator/', label: 'Shopify app cost calculator' },
      { href: '/shopify-app-stack-kill-or-keep-auditor/', label: 'App stack kill-or-keep auditor' },
      { href: '/stocky-migration-risk-scorer/', label: 'Stocky migration risk scorer' },
    ],
  },
  {
    name: 'Apps, stacks and costs',
    pages: [
      { href: '/apps/', label: 'Shopify app pricing index, sourced and dated' },
      { href: '/best-free-shopify-apps-2026/', label: 'Best free Shopify apps by category' },
      { href: '/stack/', label: 'The recommended free Shopify stack' },
      { href: '/shopify-app-development-cost/', label: 'What a custom Shopify app costs' },
      { href: '/shopify-automation-guides/', label: 'All Shopify automation guides' },
      { href: '/pro/', label: 'Ready-made Make.com blueprints' },
    ],
  },
  {
    name: 'About this site',
    pages: [
      { href: '/about/', label: 'About Luke Sandelands' },
      { href: '/how-we-test/', label: 'How we test and verify every claim' },
      { href: '/', label: 'Home' },
    ],
  },
];

export const SITE_INDEX_HREFS: string[] = SITE_INDEX.flatMap((g) => g.pages.map((p) => p.href));
