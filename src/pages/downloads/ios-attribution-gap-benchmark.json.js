// Build-time JSON of the iOS Attribution Gap Benchmark.
// Generated from src/data/attributionGap.js — always in sync with the page.
import {
  dataPoints,
  benchmarkMeta,
  retractions,
  EXPORT_VERSION,
  EXPORT_VERSION_DATE,
} from '../../data/attributionGap.js';

export function GET() {
  const body = {
    // Versioned from v2 onward. v1 was unversioned and carried a `headline`
    // field; `retractions` below says what happened to it, so a consumer that
    // cached v1 can resolve the difference without guessing.
    version: EXPORT_VERSION,
    versionDate: EXPORT_VERSION_DATE,
    name: benchmarkMeta.name,
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
    retractions,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
