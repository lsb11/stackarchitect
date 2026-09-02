/**
 * Press and editorial coverage — first-party contributed quotes.
 *
 * COPYRIGHT RULE. `pullQuote` and `shortLine` are ours: our own contributed
 * words and a factual description of where they ran. Nothing else from a
 * multi-contributor article may be reproduced anywhere on this site — not
 * another contributor's text, not a summary of their sections, not the
 * article's tactic list, not its structure. A PressMention holds our
 * contribution and the bibliographic facts, and that is all it may ever hold.
 */

export interface PressMention {
  outlet: string;
  publication: string;
  author: string;
  title: string;
  url: string;
  datePublished: string;
  section: string;
  attribution: string;
  shortLine: string;
  pullQuote: string;
}

export const PRESS: PressMention[] = [{
  outlet: 'MAKERSPACE',
  publication: 'MAKERSPACE (LinkedIn newsletter)',
  author: 'Karan Raval',
  title: '34 Checkout-Page Upsell Tactics to Maximize Conversion Without Hurting Margin',
  url: 'https://www.linkedin.com/pulse/34-checkout-page-upsell-tactics-maximize-conversion-without-raval-alizf/',
  datePublished: '2026-08-14',
  section: '34. Build Native Checkout Upsells To Boost Completion',
  attribution: 'Luke Sandelands, Founder, Stack Architect',
  shortLine: 'Quoted on server-side vs. app-based checkout tracking in MAKERSPACE, August 2026',
  pullQuote: `The primary margin killer in e-commerce is relying on third-party apps that inject bloated client-side code at the point of payment. Building checkout upsells natively using Shopify Checkout Extensibility shifts all targeting logic off the browser and onto the server. This keeps the transaction fast while eliminating the recurring monthly app fees that erode profit margins over time.`,
}];
