/**
 * _bots.js — the crawler gate in front of the /go/* affiliate cloaks.
 *
 * Underscore-prefixed, so Pages does not route it; it is a module, not an
 * endpoint.
 *
 * WHY THIS EXISTS
 * The first twelve days of click data (2026-09-10 → 2026-09-21) recorded 1,507
 * clicks across 115 of ~117 rendered placements, and 1,478 of them arrived with
 * no Referer at all. On the heaviest days 104–106 distinct placement tags fired
 * together. A reader clicks one or two links; a crawler walks every link on
 * every page. Set against a site that GSC shows as one indexed page, that
 * volume is machine retrieval.
 *
 * Every one of those hits was a 302 into a partner's affiliate domain, which
 * the network counts as a click that will never convert. A high click / zero
 * conversion ratio is what gets an affiliate account reviewed, so the cost of
 * leaving this alone is not a wrong statistic — it is the account.
 *
 * THE RULE, AND WHY IT IS THIS SHAPE
 * A request is treated as a crawler when:
 *
 *   - its User-Agent is missing or empty, OR
 *   - it has NO Referer *and* its User-Agent matches a known crawler.
 *
 * Referer alone is never enough. A real reader can strip it: Safari's
 * cross-site policy, a privacy extension, an in-app browser, or simply
 * `rel="noreferrer"` somewhere upstream. Requiring a crawler User-Agent
 * alongside the missing Referer is what keeps a private human out of this
 * branch. The consequence is deliberate: a crawler that DOES send a Referer is
 * let through and counted. That is the conservative direction — this gate is
 * allowed to miss a bot, and is not allowed to eat a reader.
 *
 * WHAT A GATED REQUEST GETS
 * A 200 with the vendor's name and an ordinary, uncloaked link to the vendor's
 * own site — never the affiliate destination. The crawler sees a real page and
 * a real link, and no affiliate click is generated. The page is noindex and
 * nofollow, and no-store, so it can never be cached and replayed to a reader.
 */

/**
 * Known crawler, library and preview-fetcher User-Agents.
 *
 * Deliberately conservative: every token here is one that a mainstream desktop
 * or mobile browser never sends. Generic words that could appear inside a real
 * browser string ("java", "got", "mobile") are not in this list, and the
 * headless-browser tokens are the ones automation sets, not ones Chrome sends.
 *
 * Adding a token widens what gets gated, so a new one needs the same test a
 * price does: a real User-Agent string you have actually seen.
 *
 * The tokens are grouped so uaClass() below can say which kind of client a
 * request came from. CRAWLER_UA is still every group joined in this order, so
 * the gate matches exactly what it matched before the split
 * (clicks.test.js pins its source).
 */

// Self-declared crawlers. "bot", "crawl" and "spider" cover the long tail
// (Googlebot, bingbot, AhrefsBot, Bytespider, GPTBot, ClaudeBot, …).
const DECLARED_CRAWLERS = ['bot\\b', 'bot/', '\\bcrawl', 'spider', 'slurp', 'scrapy'];
// Command-line and library clients. No browser sends these.
const TOOLS = [
  'curl/', 'wget', 'libwww', 'python-requests', 'python-urllib', 'aiohttp',
  'go-http-client', 'okhttp', 'java/', 'apache-httpclient', 'axios/',
  'node-fetch', 'guzzlehttp', 'httpx', 'postmanruntime',
];
// Headless and automation runtimes.
const HEADLESS = ['headlesschrome', 'phantomjs', 'puppeteer', 'playwright', 'selenium'];
// Link unfurlers and preview fetchers.
const UNFURLERS = [
  'facebookexternalhit', 'embedly', 'quora link preview', 'skypeuripreview',
  'whatsapp', 'telegrambot', 'slackbot', 'discordbot', 'twitterbot',
  'linkedinbot', 'redditbot', 'applebot', 'google-read-aloud',
];
// Monitors and auditors.
const MONITORS = [
  'lighthouse', 'pingdom', 'statuscake', 'uptimerobot', 'site24x7',
  'dataforseo', 'serpstat', 'screaming frog',
];

const anyOf = (tokens) => new RegExp(tokens.join('|'), 'i');

export const CRAWLER_UA = anyOf([...DECLARED_CRAWLERS, ...TOOLS, ...HEADLESS, ...UNFURLERS, ...MONITORS]);

const HEADLESS_UA = anyOf(HEADLESS);
const TOOL_UA = anyOf(TOOLS);
const DECLARED_UA = anyOf([...DECLARED_CRAWLERS, ...UNFURLERS, ...MONITORS]);
// What every mainstream browser's User-Agent opens with, and the engine token
// that follows it. A script can copy this string, which is the point of the
// bucket's name: it looks like a browser, it is not proof of one.
const BROWSER_LIKE_UA = /^Mozilla\/5\.0 \(.*\b(AppleWebKit|Gecko|Trident)\//;

/**
 * A coarse bucket for the User-Agent, for the click counters. Only the bucket
 * is ever stored; the User-Agent string itself is read here and discarded.
 *
 *   none          no User-Agent, or an empty one
 *   headless      an automation runtime that names itself (HeadlessChrome, …)
 *   tool          a command-line or HTTP library client (curl, python-requests, …)
 *   declared-bot  a crawler, link unfurler or monitor that names itself
 *   browser-like  shaped like a mainstream browser's User-Agent
 *   other         anything else
 *
 * Checked in that order: HeadlessChrome also looks like a browser, and the
 * headless answer is the useful one. "other" rather than "unknown", because
 * "unknown" is what the tables use for rows written before this column
 * existed (schema/005-click-signals.sql).
 *
 * @param {string|null|undefined} userAgent Raw User-Agent header.
 */
export function uaClass(userAgent) {
  const ua = typeof userAgent === 'string' ? userAgent.trim() : '';
  if (ua === '') return 'none';
  if (HEADLESS_UA.test(ua)) return 'headless';
  if (TOOL_UA.test(ua)) return 'tool';
  if (DECLARED_UA.test(ua)) return 'declared-bot';
  if (BROWSER_LIKE_UA.test(ua)) return 'browser-like';
  return 'other';
}

/**
 * Classify one request.
 *
 * Both arguments are raw header values, so either may be null.
 *
 * @param {string|null|undefined} userAgent Raw User-Agent header.
 * @param {string|null|undefined} referer   Raw Referer header.
 * @returns {boolean} true when the request should be gated rather than
 *                    redirected and counted.
 */
export function isLikelyBot(userAgent, referer) {
  const ua = typeof userAgent === 'string' ? userAgent.trim() : '';

  // No User-Agent at all. Every browser sends one; a client that does not is
  // a script. This clause stands on its own — it does not look at Referer.
  if (ua === '') return true;

  // A known crawler that also sent no Referer. Both halves are required.
  const hasReferer = typeof referer === 'string' && referer.trim() !== '';
  return !hasReferer && CRAWLER_UA.test(ua);
}

/** Minimal HTML escape for the two vendor strings interpolated below. */
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

/**
 * The page a gated request gets instead of the affiliate 302.
 *
 * 200, not 404 or 403: a crawler that is told this URL is broken may report it
 * as a broken link on the pages that carry it. It gets a real page with a real
 * link, and the link is the vendor's own site with no affiliate credential in
 * it, so following it earns nothing and costs nothing.
 *
 * noindex/nofollow keeps it out of any index, and no-store is what stops
 * Cloudflare or any intermediary caching this response and replaying it to a
 * reader who would otherwise have been redirected.
 *
 * @param {{vendor: string, vendorUrl: string}} cloak
 */
export function botResponse(cloak) {
  const vendor = esc(cloak.vendor);
  const href = esc(cloak.vendorUrl);
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<title>${vendor}</title>
</head>
<body>
<h1>${vendor}</h1>
<p>This is a referral link on StackArchitect. <a href="${href}" rel="nofollow noopener">${vendor}</a></p>
</body>
</html>
`;
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
      // The response now depends on both headers, so anything that does cache
      // must key on them.
      Vary: 'User-Agent, Referer',
    },
  });
}
