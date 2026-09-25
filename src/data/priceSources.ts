// The vendor pricing pages behind every third-party price this site states,
// and the date a human last read each one.
//
// A page that passes verifiedDate to <Base> is saying every vendor price on it
// was read on that date. <PriceSources ids={[...]} /> prints which pages those
// were, so the claim can be checked by a reader and not just by claims-guard.
//
// READ_DATE is the date the pages below were opened and read. It is not a
// build date and must never be generated. When a price is re-read, change the
// figure on the page, then the date here, in the same commit.
//
// What each page said on the read date is recorded in `read`, in the vendor's
// own terms. Where a vendor publishes no figure (a quote form, an interactive
// calculator with no price in the page), `read` says so and the site states
// no number for it.

export const READ_DATE = '2026-09-25';

export interface PriceSource {
  /** Link text: whose pricing page this is. */
  name: string;
  /** The page that was read. */
  url: string;
  /** What it said, in the vendor's terms, on READ_DATE. */
  read: string;
}

export const SOURCES = {
  gorgias: {
    name: 'Gorgias pricing',
    url: 'https://www.gorgias.com/pricing',
    read: 'Helpdesk: Starter $10/mo (50 tickets, monthly billing only), Basic $60/mo or $50/mo billed annually (300), Pro $360/mo or $300/mo annually (2,000), Advanced $900/mo or $750/mo annually (5,000). With AI Agent: Starter $40, Basic $90 or $77 annually, Pro $550 or $471, Advanced $1,430 or $1,227; includes 30/30/190/530 automated interactions, then $1.50 each. Ticket overage $0.40 (Starter, Basic) or $0.36 (Pro, Advanced). Enterprise custom.',
  },
  make: {
    name: 'Make pricing',
    url: 'https://www.make.com/en/pricing',
    read: 'Free $0, up to 1,000 credits/mo, 2 active scenarios, 15-minute minimum interval. Core $9/mo for 10k credits. Pro $16/mo. Teams $29/mo. Monthly billing.',
  },
  zapier: {
    name: 'Zapier pricing',
    url: 'https://zapier.com/pricing',
    read: 'Free, 100 tasks/mo. Professional from $19.99/mo. Team from $69/mo.',
  },
  klaviyo: {
    name: 'Klaviyo on the Shopify App Store',
    url: 'https://apps.shopify.com/klaviyo-email-marketing',
    read: 'Email free up to 250 contacts. Email $20/mo for 251-500 contacts, "upgrade as you grow". SMS $15/mo. klaviyo.com/pricing shows the free plan (250 active profiles, 500 email sends/mo) and no paid tier figures outside its interactive estimator.',
  },
  systeme: {
    name: 'systeme.io pricing',
    url: 'https://systeme.io/pricing',
    read: 'Free: 2,000 contacts, unlimited emails. Startup $17/mo (5,000 contacts). Webinar $47/mo (10,000). Unlimited $97/mo.',
  },
  elevar: {
    name: 'Elevar pricing',
    url: 'https://www.getelevar.com/pricing/',
    read: 'Redirects to audiense.com, page titled "Audiense Online, Elevar pricing". Core $225/mo, Advanced $650/mo, Premium $1,250/mo, Elite from $3,000/mo.',
  },
  northbeam: {
    name: 'Northbeam pricing',
    url: 'https://www.northbeam.io/pricing',
    read: 'Starter $1,500, "contact us for a quote". Professional $3,500 per month. Growth and Enterprise custom.',
  },
  analyzify: {
    name: 'Analyzify pricing',
    url: 'https://analyzify.com/pricing',
    read: 'Standard $145/mo, or $109/mo billed yearly ($1,305/yr). Plus $275/mo, or $206/mo billed yearly ($2,475/yr).',
  },
  littledata: {
    name: 'Littledata plans',
    url: 'https://www.littledata.io/plans',
    read: 'Flex from $0.35 per order. Scale from $159 per month. Plus from $792 per month.',
  },
  trueprofit: {
    name: 'TrueProfit pricing',
    url: 'https://trueprofit.io/pricing',
    read: 'Basic $35/mo, Advanced $60/mo, Ultimate $100/mo, Enterprise $200/mo.',
  },
  beprofit: {
    name: 'BeProfit on the Shopify App Store',
    url: 'https://apps.shopify.com/beprofit-profit-tracker',
    read: 'Basic $49/mo, Pro $99/mo, Ultimate $149/mo, Plus $249/mo.',
  },
  lifetimely: {
    name: 'Lifetimely on the Shopify App Store',
    url: 'https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics',
    read: 'Free plan. S $49/mo (500 orders), M $149/mo (3,000), L $299/mo (7,000).',
  },
  prediko: {
    name: 'Prediko on the Shopify App Store',
    url: 'https://apps.shopify.com/prediko',
    read: 'Starter $49/mo (stores up to $100k revenue). Scale-up $119/mo (up to $500k). Enterprise by quote.',
  },
  inventoryPlanner: {
    name: 'Inventory Planner on the Shopify App Store',
    url: 'https://apps.shopify.com/inventory-planner',
    read: 'No price published: "Contact us to get a quote."',
  },
  weltpixel: {
    name: 'WeltPixel on the Shopify App Store',
    url: 'https://apps.shopify.com/weltpixel-conversion-tracking',
    read: 'Discovery free (GA4, up to 100 orders/mo). Plus $39/mo or $390/yr, including TikTok.',
  },
  stape: {
    name: 'Stape pricing',
    url: 'https://stape.io/price',
    read: 'Free $0. Pro $17/mo billed $200 yearly. Business $83/mo billed $1,000 yearly.',
  },
  tidio: {
    name: 'Tidio pricing',
    url: 'https://www.tidio.com/pricing/',
    read: 'Free: 50 billable conversations/mo, 50 Lyro conversations one-off. Starter $24.17/mo. Growth from $49.17/mo. Plus from $300/mo. Lyro AI Agent from $32.50/mo.',
  },
  intercom: {
    name: 'Intercom pricing',
    url: 'https://www.intercom.com/pricing',
    read: 'From $19 per seat/mo plus $0.99 per Fin outcome.',
  },
  reamaze: {
    name: 'Re:amaze pricing',
    url: 'https://www.reamaze.com/pricing',
    read: 'Basic $29, Pro $49, Plus $69 per team member per month. Starter $59 flat per month.',
  },
  freshdesk: {
    name: 'Freshdesk pricing',
    url: 'https://www.freshworks.com/freshdesk/pricing/',
    read: 'Growth $19, Pro $55, Enterprise $89 per agent per month, billed annually.',
  },
  judgeme: {
    name: 'Judge.me pricing',
    url: 'https://judge.me/pricing',
    read: 'Free $0. Awesome $15/mo.',
  },
  loox: {
    name: 'Loox on the Shopify App Store',
    url: 'https://apps.shopify.com/loox',
    read: 'Beginner free (up to 500 orders). Convert $49.99/mo. Unlimited $299.99/mo.',
  },
  yotpo: {
    name: 'Yotpo pricing',
    url: 'https://www.yotpo.com/pricing/',
    read: 'Reviews: Starter $89/mo, Pro $169/mo. Loyalty & Referrals free up to 4,999 orders/mo or from $199/mo.',
  },
  okendo: {
    name: 'Okendo on the Shopify App Store',
    url: 'https://apps.shopify.com/okendo-reviews',
    read: 'Free (50 orders/mo). Essential $19/mo. Growth $119/mo. Power $299/mo.',
  },
  getresponse: {
    name: 'GetResponse pricing',
    url: 'https://www.getresponse.com/pricing',
    read: 'Monthly plans "starting at $19 per month for unlimited messages to 1,000 subscribers".',
  },
  clickfunnels: {
    name: 'ClickFunnels pricing',
    url: 'https://www.clickfunnels.com/pricing',
    read: 'Launch $97/mo ($81/mo billed annually). Scale $197/mo. Optimize $297/mo.',
  },
  teachable: {
    name: 'Teachable pricing',
    url: 'https://teachable.com/pricing',
    read: 'Starter $39/mo ($29/mo billed annually). Builder $89/mo. Growth $189/mo.',
  },
  kajabi: {
    name: 'Kajabi pricing',
    url: 'https://kajabi.com/pricing',
    read: 'Basic $179/mo ($143/mo billed annually). Growth $249/mo.',
  },
  smile: {
    name: 'Smile.io pricing',
    url: 'https://smile.io/pricing',
    read: 'Essential $15/mo, Standard $79/mo, Growth $199/mo (monthly billing). Plus $999/mo (annual billing).',
  },
  growave: {
    name: 'Growave on the Shopify App Store',
    url: 'https://apps.shopify.com/growave',
    read: 'Free (200 orders/mo). Entry $15/mo. Growth $199/mo. Plus $499/mo.',
  },
  loyaltylion: {
    name: 'LoyaltyLion pricing',
    url: 'https://loyaltylion.com/pricing',
    read: 'Classic $199/month, 500 orders per month included.',
  },
  privy: {
    name: 'Privy on the Shopify App Store',
    url: 'https://apps.shopify.com/privy',
    read: 'Pop Ups & Displays $24/mo. Email $30/mo (1,500 contacts). Email and SMS $45/mo.',
  },
  luckyorange: {
    name: 'Lucky Orange pricing',
    url: 'https://www.luckyorange.com/pricing',
    read: 'Build $39/mo, or $32/mo paid annually.',
  },
  clarity: {
    name: 'Microsoft Clarity on the Shopify App Store',
    url: 'https://apps.shopify.com/microsoft-clarity',
    read: 'Free Forever.',
  },
  vitals: {
    name: 'Vitals on the Shopify App Store',
    url: 'https://apps.shopify.com/vitals',
    read: 'All-in-One $29.99/month, plus usage fees after about $1,000/mo in Vitals-attributed sales.',
  },
  beehiiv: {
    name: 'beehiiv pricing',
    url: 'https://www.beehiiv.com/pricing',
    read: 'Launch free up to 2,500 subscribers. Scale $43/mo billed annually. Max $96/mo billed annually.',
  },
  peel: {
    name: 'Peel pricing',
    url: 'https://www.peelinsights.com/pricing',
    read: 'Core from $179/mo (annual rate) or $199/mo month-to-month.',
  },
  shopexperts: {
    name: 'Shop Experts, Shopify app development cost',
    url: 'https://shopexperts.com/help/pricing/shopify-app-development-cost',
    read: 'Simple private app $5,000-$15,000; substantial private app $15,000-$60,000; public MVP $30,000-$80,000 build plus $20,000-$50,000 first-year operations; light maintenance $3,000-$15,000/year; public app retainer $5,000-$40,000/month.',
  },
  cartcoders: {
    name: 'CartCoders, Shopify developer cost',
    url: 'https://cartcoders.com/blog/shopify-development/shopify-developer-cost-hourly-project-retainer/',
    read: 'Freelancers about $25-$160/hour; senior Shopify Plus specialists $120-$200/hour; active-store retainers $2,000-$10,000+/month.',
  },
  shopifyKnowledgeBase: {
    name: 'Shopify Knowledge Base on the Shopify App Store',
    url: 'https://apps.shopify.com/shopify-knowledge-base',
    read: 'Free.',
  },
  stockful: {
    name: 'Stockful on the Shopify App Store',
    url: 'https://apps.shopify.com/stockful-inventory-management',
    read: 'Starter $19.99/mo (2,000 SKUs, 1 location). Growth $39.99/mo (7,500). Pro $79.99/mo (15,000). Scale $199.99/mo.',
  },
  sensible: {
    name: 'Sensible Forecasting on the Shopify App Store',
    url: 'https://apps.shopify.com/sensible-forecasting',
    read: 'Monthly plan $29/month.',
  },
  sumtracker: {
    name: 'Sumtracker pricing',
    url: 'https://www.sumtracker.com/pricing',
    read: 'Manage $59/month. Replenish $119/month.',
  },
  forstock: {
    name: 'Forstock pricing',
    url: 'https://forstock.io/pricing',
    read: 'Priced by annual revenue band; the $1M-5M band shows $135/mo billed annually. No entry figure readable without the page script.',
  },
  fabrikator: {
    name: 'Fabrikator on the Shopify App Store',
    url: 'https://apps.shopify.com/fabrikator',
    read: 'Seed $99/month plus $0.75 per backorder. Scale-up $149/month. Enterprise by quote.',
  },
  cin7: {
    name: 'Cin7 Core on the Shopify App Store',
    url: 'https://apps.shopify.com/dear-inventory',
    read: 'Standard $349/month. Pro $599/month.',
  },
  qoblex: {
    name: 'Qoblex pricing',
    url: 'https://qoblex.com/pricing/',
    read: 'Starter $99 (under $200K GMV). Business $179. Scale by quote.',
  },
  skusavvy: {
    name: 'SKUSavvy on the Shopify App Store',
    url: 'https://apps.shopify.com/skusavvy',
    read: '$0/month plus usage charges, from $0.20 down to $0.06 per order.',
  },
} as const satisfies Record<string, PriceSource>;

export type SourceId = keyof typeof SOURCES;
