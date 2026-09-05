// Build-time JSON of the Shopify App Pricing Index.
// Generated from src/data/appsIndex.js — always in sync with /apps/.
//
// Carries the coverage counts as data, not just the rows. A consumer that only
// reads `rows` would see 27 nulls in price_verified_date and have to infer why;
// `coverage` says so, in the same terms the page does.
import {
  exportRows,
  fieldNotes,
  indexMeta,
  sweeps,
  verified,
  held,
  unchecked,
  inherited,
  zeroCoverageCategories,
  revisions,
  revisionCounts,
  POPULATED_ON,
  EXPORT_VERSION,
  EXPORT_VERSION_DATE,
} from '../../data/appsIndex.js';

export function GET() {
  const body = {
    version: EXPORT_VERSION,
    versionDate: EXPORT_VERSION_DATE,
    name: indexMeta.name,
    canonical: indexMeta.canonical,
    license: indexMeta.license,
    licenseName: indexMeta.licenseName,
    creator: indexMeta.creator,
    attribution: `Data: ${indexMeta.name} — ${indexMeta.canonical} (${indexMeta.licenseName})`,

    coverage: {
      total: exportRows.length,
      verified: verified.length,
      held: held.length,
      unchecked: unchecked.length,
      // Of the unchecked, those never revised since first population.
      inheritedUnsourced: inherited.length,
      populatedOn: POPULATED_ON,
      sweeps,
      zeroCoverageCategories: zeroCoverageCategories.map((c) => c.category),
      note:
        'price_verified_date is null for every row whose price_status is not "verified". ' +
        'That is a statement about our coverage, not about the vendor.',
    },

    fieldNotes: Object.fromEntries(fieldNotes),
    rows: exportRows,

    revisions: {
      counts: revisionCounts,
      note:
        'Every entry records a change to OUR record, not a vendor price change. ' +
        'kind "changed" is reserved for an observed vendor move and is so far unused.',
      entries: revisions,
    },
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-License': indexMeta.licenseName,
    },
  });
}
