// tests/pageviews.test.js — the cookieless page and crawler counter.
// Why it exists: schema/006-pageviews.sql.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agentOf, refOf, rowFor, recordPageview } from '../functions/_pageviews.js';
import { onRequest } from '../functions/_middleware.js';

const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

test('crawlers are named, the rest bucketed, and no UA is kept', () => {
  assert.equal(agentOf('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), 'Googlebot');
  assert.equal(agentOf('Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)'), 'Google-InspectionTool');
  assert.equal(agentOf('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0 Safari/537.36'), 'Bingbot');
  assert.equal(agentOf('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot'), 'OAI-SearchBot');
  assert.equal(agentOf('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot'), 'GPTBot');
  assert.equal(agentOf('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)'), 'ClaudeBot');
  assert.equal(agentOf('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)'), 'PerplexityBot');
  assert.equal(agentOf(CHROME), 'human');
  assert.equal(agentOf('curl/8.4.0'), 'other-bot');
  assert.equal(agentOf(''), 'no-ua');
});

test('only the referring host is kept', () => {
  assert.equal(refOf('https://chatgpt.com/c/abc-private-conversation'), 'chatgpt.com');
  assert.equal(refOf('https://www.google.com/'), 'google.com');
  assert.equal(refOf('https://stackarchitect.xyz/tools/'), '(internal)');
  assert.equal(refOf(null), '(none)');
});

const base = { method: 'GET', contentType: 'text/html; charset=utf-8', userAgent: CHROME, referer: null, country: 'GB', day: '2026-10-10' };

test('pages are counted; assets, API, /go/ and POSTs are not', () => {
  assert.deepEqual(rowFor({ ...base, url: 'https://stackarchitect.xyz/capi-shield/?utm_source=x', status: 200 }),
    { day: '2026-10-10', path: '/capi-shield/', status: '200', agent: 'human', ref: '(none)', country: 'GB' });
  for (const url of ['https://stackarchitect.xyz/_astro/a.css', 'https://stackarchitect.xyz/api/gap-stats', 'https://stackarchitect.xyz/go/make']) {
    assert.equal(rowFor({ ...base, url, status: 200 }), null, url);
  }
  assert.equal(rowFor({ ...base, url: 'https://stackarchitect.xyz/og/home.png', status: 200, contentType: 'image/png' }), null);
  assert.equal(rowFor({ ...base, method: 'POST', url: 'https://stackarchitect.xyz/', status: 200 }), null);
  assert.equal(rowFor({ ...base, url: 'https://stackarchitect.xyz/llms.txt', status: 200, contentType: 'text/plain' }).path, '/llms.txt');
});

test('404s are bucketed; redirects keep their path only for named search and AI crawlers', () => {
  assert.equal(rowFor({ ...base, url: 'https://stackarchitect.xyz/wp-login.php', status: 404 }).path, '(404)');
  assert.equal(rowFor({ ...base, url: 'https://stackarchitect.xyz/stocky-shutdown/', status: 301 }).path, '(redirect)');
  assert.equal(rowFor({ ...base, userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)', url: 'https://stackarchitect.xyz/stocky-shutdown/', status: 301 }).path, '/stocky-shutdown/');
});

test('a failing database never throws', async () => {
  const db = { prepare() { throw new Error('no such table: pageviews'); } };
  assert.equal(await recordPageview(db, { day: 'd', path: '/', status: '200', agent: 'human', ref: '(none)', country: 'GB' }), false);
  assert.equal(await recordPageview(undefined, {}), false);
});

test('the middleware counts a page in waitUntil and still serves it when the DB throws', async () => {
  const waits = [];
  const ctx = {
    request: new Request('https://stackarchitect.xyz/capi-shield/', { headers: { 'user-agent': CHROME } }),
    env: { DB: { prepare() { throw new Error('down'); } } },
    next: async () => new Response('<main>ok</main>', { status: 200, headers: { 'content-type': 'text/html' } }),
    waitUntil: (p) => waits.push(p),
  };
  const res = await onRequest(ctx);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '<main>ok</main>');
  assert.equal(waits.length, 1);
  assert.equal(await waits[0], false);
});

test('a redirect is still a single 301 and is counted', async () => {
  const waits = [];
  const res = await onRequest({
    request: new Request('https://stackarchitect.xyz/capi-shield', { headers: { 'user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0)' } }),
    env: {}, next: async () => new Response('x'), waitUntil: (p) => waits.push(p),
  });
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), 'https://stackarchitect.xyz/capi-shield/');
  assert.equal(waits.length, 1);
});
