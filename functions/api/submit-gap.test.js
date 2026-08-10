// Coverage for POST /api/submit-gap — the write path for the iOS attribution
// gap benchmark, and the only endpoint that accepts untrusted public input.
//
// Validation is the primary concern here. Every dataset claim on
// /shopify-ios-attribution-gap-benchmark/ rests on what this endpoint lets
// into the table, so the tests below are written around one question: can a
// hostile or malformed payload reach the INSERT?
//
// Two behaviours are asserted as invariants rather than as current
// implementation details, so they stay meaningful if the endpoint is hardened
// later:
//   • nothing reaches the DB unless the payload is fully valid
//   • a D1 failure fails CLOSED (never a 200/ok:true)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequestOptions } from './submit-gap.js';

// ── harness ────────────────────────────────────────────────────────────────
// Records every bind() so tests can assert exactly what would be persisted.
//
// The endpoint issues two statements: a SELECT ... .first() dedupe probe, then
// an INSERT ... .run(). `recentRow` is what the probe returns (null = no prior
// submission in the window), `dbError` fails the INSERT, `probeError` fails the
// probe.
function createContext({
  body,
  raw,
  headers = {},
  dbError = null,
  probeError = null,
  recentRow = null,
} = {}) {
  const inserts = [];
  const probes = [];
  const request = {
    headers: {
      get: (k) => headers[k] ?? headers[k.toLowerCase()] ?? null,
    },
    json: async () => {
      if (raw !== undefined) return JSON.parse(raw); // throws on malformed JSON
      return body;
    },
  };
  const env = {
    DB: {
      prepare: (sql) => ({
        bind: (...args) => ({
          first: async () => {
            if (probeError) throw probeError;
            probes.push({ sql, args });
            return recentRow;
          },
          run: async () => {
            if (dbError) throw dbError;
            inserts.push({ sql, args });
            return { success: true };
          },
        }),
      }),
    },
  };
  return { context: { request, env }, inserts, probes };
}

const valid = { meta_reported: 60, actual_orders: 100, window_days: 30 };

// ── happy path ─────────────────────────────────────────────────────────────
describe('submit-gap — valid submission', () => {
  it('persists a valid submission and returns ok', async () => {
    const { context, inserts } = createContext({ body: valid });
    const res = await onRequestPost(context);

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(inserts.length, 1, 'expected exactly one INSERT');
    assert.ok(/INSERT INTO submissions/.test(inserts[0].sql));
  });

  it('computes gap_pct server-side from the two raw numbers', async () => {
    const { context, inserts } = createContext({ body: valid });
    await onRequestPost(context);

    // bind order: meta, orders, windowDays, gap, note, ipHash, ua
    const [meta, orders, windowDays, gap] = inserts[0].args;
    assert.equal(meta, 60);
    assert.equal(orders, 100);
    assert.equal(windowDays, 30);
    assert.equal(gap, 0.4, '(100 - 60) / 100');
  });

  it('ignores any client-supplied gap value', async () => {
    // A client trying to inject its own headline number must not be believed.
    const { context, inserts } = createContext({
      body: { ...valid, gap_pct: 0.99, gap: 0.99 },
    });
    await onRequestPost(context);

    assert.equal(inserts[0].args[3], 0.4, 'server-computed gap must win');
  });

  it('accepts numeric strings from form input', async () => {
    const { context, inserts } = createContext({
      body: { meta_reported: '60', actual_orders: '100', window_days: '30' },
    });
    const res = await onRequestPost(context);

    assert.equal(res.status, 200);
    assert.equal(inserts[0].args[3], 0.4);
  });

  it('truncates platform_note to 280 characters', async () => {
    const { context, inserts } = createContext({
      body: { ...valid, platform_note: 'x'.repeat(500) },
    });
    await onRequestPost(context);

    assert.equal(inserts[0].args[4].length, 280);
  });

  it('stores an empty note as null rather than an empty string', async () => {
    const { context, inserts } = createContext({ body: { ...valid, platform_note: '' } });
    await onRequestPost(context);

    assert.equal(inserts[0].args[4], null);
  });
});

// ── PII handling ───────────────────────────────────────────────────────────
describe('submit-gap — PII handling', () => {
  it('hashes the IP and never stores it raw', async () => {
    const ip = '203.0.113.42';
    const { context, inserts } = createContext({
      body: valid,
      headers: { 'CF-Connecting-IP': ip, 'User-Agent': 'Mozilla/5.0' },
    });
    await onRequestPost(context);

    const ipHash = inserts[0].args[5];
    assert.match(ipHash, /^[0-9a-f]{64}$/, 'expected a hex SHA-256 digest');
    assert.notEqual(ipHash, ip);
    assert.ok(!JSON.stringify(inserts[0].args).includes(ip), 'raw IP must not be persisted');
  });

  it('stores a null ip_hash when no IP header is present', async () => {
    const { context, inserts } = createContext({ body: valid });
    await onRequestPost(context);
    assert.equal(inserts[0].args[5], null);
  });

  it('truncates the user agent to 200 characters', async () => {
    const { context, inserts } = createContext({
      body: valid,
      headers: { 'User-Agent': 'u'.repeat(400) },
    });
    await onRequestPost(context);
    assert.equal(inserts[0].args[6].length, 200);
  });
});

// ── malformed payloads ─────────────────────────────────────────────────────
describe('submit-gap — malformed payloads are rejected, not stored', () => {
  it('rejects invalid JSON with 400', async () => {
    const { context, inserts } = createContext({ raw: '{not json' });
    const res = await onRequestPost(context);

    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'Invalid JSON');
    assert.equal(inserts.length, 0);
  });

  it('rejects an empty object with 400', async () => {
    const { context, inserts } = createContext({ body: {} });
    const res = await onRequestPost(context);
    assert.equal(res.status, 400);
    assert.equal(inserts.length, 0);
  });

  it('rejects a JSON string body without storing anything', async () => {
    const { context, inserts } = createContext({ raw: '"just a string"' });
    const res = await onRequestPost(context);
    assert.equal(res.status, 400);
    assert.equal(inserts.length, 0);
  });

  it('rejects a JSON null body with an explicit 400', async () => {
    // Previously this threw a TypeError on body.meta_reported — the try/catch
    // wraps only request.json() — which surfaced as an opaque 500. It failed
    // closed, but a malformed payload gets the same explicit 400 as any other.
    const { context, inserts } = createContext({ raw: 'null' });
    const res = await onRequestPost(context);

    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'Body must be a JSON object');
    assert.equal(inserts.length, 0);
  });

  it('rejects a JSON array body with 400', async () => {
    const { context, inserts } = createContext({ raw: '[1,2,3]' });
    const res = await onRequestPost(context);

    assert.equal(res.status, 400);
    assert.equal(inserts.length, 0);
  });

  it('rejects a non-string platform_note rather than stringifying it', async () => {
    const { context, inserts } = createContext({ body: { ...valid, platform_note: { a: 1 } } });
    const res = await onRequestPost(context);

    assert.equal(res.status, 400);
    assert.equal(inserts.length, 0);
  });
});

// ── numeric validation ─────────────────────────────────────────────────────
describe('submit-gap — out-of-range and non-numeric values are rejected', () => {
  const rejected = [
    ['non-numeric meta_reported', { ...valid, meta_reported: 'abc' }, 400],
    ['non-numeric actual_orders', { ...valid, actual_orders: 'lots' }, 400],
    ['NaN-producing object', { ...valid, meta_reported: {} }, 400],
    ['negative meta_reported', { ...valid, meta_reported: -1 }, 400],
    ['fractional meta_reported', { ...valid, meta_reported: 10.5 }, 400],
    ['Infinity meta_reported', { ...valid, meta_reported: Infinity }, 400],
    ['zero actual_orders', { ...valid, actual_orders: 0 }, 400],
    ['negative actual_orders', { ...valid, actual_orders: -50 }, 400],
    ['fractional actual_orders', { ...valid, actual_orders: 100.5 }, 400],
    ['window_days = 0', { ...valid, window_days: 0 }, 400],
    ['window_days = 366', { ...valid, window_days: 366 }, 400],
    ['fractional window_days', { ...valid, window_days: 1.5 }, 400],
    ['meta greater than orders', { meta_reported: 150, actual_orders: 100, window_days: 30 }, 400],
    ['sample below the floor of 20', { meta_reported: 5, actual_orders: 19, window_days: 30 }, 422],
  ];

  for (const [name, body, status] of rejected) {
    it(`rejects ${name} with ${status} and stores nothing`, async () => {
      const { context, inserts } = createContext({ body });
      const res = await onRequestPost(context);

      assert.equal(res.status, status);
      assert.equal(inserts.length, 0, 'invalid payload must not reach the DB');
      const data = await res.json();
      assert.ok(typeof data.error === 'string' && data.error.length > 0);
    });
  }

  it('accepts the boundary values it should', async () => {
    for (const body of [
      { meta_reported: 0, actual_orders: 20, window_days: 1 },   // gap = 1.0
      { meta_reported: 20, actual_orders: 20, window_days: 365 }, // gap = 0
    ]) {
      const { context, inserts } = createContext({ body });
      const res = await onRequestPost(context);
      assert.equal(res.status, 200, `expected ${JSON.stringify(body)} to be accepted`);
      assert.equal(inserts.length, 1);
    }
  });

  it('rejects empty values that would coerce to 0 and store a 100% gap', async () => {
    // Number(null) === Number(false) === Number('') === Number([]) === 0, and 0
    // is a legitimate meta_reported ("Meta attributed nothing"), so coercing
    // before type-checking made "field missing" indistinguishable from it —
    // storing gap 1.0, the maximum possible value and the exact headline figure
    // this dataset publishes. Type is now checked first, so all of these 400.
    for (const empty of [null, false, '', [], '  ']) {
      const { context, inserts } = createContext({
        body: { ...valid, meta_reported: empty },
      });
      const res = await onRequestPost(context);

      assert.equal(res.status, 400, `${JSON.stringify(empty)} must be rejected`);
      assert.equal(inserts.length, 0, 'must not reach the DB');
    }
  });

  it('rejects an omitted numeric field rather than defaulting it to 0', async () => {
    for (const key of ['meta_reported', 'actual_orders', 'window_days']) {
      const body = { ...valid };
      delete body[key];
      const { context, inserts } = createContext({ body });
      const res = await onRequestPost(context);

      assert.equal(res.status, 400, `omitted ${key} must be rejected`);
      assert.equal(inserts.length, 0);
    }
  });

  it('rejects loose string forms that Number() would accept', async () => {
    // Hex and exponent notation are refused; ordinary decimal form input is not.
    for (const input of ['0x10', '1e2', '1e-2', '0b11', '  ', '12abc', true, false]) {
      const { context, inserts } = createContext({
        body: { ...valid, meta_reported: input },
      });
      const res = await onRequestPost(context);

      assert.equal(res.status, 400, `${JSON.stringify(input)} must be rejected`);
      assert.equal(inserts.length, 0);
    }
  });

  it('applies the same strict guard to every numeric field, not just meta_reported', async () => {
    for (const key of ['meta_reported', 'actual_orders', 'window_days']) {
      for (const bad of [null, false, true, '', [], {}, '0x10', '1e2']) {
        const { context, inserts } = createContext({ body: { ...valid, [key]: bad } });
        const res = await onRequestPost(context);

        assert.equal(res.status, 400, `${key}=${JSON.stringify(bad)} must be rejected`);
        assert.equal(inserts.length, 0);
      }
    }
  });

  it('still accepts 0 as an explicit meta_reported', async () => {
    // "Meta attributed nothing" is a real submission and must survive the
    // stricter parsing — both as a number and as a decimal string.
    for (const zero of [0, '0']) {
      const { context, inserts } = createContext({
        body: { ...valid, meta_reported: zero },
      });
      const res = await onRequestPost(context);

      assert.equal(res.status, 200, `meta_reported ${JSON.stringify(zero)} must be accepted`);
      assert.equal(inserts[0].args[0], 0);
      assert.equal(inserts[0].args[3], 1, 'a genuine 100% gap');
    }
  });

  it('keeps every stored gap within 0..1', async () => {
    for (const body of [
      { meta_reported: 0, actual_orders: 20, window_days: 30 },
      { meta_reported: 20, actual_orders: 20, window_days: 30 },
      { meta_reported: 1, actual_orders: 1000, window_days: 30 },
    ]) {
      const { context, inserts } = createContext({ body });
      await onRequestPost(context);
      const gap = inserts[0].args[3];
      assert.ok(gap >= 0 && gap <= 1, `gap ${gap} outside 0..1`);
    }
  });
});

// ── failure mode ───────────────────────────────────────────────────────────
describe('submit-gap — fails closed on a D1 error', () => {
  it('returns 500 and never reports success when the insert throws', async () => {
    const { context } = createContext({ body: valid, dbError: new Error('D1 unavailable') });
    const res = await onRequestPost(context);

    assert.equal(res.status, 500);
    const data = await res.json();
    assert.equal(data.error, 'Could not store submission');
    assert.notEqual(data.ok, true, 'must not claim success when nothing was written');
  });

  it('does not leak the underlying database error to the client', async () => {
    const { context } = createContext({
      body: valid,
      dbError: new Error('D1_ERROR: no such table: submissions at line 3'),
    });
    const res = await onRequestPost(context);
    const text = await res.text();

    assert.ok(!text.includes('no such table'), 'internal error detail must not be exposed');
    assert.ok(!text.includes('D1_ERROR'));
  });
});

// ── duplicate / replay ─────────────────────────────────────────────────────
describe('submit-gap — duplicate and replay submissions', () => {
  const headers = { 'CF-Connecting-IP': '203.0.113.42' };

  it('accepts the first submission from a network', async () => {
    const { context, inserts, probes } = createContext({ body: valid, headers, recentRow: null });
    const res = await onRequestPost(context);

    assert.equal(res.status, 200);
    assert.equal(inserts.length, 1);
    assert.equal(probes.length, 1, 'expected a dedupe probe before the insert');
  });

  it('refuses a replay within the window with 409 and stores nothing', async () => {
    const { context, inserts } = createContext({
      body: valid,
      headers,
      recentRow: { id: 1 }, // a prior submission exists inside the window
    });
    const res = await onRequestPost(context);

    assert.equal(res.status, 409);
    assert.equal(inserts.length, 0, 'a replay must not count twice');
    assert.match((await res.json()).error, /already recorded/i);
  });

  it('probes on ip_hash over a 30-day rolling window', async () => {
    const { context, probes } = createContext({ body: valid, headers });
    await onRequestPost(context);

    const [sql, args] = [probes[0].sql, probes[0].args];
    assert.match(sql, /SELECT id FROM submissions/i);
    assert.match(sql, /ip_hash = \?/i);
    assert.match(sql, /created_at > datetime\('now', \?\)/i);
    assert.match(args[0], /^[0-9a-f]{64}$/, 'probes by hash, never raw IP');
    assert.equal(args[1], '-30 days');
  });

  it('scopes dedupe to the network, so a different IP is unaffected', async () => {
    // recentRow is keyed by the probe result, so a distinct IP that has no
    // prior row still gets through.
    const { context, inserts } = createContext({
      body: valid,
      headers: { 'CF-Connecting-IP': '198.51.100.7' },
      recentRow: null,
    });
    const res = await onRequestPost(context);

    assert.equal(res.status, 200);
    assert.equal(inserts.length, 1);
  });

  it('fails CLOSED when the dedupe probe itself errors', async () => {
    // If we cannot prove this is not a duplicate, we must not write.
    const { context, inserts } = createContext({
      body: valid,
      headers,
      probeError: new Error('D1 unavailable'),
    });
    const res = await onRequestPost(context);

    assert.equal(res.status, 500);
    assert.equal(inserts.length, 0, 'must not insert when dedupe cannot be verified');
    assert.notEqual((await res.json()).ok, true);
  });

  it('fails closed if the DB rejects a duplicate via a constraint', async () => {
    // Defence in depth: if a UNIQUE index is added later, the insert throws and
    // the endpoint must still not report success.
    const { context } = createContext({
      body: valid,
      dbError: new Error('UNIQUE constraint failed: submissions.ip_hash'),
    });
    const res = await onRequestPost(context);

    assert.equal(res.status, 500);
    assert.notEqual((await res.json()).ok, true);
  });

});

// ── CORS preflight ─────────────────────────────────────────────────────────
describe('submit-gap — CORS preflight', () => {
  it('restricts the origin to the canonical host', async () => {
    const res = await onRequestOptions();
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://stackarchitect.xyz');
    assert.ok(res.headers.get('Access-Control-Allow-Methods').includes('POST'));
    assert.notEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
  });
});
