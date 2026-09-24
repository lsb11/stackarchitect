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

/**
 * Complete Kit, one-time. Was 24 until 18 Sep 2026, and 29 before that; both
 * are listed as `retired` in src/data/claims.json, so a stray old figure next
 * to the kit's name fails the build.
 */
export const KIT_PRICE = 19.99;

/** Any one blueprint, one-time. */
export const SINGLE_PRICE = 9.99;

/*
 * There are exactly two things to buy: one blueprint, or the kit. A $14
 * post-purchase upgrade (single → full kit) existed as a constant until
 * 18 Sep 2026 but never had a Stripe link; at a $19.99 kit it would have cost
 * a single buyer more than buying the kit outright, so it was removed rather
 * than repriced. The success page now points at the kit instead.
 */

/* ---------------------------------------------------------------------------
 * StockLog — our Shopify app, and the only RECURRING price we set.
 *
 * It is not a Product in the sense the PRODUCTS array below means. There is no
 * Stripe link, no blueprint file and no Drive folder, because Shopify bills it
 * and Shopify delivers it, so giving it a Product entry would mean four empty
 * fields and a `steps` array describing an install we do not run. What it does
 * share with the kit prices is the only property that matters to this file: it
 * is a number we chose, and it was being spelled out by hand in four places
 * plus two static text files under public/.
 *
 * The unit is load-bearing and is not decoration. $7.99 one-time and
 * $7.99/month are different products, and src/data/claims.json recorded this
 * one as "USD one-time" until 4 Sep 2026 while the schema on /about/ had
 * already been asserting a UnitPriceSpecification of MONTH beside it.
 * ------------------------------------------------------------------------ */

/** StockLog, per month. Billed by Shopify, not through our Stripe account. */
export const STOCKLOG_PRICE = 7.99;

/** Billing period, spelled as schema.org's UnitPriceSpecification unitText. */
export const STOCKLOG_UNIT = 'MONTH';

/** Free trial before the first charge, in days. */
export const STOCKLOG_TRIAL_DAYS = 7;

/** Where the app lives until the App Store listing is approved. */
export const STOCKLOG_URL = 'https://stocklog.onrender.com/';

/**
 * StockLog's Shopify App Store listing. Every install button on the site reads
 * this: /stocklog/ and StockLogPromo.astro. PLACEHOLDER: this is the App Store
 * root, not the listing. Swap in the real listing URL here and nowhere else.
 */
export const STOCKLOG_APP_STORE_URL = 'https://apps.shopify.com/';

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

/** One row of "when it breaks": what the buyer sees, why, and how to confirm. */
export interface FailureMode {
  symptom: string;
  cause: string;
  check: string;
}

/** One step of the full walkthrough, finer-grained than the three-step `steps`. */
export interface SetupStep {
  title: string;
  body: string;
}

export interface Product {
  slug: string;
  name: string;
  /**
   * The <title> for /pro/<slug>/. Written per product rather than templated
   * from `name`, because the four titles used to be
   * `${name} — $9.99 Make.com blueprint for Shopify` and differed only by a
   * product code name — "Stocky Swap", "CAPI Shield" — which carries no
   * meaning to anyone who has not already read the site. Four near-identical
   * titles on a four-page cluster is a query-level collision the page text
   * does not have (the four share ~109 words and zero 8-grams with their free
   * guides).
   *
   * Each leads with the job, and none of them competes with the free guide on
   * the same topic: those own the "free"/"$0" framing, and the difference
   * being sold here is a file you import rather than a build you follow.
   * Keep them under 60 characters.
   */
  pageTitle: string;
  blueprint: string;
  tagline: string;
  /** The question the buyer is asking. This is the H1 of the single page. */
  problem: string;
  /**
   * What the file does, in the buyer's words and without the product's code
   * name. Opens the answer paragraph under the H1, so a first-time reader
   * learns the job before they meet "CAPI Shield" or "Stocky Swap".
   */
  job: string;
  /** Who should buy this one file. Rendered in "Which one is right for you". */
  buyIf: string;
  /** Who should use the free guide instead. Same section. */
  guideIf: string;
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
  /**
   * What the paid apps in `replaces` do that this file does not, in prose.
   * Deliberately carries no vendor prices: the figures in `replaces` are
   * unverified (see the VERIFY note above), and repeating them here would
   * double the surface that needs checking.
   */
  replacesNote: string;
  /** What the buyer needs in hand before importing. */
  prerequisites: string[];
  /** The full walkthrough, from the Drive folder to a verified first event. */
  setup: SetupStep[];
  failureModes: FailureMode[];
  faq: Faq[];
}

export const KIT_STRIPE_URL = 'https://buy.stripe.com/00w28k3fLcbJb7P3lffrW07';

export const PRODUCTS: Product[] = [
  {
    slug: 'stocky-swap',
    pageTitle: 'Shopify Inventory to Sheets — Import-Ready Blueprint',
    name: 'Stocky Swap',
    blueprint: 'Blueprint 03',
    tagline: 'Live inventory to Google Sheets',
    problem: 'Stocky is gone and I have no inventory tracking.',
    job:
      "Writes every unit sold through Shopify into a Google Sheet you own, one row per order line as each order is paid, so you keep a record of what sold and when.",
    buyIf:
      "You relied on Stocky to know what sold and when, that record is the thing you need back, and you do not need the other three automations.",
    guideIf:
      "You have built a Make scenario before and are happy to lay out the Sheet and map the columns yourself. The free guide builds the same ledger.",
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
    replacesNote:
      "Linnworks, Skubana and Inventory Planner are inventory systems in the full sense: purchase orders, supplier lead times, demand forecasts, warehouse locations. Stocky Swap is none of that. It is a sales ledger — every unit that leaves through a Shopify order is written to a Sheet you own, as it happens. If what you relied on Stocky for was knowing what sold and when, that is the whole job, and a monthly subscription to a forecasting suite pays for screens you will not open. If you raise purchase orders against suppliers every week, one of those tools is the right call, and this page is not trying to argue you out of it.",
    prerequisites: [
      "Shopify admin access that reaches Settings → Notifications. The store owner has it; a staff account needs the settings permission.",
      "A Make.com account. This one scenario fits inside Make’s free plan.",
      "A Google account with Drive, which is where your copy of the Sheet will live.",
      "SKUs on your variants. The ledger reads the SKU from each order line, and a variant without one writes an empty cell that cannot be totalled against anything.",
      "An opening stock count. The ledger records movement, not levels, so the first rows you add by hand should be today’s quantities for the sales to count down from.",
    ],
    setup: [
      {
        title: "Download both files from the Drive folder",
        body: "Your Stripe receipt links to a Drive folder holding the JSON blueprint and the Excel template. Save the JSON to your computer — Make imports from a local file, not from a Drive link.",
      },
      {
        title: "Import into an empty scenario",
        body: "In Make, open Scenarios and start a new one, then use the three-dot menu at the foot of the editor and pick Import Blueprint. Choose the JSON. The editor redraws the whole chain: the webhook that receives each order, the iterator that splits it into lines, and the Sheets step that writes each line.",
      },
      {
        title: "Turn the template into a Google Sheet",
        body: "Upload SA_Template_1 to Drive and open it with Google Sheets so it converts; the scenario writes to a Google Sheet, not to an .xlsx file stored in Drive. Leave the tab called Inventory_Log named exactly that — the scenario finds it by name.",
      },
      {
        title: "Connect Google and pick the Sheet",
        body: "Open the Sheets step, add a connection to your Google account, and select the converted spreadsheet in the file picker. The column mapping is already done; nothing else in that step needs touching.",
      },
      {
        title: "Give Shopify the webhook address, then switch on",
        body: "Click the webhook step and copy its address. In Shopify Admin, go to Settings, then Notifications, scroll down to Webhooks and create one on the Order payment event in JSON format with that address. Save it, then turn the scenario on in Make so it runs whenever an order arrives.",
      },
      {
        title: "Prove it with one order",
        body: "Buy something with a SKU — a cheap real order you refund, or a checkout through Shopify’s test payment gateway. Once the run finishes there should be one new row per line: time, SKU, a negative quantity, the order ID, the product title and a note. Delete the test rows once you have seen them.",
      },
    ],
    failureModes: [
      {
        symptom: "A paid order produced no rows at all.",
        cause: "The scenario is switched off, or Shopify is posting to an old address. Every fresh import gets a fresh webhook URL, so a re-import leaves the Shopify webhook pointing at nothing.",
        check: "In Make, confirm the scenario toggle is on and look in History for a run at the time of the order. No run means Shopify never reached it: compare the address in the Shopify webhook list with the one on the webhook step.",
      },
      {
        symptom: "Rows arrive with the SKU column empty.",
        cause: "That variant has no SKU in Shopify.",
        check: "Open the product in Shopify and add a SKU to each variant. The scenario only fixes orders from then on, so correct the blank rows already in the ledger by hand.",
      },
      {
        symptom: "Make shows runs, but the Sheet stops filling.",
        cause: "The Google connection has lapsed — changing your Google password or removing Make’s access revokes it — or someone renamed the tab. The Sheets step is set to ignore errors, so the run can still finish without an alert.",
        check: "Open the latest run and click the Sheets step. An authorisation error means reconnect Google; a message that the sheet cannot be found means the tab no longer reads Inventory_Log.",
      },
      {
        symptom: "Rows stop partway through the month.",
        cause: "The Make account has used its monthly credit allowance. Each order line is a separate write, so large baskets use more than single-item orders.",
        check: "Make’s organisation dashboard shows usage against the allowance. Compare the ledger with Shopify’s order list for the gap and enter the missing lines by hand.",
      },
    ],
    faq: [
      {
        q: 'Can it import my existing Stocky history?',
        a: 'No. Stocky Swap logs forward from the next order it sees and does not import history. Export your Stocky purchase orders, stocktakes and supplier records separately: Shopify says read-only export stays open for at least 90 days after 31 August 2026, and has published no end date. The sooner Stocky Swap is switched on, the fewer new orders fall outside the log.',
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
        a: 'The free guide at /stocky-swap/ walks through the same scenario module by module and the result is identical on day one. You are paying for the finished file: the line-item loop, the column mapping and the Sheet layout already done, and the afternoon it takes to get them right.',
      },
      {
        q: "Does it record restocks, returns and adjustments?",
        a: "No — only units leaving through paid orders. Add incoming stock as a row with a positive number in the change column and a note such as “PO received”, and the running total stays honest. Returns go in the same way.",
      },
      {
        q: "Will it slow down my storefront or checkout?",
        a: "No. Nothing is installed on the storefront. Shopify hands the order to Make after payment, server to server, so the shopper’s page is never waiting on it.",
      },
    ],
  },
  {
    slug: 'capi-shield',
    pageTitle: 'Meta CAPI — Import-Ready Shopify Blueprint',
    name: 'CAPI Shield',
    blueprint: 'Blueprint 01',
    tagline: 'Meta Conversions API purchase events, server-side',
    problem: 'iOS and ad blockers are eating my Meta conversions.',
    job:
      "Sends every paid Shopify order to Meta’s Conversions API from the server, with the customer’s details hashed for matching, so the purchase can reach your ad account even when the browser pixel is blocked.",
    buyIf:
      "You advertise on Meta, Ads Manager reports fewer purchases than Shopify, and nothing else — Shopify’s own Facebook & Instagram app included — is already sending purchases to Meta from the server.",
    guideIf:
      "You want to see and adapt every field that goes to Meta, or you mainly want to understand how server-side events work. The free guide walks through the same request.",
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
        body: 'The blueprint ships with placeholders where your secrets go: your Meta pixel ID and Conversions API access token. Paste yours in — nothing is shared, nothing is proxied through us. Then delete the Google Ads route: as shipped it cannot match orders.',
        tool: 'Meta Events Manager',
      },
      {
        time: '~2 min',
        title: 'Add the webhook and fire a test event',
        body: 'Add an Order payment webhook in Shopify Admin, then place a test order. Meta Events Manager should show a server event arriving with a match quality score against the hashed email, phone, name, IP and user-agent the blueprint sends.',
        tool: 'Shopify Admin · Events Manager',
      },
    ],
    replacesNote:
      "Elevar, Stape, Littledata and Triple Whale each do more than deliver purchases to Meta: hosted server containers, full-funnel events, attribution dashboards, a support team. If the purchase signal is what you pay them for, that is the part CAPI Shield ships as a file. What it will not do: send ViewContent or AddToCart from the server, model multi-touch attribution, give you a reporting screen, or match orders in Google Ads. Your browser pixel keeps covering the top of the funnel; this covers the order. If the dashboards are what you use, keep paying for them.",
    prerequisites: [
      "Meta Business access with permission to generate a Conversions API token for your pixel (Meta now calls it a dataset) in Events Manager.",
      "A Make.com account, and Shopify admin access that reaches Settings → Notifications.",
      "A decision about Shopify’s own Meta connection. If the Facebook & Instagram app is on Maximum data sharing, Shopify is already sending server events, and running both without matching event IDs counts some purchases twice.",
      "A privacy policy that tells customers their order details are shared with advertising platforms.",
    ],
    setup: [
      {
        title: "Import the file into a new scenario",
        body: "Save Blueprint 01_CAPI_Shield.json from the Drive folder, then in Make start a new scenario and choose Import Blueprint from the three-dot menu in the editor. You should see one webhook, a step that prepares and hashes the customer fields, and a router with a Meta branch and a Google branch.",
      },
      {
        title: "Generate the Meta token",
        body: "In Events Manager, select your dataset, open its Settings tab and generate a Conversions API access token. Copy it together with the dataset ID shown on the same screen. Treat the token like a password: whoever holds it can send events in your store’s name.",
      },
      {
        title: "Fill in the Meta branch",
        body: "Open the Meta request step and replace the two placeholders — dataset ID and token — with yours. Leave the request body as it is; the field names and the hashing are what Meta checks each event against.",
      },
      {
        title: "Delete the Google route",
        body: "Google attributes this kind of upload by the click ID an ad visit leaves behind, and the order Shopify hands to Make does not carry one, so as shipped the Google branch finds no match for most orders. Right-click the Google step and delete it, so each order spends credits on the Meta branch alone. Keep it only if you are rebuilding it, and set its two consent fields, which ship as Unspecified, to match your own consent setup.",
      },
      {
        title: "Point Shopify at the webhook and switch on",
        body: "Copy the address from the webhook step. In Shopify Admin, under Settings → Notifications → Webhooks, create a webhook on Order payment in JSON with that address, save it, and turn the scenario on.",
      },
      {
        title: "Confirm it in Test Events",
        body: "Open Test Events in Events Manager, then place an order — a cheap real one you refund, or one through Shopify’s test gateway. A Purchase should appear from the server. If your browser pixel fires as well, the pair should read as one deduplicated event, not two.",
      },
    ],
    failureModes: [
      {
        symptom: "Make shows successful runs, but Meta shows no server events.",
        cause: "The Meta step is set to carry on past an error, so a rejected request still ends as a green run in Make’s history. The usual rejection is a mistyped dataset ID, a token issued for a different business, or a Graph API version in the URL that Meta has retired.",
        check: "Open a run, click the Meta step and read the response body. Meta answers events_received: 1 when it accepted the event; anything else comes with a message naming the problem.",
      },
      {
        symptom: "Purchases in Ads Manager jump to roughly double.",
        cause: "Two server-side senders are reporting the same order — this scenario plus Shopify’s own Meta integration or another tracking app — with event IDs that do not match.",
        check: "Events Manager’s Overview lists the sources feeding each event and whether they are being deduplicated. Switch one server sender off, or make both send the same event ID.",
      },
      {
        symptom: "Event Match Quality stays low.",
        cause: "The score is calculated across many events, so one test order tells you very little. A score that stays low usually means most checkouts do not collect a phone number, which leaves email carrying the match on its own.",
        check: "Wait for a few days of real orders, then open the score’s breakdown in Events Manager. It lists which customer parameters are missing and how often.",
      },
      {
        symptom: "Events stop arriving months after setup.",
        cause: "The token was revoked — for example, the Conversions API system user was removed during a clean-up of Business Settings — or Meta retired the Graph API version named in the request URL.",
        check: "Read the Meta step’s response in the latest run. For a token error, generate a new token in Events Manager and paste it in; for a version error, move the URL to a current version from Meta’s changelog. Send one order through to confirm.",
      },
    ],
    faq: [
      {
        q: 'Where does the hashing happen?',
        a: 'Inside the scenario, in your own Make.com account, before anything leaves for Meta. Email and first and last name are lowercased and trimmed, then SHA-256 hashed. The phone number only has its spaces removed before hashing, so a plus sign, dashes or brackets stay in and the hash will not match Meta’s digits-only format. An order with no phone number sends the hash of an empty string rather than leaving the field out.',
      },
      {
        q: 'Does this replace my Meta pixel?',
        a: 'No. It runs alongside it. The browser pixel keeps firing for the visitors it can still see; the server-side events cover the ones it cannot, which is the point of the Conversions API.',
      },
      {
        q: 'Does it send to Google Ads as well?',
        a: 'Not reliably, as shipped. The Google step uploads a click conversion keyed on a Google click ID, and Shopify’s order data has no field for one, so most orders reach Google with nothing to match on. Google is also moving this upload method, offline click conversion import, out of the Google Ads API and into its Data Manager API, and Make’s Google Ads module now warns that uploads may fail for developer tokens that have not recently sent click conversions. Treat CAPI Shield as a Meta product until the Google branch is rebuilt; the Meta branch does not depend on it. If you keep the Google step, its two consent fields ship as Unspecified: set them to match your own consent setup.',
      },
      {
        q: 'What happens when Meta retires the Graph API version it uses?',
        a: 'Every request to it starts failing. The version is part of the Meta step’s address, and Meta lists the date each one is retired, around two years after release, in its Graph API changelog. Look yours up there, change the address to a current version ahead of that date, and push one order through to check that Meta still accepts the events.',
      },
      {
        q: "Can it run alongside Shopify’s Facebook & Instagram app?",
        a: "Yes, provided only one of them sends purchases from the server, or both use the same event ID. Keeping that app’s browser pixel is fine; the conflict is only ever between two server-side senders.",
      },
      {
        q: "Do I need Google Ads for it to work?",
        a: "No. The Meta branch works on its own. Delete the Google route — as shipped it cannot match orders anyway — and each order then makes one outbound call instead of two.",
      },
    ],
  },
  {
    slug: 'tiktok-capi',
    pageTitle: 'TikTok Events API — Import-Ready Shopify Blueprint',
    name: 'TikTok CAPI',
    blueprint: 'Blueprint 02',
    tagline: 'CompletePayment to TikTok’s Events API, server-side',
    problem: 'My TikTok ads report fewer purchases than Shopify does.',
    job:
      "Sends every paid Shopify order to TikTok’s Events API from the server, with email and phone hashed for matching, so the purchase can reach TikTok even when the browser pixel is blocked.",
    buyIf:
      "You advertise on TikTok, TikTok reports fewer purchases than Shopify, and TikTok’s own Shopify app is not already sending server events for the same pixel.",
    guideIf:
      "You would rather build the request yourself and understand each field in it. The free guide covers the same scenario end to end.",
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
        body: 'In Make.com: Create a new scenario → Import Blueprint → upload Blueprint 02_TikTok_CAPI.json. The Events API payload shape and the CompletePayment mapping arrive built.',
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
        title: 'Add the webhook and read TikTok’s reply',
        body: 'Add an Order payment webhook in Shopify Admin and place a test order. TikTok answers every request with a code, and 0 means it accepted the event; any other code names the problem, even when Make shows the run as green. Then confirm the event in Events Manager.',
        tool: 'Shopify Admin · test event',
      },
    ],
    replacesNote:
      "WeltPixel and Analyzify sell server-side tracking inside wider packages: several ad platforms at once, GA4 clean-up, help with installation. For a store whose TikTok problem is purchases going missing, the part that matters is one server event per paid order with the customer fields hashed for matching. TikTok CAPI is that part as an importable file. It does not send browse or cart events from the server and it reports on nothing — TikTok Ads Manager stays the place you read results.",
    prerequisites: [
      "A TikTok pixel in Events Manager, and an Admin or Operator role on the ad account, which TikTok requires before it will issue an Events API token.",
      "Your pixel code, copied from the pixel’s settings page.",
      "A Make.com account, and Shopify admin access that reaches Settings → Notifications.",
      "A look at TikTok’s own Shopify app first. If it already sends server events for this pixel, running both can count one purchase twice unless the event IDs agree.",
    ],
    setup: [
      {
        title: "Import the file into a new scenario",
        body: "Save Blueprint 02_TikTok_CAPI.json from the Drive folder and import it into a fresh Make scenario from the three-dot menu in the editor. The chain is short: the webhook, a step that hashes email and phone and picks up the shopper’s IP address and browser, and one request to TikTok.",
      },
      {
        title: "Generate an Events API token",
        body: "In TikTok Events Manager, open your pixel, go to its settings and generate an access token for the Events API. Copy the token and the pixel code — both go into Make next.",
      },
      {
        title: "Fill the two placeholders",
        body: "In the request step, the token belongs in the Access-Token header and the pixel code belongs in the body where the placeholder sits. Keep the quote marks either side of the pixel code; remove them and the body stops being valid JSON, which TikTok rejects outright.",
      },
      {
        title: "Point Shopify at the webhook and switch on",
        body: "Copy the address from the webhook step. In Shopify Admin, under Settings → Notifications → Webhooks, create a webhook on Order payment in JSON with that address, save it, and turn the scenario on.",
      },
      {
        title: "Check the response, then Events Manager",
        body: "Place an order and open the run in Make. TikTok’s reply on the request step should read code 0 with the message OK. Then find the CompletePayment in Events Manager and confirm its connection method is the Events API.",
      },
      {
        title: "Watch the numbers for a week",
        body: "Compare TikTok’s reported purchases against Shopify’s order count over the next few days. If the gap widens instead of narrowing, go through the list below before putting it down to TikTok being slow.",
      },
    ],
    failureModes: [
      {
        symptom: "Runs appear in Make, but nothing shows in TikTok.",
        cause: "A wrong pixel code, a token issued for a different pixel, or a malformed body. TikTok answers with a non-zero code, and because the request step is set to carry on past errors, the run still looks successful in Make’s history.",
        check: "Open the latest run, click the request step and read TikTok’s reply. A non-zero code arrives with a message that names the field at fault.",
      },
      {
        symptom: "Purchases are counted twice.",
        cause: "Two server-side senders: this scenario and TikTok’s own Shopify app, with event IDs that do not agree.",
        check: "In Events Manager, look at which connection methods are listed against CompletePayment. If both appear, turn one off or align the event IDs.",
      },
      {
        symptom: "Match quality is weaker than expected on some orders.",
        cause: "The IP address and browser fields come from the shopper’s session. Draft orders created in the admin and POS sales have no session, so they match on email and phone alone.",
        check: "Filter the low-quality events by order source. If they are all admin or POS orders, that is expected rather than a fault.",
      },
      {
        symptom: "The token is rejected after working for months.",
        cause: "Someone regenerated it, or the person who created it lost their role on the ad account.",
        check: "Generate a new token from the pixel’s settings, paste it into the Access-Token header, and send one order through to confirm.",
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
        q: 'What happens when TikTok retires the API version it uses?',
        a: 'Every request to it starts failing, and because the request step carries on past errors, the runs still look green in Make. The version is part of the TikTok step’s address. Check it against TikTok’s Events API documentation, change the address to a current version before yours is retired, and push one order through to check that TikTok still answers with code 0.',
      },
      {
        q: 'Can I build this from the free guide instead?',
        a: 'Yes — /tiktok-events-api-shopify/ covers the same scenario end to end and the day-one result is the same. This is the finished file for people who would rather not spend the afternoon.',
      },
      {
        q: "Does it send events for POS and draft orders?",
        a: "It sends whatever reaches Shopify’s Order payment webhook, which includes admin-created and POS orders once they are paid. If you would rather not report those to TikTok, add a filter on the order’s source straight after the webhook.",
      },
      {
        q: "Is TikTok’s own Shopify app enough on its own?",
        a: "It can be. If its data-sharing setting already sends server events and your purchase counts line up with Shopify, you do not need this. The file is for stores where the app’s numbers still fall short, or that want the events flowing through an account they control.",
      },
    ],
  },
  {
    slug: 'pnl-auto',
    pageTitle: 'Shopify P&L to Sheets — Import-Ready Blueprint',
    name: 'P&L Auto',
    blueprint: 'Blueprint 04',
    tagline: 'Per-order revenue, fees, COGS and gross profit into Google Sheets',
    problem: "I don't know which orders actually make money.",
    job:
      "Writes one row per paid Shopify order into a Google Sheet you own, with revenue, an estimated processing fee, the cost of goods from your own cost table, and gross profit.",
    buyIf:
      "You know your unit costs, most of your orders are for a single item, and you want per-order gross profit in a Sheet rather than in a monthly app.",
    guideIf:
      "You want to change the maths — cost every line item, or use your own fee model — and would rather build the scenario knowing how each step works.",
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
    replacesNote:
      "TrueProfit, BeProfit and Glew.io pull ad spend from Meta, Google and TikTok automatically, break profit down by product and channel, and present it on a hosted dashboard. P&L Auto does the per-order arithmetic — revenue, fees, cost of goods, gross profit — and writes it into a workbook you own. Ad spend you enter yourself, weekly or monthly. If your margin questions are about individual orders and SKUs, that trade is worth the subscription you stop paying. If you run spend across many campaigns and want it attributed order by order, the paid tools earn their price.",
    prerequisites: [
      "A unit cost for every SKU you sell. This is the only real work; the workbook cannot work out profit on a product it has no cost for.",
      "The variant ID of every product you sell. COGS_Table is keyed on Shopify’s variant ID, not the SKU; it is in the variant’s admin URL.",
      "A Google account with Drive, and a Make.com account.",
      "Shopify admin access that reaches Settings → Notifications.",
      "Your payment processing rate, so you can check the fee column against a real payout.",
    ],
    setup: [
      {
        title: "Import the file into a new scenario",
        body: "Save Blueprint 04_P_and_L_Auto.json from the Drive folder and import it into a fresh Make scenario from the three-dot menu in the editor.",
      },
      {
        title: "Turn the workbook into a Google Sheet",
        body: "Upload SA_Template_2 to Drive and open it with Google Sheets so it converts. Leave the tab names as they are — the scenario addresses Order_Data and COGS_Table by name.",
      },
      {
        title: "Fill COGS_Table before anything else",
        body: "One row per variant ID with its landed unit cost: what you paid the supplier plus inbound freight and duty, if you want gross profit to mean what it says. Do this before the first live order — an order whose variant is missing from the table is not written at all.",
      },
      {
        title: "Connect Google in every Sheets step",
        body: "The scenario reads COGS_Table and writes Order_Data, so it touches the workbook more than once per order. Connect your Google account and select the converted workbook in each Sheets step.",
      },
      {
        title: "Point Shopify at the webhook and switch on",
        body: "Copy the address from the webhook step. In Shopify Admin, under Settings → Notifications → Webhooks, create a webhook on Order payment in JSON with that address, save it, and turn the scenario on.",
      },
      {
        title: "Reconcile one order by hand",
        body: "Place a test order, then check its row against Shopify: revenue should match the order total, COGS should match your table’s unit cost for the first item, and the fee should sit close to what your processor actually charged. If any figure is off, fix it now — every later row follows the same logic.",
      },
    ],
    failureModes: [
      {
        symptom: "A paid order never appears in Order_Data.",
        cause: "The scenario looks up the order’s cost in COGS_Table by variant ID before it writes the row. When that variant has no row in the table, the lookup returns nothing and the write step never runs, so the whole order is skipped rather than written with a blank cost.",
        check: "Compare Order_Data with Shopify’s order list for the day. For each missing order, add its variant IDs to COGS_Table, then enter the order by hand; the scenario does not go back for it.",
      },
      {
        symptom: "Gross profit looks too good on multi-item orders.",
        cause: "Cost is taken from the first line item’s variant, once. Further lines, and quantities above one, add revenue but no cost.",
        check: "Filter Order_Data for orders with more than one unit and recalculate their COGS from COGS_Table by hand. A healthy-looking month built on large baskets is the one to check first.",
      },
      {
        symptom: "Refunded orders still count as revenue.",
        cause: "The scenario runs on payment, so it writes when money comes in. A refund issued later does not remove the row.",
        check: "Once a month, take the refund total from Shopify’s reports and enter it as a negative row, so the Dashboard nets it off.",
      },
      {
        symptom: "The fee column does not match your payouts.",
        cause: "Processing fees vary with card type, country and plan, and a third-party gateway bills its fee outside Shopify altogether.",
        check: "Compare a week of rows with the fee lines in Shopify’s payouts report. If another gateway takes a cut, its charges will not appear on the order.",
      },
    ],
    faq: [
      {
        q: 'Where do the product costs come from?',
        a: 'From you. You enter a unit cost for each variant in the COGS_Table tab, keyed on Shopify’s variant ID rather than the SKU. The scenario looks up the first line item’s variant only and takes its unit cost once, so an order with several items, or a quantity above one, is under-costed. Nothing guesses your margins, but multi-item orders need checking by hand.',
      },
      {
        q: 'Does it include Shopify payment fees?',
        a: 'It includes an estimate, not your actual fee. The scenario calculates 2.9% of the order total plus $0.30 for every order and writes that to the fee column; the separate payment-fee column is left at 0. Your real rate depends on your Shopify plan, country, card type and payment provider, so check the column against your payouts report and change the rate in the scenario if it differs.',
      },
      {
        q: 'Does it work in my currency?',
        a: 'Yes. The scenario logs whatever currency the Shopify order carries; the Dashboard totals in the same one. No conversion is applied and none is assumed.',
      },
      {
        q: 'Is this a live dashboard or a report I have to run?',
        a: 'Live. Rows arrive as orders are paid and the Dashboard tab re-totals via SUM formulas, so it is current whenever you open it.',
      },
      {
        q: "Can it include ad spend?",
        a: "Yes, entered by hand. Spend lives in Meta, Google and TikTok, not on the Shopify order, so no order webhook can carry it. Enter a weekly or monthly total and subtract it from gross profit to see what the ads actually left you.",
      },
      {
        q: "What about orders from before I switched it on?",
        a: "They are not backfilled. The scenario writes each order as it is paid, from the moment it is on. For earlier months, export orders from Shopify and paste them into Order_Data in the same column order.",
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

/** Formats a price the way it is written on the page: $19.99, $9.99, $9. */
export function formatPrice(n: number): string {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

/**
 * Formats a recurring price the way it is written on the page: $7.99/month.
 *
 * Separate from formatPrice because the interval is the part that goes wrong:
 * a one-time price and a monthly one render identically without it.
 */
export function formatMonthly(n: number): string {
  return `${formatPrice(n)}/month`;
}
