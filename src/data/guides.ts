/**
 * The header's Guides disclosure.
 *
 * The guide list itself stays in src/pages/shopify-automation-guides.astro
 * (its `rows`), because claims-guard scans src/pages and not src/data, and
 * that page's price claims are quarantined under its own path. Moving the rows
 * here would take them out of the guard. So this file reads the hrefs out of
 * that page's source at build time instead: the "All N guides" count and the
 * check that every pick below is still on the index both come from the same
 * list the index renders, deduped by href exactly as the page dedupes it.
 *
 * Picked 24 Sep 2026: GSC impressions where a guide had any (the export in
 * data/gsc_export/, last 3 months to 7 Aug), cluster coverage where none did.
 * `name` and `line` are nav copy; the full title stays on the index.
 */
import fs from 'node:fs';
import path from 'node:path';

export const GUIDES_INDEX = '/shopify-automation-guides/';

export interface NavGuide {
  href: string;
  name: string;
  line: string;
}

export const NAV_GUIDES: NavGuide[] = [
  {
    href: '/blog/shopify-server-side-tracking-complete-setup-guide/',
    name: 'Server-side tracking setup',
    line: 'Send orders to ad platforms from the server.',
  },
  {
    href: '/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/',
    name: 'Apps Script quotas and errors',
    line: 'Every limit, and the fix for each quota error.',
  },
  {
    href: '/blog/the-ultimate-guide-to-shopify-inventory-management/',
    name: 'Shopify inventory management',
    line: 'Order logs, stock levels and low-stock alerts.',
  },
  {
    href: '/blog/shopify-ai-playbook-2026/',
    name: 'Shopify AI playbook',
    line: 'Where AI helps, from product research to support.',
  },
  {
    href: '/blog/tidio-for-shopify-complete-setup-guide/',
    name: 'Tidio setup for Shopify',
    line: 'Install Tidio, set up Lyro AI, connect orders.',
  },
];

/** Unique guide hrefs on the index, in the order its `rows` list them. */
export function guideIndexHrefs(): string[] {
  const src = fs.readFileSync(
    path.join(process.cwd(), 'src/pages/shopify-automation-guides.astro'),
    'utf8',
  );
  const start = src.indexOf('const rows: GuideRow[] = [');
  const end = src.indexOf('\n];', start);
  if (start < 0 || end < 0) {
    throw new Error('guides.ts: cannot find `const rows: GuideRow[] = [ ... ];` in shopify-automation-guides.astro');
  }
  const hrefs = [...src.slice(start, end).matchAll(/href: '([^']+)'/g)].map((m) => m[1]);
  const unique = [...new Set(hrefs)];
  if (unique.length === 0) throw new Error('guides.ts: no guide hrefs found on the index');
  for (const g of NAV_GUIDES) {
    if (!unique.includes(g.href)) {
      throw new Error(`guides.ts: NAV_GUIDES links ${g.href}, which is not a guide on ${GUIDES_INDEX}`);
    }
  }
  return unique;
}
