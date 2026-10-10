// The Shopify Agentic Storefronts channel matrix as open data (CC BY 4.0).
// Generated from src/data/agentic-storefronts-channels.json, the same record
// the guide renders, so the file and the page cannot disagree. Linked from the
// guide's "Key facts" block and its Dataset JSON-LD `distribution`.
import CHANNELS from '../../data/agentic-storefronts-channels.json';

const CANONICAL = 'https://stackarchitect.xyz/blog/shopify-agentic-storefronts-setup-guide-2026/';

export function GET() {
  const body = {
    name: CHANNELS.title,
    canonical: CANONICAL,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    licenseName: 'CC BY 4.0',
    creator: 'Stack Architect (Luke Sandelands)',
    attribution: `Data: ${CHANNELS.title}, Stack Architect, verified ${CHANNELS.verifiedDate}. ${CANONICAL} (CC BY 4.0)`,
    ...CHANNELS,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
  });
}
