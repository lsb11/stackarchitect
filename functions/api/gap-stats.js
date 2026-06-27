// GET /api/gap-stats
// Public, cacheable. Aggregates ONLY approved submissions.
// Returns the live first-party figure: N stores, median + mean gap.
// Median is the headline (robust to outliers); mean shown for transparency.

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const rows = (await env.DB.prepare(
      `SELECT gap_pct FROM submissions WHERE status = 'approved' ORDER BY gap_pct ASC`
    ).all()).results || [];

    const n = rows.length;

    // Suppress the figure until it's defensible. A benchmark with N=3 is not a benchmark.
    const MIN_N = 10;
    if (n < MIN_N) {
      return json({
        ready: false,
        n,
        min_n: MIN_N,
        message: `Collecting first-party submissions: ${n} of ${MIN_N} needed to publish a figure.`,
      });
    }

    const gaps = rows.map((r) => r.gap_pct);
    const mean = gaps.reduce((a, b) => a + b, 0) / n;
    const median = n % 2
      ? gaps[(n - 1) / 2]
      : (gaps[n / 2 - 1] + gaps[n / 2]) / 2;

    return json({
      ready: true,
      n,
      median_gap_pct: round1(median * 100),
      mean_gap_pct: round1(mean * 100),
      methodology_url: "https://stackarchitect.xyz/capi-shield/#methodology",
      cite_as: `Stack Architect, iOS CAPI Attribution Gap (first-party, N=${n}, 2026)`,
      updated: new Date().toISOString().slice(0, 10),
    }, 200, { "Cache-Control": "public, max-age=3600" });
  } catch {
    return json({ error: "Could not compute stats" }, 500);
  }
}

function round1(x) { return Math.round(x * 10) / 10; }
function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...extra } });
}
