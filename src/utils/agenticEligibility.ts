// Which Shopify Agentic Storefronts channels a store can use, from
// src/data/agentic-storefronts-channels.json and nothing else.
//
// The eligibility checker on the agentic guide runs this twice: at build time
// for its default answer (what a crawler and a no-JS reader see) and in the
// browser when a reader changes the inputs. Both read the same rules, so the
// checker cannot disagree with the matrix, the FAQ or the open data.
//
// The rules are parsed from the JSON's own wording. If a future edit to that
// file uses wording this parser does not know, parseRules() throws and the
// build fails, which is the point: a checker that guessed would give a UK
// merchant a confident wrong answer.

export const MARKETS = ['United States', 'Canada', 'Mexico'] as const;
export type Market = (typeof MARKETS)[number];

export interface ChannelInput {
  id: string;
  name: string;
  inShopifyAdmin: boolean;
  checkoutModel: string;
  storeLocationRule: string;
  customerLocationRule: string;
  source: string;
}

export interface ChannelRule {
  id: string;
  name: string;
  checkoutModel: 'direct' | 'redirect';
  /** null = a store based in any country qualifies. */
  storeIn: string[] | null;
  /** The store must sell to at least one of these. */
  sellsToAny: Market[];
  source: string;
}

export function parseRules(channels: ChannelInput[]): ChannelRule[] {
  return channels
    .filter((c) => c.inShopifyAdmin)
    .map((c) => {
      if (c.checkoutModel !== 'direct' && c.checkoutModel !== 'redirect') {
        throw new Error(`agenticEligibility: ${c.id} has checkout model "${c.checkoutModel}"`);
      }
      let storeIn: string[] | null;
      if (c.storeLocationRule === 'Any country') storeIn = null;
      else {
        const m = /^(.+) only$/.exec(c.storeLocationRule);
        if (!m) throw new Error(`agenticEligibility: cannot read store rule for ${c.id}: "${c.storeLocationRule}"`);
        storeIn = [m[1]];
      }
      if (!/^Must sell to customers in /.test(c.customerLocationRule)) {
        throw new Error(`agenticEligibility: cannot read customer rule for ${c.id}: "${c.customerLocationRule}"`);
      }
      const sellsToAny = MARKETS.filter((mk) => c.customerLocationRule.includes(mk));
      const rest = MARKETS.reduce((s, mk) => s.replace(mk, ''), c.customerLocationRule.replace(/^Must sell to customers in /, ''));
      if (!sellsToAny.length || /[A-Za-z]{3,}/.test(rest.replace(/\b(the|or|and)\b/g, ''))) {
        throw new Error(`agenticEligibility: customer rule for ${c.id} names a market this checker does not know: "${c.customerLocationRule}"`);
      }
      return { id: c.id, name: c.name, checkoutModel: c.checkoutModel, storeIn, sellsToAny, source: c.source };
    });
}

export interface Verdict {
  id: string;
  name: string;
  eligible: boolean;
  checkout: string;
  reason: string;
  source: string;
}

const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`);
const the = (country: string) => (country === 'United States' ? 'the United States' : country);

export function checkEligibility(rules: ChannelRule[], storeCountry: string, sellsTo: string[]): Verdict[] {
  return rules.map((r) => {
    const checkout = r.checkoutModel === 'direct' ? 'Checkout inside the AI product' : 'Checkout on your own Shopify store';
    const storeOk = r.storeIn === null || r.storeIn.includes(storeCountry);
    const marketOk = r.sellsToAny.some((m) => sellsTo.includes(m));
    let reason: string;
    if (!storeOk) reason = `Your store must be based in ${list(r.storeIn!.map(the))}.`;
    else if (!marketOk) reason = `You must sell to customers in ${list(r.sellsToAny.map(the))}.`;
    else if (r.checkoutModel === 'direct') reason = `Direct checkout is shown to customers in ${list(r.sellsToAny.map(the))}; product-type and pixel limits apply.`;
    else reason = 'Shoppers finish on your own checkout, so your normal rules and pixels apply.';
    return { id: r.id, name: r.name, eligible: storeOk && marketOk, checkout, reason, source: r.source };
  });
}
