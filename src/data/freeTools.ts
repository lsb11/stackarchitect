/**
 * The free range: every free setup guide on this site, in the order the
 * footer and /stack/ list them.
 *
 * One list so the footer's "Free tools" column and the section on /stack/
 * (which the header's "Free tools" link points at) cannot drift apart. Each
 * `line` is checked against the page it describes: say what the setup does,
 * not what it saves. No vendor prices here; they belong on the page with a
 * source and a date.
 */
export interface FreeTool {
  href: string;
  name: string;
  line: string;
}

export const FREE_TOOLS: FreeTool[] = [
  {
    href: '/capi-shield/',
    name: 'CAPI Shield',
    line: "Sends Shopify purchases to Meta's Conversions API from the server, through a free Make.com scenario.",
  },
  {
    href: '/shopify-google-ads-conversion-tracking/',
    name: 'Google Ads conversion tracking',
    line: 'Uploads Shopify purchases to Google Ads server side, and says what Google can match without a click ID.',
  },
  {
    href: '/tiktok-events-api-shopify/',
    name: 'TikTok Events API',
    line: 'Sends a CompletePayment event to TikTok for every paid Shopify order, server to server.',
  },
  {
    href: '/stocky-swap/',
    name: 'Stocky Swap',
    line: 'Logs every Shopify order line to a Google Sheet you own, for stores that relied on Stocky.',
  },
  {
    href: '/shopify-profit-loss-automation/',
    name: 'Live P&L',
    line: "Writes each order's revenue and fees to a Google Sheet that totals monthly profit against your costs.",
  },
  {
    href: '/replace-klaviyo-free/',
    name: 'Replace Klaviyo free',
    line: "Moves your list and email flows to Systeme.io's free plan and connects it to Shopify.",
  },
  {
    href: '/autocrat-quota-fix/',
    name: 'Autocrat Quota Fix',
    line: "Moves Autocrat document runs to Make.com in batches that stay inside Google's Apps Script quota.",
  },
];
