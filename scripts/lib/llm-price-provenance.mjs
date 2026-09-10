/**
 * llm-price-provenance.mjs — the per-price provenance rule for the two files
 * written to be quoted verbatim by AI systems, public/llms.txt and
 * public/llms-full.txt.
 *
 * Lifted out of scripts/claims-guard.mjs so it can be tested without running
 * the whole build guard, which reads the tree and exits the process.
 *
 * THE RULE
 * Every third-party price carries, beside it, the date a human read it on the
 * vendor's own pricing page and the source that date refers to — or an
 * explicit "NOT verified", which publishes no figure as checked.
 *
 * WHY THE SCOPE IS PER PRICE AND NOT PER LINE
 * The first implementation judged a whole line, then widened to the whole
 * blank-line block. One line here routinely names three vendors:
 *
 *   - **Replaces**: Elevar (entry $225/mo — verified 2026-08-08, https://… ;
 *     higher tiers … NOT verified), Triple Whale (~$129/mo … NOT verified),
 *     Northbeam ($1,500+/mo — verified 2026-08-08, https://… ).
 *
 * so one vendor's citation vouched for every price on the line. A bare price
 * on its own line failed correctly; the same price appended to that line
 * passed. Nothing rode through on it — lines 24, 44 and 50 of llms-full.txt
 * are that shape and every price on them is individually sourced — but the
 * check did not enforce what its docstring claimed, and the next edit to one
 * of those lines is where it would have mattered.
 *
 * A price's scope is now the clause it sits in: the text between the nearest
 * clause boundary before it and the nearest one after. The boundaries are any
 * OTHER price, a semicolon, a closing parenthesis, and a blank line — plus,
 * looking backwards only, the start of the line.
 *
 * The scope is asymmetric because the provenance always follows the figure it
 * belongs to: `$225/mo — verified 2026-08-08, https://…`. Reading forward
 * across a line break lets these files keep wrapping their paragraphs;
 * refusing to read backward across one stops a `**Canonical URL**:` line, or
 * any other unrelated link above, from standing in as a vendor source.
 *
 * An opening parenthesis is deliberately NOT a boundary. The commonest shape
 * in these files is a price glossed by the parenthetical that follows it —
 * `$321–$1,887/month (sum of …)` — and making `(` a boundary would cut every
 * such price off from its own provenance.
 *
 * Two prices inside one vendor's parenthetical still share that vendor's
 * citation, which is correct: the citation is the vendor's pricing page and
 * both figures came off it.
 */

/** Every price shape these files use, including ranges and "$X+" floors. */
export const PRICE =
  /\$[0-9][0-9,]*(?:\.[0-9]{2})?(?:\s*[–—-]\s*\$?[0-9][0-9,]*(?:\.[0-9]{2})?)?(?:\s*\/\s*(?:mo|month|yr|year))?\+?/g;

/** "verified 2026-08-08" — the date a human read the vendor's own page. */
export const VERIFIED_DATE = /\bverified\s+(20\d\d-[01]\d-[0-3]\d)\b/i;
/** A bare domain or URL in the same clause, as the source that date refers to. */
export const SOURCE_URL = /https?:\/\/[^\s)]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\/[^\s)]*/i;
/** An explicit refusal to publish a figure as checked, which needs no source. */
export const NOT_VERIFIED = /\bNOT verified\b/;

/** Clause boundaries other than a neighbouring price. */
const BOUNDARY = /;|\)|\n[ \t>]*\n/g;

/**
 * The clause a price sits in: from the last boundary before it to the first
 * boundary after it, where a boundary is another price, `;`, `)` or a blank
 * line. Exported for the regression test, which asserts on the scope rather
 * than only on the verdict.
 */
export function clauseFor(source, index, length) {
  const end = index + length;
  let start = source.lastIndexOf('\n', index) + 1;
  let stop = source.length;

  for (const m of source.matchAll(PRICE)) {
    if (m.index + m[0].length <= index) start = Math.max(start, m.index + m[0].length);
    else if (m.index >= end) {
      stop = Math.min(stop, m.index);
      break;
    }
  }

  for (const m of source.matchAll(BOUNDARY)) {
    if (m.index + m[0].length <= index) start = Math.max(start, m.index + m[0].length);
    else if (m.index >= end) {
      stop = Math.min(stop, m.index);
      break;
    }
  }

  return source.slice(start, Math.max(stop, end));
}

/** Line number of a character offset, for an error a human can act on. */
function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

/**
 * Every third-party price in `source` whose own clause carries no provenance.
 *
 * `isOurs` decides which prices are ours to set and so need no vendor source;
 * claims-guard builds it from src/data/claims.json.
 */
export function findUnsourcedPrices(source, isOurs = () => false) {
  const problems = [];

  for (const m of source.matchAll(PRICE)) {
    const price = m[0].trim();
    if (isOurs(price)) continue;

    const scope = clauseFor(source, m.index, m[0].length);
    if (NOT_VERIFIED.test(scope)) continue;

    const hasDate = VERIFIED_DATE.test(scope);
    const hasSource = SOURCE_URL.test(scope);
    if (hasDate && hasSource) continue;

    problems.push({
      line: lineOf(source, m.index),
      price,
      why: !hasDate && !hasSource
        ? 'no source and no verification date'
        : !hasDate
          ? 'has a source but no "verified YYYY-MM-DD"'
          : 'has a verification date but no source URL',
      excerpt: scope.replace(/\s+/g, ' ').trim().slice(0, 110),
    });
  }

  return problems;
}
