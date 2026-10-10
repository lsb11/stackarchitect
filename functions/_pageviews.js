/**
 * _pageviews.js — cookieless daily counts of who fetched which page.
 *
 * Underscore-prefixed, so Pages does not route it. Called from
 * functions/_middleware.js inside waitUntil, after the response is decided,
 * so it can never slow down or break a page. Why it exists and what is never
 * stored: schema/006-pageviews.sql.
 */

// Crawlers that matter to this site, named. First match wins, so the more
// specific tokens come before the ones they contain.
const NAMED = [
  ['Google-InspectionTool', /Google-InspectionTool/i],
  ['GoogleOther', /GoogleOther/i],
  ['Storebot-Google', /Storebot-Google/i],
  ['Googlebot', /Googlebot/i],
  ['Bingbot', /bingbot|BingPreview/i],
  ['OAI-SearchBot', /OAI-SearchBot/i],
  ['ChatGPT-User', /ChatGPT-User/i],
  ['GPTBot', /GPTBot/i],
  ['Claude-SearchBot', /Claude-SearchBot/i],
  ['Claude-User', /Claude-User/i],
  ['ClaudeBot', /ClaudeBot|anthropic-ai/i],
  ['Perplexity-User', /Perplexity-User/i],
  ['PerplexityBot', /PerplexityBot/i],
  ['Applebot', /Applebot/i],
  ['DuckDuckBot', /DuckDuckBot|DuckAssistBot/i],
  ['meta-externalagent', /meta-external/i],
  ['Bytespider', /Bytespider/i],
  ['AhrefsBot', /AhrefsBot/i],
  ['SemrushBot', /SemrushBot/i],
  ['YandexBot', /YandexBot/i],
];
const OTHER_BOT = /bot\b|bot\/|crawl|spider|slurp|curl\/|wget|python-|go-http|headless|facebookexternalhit|preview/i;

/** Name the client, or bucket it. Only this label is stored, never the UA. */
export function agentOf(userAgent) {
  const ua = typeof userAgent === 'string' ? userAgent.trim() : '';
  if (!ua) return 'no-ua';
  for (const [name, re] of NAMED) if (re.test(ua)) return name;
  if (OTHER_BOT.test(ua)) return 'other-bot';
  return /^Mozilla\/5\.0 /.test(ua) ? 'human' : 'other';
}

/** The referring site's host only: never the path, which can carry anything. */
export function refOf(referer, selfHost = 'stackarchitect.xyz') {
  if (!referer) return '(none)';
  try {
    const h = new URL(referer).hostname.toLowerCase().replace(/^www\./, '');
    if (h === selfHost) return '(internal)';
    return h.slice(0, 80) || '(none)';
  } catch {
    return '(none)';
  }
}

const KEEP_REDIRECT_PATHS = new Set(['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Applebot']);

/**
 * Which row this request belongs in, or null when it is not worth counting.
 * Pages and their redirects are counted; assets, API calls and /go/ (which has
 * its own counter) are not. A 404 is bucketed, because a probe for
 * /wp-login.php should not add a row per guess. A redirect keeps its path only
 * for the named search and AI crawlers: whether Google still crawls a retired
 * URL is worth knowing, and every other client's would be noise.
 */
export function rowFor({ url, method, status, contentType, userAgent, referer, country, day }) {
  if (method !== 'GET') return null;
  const u = new URL(url);
  const p = u.pathname;
  if (p.startsWith('/api/') || p.startsWith('/go/') || p.startsWith('/_astro/') || p.startsWith('/cdn-cgi/')) return null;
  const agent = agentOf(userAgent);
  const isFile = /\.[a-z0-9]{2,5}$/i.test(p);
  let path;
  if (status === 200) {
    const wanted = !isFile ? /text\/html/i.test(contentType || '') : /^\/(llms(-full)?\.txt|robots\.txt|sitemap[^/]*\.xml)$/.test(p);
    if (!wanted) return null;
    path = p.slice(0, 160);
  } else if (status >= 300 && status < 400) {
    path = KEEP_REDIRECT_PATHS.has(agent) ? p.slice(0, 160) : '(redirect)';
  } else if (status === 404) {
    path = '(404)';
  } else {
    path = '(other)';
  }
  return {
    day: day ?? new Date().toISOString().slice(0, 10),
    path,
    status: String(status),
    agent,
    ref: refOf(referer, u.hostname.replace(/^www\./, '')),
    country: /^[A-Z]{2}$/.test(country || '') ? country : 'XX',
  };
}

const SQL = `INSERT INTO pageviews (day, path, status, agent, ref, country, n)
VALUES (?, ?, ?, ?, ?, ?, 1)
ON CONFLICT (day, path, status, agent, ref, country) DO UPDATE SET n = n + 1`;

/** Count one request. Never throws; a missing table or binding costs a count, never a page. */
export async function recordPageview(db, row) {
  if (!row || !db || typeof db.prepare !== 'function') return false;
  try {
    await db.prepare(SQL).bind(row.day, row.path, row.status, row.agent, row.ref, row.country).run();
    return true;
  } catch {
    return false;
  }
}
