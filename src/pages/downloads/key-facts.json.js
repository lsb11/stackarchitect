// Open data: every sourced key fact on the site, with the vendor page it was
// read on and the date. Source of truth: src/data/keyFacts.ts.
import { KEY_FACTS, SOURCES } from '../../data/keyFacts';

export function GET() {
  const body = {
    name: 'Stack Architect key facts',
    description: 'Self-contained facts about Shopify, Meta, Google and Apple tracking and automation, each read on the vendor’s own page on the date given.',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: { name: 'Luke Sandelands', url: 'https://stackarchitect.xyz/about/' },
    facts: KEY_FACTS.map((f) => ({
      id: f.id,
      text: f.text,
      source: SOURCES[f.source],
      pages: f.routes.map((r) => `https://stackarchitect.xyz${r}`),
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
