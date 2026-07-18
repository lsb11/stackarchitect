// Build-time CSV of the iOS Attribution Gap Benchmark.
// Generated from src/data/attributionGap.js — the same array that renders
// the page table — so this file is always in sync with the published data.
import { dataPoints, benchmarkMeta } from '../../data/attributionGap.js';

const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;

export function GET() {
  const header = ['metric', 'value', 'detail', 'source', 'source_url', 'source_date'];
  const rows = dataPoints.map((d) =>
    [d.metric, d.value, d.detail, d.source, d.sourceUrl, d.sourceDate].map(esc).join(',')
  );
  const csv = [header.join(','), ...rows].join('\r\n') + '\r\n';
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'X-License': benchmarkMeta.licenseName,
    },
  });
}
