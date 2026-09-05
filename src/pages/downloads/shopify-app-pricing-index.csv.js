// Build-time CSV of the Shopify App Pricing Index.
// Generated from src/data/appsIndex.js — the same module that renders the table
// on /apps/ — so the download and the page cannot disagree.
//
// Not a page: Astro's sitemap integration emits HTML routes only, so this never
// enters the URL set. That matters while the URL set is frozen (see CLAUDE.md).
import { exportRows, indexMeta } from '../../data/appsIndex.js';

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function GET() {
  const header = Object.keys(exportRows[0]);
  const rows = exportRows.map((r) => header.map((k) => esc(r[k])).join(','));
  // CRLF and a trailing newline, matching the gap-benchmark export: Excel is
  // the most likely consumer and it is the fussiest.
  const csv = [header.join(','), ...rows].join('\r\n') + '\r\n';
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'X-License': indexMeta.licenseName,
    },
  });
}
