// Build-time JSON of the iOS Attribution Gap Benchmark.
// Generated from src/data/attributionGap.js — always in sync with the page.
import { dataPoints, benchmarkMeta } from '../../data/attributionGap.js';

export function GET() {
  const body = {
    name: benchmarkMeta.name,
    headline: benchmarkMeta.headline,
    canonical: benchmarkMeta.canonical,
    license: benchmarkMeta.license,
    licenseName: benchmarkMeta.licenseName,
    creator: benchmarkMeta.creator,
    attribution: `Data: ${benchmarkMeta.name} — ${benchmarkMeta.canonical} (${benchmarkMeta.licenseName})`,
    dataPoints: dataPoints.map((d) => ({
      metric: d.metric,
      value: d.value,
      detail: d.detail,
      source: d.source,
      sourceUrl: d.sourceUrl,
      sourceDate: d.sourceDate,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
