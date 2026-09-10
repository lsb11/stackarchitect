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
  UPSERT_SQL,
  NO_REFERER,
  EXTERNAL,
} from './_clicks.js';

const ORIGIN = 'https://stackarchitect.xyz';

/** A D1 double that records what it was asked to write. */
function fakeDb({ throws = false } = {}) {
  const writes = [];
  return {
    writes,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (throws) throw new Error('D1 unavailable');
              writes.push({ sql, args });
              return { success: true };
            },
          };
        },
      };
    },
  };
}

const call = (path, slug, { db, referer, waitUntil } = {}) => {
  const headers = referer ? { Referer: referer } : {};
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
  it('writes one upsert with the four key columns', async () => {
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
    assert.deepEqual(db.writes[0].args, ['2026-09-10', 'make', 'stack-row', '/stack/']);
  });

  it('increments rather than inserting a row per click', () => {
    assert.match(UPSERT_SQL, /ON CONFLICT\(day, slug, source, landing\) DO UPDATE SET n = n \+ 1/);
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
    assert.equal(new URL(res.headers.get('location')).searchParams.get('source'), 'stack-row');
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(db.writes[0].args.slice(1), ['make', 'stack-row', '/stack/']);
  });

  it('logs the no-source path too — an old link is worth seeing', async () => {
    const db = fakeDb();
    const res = await call('/go/make', ['make'], { db, waitUntil: (p) => p });
    assert.equal(res.headers.get('location'), CLOAKS.make.destination);
    await new Promise((r) => setImmediate(r));
    assert.equal(db.writes.length, 1);
    assert.deepEqual(db.writes[0].args.slice(1), ['make', NO_REFERER, NO_REFERER]);
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
