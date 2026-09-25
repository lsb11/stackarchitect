/**
 * analytics.ts — the data the GA4 click tracker in Base.astro needs, and the
 * pure functions that go with it.
 *
 * WHY THIS IS A MODULE AND NOT JUST MORE INLINE SCRIPT
 * The tracker has to stay `is:inline` so gtag is defined before anything can
 * call it, and an inline script cannot import. So the *data* is interpolated
 * into the page as JSON (see `analyticsBootstrap()`), and only the small
 * amount of logic that reads it stays inline. Two things fall out of that:
 *
 *   - Prices reach GA4 from `products.ts`, never as a literal. A literal here
 *     would be a price in `src/layouts`/`src/data` that claims-guard cannot
 *     fully see (see CLAUDE.md: its walker does not read `src/data/`), and it
 *     would drift the moment KIT_PRICE changed.
 *   - The parts worth testing are testable. `tests/analytics-tracker.test.js`
 *     imports this file directly.
 */
import { PRODUCTS, KIT_PRICE, SINGLE_PRICE, KIT_STRIPE_URL } from './products.ts';

/**
 * AI assistants, by the hostname they send readers from.
 *
 * This exists because GA4 has no "AI assistant" channel. Left alone, a
 * Perplexity referral lands in `Referral` next to a forum link, and a
 * ChatGPT one usually lands in `Direct` — the apps strip the referrer, or
 * send it from a domain GA4 has never classified. Neither is a line you can
 * read GEO performance off.
 *
 * The matching rule is "hostname equals, or is a subdomain of". Bare-suffix
 * matching would classify `notopenai.com` as OpenAI.
 *
 * `source` is what gets sent to GA4. Keep the values stable: they are what
 * the custom channel group in the GA4 UI matches on, and renaming one here
 * silently splits a channel in two. See docs/GA4-SETUP.md.
 */
export const AI_REFERRERS: { host: string; source: string }[] = [
  { host: 'perplexity.ai', source: 'perplexity' },
  { host: 'chatgpt.com', source: 'chatgpt' },
  { host: 'openai.com', source: 'chatgpt' },
  { host: 'claude.ai', source: 'claude' },
  { host: 'anthropic.com', source: 'claude' },
  { host: 'gemini.google.com', source: 'gemini' },
  { host: 'bard.google.com', source: 'gemini' },
  { host: 'aistudio.google.com', source: 'gemini' },
  { host: 'copilot.microsoft.com', source: 'copilot' },
  { host: 'copilot.cloud.microsoft', source: 'copilot' },
  { host: 'm365.cloud.microsoft', source: 'copilot' },
];

/**
 * The assistant a referrer hostname belongs to, or '' for anything else.
 *
 * Exact host or subdomain only, so `www.perplexity.ai` matches and
 * `perplexity.ai.example.com` does not.
 */
export function aiAssistantSource(host: string): string {
  if (typeof host !== 'string' || !host) return '';
  const h = host.toLowerCase().replace(/^www\./, '');
  for (const { host: known, source } of AI_REFERRERS) {
    if (h === known || h.endsWith('.' + known)) return source;
  }
  return '';
}

/**
 * Stripe Payment Link -> the item GA4 should book against it.
 *
 * Keyed by the bare payment-link URL, because by the time the click handler
 * sees the href it has a `client_reference_id` on it and may have picked up
 * more. The handler matches on origin + pathname for the same reason.
 *
 * `value` is the list price. It is what the buyer is about to be charged, not
 * revenue recognised — `begin_checkout` fires on the click, and nothing here
 * knows whether the payment completed.
 */
export interface CheckoutItem {
  item_id: string;
  item_name: string;
  value: number;
}

export const CHECKOUT_ITEMS: Record<string, CheckoutItem> = {
  [stripeKey(KIT_STRIPE_URL)]: {
    item_id: 'complete-kit',
    item_name: 'Complete Kit',
    value: KIT_PRICE,
  },
  ...Object.fromEntries(
    PRODUCTS.filter((p) => p.stripeUrl).map((p) => [
      stripeKey(p.stripeUrl),
      { item_id: p.slug, item_name: p.name, value: SINGLE_PRICE },
    ]),
  ),
};

/** origin + pathname, which is the part of a Payment Link that identifies it. */
export function stripeKey(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/$/, '');
  } catch {
    return url;
  }
}

/**
 * The JSON the inline tracker reads, as a string ready for `set:html`.
 *
 * Serialised with JSON.stringify and then `<` escaped, so a value can never
 * close the script element early.
 */
export function analyticsBootstrap(): string {
  const payload = {
    ai: AI_REFERRERS,
    checkout: CHECKOUT_ITEMS,
    currency: 'USD',
  };
  return `window.__saAnalytics=${JSON.stringify(payload).replace(/</g, '\\u003c')};`;
}
