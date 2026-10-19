// src/data/mission.ts
//
// What Stack Architect is, said once. Chosen by the owner on 19 Oct 2026
// ("Fewer paid apps, checked"). The homepage, /about/, the footer, the
// Organization schema and llms.txt all state this; change it here and the
// pages follow (llms.txt cannot import, so sweep it by hand).
//
// Rules: no savings total (the category bands are arithmetic, not a measured
// saving), no time-to-set-up, and nothing a free guide cannot deliver.

export const MISSION = 'Run your Shopify store on fewer paid apps.';

export const MISSION_SUMMARY =
  'Free, no-code setups for tracking, inventory, email and reporting, built on Make.com and Google Sheets. Every price and fact is read on the vendor’s own page and dated.';

export const AUDIENCE = [
  { who: 'Store owners', what: 'cutting monthly app spend without hiring a developer.' },
  { who: 'Freelancers and agencies', what: 'building Shopify automations for clients who need setups that keep working.' },
];

export const HOW_WE_CHECK =
  'Every third-party price and platform fact is read on the vendor’s own page, recorded with the date, and shown on the page that uses it. When a vendor changes something, the page changes or says it no longer applies.';

export const HOW_WE_EARN =
  'Optional ready-made blueprints and disclosed affiliate links. Every free guide works without buying anything, and a commission never decides a recommendation.';

// One sentence for meta descriptions and schema, under 160 characters.
export const MISSION_ONE_LINE =
  'Free, no-code ways to run a Shopify store on fewer paid apps: tracking, inventory, email and reporting, with every price and fact checked on the source.';
