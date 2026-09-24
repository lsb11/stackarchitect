#!/usr/bin/env node
/**
 * npm run check:stripe: open every Stripe Payment Link in products.ts and
 * fail if any is dead or charges a price the site does not show.
 *
 * Manual on purpose. It loads live Stripe checkout pages, so it is not in
 * `npm run build`, `npm test` or any workflow. Run it after touching a link
 * or a price, and before announcing a price change.
 *
 * Why a browser and not curl: a Payment Link returns the same 200 HTML shell
 * whether it is live or deactivated. "The link is no longer active" is drawn
 * by Stripe's JavaScript after an API call, so only a rendered page shows it.
 * Found 24 Sep 2026, when the retired kit link still answered 200.
 *
 * Each link is loaded with a client_reference_id, the way buildStripeUrl()
 * sends it, so a link that rejected the parameter would show up here too.
 */
import { chromium } from 'playwright';
import {
  PRODUCTS, KIT_STRIPE_URL, KIT_PRICE, SINGLE_PRICE, buildStripeUrl, formatPrice,
} from '../src/data/products.ts';

const DEAD = /no longer active|link (has )?expired|deactivated|isn['’]t available|not available|something went wrong/i;
const TIMEOUT_MS = 30_000;

const links = [
  { name: 'Complete Kit', url: KIT_STRIPE_URL, price: KIT_PRICE },
  ...PRODUCTS.filter((p) => p.stripeUrl).map((p) => ({ name: p.name, url: p.stripeUrl, price: SINGLE_PRICE })),
];

const browser = await chromium.launch();
let failed = 0;
try {
  for (const { name, url, price } of links) {
    const page = await browser.newPage();
    const href = buildStripeUrl(url, 'check_stripe');
    const want = formatPrice(price);
    let verdict;
    try {
      await page.goto(href, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
      // A live checkout never goes network-idle, so wait for either outcome.
      await page.waitForFunction(
        (src) => new RegExp(src, 'i').test(document.body.innerText) || /\$\d/.test(document.body.innerText),
        DEAD.source,
        { timeout: TIMEOUT_MS },
      );
      await page.waitForTimeout(1500);
      const text = (await page.innerText('body')).replace(/\s+/g, ' ');
      if (DEAD.test(text)) verdict = `DEAD: "${text.match(DEAD)[0]}"`;
      else if (!text.includes(want)) verdict = `PRICE MISMATCH: site says ${want}, page shows ${(text.match(/\$[\d.,]+/g) || []).join(' ')}`;
    } catch (err) {
      verdict = `NO RESPONSE: ${err.message.split('\n')[0]}`;
    }
    await page.close();
    if (verdict) failed++;
    console.log(`${verdict ? 'FAIL' : 'ok  '}  ${name.padEnd(14)} ${want.padEnd(7)} ${url}${verdict ? `\n      ${verdict}` : ''}`);
  }
} finally {
  await browser.close();
}

console.log(failed ? `\n${failed} of ${links.length} link(s) failed.` : `\nAll ${links.length} links live at the listed price.`);
process.exit(failed ? 1 : 0);
