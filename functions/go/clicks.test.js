// Tests for /go/* click counting.
//
// The rule these all serve: counting must never cost a click. So alongside the
// arithmetic there are assertions that a missing binding, a throwing binding
// and an absent waitUntil all still produce the right 302.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from './[[slug]].js';
import { CLOAKS } from './_cloaks.js';
import {
  landingFrom,
  dayFrom,
  recordClick,
  recordBotHit,
  signalsFrom,
  isPreMigration,
  UPSERT_SQL,
  BOT_UPSERT_SQL,
  LEGACY_UPSERT_SQL,
  LEGACY_BOT_UPSERT_SQL,
  SIGNAL_COLUMNS,
  NO_REFERER,
  EXTERNAL,
  ABSENT,
  OTHER,
} from './_clicks.js';
import { CRAWLER_UA, uaClass } from './_bots.js';

const ORIGIN = 'https://stackarchitect.xyz';

// Every call below must carry a browser User-Agent. /go/* answers a request
// with no User-Agent as a crawler (see _bots.js): it returns a 200 and writes
// to bot_hits, not clicks. Without this the assertions here would be measuring
// the gated branch rather than the counted one.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

/**
 * A D1 double that records what it was asked to write. `rejects(sql)` returns
 * an error message to throw for that statement, or nothing to accept it.
 */
function fakeDb({ throws = false, rejects } = {}) {
  const writes = [];
  const attempts = [];
  return {
    writes,
    attempts,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              attempts.push({ sql, args });
              if (throws) throw new Error('D1 unavailable');
              const msg = rejects?.(sql);
              if (msg) throw new Error(msg);
              writes.push({ sql, args });
              return { success: true };
            },
          };
        },
      };
    },
  };
}

const call = (path, slug, { db, referer, waitUntil, userAgent = BROWSER_UA, extra = {} } = {}) => {
  const headers = {
    ...(userAgent ? { 'User-Agent': userAgent } : {}),
    ...(referer ? { Referer: referer } : {}),
    ...extra,
  };
  return onRequest({
    params: { slug },
    request: new Request(`${ORIGIN}${path}`, { headers }),
    env: db ? { DB: db } : {},
    waitUntil,
    next: async () => 'NEXT',
  });
};

describe('landingFrom', () => {
  it('reduces a same-origin referer to its path', () => {
    assert.equal(landingFrom(`${ORIGIN}/stack/`, ORIGIN), '/stack/');
  });

  it('strips the query and fragment — neither belongs in a primary key', () => {
    assert.equal(landingFrom(`${ORIGIN}/tools/?utm_source=x#row3`, ORIGIN), '/tools/');
  });

  it('collapses another site to a single sentinel, to bound cardinality', () => {
    assert.equal(landingFrom('https://news.ycombinator.com/item?id=1', ORIGIN), EXTERNAL);
  });

  it('records an absent Referer rather than dropping the click', () => {
    // Direct traffic and in-app browsers. Dropping these under-counts exactly
    // the cloaks most used off-site.
    assert.equal(landingFrom(undefined, ORIGIN), NO_REFERER);
    assert.equal(landingFrom('', ORIGIN), NO_REFERER);
    assert.equal(landingFrom(null, ORIGIN), NO_REFERER);
  });

  it('treats an unparseable Referer as no Referer', () => {
    assert.equal(landingFrom('not a url', ORIGIN), NO_REFERER);
  });

  it('caps a pathological path length', () => {
    const long = `${ORIGIN}/${'a'.repeat(500)}`;
    assert.ok(landingFrom(long, ORIGIN).length <= 128);
  });
});

describe('dayFrom', () => {
  it('is a UTC calendar day, not a rolling window', () => {
    assert.equal(dayFrom(new Date('2026-09-10T23:59:59Z')), '2026-09-10');
    assert.equal(dayFrom(new Date('2026-09-11T00:00:00Z')), '2026-09-11');
  });
});

describe('recordClick', () => {
  it('writes one upsert with the nine key columns', async () => {
    const db = fakeDb();
    const ok = await recordClick(db, {
      slug: 'make',
      source: 'stack-row',
      landing: '/stack/',
      day: '2026-09-10',
    });
    assert.equal(ok, true);
    assert.equal(db.writes.length, 1);
    assert.equal(db.writes[0].sql, UPSERT_SQL);
    // No signals passed: each is stored as 'unknown', never left unbound.
    assert.deepEqual(db.writes[0].args, [
      '2026-09-10', 'make', 'stack-row', '/stack/',
      'unknown', 'unknown', 'unknown', 'unknown', 'unknown',
    ]);
  });

  it('increments rather than inserting a row per click', () => {
    assert.match(
      UPSERT_SQL,
      /ON CONFLICT\(day, slug, source, landing, sec_fetch_mode, sec_fetch_dest, sec_fetch_site, is_prefetch, ua_class\) DO UPDATE SET n = n \+ 1/
    );
  });

  it('counts the same reader twice on the same day — clicks, not visitors', async () => {
    const db = fakeDb();
    const click = { slug: 'make', source: 'stack-row', landing: '/stack/', day: '2026-09-10' };
    await recordClick(db, click);
    await recordClick(db, click);
    assert.equal(db.writes.length, 2, 'two writes; the counter does the deduping, nothing else does');
  });

  it('stores the sentinel when a click carries no source tag', async () => {
    const db = fakeDb();
    await recordClick(db, { slug: 'make', source: '', landing: '/', day: '2026-09-10' });
    assert.equal(db.writes[0].args[2], NO_REFERER);
  });

  it('does nothing when there is no binding, and says so', async () => {
    assert.equal(await recordClick(undefined, { slug: 'make', source: 'x', landing: '/' }), false);
    assert.equal(await recordClick({}, { slug: 'make', source: 'x', landing: '/' }), false);
  });

  it('swallows a D1 failure instead of rejecting', async () => {
    const ok = await recordClick(fakeDb({ throws: true }), {
      slug: 'make',
      source: 'x',
      landing: '/',
    });
    assert.equal(ok, false);
  });
});

describe('/go/* still earns while counting', () => {
  it('logs the click and returns the same 302 as before', async () => {
    const db = fakeDb();
    const res = await call('/go/make/?source=stack-row', ['make'], {
      db,
      referer: `${ORIGIN}/stack/`,
      waitUntil: (p) => p,
    });
    assert.equal(res.status, 302);
    assert.equal(
      new URL(res.headers.get('location')).searchParams.get(CLOAKS.make.subidParam),
      'stack-row'
    );
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(db.writes[0].args.slice(1, 4), ['make', 'stack-row', '/stack/']);
  });

  it('logs the no-source path too — an old link is worth seeing', async () => {
    const db = fakeDb();
    const res = await call('/go/make', ['make'], { db, waitUntil: (p) => p });
    assert.equal(res.headers.get('location'), CLOAKS.make.destination);
    await new Promise((r) => setImmediate(r));
    assert.equal(db.writes.length, 1);
    assert.deepEqual(db.writes[0].args.slice(1, 4), ['make', NO_REFERER, NO_REFERER]);
  });

  it('redirects normally when the binding is missing entirely', async () => {
    const res = await call('/go/make/?source=stack-row', ['make'], { waitUntil: (p) => p });
    assert.equal(res.status, 302);
  });

  it('redirects normally when D1 throws', async () => {
    const res = await call('/go/make/?source=stack-row', ['make'], {
      db: fakeDb({ throws: true }),
      waitUntil: (p) => p,
    });
    assert.equal(res.status, 302);
  });

  it('redirects normally when the runtime provides no waitUntil', async () => {
    const res = await call('/go/make/?source=stack-row', ['make'], { db: fakeDb() });
    assert.equal(res.status, 302);
  });

  it('does not log a click for an unknown slug — nothing was earned', async () => {
    const db = fakeDb();
    assert.equal(await call('/go/not-a-partner', ['not-a-partner'], { db, waitUntil: (p) => p }), 'NEXT');
    await new Promise((r) => setImmediate(r));
    assert.equal(db.writes.length, 0);
  });
});

// The gated branch. Same contract as the counted one, against the other table.
describe('gated crawler hits are counted separately', () => {
  const GOOGLEBOT =
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

  it('writes to bot_hits, not clicks, and returns a 200', async () => {
    const db = fakeDb();
    const res = await call('/go/make/?source=home-grid-make', ['make'], {
      db,
      userAgent: GOOGLEBOT,
      waitUntil: (p) => p,
    });
    assert.equal(res.status, 200);
    await new Promise((r) => setImmediate(r));
    assert.equal(db.writes.length, 1);
    assert.equal(db.writes[0].sql, BOT_UPSERT_SQL);
    assert.notEqual(BOT_UPSERT_SQL, UPSERT_SQL, 'the two counters must hit different tables');
    assert.match(BOT_UPSERT_SQL, /INSERT INTO bot_hits/);
    assert.deepEqual(db.writes[0].args.slice(1, 4), ['make', 'home-grid-make', NO_REFERER]);
    assert.equal(db.writes[0].args[8], 'declared-bot');
  });

  it('keeps clicks clean — a gated hit never lands in the revenue metric', async () => {
    const db = fakeDb();
    await call('/go/systeme/', ['systeme'], { db, userAgent: GOOGLEBOT, waitUntil: (p) => p });
    await new Promise((r) => setImmediate(r));
    assert.ok(
      db.writes.every((w) => !/INSERT INTO clicks/.test(w.sql)),
      'nothing may be written to clicks on the gated branch'
    );
  });

  it('serves the gated page even when the binding is missing or throws', async () => {
    for (const db of [undefined, fakeDb({ throws: true })]) {
      const res = await call('/go/make/', ['make'], { db, userAgent: GOOGLEBOT, waitUntil: (p) => p });
      assert.equal(res.status, 200);
    }
  });

  it('recordBotHit has the same never-throw contract as recordClick', async () => {
    assert.equal(await recordBotHit(undefined, { slug: 'make', source: 'x', landing: '/' }), false);
    assert.equal(await recordBotHit({}, { slug: 'make', source: 'x', landing: '/' }), false);
    assert.equal(
      await recordBotHit(fakeDb({ throws: true }), { slug: 'make', source: 'x', landing: '/' }),
      false
    );
  });
});

// ── Request signals (schema/005-click-signals.sql) ─────────────────────────

const NAV = { 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Site': 'same-origin' };
const settle = () => new Promise((r) => setImmediate(r));
const signalsOf = (write) => Object.fromEntries(SIGNAL_COLUMNS.map((c, i) => [c, write.args[4 + i]]));

// What /go/make/?source=stack-row answered before the signals existed. Every
// case below must produce exactly this.
async function baseline() {
  const res = await call('/go/make/?source=stack-row', ['make'], { referer: `${ORIGIN}/stack/` });
  return { status: res.status, location: res.headers.get('location'), cache: res.headers.get('cache-control'), vary: res.headers.get('vary') };
}

describe('the redirect is unchanged by the request signals', () => {
  // Every combination of each Sec-Fetch-* header absent, a spec value, or
  // junk, with and without Sec-Purpose: prefetch. 4 × 4 × 4 × 2 = 128 cases.
  const MODES = [undefined, 'navigate', 'no-cors', 'junk'];
  const DESTS = [undefined, 'document', 'empty', ''];
  const SITES = [undefined, 'same-origin', 'cross-site', 'none'];
  const PURPOSES = [undefined, 'prefetch'];

  it('gives the same status, Location and headers for every header combination', async () => {
    const want = await baseline();
    assert.equal(want.status, 302);
    let n = 0;
    for (const mode of MODES) for (const dest of DESTS) for (const site of SITES) for (const purpose of PURPOSES) {
      const extra = {};
      if (mode !== undefined) extra['Sec-Fetch-Mode'] = mode;
      if (dest !== undefined) extra['Sec-Fetch-Dest'] = dest;
      if (site !== undefined) extra['Sec-Fetch-Site'] = site;
      if (purpose !== undefined) extra['Sec-Purpose'] = purpose;
      for (const db of [undefined, fakeDb(), fakeDb({ throws: true })]) {
        const res = await call('/go/make/?source=stack-row', ['make'], { db, referer: `${ORIGIN}/stack/`, extra, waitUntil: (p) => p });
        assert.deepEqual(
          { status: res.status, location: res.headers.get('location'), cache: res.headers.get('cache-control'), vary: res.headers.get('vary') },
          want,
          JSON.stringify(extra)
        );
        n++;
      }
    }
    assert.equal(n, 384);
  });

  it('redirects the same when signalsFrom is handed headers that throw', () => {
    const broken = { get() { throw new Error('boom'); } };
    assert.deepEqual(signalsFrom(broken), {
      sec_fetch_mode: 'unknown', sec_fetch_dest: 'unknown', sec_fetch_site: 'unknown',
      is_prefetch: 'unknown', ua_class: 'unknown',
    });
  });

  it('leaves the crawler gate matching exactly what it matched before', () => {
    // The source of the regex before the tokens were split into groups.
    assert.equal(
      CRAWLER_UA.source,
      'bot\\b|bot\\/|\\bcrawl|spider|slurp|scrapy|curl\\/|wget|libwww|python-requests|python-urllib|aiohttp|go-http-client|okhttp|java\\/|apache-httpclient|axios\\/|node-fetch|guzzlehttp|httpx|postmanruntime|headlesschrome|phantomjs|puppeteer|playwright|selenium|facebookexternalhit|embedly|quora link preview|skypeuripreview|whatsapp|telegrambot|slackbot|discordbot|twitterbot|linkedinbot|redditbot|applebot|google-read-aloud|lighthouse|pingdom|statuscake|uptimerobot|site24x7|dataforseo|serpstat|screaming frog'
    );
    assert.equal(CRAWLER_UA.flags, 'i');
  });
});

describe('each signal records the expected value', () => {
  it('records a browser navigation from our own page', async () => {
    const db = fakeDb();
    await call('/go/make/?source=stack-row', ['make'], { db, referer: `${ORIGIN}/stack/`, extra: NAV, waitUntil: (p) => p });
    await settle();
    assert.deepEqual(signalsOf(db.writes[0]), {
      sec_fetch_mode: 'navigate', sec_fetch_dest: 'document', sec_fetch_site: 'same-origin',
      is_prefetch: 'false', ua_class: 'browser-like',
    });
  });

  it('records "absent" for every Sec-Fetch-* header not sent', async () => {
    const db = fakeDb();
    await call('/go/make/', ['make'], { db, waitUntil: (p) => p });
    await settle();
    const s = signalsOf(db.writes[0]);
    assert.equal(s.sec_fetch_mode, ABSENT);
    assert.equal(s.sec_fetch_dest, ABSENT);
    assert.equal(s.sec_fetch_site, ABSENT);
    assert.equal(s.is_prefetch, 'false');
  });

  it('keeps an empty header distinct from an absent one', () => {
    const s = signalsFrom(new Headers({ 'Sec-Fetch-Mode': '' }));
    assert.equal(s.sec_fetch_mode, OTHER);
    assert.equal(s.sec_fetch_dest, ABSENT);
  });

  it('stores a value outside the spec as "other", so the key stays bounded', () => {
    const s = signalsFrom(new Headers({ 'Sec-Fetch-Site': 'x'.repeat(500), 'Sec-Fetch-Dest': 'DOCUMENT' }));
    assert.equal(s.sec_fetch_site, OTHER);
    assert.equal(s.sec_fetch_dest, 'document', 'case is normalised');
  });

  it('sorts User-Agents into the six buckets', () => {
    assert.equal(uaClass(undefined), 'none');
    assert.equal(uaClass('  '), 'none');
    assert.equal(uaClass(BROWSER_UA), 'browser-like');
    assert.equal(uaClass('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0'), 'browser-like');
    assert.equal(uaClass('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36'), 'headless');
    assert.equal(uaClass('curl/8.4.0'), 'tool');
    assert.equal(uaClass('python-requests/2.31.0'), 'tool');
    assert.equal(uaClass('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), 'declared-bot');
    assert.equal(uaClass('facebookexternalhit/1.1'), 'declared-bot');
    assert.equal(uaClass('SomethingElse/1.0'), 'other');
  });

  it('never uses "unknown" as a bucket: that word means a row from before schema/005', () => {
    for (const ua of [undefined, '', BROWSER_UA, 'curl/8', 'x', 'Mozilla/4.0']) assert.notEqual(uaClass(ua), 'unknown');
  });
});

describe('a prefetch is recorded as one and still redirects', () => {
  it('marks is_prefetch true and returns the same 302', async () => {
    const want = await baseline();
    const db = fakeDb();
    const res = await call('/go/make/?source=stack-row', ['make'], {
      db,
      referer: `${ORIGIN}/stack/`,
      extra: { ...NAV, 'Sec-Purpose': 'prefetch;prerender' },
      waitUntil: (p) => p,
    });
    assert.equal(res.status, want.status);
    assert.equal(res.headers.get('location'), want.location);
    await settle();
    assert.equal(signalsOf(db.writes[0]).is_prefetch, 'true');
  });
});

describe('nothing identifying reaches the D1 write', () => {
  const IP = '203.0.113.77';
  const COOKIE = 'sa_attr=secret-cookie-value; _ga=GA1.1.123456789.1700000000';
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 UniqueTag/9f3e';
  const REFERER = `${ORIGIN}/stack/?utm_source=newsletter&email=reader@example.com#row3`;

  for (const [label, userAgent] of [['a counted click', UA], ['a gated crawler hit', `${UA} Googlebot/2.1`]]) {
    it(`passes no IP, cookie, User-Agent or full Referer for ${label}`, async () => {
      const db = fakeDb();
      await call('/go/make/?source=stack-row&email=reader@example.com', ['make'], {
        db,
        userAgent,
        referer: label === 'a gated crawler hit' ? undefined : REFERER,
        extra: { ...NAV, 'CF-Connecting-IP': IP, 'X-Forwarded-For': IP, Cookie: COOKIE },
        waitUntil: (p) => p,
      });
      await settle();
      assert.equal(db.attempts.length, 1);
      const sent = JSON.stringify(db.attempts.map((a) => [a.sql, a.args]));
      for (const leak of [IP, 'secret-cookie-value', 'GA1.1', 'UniqueTag', 'Chrome/140', 'Macintosh', 'Googlebot', 'utm_source', 'reader@example.com', 'row3']) {
        assert.ok(!sent.includes(leak), `"${leak}" reached the D1 write`);
      }
      // Every bound value is one of the few things the table is meant to hold.
      const [, , , , ...signals] = db.attempts[0].args;
      assert.equal(signals.length, 5);
      for (const v of signals) assert.ok(v.length <= 16, `signal "${v}" is longer than any bucket`);
    });
  }
});

describe('the temporary pre-migration fallback', () => {
  const MISSING = 'D1_ERROR: table clicks has no column named sec_fetch_mode: SQLITE_ERROR';

  it('keeps the legacy statements identical to the ones live before schema/005', () => {
    assert.equal(
      LEGACY_UPSERT_SQL,
      'INSERT INTO clicks (day, slug, source, landing, n) VALUES (?, ?, ?, ?, 1) ON CONFLICT(day, slug, source, landing) DO UPDATE SET n = n + 1'
    );
    assert.equal(LEGACY_BOT_UPSERT_SQL, LEGACY_UPSERT_SQL.replaceAll('clicks', 'bot_hits'));
  });

  it('recognises only the missing-column errors (text taken from a local D1 run)', () => {
    assert.equal(isPreMigration(new Error(MISSING)), true);
    assert.equal(isPreMigration(new Error('no such column: ua_class')), true);
    assert.equal(isPreMigration(new Error('D1 unavailable')), false);
    assert.equal(isPreMigration(new Error('table clicks has no column named day')), false);
    assert.equal(isPreMigration(new Error('ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint')), false);
    assert.equal(isPreMigration(undefined), false);
  });

  it('retries with the four-column statement when the table predates schema/005', async () => {
    const db = fakeDb({ rejects: (sql) => (sql === UPSERT_SQL ? MISSING : undefined) });
    const ok = await recordClick(db, { slug: 'make', source: 'x', landing: '/', day: '2026-09-29', ...signalsFrom(new Headers(NAV)) });
    assert.equal(ok, true);
    assert.equal(db.writes.length, 1);
    assert.equal(db.writes[0].sql, LEGACY_UPSERT_SQL);
    assert.deepEqual(db.writes[0].args, ['2026-09-29', 'make', 'x', '/']);
  });

  it('does the same for bot_hits', async () => {
    const db = fakeDb({ rejects: (sql) => (sql === BOT_UPSERT_SQL ? MISSING.replace('clicks', 'bot_hits') : undefined) });
    assert.equal(await recordBotHit(db, { slug: 'make', source: 'x', landing: '/' }), true);
    assert.equal(db.writes[0].sql, LEGACY_BOT_UPSERT_SQL);
  });

  it('does not retry any other failure, so a bug in the new write stays visible', async () => {
    const db = fakeDb({ rejects: (sql) => (sql === UPSERT_SQL ? 'UNIQUE constraint failed' : undefined) });
    const ok = await recordClick(db, { slug: 'make', source: 'x', landing: '/' });
    assert.equal(ok, false);
    assert.equal(db.attempts.length, 1, 'one attempt, no fallback');
  });

  it('still redirects when the new write fails and the fallback runs', async () => {
    const db = fakeDb({ rejects: (sql) => (sql === UPSERT_SQL ? MISSING : undefined) });
    const res = await call('/go/make/?source=stack-row', ['make'], { db, referer: `${ORIGIN}/stack/`, waitUntil: (p) => p });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), (await baseline()).location);
  });
});
