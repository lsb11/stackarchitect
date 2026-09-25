// Tests for the /go/* cloak resolver. This is the revenue path: every case
// here is a way a click could stop earning, so the assertions are about the
// Location header a partner actually receives.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from './[[slug]].js';
import { CLOAKS, sanitiseSource } from './_cloaks.js';
import { isLikelyBot } from './_bots.js';

const NEXT = Symbol('next');

// A real desktop Chrome string. Every call below has to carry one, because
// /go/* now answers a request with no User-Agent as a crawler (see _bots.js) —
// a bare `new Request(url)` sends no UA and would take the gated branch, so a
// test written without this would be asserting the wrong path.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const call = (path, slug, headers = {}) =>
  onRequest({
    params: { slug },
    request: new Request(`https://stackarchitect.xyz${path}`, {
      headers: { 'User-Agent': BROWSER_UA, ...headers },
    }),
    next: async () => NEXT,
  });

describe('/go/* cloak resolver', () => {
  it('redirects a bare cloak to the declared destination, untouched', async () => {
    const res = await call('/go/make', ['make']);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), CLOAKS.make.destination);
  });

  it('handles the trailing-slash variant identically', async () => {
    // /go/* is exempt from middleware slash-adding, so both shapes arrive here
    // and the catch-all yields a trailing empty segment for one of them.
    const res = await call('/go/make/', ['make', '']);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), CLOAKS.make.destination);
  });

  it('merges ?source= into the destination without losing the referral param', async () => {
    const res = await call('/go/make/?source=stocky-shutdown-step2', ['make']);
    const url = new URL(res.headers.get('location'));
    assert.equal(url.searchParams.get('pc'), 'techie123', 'referral credential must survive');
    // Our own placement tag always arrives as ?source=; the name it leaves
    // under is the partner's, from subidParam. Make reads `affiliatesource`.
    assert.equal(url.searchParams.get('affiliatesource'), 'stocky-shutdown-step2');
    assert.equal(url.searchParams.get('source'), null, 'must not also send the generic name');
  });

  it('preserves a destination whose referral param is the only query', async () => {
    const res = await call('/go/systeme/?source=index-grid', ['systeme']);
    const url = new URL(res.headers.get('location'));
    assert.ok(url.searchParams.get('sa').startsWith('sa0274'), 'sa= must survive');
    // Systeme reads its tag back as `tk`
    // (help.systeme.io/article/1508-how-to-tag-an-affiliate-link).
    assert.equal(url.searchParams.get('tk'), 'index-grid');
    assert.equal(url.searchParams.get('source'), null, 'must not also send the generic name');
  });

  it('adds nothing to a destination with no query string of its own', async () => {
    const res = await call('/go/tidio/?source=stack-row', ['tidio']);
    const url = new URL(res.headers.get('location'));
    assert.equal(url.origin + url.pathname, CLOAKS.tidio.destination);
    assert.equal(url.searchParams.get('source'), 'stack-row');
  });

  it('falls through to _redirects for an unknown slug', async () => {
    assert.equal(await call('/go/not-a-partner', ['not-a-partner']), NEXT);
  });

  it('falls through rather than throwing when params are malformed', async () => {
    assert.equal(await call('/go/', [undefined]), NEXT);
  });

  it('drops a source that sanitises to nothing instead of sending an empty param', async () => {
    const res = await call('/go/make/?source=%2F%2F%3C%3E', ['make']);
    assert.equal(res.headers.get('location'), CLOAKS.make.destination);
  });

  it('never overwrites a param the network already set', async () => {
    // Guards the case where a future destination carries its own `source`.
    const withSource = { destination: 'https://example.com/?source=network', subidParam: 'source' };
    const saved = CLOAKS['tidio-ai'];
    CLOAKS['tidio-ai'] = withSource;
    try {
      const res = await call('/go/tidio-ai/?source=ours', ['tidio-ai']);
      assert.equal(new URL(res.headers.get('location')).searchParams.get('source'), 'network');
    } finally {
      CLOAKS['tidio-ai'] = saved;
    }
  });
});

describe('sanitiseSource', () => {
  it('lowercases and keeps only safe characters', () => {
    assert.equal(sanitiseSource('Stocky-Shutdown_Step2.a'), 'stocky-shutdown_step2.a');
    assert.equal(sanitiseSource('a b/c?d=e&f'), 'abcdef');
  });

  it('caps length and rejects non-strings', () => {
    assert.equal(sanitiseSource('a'.repeat(200)).length, 64);
    assert.equal(sanitiseSource(null), '');
    assert.equal(sanitiseSource(undefined), '');
  });
});

// The crawler gate. These assertions are the other half of the revenue path:
// the first block is about a click still earning, this one is about a click
// that should never have been sent to a partner at all.
describe('/go/* crawler gate', () => {
  const GOOGLEBOT =
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

  it('answers a known crawler with a 200 and never the affiliate destination', async () => {
    const res = await call('/go/make/?source=home-grid-make', ['make'], {
      'User-Agent': GOOGLEBOT,
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('location'), null, 'must not redirect a crawler');
    const body = await res.text();
    assert.ok(body.includes('Make.com'), 'names the vendor');
    assert.ok(body.includes(CLOAKS.make.vendorUrl), 'links the vendor own site');
    assert.ok(
      !body.includes('techie123'),
      'the referral credential must never reach a crawler'
    );
  });

  it('keeps the gated page out of any index and out of every cache', async () => {
    const res = await call('/go/systeme/', ['systeme'], { 'User-Agent': GOOGLEBOT });
    assert.match(res.headers.get('x-robots-tag'), /noindex/);
    assert.equal(res.headers.get('cache-control'), 'no-store');
  });

  it('gates a request with no User-Agent at all, Referer or not', async () => {
    // Undici sends no UA for a bare Request, which is the case this covers.
    const bare = await onRequest({
      params: { slug: ['make'] },
      request: new Request('https://stackarchitect.xyz/go/make/'),
      next: async () => NEXT,
    });
    assert.equal(bare.status, 200);
  });

  it('still redirects a crawler User-Agent that arrived from one of our pages', async () => {
    // Deliberate: the rule needs BOTH halves. Letting a refererless human
    // through matters more than catching every bot, so this direction is the
    // one the gate is allowed to miss.
    const res = await call('/go/make/?source=stack-make', ['make'], {
      'User-Agent': GOOGLEBOT,
      Referer: 'https://stackarchitect.xyz/stack/',
    });
    assert.equal(res.status, 302);
  });

  it('redirects a real browser that sends no Referer', async () => {
    // The case the rule exists to protect: privacy settings, an in-app
    // browser, or rel="noreferrer" upstream. This must never be gated.
    const res = await call('/go/tidio/?source=stack-tidio', ['tidio']);
    assert.equal(res.status, 302);
    assert.equal(
      new URL(res.headers.get('location')).searchParams.get('source'),
      'stack-tidio'
    );
  });

  it('marks the redirect no-store too, so no cache can serve it across the gate', async () => {
    const res = await call('/go/make/', ['make']);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.match(res.headers.get('vary'), /User-Agent/);
  });

  it('gives every cloak a vendor name and an uncloaked vendor URL', async () => {
    for (const [slug, cloak] of Object.entries(CLOAKS)) {
      assert.ok(cloak.vendor, `${slug} has no vendor name`);
      assert.match(cloak.vendorUrl, /^https:\/\//, `${slug} vendorUrl is not a URL`);
      assert.equal(
        new URL(cloak.vendorUrl).search,
        '',
        `${slug} vendorUrl carries a query string — it must be the bare public URL`
      );
    }
  });
});

describe('isLikelyBot', () => {
  const BROWSERS = [
    BROWSER_UA,
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ];

  it('never gates a mainstream browser, with or without a Referer', () => {
    for (const ua of BROWSERS) {
      assert.equal(isLikelyBot(ua, null), false, ua);
      assert.equal(isLikelyBot(ua, 'https://stackarchitect.xyz/'), false, ua);
    }
  });

  it('gates a missing, empty or whitespace User-Agent on its own', () => {
    assert.equal(isLikelyBot(null, 'https://stackarchitect.xyz/'), true);
    assert.equal(isLikelyBot('', 'https://stackarchitect.xyz/'), true);
    assert.equal(isLikelyBot('   ', null), true);
    assert.equal(isLikelyBot(undefined, null), true);
  });

  it('gates known crawlers and clients when no Referer came with them', () => {
    for (const ua of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
      'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2)',
      'curl/8.4.0',
      'Wget/1.21.4',
      'python-requests/2.32.3',
      'Go-http-client/2.0',
      'axios/1.7.2',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36',
      'facebookexternalhit/1.1',
    ]) {
      assert.equal(isLikelyBot(ua, null), true, ua);
    }
  });

  it('never gates on a missing Referer alone', () => {
    // The explicit guard against the obvious wrong implementation.
    assert.equal(isLikelyBot(BROWSER_UA, null), false);
    assert.equal(isLikelyBot(BROWSER_UA, ''), false);
  });
});
