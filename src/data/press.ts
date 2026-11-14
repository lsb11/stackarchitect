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
}, {
  // PRAPI Research, 12 Nov 2026. A 10-contributor research report (94
  // submissions). pullQuote is Luke's own words only, joined from the two
  // passages the report prints in quotation form; the report's narration
  // between them ("Fixing it took two weeks...") is PRAPI's, not ours, and
  // is not reproduced.
  outlet: 'PRAPI Research',
  publication: 'PRAPI Research',
  author: 'PRAPI',
  title: 'What Teams Had to Fix Before They Could Automate',
  url: 'https://prapi.dev/research/fix-before-automating-2026',
  datePublished: '2026-11-12',
  section: 'The through-line',
  attribution: 'Luke Sandelands, Founder at Stack Architect',
  shortLine: 'Quoted on automating a broken Shopify profit report in PRAPI Research, November 2026',
  pullQuote: `I found this out by building the automation anyway. It worked. Every week it produced a clean, confident report that was badly wrong on any product whose cost had changed during the year, and nothing in it looked wrong. The manual version at least made people uneasy. The automated one was quiet, fast and authoritative enough that the owner would have priced against it. What I would tell anyone scoping an automation project is that broken manual processes are loud. Somebody is always complaining about them, which is how they get on the roadmap in the first place. Automate one without fixing it and the complaints stop while the errors continue, which is a far worse place to be than where you started.`,
}];

/** Look up one mention by outlet, so pages do not depend on array order. */
export const pressBy = (outlet: string): PressMention => {
  const m = PRESS.find((p) => p.outlet === outlet);
  if (!m) throw new Error(`press.ts: no mention for ${outlet}`);
  return m;
};
