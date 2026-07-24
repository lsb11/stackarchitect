const fs = require('fs');

const path = 'src/data/apps.json';
const rawData = fs.readFileSync(path, 'utf8');
const apps = JSON.parse(rawData);

// Category specific templates for fallback
const categoryData = {
  "Tracking & Analytics": {
    features: ["Multi-touch attribution models", "Pixel tracking integration", "ROAS dashboarding", "Customer journey mapping"],
    pros: ["Deep data granularity for ad spend", "Native integrations with Meta and Google Ads", "Visual reporting interfaces"],
    cons: ["Often blocked by iOS privacy updates (ITP)", "Inaccurate browser-side tracking data", "High recurring monthly costs for basic data"],
    pricingScaling: "Pricing scales aggressively based on your store's order volume, effectively penalizing you for growing your revenue."
  },
  "Email Marketing": {
    features: ["Drag-and-drop email builder", "Automated flow triggers", "Segmentation logic", "A/B testing capabilities"],
    pros: ["Easy to use for beginners", "High initial deliverability", "Good pre-built templates"],
    cons: ["Expensive at scale", "Charges per subscriber even if inactive", "Bloated with features you rarely use"],
    pricingScaling: "Pricing scales exponentially based on your total subscriber count. You are forced into higher tiers even if your open rates drop."
  },
  "Email & Popups": {
    features: ["Exit-intent popups", "Spin-to-win wheels", "Basic email autoresponders", "Discount code generation"],
    pros: ["Quick list growth", "Simple installation", "Good popup design templates"],
    cons: ["Slows down store load speed (LCP)", "Aggressive pricing models", "Can hurt user experience if overused"],
    pricingScaling: "Costs increase rapidly as your monthly pageviews scale, meaning higher traffic immediately results in higher app bills."
  },
  "SMS Marketing": {
    features: ["Two-way SMS conversations", "Automated SMS flows", "Compliance management (TCPA)", "Campaign segmentation"],
    pros: ["High open rates compared to email", "Immediate delivery for flash sales", "Strong ROI for VIP segments"],
    cons: ["Extremely high cost per message sent", "Carrier fees eat into profit margins", "High unsubscribe rates if overused"],
    pricingScaling: "You pay a base platform fee plus a high variable cost per text message sent, which heavily compresses margins on lower AOV products."
  },
  "Inventory Management": {
    features: ["Purchase order creation", "Low stock alerts", "Multi-location syncing", "Demand forecasting"],
    pros: ["Centralized stock visibility", "Native Shopify sync", "Reduces overselling risk"],
    cons: ["Complex onboarding process", "Overkill for single-location brands", "Clunky user interfaces"],
    pricingScaling: "Pricing often scales by SKU count or order volume, making it expensive for high-SKU catalogues."
  },
  "Customer Support": {
    features: ["Shared unified inbox", "Live chat widgets", "Basic automated macros", "Order status tracking"],
    pros: ["Centralizes all support tickets", "Integrates with Shopify order data", "Reduces response times"],
    cons: ["Expensive per-seat pricing models", "Basic chatbots are easily confused", "Adds bloat to store loading times"],
    pricingScaling: "You are billed per support agent seat and often face limits on total monthly ticket volume before overage charges apply."
  },
  "Page Builder": {
    features: ["Drag-and-drop canvas", "Pre-built section templates", "Mobile responsive design controls", "Global styling"],
    pros: ["No coding required", "Fast landing page creation", "Good for marketing teams"],
    cons: ["Creates bloated, slow HTML code", "Hard to migrate away from", "Hinders Core Web Vitals scores"],
    pricingScaling: "Costs scale based on the number of published pages, forcing you to delete old landing pages to stay within budget."
  },
  "Product Reviews": {
    features: ["Automated review request emails", "Photo and video reviews", "Customizable display widgets", "Google Rich Snippets sync"],
    pros: ["Builds social proof", "Increases conversion rates", "Improves organic CTR via stars"],
    cons: ["Limits number of review requests on basic tiers", "Widgets often slow down product pages", "Expensive for video review features"],
    pricingScaling: "Pricing scales based on monthly order volume—the more you sell, the more you pay just to ask for a review."
  },
  "Subscriptions": {
    features: ["Recurring billing portal", "Customer self-service management", "Dunning (failed payment) management", "Prepaid subscription support"],
    pros: ["Increases Customer Lifetime Value (LTV)", "Creates predictable monthly recurring revenue", "Reduces churn"],
    cons: ["Charges a % transaction fee on top of monthly costs", "Complex migration if you want to leave", "Can cause checkout conflicts"],
    pricingScaling: "These apps take a direct cut (e.g., 1% + 10¢) of every subscription transaction on top of a hefty flat monthly fee."
  },
  "Automation": {
    features: ["Visual workflow builder", "Pre-built app connectors", "Webhooks and API access", "Multi-step logic branching"],
    pros: ["Connects disparate software stacks", "Saves manual administrative time", "Reliable execution for basic tasks"],
    cons: ["Prohibitively expensive at high task volumes", "Hard to debug complex failures", "Vendor lock-in"],
    pricingScaling: "You are billed per 'task' or 'operation' executed. A single order might consume 5 tasks, blowing through cheap tiers instantly."
  },
  "Manufacturing & Inventory": {
    features: ["Bill of Materials (BOM) management", "Raw material tracking", "Production scheduling", "Shopify inventory sync"],
    pros: ["End-to-end manufacturing visibility", "Accurate COGS tracking", "Prevents production bottlenecks"],
    cons: ["Steep learning curve", "Requires strict internal discipline to maintain", "High enterprise-level pricing"],
    pricingScaling: "Priced as enterprise software, often scaling by the number of users or active manufacturing workflows."
  },
  "Inventory Forecasting": {
    features: ["AI demand prediction", "Replenishment recommendations", "Seasonality adjustments", "Capital allocation insights"],
    pros: ["Prevents stockouts on bestsellers", "Reduces dead stock holding costs", "Optimizes cash flow"],
    cons: ["Requires high historical data volume to be accurate", "Often fails during unpredictable viral spikes", "Expensive monthly overhead"],
    pricingScaling: "Billed based on total store GMV or total SKU count, making it a significant expense for fast-growing stores."
  },
  "Affiliate Marketing": {
    features: ["Custom affiliate tracking links", "Automated commission payouts", "Discount code tracking", "Affiliate dashboard portal"],
    pros: ["Drives performance-based revenue", "Expands brand reach via influencers", "Easy to recruit ambassadors"],
    cons: ["Charges a % of affiliate revenue generated", "Susceptible to discount code leakage", "Basic UI on lower tiers"],
    pricingScaling: "Scales based on the number of active affiliates or total affiliate revenue driven, penalizing you for a successful program."
  },
  "Referral Program": {
    features: ["Post-purchase referral prompts", "Give-get reward logic", "Automated reward fulfillment", "Fraud prevention"],
    pros: ["Lowers Customer Acquisition Cost (CAC)", "Leverages existing customer trust", "High conversion rates on referred traffic"],
    cons: ["High fixed monthly costs regardless of performance", "Often takes a % of referral sales", "Can feel spammy if over-optimized"],
    pricingScaling: "Priced via a flat fee plus a percentage commission on every sale generated through the referral program."
  },
  "SEO Optimization": {
    features: ["Bulk meta tag editing", "Image alt text automation", "Broken link (404) monitoring", "JSON-LD schema injection"],
    pros: ["Saves time on basic on-page SEO", "Ensures baseline technical compliance", "Good for non-technical users"],
    cons: ["Does not write high-quality content for you", "Often injects bloated code", "Native Shopify 2.0 handles most of this already"],
    pricingScaling: "Generally flat-rate, but higher tiers are required for automated bulk optimizations and premium schema types."
  },
  "Returns Management": {
    features: ["Branded returns portal", "Automated shipping label generation", "Exchanges and store credit logic", "Return analytics"],
    pros: ["Improves customer post-purchase experience", "Retains revenue via exchanges", "Reduces support ticket volume"],
    cons: ["High enterprise-tier pricing", "Can encourage higher return rates by making it too easy", "Complex integration with 3PLs"],
    pricingScaling: "You are billed per return processed, meaning a high-return month directly spikes your software bill."
  },
  "Site Search": {
    features: ["Typo-tolerance AI search", "Merchandising and product boosting", "Faceted filtering (color, size)", "Search analytics"],
    pros: ["Improves conversion rate for high-intent shoppers", "Helps clear out overstocked inventory", "Better than native Shopify 1.0 search"],
    cons: ["Native Shopify Search & Discovery now does 90% of this for free", "Expensive at high traffic volumes", "Can slow down the header"],
    pricingScaling: "Billed directly on search query volume. If a bot scrapes your site or you go viral, your bill skyrockets."
  },
  "Automation & Integration": {
    features: ["Enterprise ERP connectivity (NetSuite, etc.)", "High-volume data transformation", "EDI compliance", "Custom API orchestration"],
    pros: ["True enterprise-grade reliability", "Handles millions of daily operations", "Deep integrations across the supply chain"],
    cons: ["Astronomical pricing", "Requires dedicated developers to maintain", "Complete overkill for 95% of Shopify stores"],
    pricingScaling: "Enterprise contracts that start in the thousands per month and scale based on endpoint connections and data volume."
  }
};

// Specific App Overrides for high-priority apps
const appOverrides = {
  "klaviyo": {
    features: ["Advanced predictive analytics", "Deep Shopify historical data sync", "Custom flow branching", "SMS integration"],
    pros: ["Industry standard with massive integration ecosystem", "Excellent segmentation engine", "Reliable delivery infrastructure"],
    cons: ["Extremely expensive at 25,000+ subscribers", "Support is slow on lower tiers", "Overwhelming interface for basic tasks"],
    pricingScaling: "Klaviyo penalizes you for growing your list. Expanding from 10k to 50k subscribers increases your bill exponentially, even if those users rarely buy."
  },
  "triple-whale": {
    features: ["Pixel-based attribution tracking", "Post-purchase surveys", "Centralized ROAS dashboard", "Creative analytics"],
    pros: ["Beautiful dashboard UI", "Makes blended ROAS easy to understand", "Consolidates all ad platform data"],
    cons: ["Relying heavily on browser pixels which are blocked by iOS", "Incredibly expensive for smaller brands", "Does not natively fix the Meta algorithm like CAPI does"],
    pricingScaling: "Triple Whale charges based on your store's total GMV (Gross Merchandise Value). If you have a high-revenue, low-margin business, this pricing model destroys profits."
  },
  "elevar": {
    features: ["Google Tag Manager (GTM) data layer", "Server-Side tracking (CAPI)", "Event monitoring", "Pre-built GTM container tags"],
    pros: ["Highly accurate tracking foundation", "Excellent documentation", "Industry standard for GTM on Shopify"],
    cons: ["Expensive monthly recurring cost for a data layer", "Requires technical GTM knowledge to fully utilize", "The free CAPI Shield method achieves the same result for $0"],
    pricingScaling: "Priced on order volume. As you scale past 1,000 orders per month, the cost increases significantly for the exact same server infrastructure."
  },
  "stocky": {
    features: ["Purchase order management", "Basic stock forecasting", "Cost of goods (COGS) tracking", "Stocktake adjustments"],
    pros: ["Native Shopify integration", "Was free for POS Pro users", "Simple interface for beginners"],
    cons: ["Officially shutting down on August 31, 2026", "Lacks advanced multi-location logic", "Prone to syncing errors on high-volume days"],
    pricingScaling: "Stocky is shutting down, forcing merchants to migrate to $200/mo enterprise apps unless they use a free alternative like Stocky Swap."
  },
  "zapier": {
    features: ["5,000+ app integrations", "Multi-step zaps", "Path branching logic", "Formatter by Zapier"],
    pros: ["Easiest UI for complete beginners", "Has the most software integrations", "Extensive community support"],
    cons: ["Prohibitively expensive per-task pricing", "Hard to debug failed complex zaps", "Cannot handle high-volume Shopify data efficiently"],
    pricingScaling: "Zapier charges per task. A simple Shopify order might trigger 5 tasks. At 1,000 orders/month, you instantly blow past the cheap tiers into hundreds of dollars."
  },
  "gorgias": {
    features: ["Shopify order actions inside tickets", "Omnichannel inbox (Email, IG, FB, SMS)", "Macro automation rules", "Revenue statistics"],
    pros: ["Deepest native Shopify integration on the market", "Saves support agents massive amounts of time", "Clean UI"],
    cons: ["Very expensive for seasonal brands", "Help center is an add-on cost", "Automated rules count towards ticket limits"],
    pricingScaling: "Gorgias bills based on ticket volume. During Black Friday/Cyber Monday, your support bill will spike aggressively just when margins are tightest."
  },
  "recharge": {
    features: ["Customizable customer portal", "Subscription checkout", "Dunning management", "Churn analytics"],
    pros: ["Enterprise-grade reliability", "Massive developer ecosystem", "Deep API access"],
    cons: ["Takes a transaction fee (1% + 10¢) on top of the $99/mo fee", "Very difficult to migrate away from", "Overkill for brands with simple Subscribe & Save needs"],
    pricingScaling: "The real cost of Recharge is the transaction fee. A store doing $100k/mo in subscriptions pays $1,000/mo in transaction fees alone on top of the base tier."
  },
  "northbeam": {
    features: ["Machine learning attribution models", "First-party data graphing", "Hourly ROAS reporting", "LTV cohorts"],
    pros: ["Considered the gold standard for enterprise attribution", "Excellent for multi-channel omnichannel brands", "Highly accurate forecasting"],
    cons: ["Starts at $1,000/month", "Requires significant ad spend (>$50k/mo) to justify the cost", "Complex onboarding"],
    pricingScaling: "Northbeam is built and priced for the enterprise. It scales on pageviews and revenue, meaning high-traffic, low-converting stores pay a massive premium."
  }
};

// Apply enrichments
const enrichedApps = apps.map(app => {
  const catDefaults = categoryData[app.category] || categoryData["Automation"];
  const override = appOverrides[app.id.toLowerCase()];

  return {
    ...app,
    keyFeatures: override?.features || catDefaults.features,
    pros: override?.pros || catDefaults.pros,
    cons: override?.cons || catDefaults.cons,
    pricingScaling: override?.pricingScaling || catDefaults.pricingScaling
  };
});

fs.writeFileSync(path, JSON.stringify(enrichedApps, null, 2));
console.log('Successfully enriched all 53 apps with SEO data.');
