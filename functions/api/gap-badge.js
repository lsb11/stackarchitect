// GET /api/gap-badge
// Live shields-style SVG badge for the Shopify iOS Attribution Gap benchmark.
// - Before 10 approved submissions: shows the published synthesis range.
// - After: shows the first-party median (N=…), automatically.
// Hot-linkable from READMEs and blogs; cached at the edge for 1 hour.

const SYNTH_LABEL = "iOS attribution gap";
const SYNTH_VALUE = "20\u201340% est."; // published synthesis range

export async function onRequestGet(context) {
  const { env } = context;
  let value = SYNTH_VALUE;
  let color = "#4ade80";

  try {
    const rows = (await env.DB.prepare(
      `SELECT gap_pct FROM submissions WHERE status = 'approved' ORDER BY gap_pct ASC`
    ).all()).results || [];
    const n = rows.length;
    if (n >= 10) {
      const gaps = rows.map((r) => r.gap_pct);
      const median = n % 2 ? gaps[(n - 1) / 2] : (gaps[n / 2 - 1] + gaps[n / 2]) / 2;
      value = `${(median * 100).toFixed(1)}% median (N=${n})`;
    }
  } catch {
    // fall back to synthesis value; badge must never 500
  }

  return new Response(buildBadge(SYNTH_LABEL, value, color), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Pure SVG builder (shields.io flat style, self-contained, no external fonts)
export function buildBadge(label, value, valueColor) {
  const CHAR_W = 6.6; // approx width per char at 11px Verdana-ish
  const PAD = 10;
  const lw = Math.round(label.length * CHAR_W + PAD * 2);
  const vw = Math.round(value.length * CHAR_W + PAD * 2);
  const w = lw + vw;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(label)}: ${esc(value)}">
  <title>${esc(label)}: ${esc(value)}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${lw}" height="20" fill="#0a0a0a"/>
    <rect x="${lw}" width="${vw}" height="20" fill="#062e17"/>
    <rect width="${w}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${lw / 2}" y="14" fill="#e8eef4">${esc(label)}</text>
    <text x="${lw + vw / 2}" y="14" fill="${valueColor}" font-weight="bold">${esc(value)}</text>
  </g>
</svg>`;
}
