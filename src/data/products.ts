/**
 * products.ts — the single source of truth for what Stack Architect sells.
 *
 * Everything downstream reads from here: /pro/, /pro/{slug}/, the success
 * pages and the inline offer blocks on the guide pages. No price, Stripe URL
 * or file name is hardcoded anywhere else. Changing KIT_PRICE is a one-line
 * change that repoints every surface at once.
 *
 * WHY THE PAGE COPY LIVES HERE TOO
 * `steps` and `faq` are page copy, not data, and the obvious instinct is to
 * leave them in the .astro file. They are here because there are four
 * near-identical single-product pages rendered from one template: copy that
 * lives in the template has to fork on slug, and copy that forks on slug in a
 * template is how the four pages drift apart. Per-product prose belongs beside
 * the per-product price.
 *
 * VERIFY — third-party prices. The figures in `replaces[]` and `savingRange`
 * are carried over verbatim from src/pages/pro.astro, which is quarantined in
 * docs/claims-unverified.json as unverified against vendor sources. They
 * inherit that status; they have NOT been re-checked. Clearing them means
 * opening each vendor's pricing page and dating what you read there.
 * Note also that scripts/claims-guard.mjs reads only the top level of
 * src/pages, so neither this file nor src/pages/pro/ is scanned by it.
 */

/** Complete Kit, one-time. Alt: 29 — one-line change. */
export const KIT_PRICE = 24;

/** Any one blueprint, one-time. */
export const SINGLE_PRICE = 9.99;

/** Post-purchase upgrade from one single to the full four. */
export const UPGRADE_PRICE = 14;

export type Accent = 'green' | 'sky' | 'tiktok' | 'amber';

export interface HowStep {
  /** "~2 min" — shown beside the step number. */
  time: string;
  title: string;
  body: string;
  /** Small mono line under the step: which tool the step happens in. */
  tool: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Product {
  slug: string;
  name: string;
  blueprint: string;
  tagline: string;
  /** The question the buyer is asking. This is the H1 of the single page. */
  problem: string;
  files: string[];
  replaces: { name: string; price: string }[];
  savingRange: string;
  guideUrl: string;
  /** Stripe Payment Link. Empty renders the CTA as a disabled button. */
  stripeUrl: string;
  /** Google Drive folder the Stripe link redirects to, shown on success. */
  driveUrl: string;
  accent: Accent;
  deployTime: string;
  steps: HowStep[];
  faq: Faq[];
}

export const KIT_STRIPE_URL = 'https://buy.stripe.com/9B68wI4jP3Fd8ZH6xrfrW02';

/** TODO: Payment Link for the $14 single → full-kit upgrade (brief §9.2). */
export const UPGRADE_STRIPE_URL = '';

export const PRODUCTS: Product[] = [
  {
    slug: 'stocky-swap',
    name: 'Stocky Swap',
    blueprint: 'Blueprint 03',
    tagline: 'Live inventory to Google Sheets',
    problem: 'Stocky is gone and I have no inventory tracking.',
    files: [
      'Blueprint 03_Stocky_Swap_Inventory.json',
      'SA_Template_1_Stocky_Swap_Inventory.xlsx',
    ],
    replaces: [
      { name: 'Shopify Stocky', price: 'retired' },
      { name: 'Linnworks', price: '' },
      { name: 'Skubana', price: '' },
      { name: 'Inventory Planner', price: '' },
    ],
    savingRange: '$29–$199/mo',
    guideUrl: '/stocky-swap/',
    stripeUrl: 'https://buy.stripe.com/aFa6oA8A51x50tbcVPfrW03',
    driveUrl: 'https://drive.google.com/drive/folders/1tXj9zqcwl26zf336O5OmU_N_zZ2npZIj',
    accent: 'sky',
    deployTime: '~4 min',
    steps: [
      {
        time: '~1 min',
        title: 'Import the blueprint',
        body: 'In Make.com: Create a new scenario → Import Blueprint → upload Blueprint 03_Stocky_Swap_Inventory.json. Every module and field mapping is recreated as it was built.',
        tool: 'Make.com · one click',
      },
      {
        time: '~2 min',
        title: 'Copy the Sheet, paste your credentials',
        body: 'Copy SA_Template_1 into your own Drive — the six-column Inventory_Log is already laid out — then connect your Google account and your Shopify store where the blueprint marks the placeholders.',
        tool: 'Google Sheets · your own connections',
      },
      {
        time: '~1 min',
        title: 'Add the webhook and place a test order',
        body: 'In Shopify Admin → Settings → Notifications → Webhooks, add an Order payment webhook pointing at the Make.com URL. Place a test order and watch the row land: timestamp, SKU, quantity, order ID, product.',
        tool: 'Shopify Admin · no app install',
      },
    ],
    faq: [
      {
        q: 'Can it import my existing Stocky history?',
        a: 'No, and nothing else can either. Stocky’s data was deleted rather than migrated into Shopify Admin. Stocky Swap starts logging from the next order it sees, so the sooner it is switched on the less history you lose.',
      },
      {
        q: 'What exactly lands in the Sheet?',
        a: 'One row per order line item, in six columns: timestamp, SKU, change amount (the quantity sold, as a negative), order ID, product, and a free-text note. It is a running ledger, not a snapshot, so you can total it any way you like.',
      },
      {
        q: 'Do I need a paid Make.com plan?',
        a: 'Not for this one scenario — it runs on Make’s free plan. Make’s free plan caps how many scenarios you can have active at once, so running several blueprints together is what pushes you onto a paid tier.',
      },
      {
        q: 'What if I would rather build it myself?',
        a: 'The free guide at /stocky-swap/ walks through the same scenario module by module and the result is identical on day one. You are paying here for the finished file and the error handling already wired in.',
      },
    ],
  },
  {
    slug: 'capi-shield',
    name: 'CAPI Shield',
    blueprint: 'Blueprint 01',
    tagline: 'Meta Conversions API + Google Ads Enhanced Conversions, server-side',
    problem: 'iOS and ad blockers are eating my Meta and Google conversions.',
    files: ['Blueprint 01_CAPI_Shield.json'],
    replaces: [
      { name: 'Elevar', price: '$225/mo' },
      { name: 'Triple Whale', price: 'GMV-based' },
      { name: 'Stape', price: '$29+/mo' },
      { name: 'Littledata', price: '$159+/mo' },
    ],
    savingRange: '$29–$225/mo',
    guideUrl: '/capi-shield/',
    stripeUrl: 'https://buy.stripe.com/7sY4gsaId4Jhek12hbfrW04',
    driveUrl: 'https://drive.google.com/drive/folders/1x2xGpAhtzHRvsppiwoc0uosgiauUv3do',
    accent: 'green',
    deployTime: '~6 min',
    steps: [
      {
        time: '~1 min',
        title: 'Import the blueprint',
        body: 'In Make.com: Create a new scenario → Import Blueprint → upload Blueprint 01_CAPI_Shield.json. The router that splits each purchase to Meta and to Google Ads comes with it.',
        tool: 'Make.com · one click',
      },
      {
        time: '~3 min',
        title: 'Paste your own API credentials',
        body: 'The blueprint ships with placeholders where your secrets go: Meta pixel ID and Conversions API access token, Google Ads conversion action. Paste yours in — nothing is shared, nothing is proxied through us.',
        tool: 'Meta Events Manager · Google Ads',
      },
      {
        time: '~2 min',
        title: 'Add the webhook and fire a test event',
        body: 'Add an Order payment webhook in Shopify Admin, then place a test order. Meta Events Manager should show a server event arriving with a match quality score against the hashed email, phone, name, IP and user-agent the blueprint sends.',
        tool: 'Shopify Admin · Events Manager',
      },
    ],
    faq: [
      {
        q: 'Where does the hashing happen?',
        a: 'Inside the scenario, in your own Make.com account, before anything leaves for Meta. Email, phone and name are SHA-256 hashed and normalised first — lowercase, trimmed, punctuation stripped — which is the part that is easy to get subtly wrong by hand and quietly costs match quality.',
      },
      {
        q: 'Does this replace my Meta pixel?',
        a: 'No. It runs alongside it. The browser pixel keeps firing for the visitors it can still see; the server-side events cover the ones it cannot, which is the point of the Conversions API.',
      },
      {
        q: 'Does it send to Google Ads as well?',
        a: 'Yes — one router in the same scenario sends Enhanced Conversions to Google Ads off the same order event, so you are not maintaining two separate builds.',
      },
      {
        q: 'What happens when Meta bumps the Graph API version?',
        a: 'You get the updated blueprint. Silent tracking failure after an API deprecation is the expensive part of running this yourself, and it is the part a static guide cannot help with.',
      },
    ],
  },
  {
    slug: 'tiktok-capi',
    name: 'TikTok CAPI',
    blueprint: 'Blueprint 02',
    tagline: 'TikTok Events API v1.3 CompletePayment, server-side',
    problem: 'My TikTok ads report fewer purchases than Shopify does.',
    files: ['Blueprint 02_TikTok_CAPI.json'],
    replaces: [
      { name: 'WeltPixel', price: '$39+/mo' },
      { name: 'Analyzify', price: '$145–$275/mo' },
    ],
    savingRange: '$39–$275/mo',
    guideUrl: '/tiktok-events-api-shopify/',
    stripeUrl: 'https://buy.stripe.com/7sY4gs4jP0t17VDdZTfrW05',
    driveUrl: 'https://drive.google.com/drive/folders/1PjMY5dJsqEczHv7Jea7h_llZN5DT6vDu',
    accent: 'tiktok',
    deployTime: '~6 min',
    steps: [
      {
        time: '~1 min',
        title: 'Import the blueprint',
        body: 'In Make.com: Create a new scenario → Import Blueprint → upload Blueprint 02_TikTok_CAPI.json. The Events API v1.3 payload shape and the CompletePayment mapping arrive built.',
        tool: 'Make.com · one click',
      },
      {
        time: '~3 min',
        title: 'Paste your pixel code and access token',
        body: 'Generate an Events API access token in TikTok Events Manager and paste it, with your pixel code, where the blueprint marks the placeholders. Advanced Matching fields are already mapped to the Shopify order.',
        tool: 'TikTok Events Manager',
      },
      {
        time: '~2 min',
        title: 'Add the webhook and check for a 200',
        body: 'Add an Order payment webhook in Shopify Admin and place a test order. A 200 back from the Events API, and the event visible in Events Manager, means TikTok is now counting the purchases the browser pixel was missing.',
        tool: 'Shopify Admin · test event',
      },
    ],
    faq: [
      {
        q: 'Why does TikTok report fewer purchases than Shopify?',
        a: 'The browser-side pixel is the weak link — iOS restrictions, ad blockers and abandoned sessions all cost it events. A server-side CompletePayment fires from the order itself, so it does not depend on the shopper’s browser cooperating.',
      },
      {
        q: 'Will this double-count against my existing pixel?',
        a: 'Not if the event IDs match, which is what deduplication is for. The blueprint sends an event ID derived from the Shopify order so TikTok can collapse the browser event and the server event into one.',
      },
      {
        q: 'Which API version does it use?',
        a: 'TikTok Events API v1.3, sending CompletePayment with Advanced Matching. If TikTok moves off v1.3, you get the updated blueprint rather than a guide you have to re-follow.',
      },
      {
        q: 'Can I build this from the free guide instead?',
        a: 'Yes — /tiktok-events-api-shopify/ covers the same scenario end to end and the day-one result is the same. This is the finished file for people who would rather not spend the afternoon.',
      },
    ],
  },
  {
    slug: 'pnl-auto',
    name: 'P&L Auto',
    blueprint: 'Blueprint 04',
    tagline: 'Per-order revenue, fees, COGS and gross profit into Google Sheets',
    problem: "I don't know which orders actually make money.",
    files: ['Blueprint 04_P_and_L_Auto.json', 'SA_Template_2_PnL_Auto.xlsx'],
    replaces: [
      { name: 'TrueProfit', price: '$19+/mo' },
      { name: 'BeProfit', price: '$29+/mo' },
      { name: 'Glew.io', price: '' },
    ],
    savingRange: '$19–$99/mo',
    guideUrl: '/shopify-profit-loss-automation/',
    stripeUrl: 'https://buy.stripe.com/5kQfZaeYtdfNb7P8FzfrW06',
    driveUrl: 'https://drive.google.com/drive/folders/1qnL9uKBa86-qvqqk_e4NjE_oU4Ep3prL',
    accent: 'amber',
    deployTime: '~8 min',
    steps: [
      {
        time: '~1 min',
        title: 'Import the blueprint',
        body: 'In Make.com: Create a new scenario → Import Blueprint → upload Blueprint 04_P_and_L_Auto.json. The revenue, fee and COGS lookups are already wired to the template’s tabs.',
        tool: 'Make.com · one click',
      },
      {
        time: '~4 min',
        title: 'Copy the workbook and fill in your COGS',
        body: 'Copy SA_Template_2 into your Drive. It has four tabs: Order_Data, COGS_Table, a Dashboard that totals itself, and a setup tab. The only real work is putting your own unit costs into COGS_Table.',
        tool: 'Google Sheets · your product costs',
      },
      {
        time: '~3 min',
        title: 'Connect, add the webhook, place a test order',
        body: 'Connect your Google account in Make.com, add an Order payment webhook in Shopify Admin, and place a test order. One row per order appears with revenue, fees, COGS and gross profit calculated, and the Dashboard totals move.',
        tool: 'Shopify Admin · test order',
      },
    ],
    faq: [
      {
        q: 'Where do the product costs come from?',
        a: 'From you. The COGS_Table tab is where you enter unit cost per SKU, and the scenario looks each order line up against it. Nothing guesses your margins.',
      },
      {
        q: 'Does it include Shopify payment fees?',
        a: 'Yes — the per-order fee comes through on the order payload and lands in its own column, so gross profit is after fees rather than a revenue-minus-COGS approximation.',
      },
      {
        q: 'Does it work in my currency?',
        a: 'Yes. The scenario logs whatever currency the Shopify order carries; the Dashboard totals in the same one. No conversion is applied and none is assumed.',
      },
      {
        q: 'Is this a live dashboard or a report I have to run?',
        a: 'Live. Rows arrive as orders are paid and the Dashboard tab re-totals via SUM formulas, so it is current whenever you open it.',
      },
    ],
  },
];

/** Look up a product by slug. Returns undefined for an unknown slug. */
export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

/**
 * Stamp a Stripe Payment Link with the CTA that produced the click.
 *
 * `client_reference_id` shows against the payment in the Stripe dashboard, so
 * every CTA is attributable with no analytics setup at all. Source strings are
 * the ones listed in the build brief §5: `pro_hero`, `pro_chooser_{slug}`,
 * `single_{slug}_hero`, `thanks_{slug}_upgrade`, and so on.
 *
 * Returns '' when the link does not exist yet, which is the signal callers use
 * to render a disabled "Coming this week" button instead of a broken link.
 */
export function buildStripeUrl(url: string, source: string): string {
  if (!url) return '';
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}client_reference_id=${encodeURIComponent(source)}`;
}

/** Formats a price the way it is written on the page: $24, $9.99. */
export function formatPrice(n: number): string {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}
