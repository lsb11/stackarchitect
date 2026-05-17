import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '../src/assets/screenshots');
const OUTPUT_JSON = path.join(__dirname, '../src/assets/site-data.json');

const PAGES = [
  { url: 'https://www.stackarchitect.xyz/', name: 'homepage' },
  { url: 'https://www.stackarchitect.xyz/stocky-swap', name: 'stocky' },
  { url: 'https://www.stackarchitect.xyz/replace-klaviyo-free', name: 'klaviyo' },
  { url: 'https://www.stackarchitect.xyz/shopify-profit-loss-automation', name: 'pnl' },
  { url: 'https://www.stackarchitect.xyz/tiktok-events-api-shopify', name: 'tiktok' },
  { url: 'https://www.stackarchitect.xyz/autocrat-quota-fix', name: 'autocrat' },
];

const FALLBACK_DATA = {
  hook: { revenue: 84000, profit: -340, currency: '$' },
  receipt: [
    { name: 'Ad tracking', examples: 'Triple Whale, Northbeam, Elevar', monthly: 199, insight: null },
    { name: 'Email platform', examples: 'Klaviyo', monthly: 320, insight: 'charges you for contacts you never email' },
    { name: 'Inventory app', examples: 'Stocky replacement', monthly: 149, insight: 'Shopify generates this data on every order you place' },
    { name: 'TikTok tracking', examples: 'WeltPixel, Analyzify', monthly: 89, insight: 'same server-side signal, available free' },
    { name: 'Connectors', examples: 'Zapier paid tiers', monthly: 99, insight: 'replaceable with Make.com free tier' },
  ],
  totals: { monthly: 856, annual: 10272, currency: '$' },
  insight_line: 'Shopify generates all of this data on every order you process. You already own it.',
  proof: {
    orders: [
      { id: '#5137', time: 'Just now', customer: 'S. Patel', delta: '-1 SKU' },
      { id: '#5136', time: '0.6s ago', customer: 'T. Grant', delta: '-1 SKU' },
      { id: '#5135', time: '1.4s ago', customer: 'K. Smith', delta: '-2 SKUs' },
      { id: '#5134', time: '3.2s ago', customer: 'L. Chen', delta: '-1 SKU' },
      { id: '#5133', time: '7.1s ago', customer: 'M. Fisher', delta: '-3 SKUs' },
    ],
    replaces: 'Triple Whale · Klaviyo · Stocky · Zapier',
    stores: '500+', cost: '$0/month', setup: '5 minutes',
  },
  countdown: { deadline: '2026-08-31', app: 'Stocky', merchants_affected: '200,000+', paid_alternatives: '$49–$199/mo' },
  testimonials: [
    { category: 'EMAIL MARKETING', quote: 'Klaviyo auto-upgraded us to $175/mo without warning. Switched to Systeme.io that afternoon. Saving over $2,000 a year.', name: 'Ben C.', store: 'Shopify Fitness Supplements' },
    { category: 'AD TRACKING', quote: 'Recovered $600/mo in 10 minutes. CAPI Shield fixed our iOS tracking gap the same day.', name: 'Jamie L.', store: '6-figure Shopify Apparel Brand' },
    { category: 'INVENTORY', quote: 'Zero sync errors on Black Friday. Orders log in real time. $0/month.', name: 'Ultra-Ledger', store: 'Shopify Plus · 7-figure electronics store' },
  ],
  cta: { url: 'stackarchitect.xyz', tagline: 'Free. No code. Live in 5 minutes.', proof: '6 apps replaced. $700+/month saved.' },
  crawled: false,
};

async function crawl() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const siteData: Record<string, any> = { ...FALLBACK_DATA, crawled: false, pages: {} };

  for (const page of PAGES) {
    try {
      console.log(`Crawling: ${page.url}`);
      const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
      const p = await ctx.newPage();

      const response = await p.goto(page.url, { timeout: 15000, waitUntil: 'networkidle' });

      if (!response || response.status() >= 400) {
        console.warn(`  Skipping ${page.url} — status ${response?.status()}`);
        await ctx.close();
        continue;
      }

      await p.waitForTimeout(3000);
      await p.screenshot({ path: path.join(SCREENSHOTS_DIR, `${page.name}.png`), fullPage: false });

      const extracted = await p.evaluate(() => {
        const h1 = Array.from(document.querySelectorAll('h1')).map(el => el.textContent?.trim()).filter(Boolean);
        const h2 = Array.from(document.querySelectorAll('h2')).map(el => el.textContent?.trim()).filter(Boolean);
        const stats = Array.from(document.querySelectorAll('[class*="stat"], [class*="number"], [class*="metric"], strong, b'))
          .map(el => el.textContent?.trim()).filter(t => t && /[\$\d]/.test(t));
        const quotes = Array.from(document.querySelectorAll('blockquote, [class*="testimonial"], [class*="quote"]'))
          .map(el => el.textContent?.trim()).filter(Boolean);
        return { h1, h2, stats: stats.slice(0, 20), quotes: quotes.slice(0, 10) };
      });

      siteData.pages[page.name] = { url: page.url, ...extracted };
      siteData.crawled = true;
      console.log(`  Done: ${page.name} — h1: ${extracted.h1.slice(0, 1)}`);
      await ctx.close();
    } catch (err) {
      console.warn(`  Failed ${page.url}:`, (err as Error).message);
    }
  }

  await browser.close();
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(siteData, null, 2));
  console.log(`\nSite data written to ${OUTPUT_JSON}`);
  console.log(`Screenshots written to ${SCREENSHOTS_DIR}`);
}

crawl().catch(err => {
  console.error('Crawl failed, writing fallback data:', err.message);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(FALLBACK_DATA, null, 2));
});
