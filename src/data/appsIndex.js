// Shared derivations for the Shopify App Pricing Index.
//
// src/pages/apps/index.astro renders this, and both /downloads/ endpoints
// export it. They import from here rather than each recomputing, for the same
// reason src/data/attributionGap.js exists: the page and the download must not
// be able to disagree about how many records are verified.
//
// Every count below is DERIVED from apps.json. None of them is a literal.
// That is deliberate — the page states "27 of 54 verified" in visible prose,
// and the failure mode this file exists to prevent is exactly the one that
// shipped in the <h1> ("53 Apps Compared" over a table of 54): a hand-written
// count that stops matching the data it describes.

import apps from './apps.json';
import priceLog from './appsPriceLog.json';

export const indexMeta = {
  name: 'Shopify App Pricing Index',
  canonical: 'https://stackarchitect.xyz/apps/',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  licenseName: 'CC BY 4.0',
  creator: 'Stack Architect (stackarchitect.xyz)',
  author: 'Luke Sandelands',
};

export const EXPORT_VERSION = 1;
export const EXPORT_VERSION_DATE = '2026-09-05';

/** The day the index was first populated, before any figure had been sourced. */
export const POPULATED_ON = '2026-07-24';

/**
 * Three states, not two. A price we checked and deliberately did not record is
 * not the same as a price nobody has looked at, and collapsing them into
 * "unverified" throws away the more valuable of the two.
 */
export function statusOf(app) {
  if (app.priceVerifiedDate && app.priceSourceUrl) return 'verified';
  if (app.priceHeldReason) return 'held';
  return 'unchecked';
}

export const STATUS_LABEL = {
  verified: 'Verified',
  held: 'Checked, not recorded',
  unchecked: 'Not yet checked',
};

const byStatus = (s) => apps.filter((a) => statusOf(a) === s);

export const verified = byStatus('verified');
export const held = byStatus('held');
export const unchecked = byStatus('unchecked');

/** Distinct dates on which prices were verified, oldest first. */
export const sweepDates = [
  ...new Set(apps.map((a) => a.priceVerifiedDate).filter(Boolean)),
].sort();

/** How many records each sweep verified, for the coverage table. */
export const sweeps = sweepDates.map((date) => ({
  date,
  count: apps.filter((a) => a.priceVerifiedDate === date).length,
}));

export const latestVerified = sweepDates[sweepDates.length - 1] ?? null;
export const oldestVerified = sweepDates[0] ?? null;

/** The single date on which the three held records were checked. */
export const heldCheckedDate =
  [...new Set(held.map((a) => a.priceCheckedDate).filter(Boolean))].sort().pop() ?? '';

export const categories = [...new Set(apps.map((a) => a.category))].sort();

/**
 * Categories where not one record has been verified. Naming these is the point:
 * "24 not yet checked" is a number a reader must take on trust, whereas "no app
 * in Site Search has been checked" is a claim they can test in one click.
 */
export const zeroCoverageCategories = categories
  .filter((c) => !apps.some((a) => a.category === c && statusOf(a) === 'verified'))
  .map((c) => ({
    category: c,
    apps: apps.filter((a) => a.category === c).map((a) => a.name),
  }));

/**
 * Records still carrying the figure they were populated with on 24 Jul 2026 —
 * never checked, and never even revised. An app appears in the price log the
 * moment its figure is touched, so absence from the log is the test.
 */
const revisedIds = new Set(priceLog.entries.map((e) => e.id));
export const inherited = unchecked.filter((a) => !revisedIds.has(a.id));

/** Whole days between two ISO dates, for "43 days" in the coverage prose. */
export function daysBetween(fromISO, toISO) {
  return Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 86400000);
}

/** Log rows, newest first, which is the order a revision history is read in. */
export const revisions = [...priceLog.entries].sort(
  (a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name)
);

export const revisionCounts = revisions.reduce((acc, e) => {
  acc[e.kind] = (acc[e.kind] || 0) + 1;
  return acc;
}, {});

/** Revisions that moved a figure up vs down. Both are published, on purpose. */
export const revisedUp = revisions.filter((e) => e.direction === 'up').length;
export const revisedDown = revisions.filter((e) => e.direction === 'down').length;

/**
 * Flat, machine-readable rows. The CSV and JSON endpoints both serialise this,
 * so the two downloads carry identical facts under different encodings.
 */
export const exportRows = apps.map((a) => ({
  id: a.id,
  name: a.name,
  category: a.category,
  monthly_cost: a.monthlyCost,
  price_plan: a.pricePlan ?? null,
  price_status: statusOf(a),
  price_verified_date: a.priceVerifiedDate ?? null,
  price_checked_date: a.priceCheckedDate ?? null,
  price_source_url: a.priceSourceUrl ?? null,
  price_held_reason: a.priceHeldReason ?? null,
  brand_change_note: a.brandChange?.note ?? null,
  replacement: a.replacement,
  replacement_url: `https://stackarchitect.xyz${a.stackarchitectAlternativeLink}`,
  detail_url: `https://stackarchitect.xyz/apps/${a.id}/`,
}));

/** Field notes, published beside the download so the nulls are not a puzzle. */
export const fieldNotes = [
  ['id', 'Stable slug. Also the last path segment of detail_url.'],
  ['name', "The app's name as the vendor writes it."],
  ['category', 'Our categorisation, not the Shopify App Store’s.'],
  ['monthly_cost', 'Display text, not a number — "$99", "$45+", "Free", "Not publicly listed". Parse it, do not assume a figure.'],
  ['price_plan', 'The named plan the figure belongs to. Null where no figure is recorded, or where the vendor names no tier.'],
  ['price_status', 'verified | held | unchecked. See the three states above.'],
  ['price_verified_date', 'ISO date a human read the figure on the vendor page. Null unless price_status is verified.'],
  ['price_checked_date', 'ISO date a held record was checked. Null unless price_status is held.'],
  ['price_source_url', 'The exact page the figure was read from. Null unless price_status is verified.'],
  ['price_held_reason', 'Why a checked figure was not recorded. Null unless price_status is held.'],
  ['brand_change_note', 'Set where the source page is published under a different brand than the app. Currently Elevar only.'],
  ['replacement', 'The free or cheaper approach we document in place of this app.'],
  ['replacement_url', 'Where that approach is written up.'],
  ['detail_url', 'The per-app page. Noindexed by design; it is a reference, not a landing page.'],
];

export default apps;
