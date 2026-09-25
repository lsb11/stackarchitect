/**
 * _cloaks.js — the /go/* affiliate cloak table.
 *
 * Underscore-prefixed, so Pages does not route it; it is a module, not an
 * endpoint.
 *
 * WHY THIS EXISTS ALONGSIDE public/_redirects
 * public/_redirects still declares every cloak and stays the fallback: if
 * [[slug]].js throws or is not deployed, context.next() drops through to the
 * static rule and the link still earns. This table only adds what a static
 * rule cannot express — merging a per-placement ?source= into the destination.
 * Cloudflare drops an incoming query string when the destination already has
 * one, which is why ?source= on a static cloak is silently discarded. Verified
 * on the live site: /go/make/?source=probe-test returned the bare destination.
 *
 * The two are checked against each other by scripts/claims-guard.mjs. A slug
 * in one and not the other, or a destination that differs, fails the build.
 *
 * vendor / vendorUrl — the partner's plain name and its own public site, with
 * no affiliate credential in the URL. These are never used on the redirect
 * path. They exist only for the crawler gate in _bots.js, which answers a
 * gated request with an ordinary page naming the vendor and linking to
 * vendorUrl, so a crawler is never sent into the affiliate domain. A vendorUrl
 * that carried a referral param would defeat the whole point, so it must stay
 * the bare public URL.
 *
 * subidParam — the query parameter the partner network reads back as a
 * sub-identifier in its dashboard. CONFIRMED ONE AT A TIME, against the
 * network's own docs, with the date somebody read them:
 *   make — `affiliatesource`, per help.make.com/affiliate-program, read
 *          21 Sep 2026.
 *   systeme — `tk`, per
 *          help.systeme.io/article/1508-how-to-tag-an-affiliate-link, read
 *          21 Sep 2026.
 * Every other partner is still on the generic `source`, which is a
 * placeholder and not a confirmation. An unrecognised parameter is inert —
 * the referral credential is a separate param and is never touched — so a
 * wrong name here costs reporting, never revenue.
 */
export const CLOAKS = {
  beehiiv:         { destination: 'https://www.beehiiv.com/?via=gym-extras',                           subidParam: 'source', vendor: 'beehiiv', vendorUrl: 'https://www.beehiiv.com/' },
  getresponse:     { destination: 'https://try.getresponsetoday.com/gejtf3pvvf1u',                     subidParam: 'source', vendor: 'GetResponse', vendorUrl: 'https://www.getresponse.com/' },
  gorgias:         { destination: 'https://partner.gorgias.com/xclmfdgeizdk',                          subidParam: 'source', vendor: 'Gorgias', vendorUrl: 'https://www.gorgias.com/' },
  make:            { destination: 'https://www.make.com/en/register?pc=techie123',                     subidParam: 'affiliatesource', vendor: 'Make.com', vendorUrl: 'https://www.make.com/' },
  systeme:         { destination: 'https://systeme.io/?sa=sa02742252683e3d56c853555171a010913de57be6', subidParam: 'tk',     vendor: 'Systeme.io', vendorUrl: 'https://systeme.io/' },
  tidio:           { destination: 'https://affiliate.tidio.com/5kfhrx3ot6tf',                          subidParam: 'source', vendor: 'Tidio', vendorUrl: 'https://www.tidio.com/' },
  'tidio-ai':      { destination: 'https://affiliate.tidio.com/6zz36w6istip-yq3nec',                   subidParam: 'source', vendor: 'Tidio', vendorUrl: 'https://www.tidio.com/' },
  'tidio-pricing': { destination: 'https://affiliate.tidio.com/xwzr8x1q52z5-zlvl5g',                   subidParam: 'source', vendor: 'Tidio', vendorUrl: 'https://www.tidio.com/' },
  workspace:       { destination: 'https://referworkspace.app.goo.gl/sy2C',                            subidParam: 'source', vendor: 'Google Workspace', vendorUrl: 'https://workspace.google.com/' },
};

/**
 * A source tag is our own string, but it arrives from a URL and is written
 * into an outbound Location header, so it is treated as untrusted: lowercase,
 * [a-z0-9._-] only, capped. An empty result is dropped rather than sent.
 */
export function sanitiseSource(raw) {
  if (typeof raw !== 'string') return '';
  return raw.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 64);
}
