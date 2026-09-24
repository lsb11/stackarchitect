/**
 * The free range: every free setup guide on this site, in the order the
 * footer and /stack/ list them.
 *
 * One list so the footer's "Free tools" column, the header's Free tools
 * disclosure and the section on /stack/ cannot drift apart. Each
 * `line` is checked against the page it describes: say what the setup does,
 * not what it saves. No vendor prices here; they belong on the page with a
 * source and a date.
 *
 * `short` is the one-line descriptor in the header's Free tools disclosure,
 * where `line` would wrap to three lines. Same rule: what it does.
 */
export interface FreeTool {
  href: string;
  name: string;
  short: string;
  line: string;
}

export const FREE_TOOLS: FreeTool[] = [
  {
    href: '/capi-shield/',
    name: 'CAPI Shield',
    short: 'Sends purchases to Meta from the server',
    line: "Sends Shopify purchases to Meta's Conversions API from the server, through a free Make.com scenario.",
  },
  {
    href: '/shopify-google-ads-conversion-tracking/',
    name: 'Google Ads conversion tracking',
    short: 'Uploads purchases to Google Ads server side',
    line: 'Uploads Shopify purchases to Google Ads server side, and says what Google can match without a click ID.',
  },
  {
    href: '/tiktok-events-api-shopify/',
    name: 'TikTok Events API',
    short: 'Sends paid orders to TikTok from the server',
    line: 'Sends a CompletePayment event to TikTok for every paid Shopify order, server to server.',
  },
  {
    href: '/stocky-swap/',
    name: 'Stocky Swap',
    short: 'Logs every order line to a Google Sheet',
    line: 'Logs every Shopify order line to a Google Sheet you own, for stores that relied on Stocky.',
  },
  {
    href: '/shopify-profit-loss-automation/',
    name: 'Live P&L',
    short: 'Totals monthly profit in a Google Sheet',
    line: "Writes each order's revenue and fees to a Google Sheet that totals monthly profit against your costs.",
  },
  {
    href: '/replace-klaviyo-free/',
    name: 'Replace Klaviyo free',
    short: "Moves your email to Systeme.io's free plan",
    line: "Moves your list and email flows to Systeme.io's free plan and connects it to Shopify.",
  },
  {
    href: '/autocrat-quota-fix/',
    name: 'Autocrat Quota Fix',
    short: 'Batches Autocrat runs to stay inside quota',
    line: "Moves Autocrat document runs to Make.com in batches that stay inside Google's Apps Script quota.",
  },
];
