// The one source for a page's visible "Updated <date>" and its JSON-LD
// dateModified. The dates live in page-updated.json, maintained by
// scripts/page-updated.mjs, which explains why they are recorded rather than
// read from git at build time.
import dates from './page-updated.json';

const MAP = dates as Record<string, string>;

/** ISO date (YYYY-MM-DD) the page at `path` was last updated, or undefined. */
export function pageUpdated(path: string): string | undefined {
  const p = path.endsWith('/') ? path : path + '/';
  return MAP[p];
}

/** "24 September 2026" */
export function formatUpdated(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/** "September 2026" */
export function formatUpdatedMonth(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}
