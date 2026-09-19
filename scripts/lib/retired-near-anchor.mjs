/**
 * retired-near-anchor.mjs — finds a retired first-party price stated near
 * something that identifies the product, in either direction.
 *
 * Lifted out of scripts/claims-guard.mjs so it can be tested without running
 * the whole build guard, which reads the tree and exits the process.
 *
 * WHY THIS EXISTS
 * claims-guard's `contexts` patterns for the kit price read left to right on
 * one line: the kit's name, then up to 90 characters with no newline, then the
 * price. On 18 Sep 2026 two live $29s had gone past them:
 *
 *   - a relatedGuides badge in shopify-bfcm-automation-checklist-2026.md,
 *     where the price sits two YAML lines below `href: "/pro"` and the kit's
 *     name is in the title above that;
 *   - a heading on /best-free-shopify-apps-2026/, "Skip the 8-hour build.
 *     Deploy in 10 minutes. $29.", where the kit is named in the paragraph
 *     that FOLLOWS the price.
 *
 * So the anchor may sit on either side, across newlines, within `window`
 * characters, and a link to /pro/ counts as naming the kit.
 *
 * WHAT IS NOT FLAGGED
 * The kit is a one-time price. A retired figure written as a recurring price
 * ("$29/mo", "$29+", "$29 per month") or as one end of a range ("$29–$99") is
 * another vendor's, and pages that link to /pro/ are full of them.
 *
 * KNOWN MISS, accepted on 19 Sep 2026: a price with no anchor within the
 * window. The tocHeadings copy of that heading is the case: the same text,
 * nowhere near the kit's name or a /pro/ link. Catching it means flagging
 * every bare retired figure, which is too broad.
 */

const PRICE = /\$([0-9]+(?:\.[0-9]{2})?)(?![0-9])/g;
const RECURRING = /^\+?\s*(?:\/\s*(?:mo|month|yr|year|user)\b|per\s+(?:month|year|user)\b|a\s+month\b|monthly\b|\+)/i;
const RANGE_AFTER = /^\s*(?:–|—|-|to)\s*\$/;
const RANGE_BEFORE = /\$[0-9.,]+\s*(?:–|—|-)\s*$/;

/**
 * @param {string} src     file contents
 * @param {object} spec    { retired: number[], anchors: string (regex source), window: number }
 * @returns {{ index: number, value: number, excerpt: string }[]}
 */
export function retiredNearAnchor(src, { retired, anchors, window }) {
  if (!retired?.length) return [];
  const at = [...src.matchAll(new RegExp(anchors, 'gi'))].map((m) => m.index);
  if (!at.length) return [];
  const out = [];
  for (const m of src.matchAll(PRICE)) {
    const value = Number(m[1]);
    if (!retired.includes(value)) continue;
    const end = m.index + m[0].length;
    const after = src.slice(end, end + 20);
    const before = src.slice(Math.max(0, m.index - 20), m.index);
    if (RECURRING.test(after) || RANGE_AFTER.test(after) || RANGE_BEFORE.test(before)) continue;
    if (!at.some((a) => Math.abs(a - m.index) <= window)) continue;
    out.push({
      index: m.index,
      value,
      excerpt: src.slice(Math.max(0, m.index - 60), end + 30).replace(/\s+/g, ' ').trim(),
    });
  }
  return out;
}
