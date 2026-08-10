// Converted from vitest to node:test so `npm test` (bare `node --test`) covers
// the whole suite with one runner. The vi.fn() calls here were used only as
// stub factories — no call counts or arguments were ever asserted — so plain
// functions are an exact replacement.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet } from './gap-stats.js';

describe('gap-stats API', () => {
  const createMockContext = (results) => {
    return {
      env: {
        DB: {
          prepare: () => ({
            all: async () => ({ results })
          })
        }
      }
    };
  };

  const createMockErrorContext = () => {
    return {
      env: {
        DB: {
          prepare: () => ({
            all: async () => { throw new Error('DB Error'); }
          })
        }
      }
    };
  };

  it('returns ready: false if N < 10', async () => {
    const results = [
      { gap_pct: 0.1 },
      { gap_pct: 0.2 },
      { gap_pct: 0.3 }
    ]; // N=3
    const context = createMockContext(results);

    const response = await onRequestGet(context);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.ready, false);
    assert.equal(data.n, 3);
    assert.equal(data.min_n, 10);
    assert.ok(data.message.includes('3 of 10 needed'));
  });

  it('calculates mean and median correctly for an odd number of items (N >= 10)', async () => {
    // 11 items
    const gaps = [
      0.01, 0.02, 0.03, 0.04, 0.05,
      0.10, // median
      0.15, 0.16, 0.17, 0.18, 0.19
    ];
    const results = gaps.map(gap_pct => ({ gap_pct }));
    const context = createMockContext(results);

    const response = await onRequestGet(context);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'public, max-age=3600');
    assert.equal(response.headers.get('Content-Type'), 'application/json');

    const data = await response.json();
    assert.equal(data.ready, true);
    assert.equal(data.n, 11);

    // Mean = sum / 11 = 1.1 / 11 = 0.1 -> round1(0.1 * 100) = 10
    assert.equal(data.mean_gap_pct, 10);

    // Median = 0.10 -> round1(0.10 * 100) = 10
    assert.equal(data.median_gap_pct, 10);
  });

  it('calculates mean and median correctly for an even number of items (N >= 10)', async () => {
    // 10 items
    const gaps = [
      0.01, 0.02, 0.03, 0.04,
      0.08, 0.12, // median should be (0.08 + 0.12) / 2 = 0.10
      0.16, 0.17, 0.18, 0.19
    ]; // sum = 1.0
    const results = gaps.map(gap_pct => ({ gap_pct }));
    const context = createMockContext(results);

    const response = await onRequestGet(context);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.ready, true);
    assert.equal(data.n, 10);

    // Mean = 1.0 / 10 = 0.10 -> 10
    assert.equal(data.mean_gap_pct, 10);

    // Median = 0.10 -> 10
    assert.equal(data.median_gap_pct, 10);
  });

  it('rounds values to 1 decimal place', async () => {
    // 10 items to get past MIN_N.
    // Median targets 0.0555 (5.55%) -> rounds to 5.6
    const gaps = [
      0.01, 0.01, 0.01, 0.01,
      0.0512, 0.0598, // median = (0.0512 + 0.0598) / 2 = 0.0555 -> 5.55%
      0.1, 0.1, 0.1, 0.1
    ]; // sum = 0.551
    const results = gaps.map(gap_pct => ({ gap_pct }));
    const context = createMockContext(results);

    const response = await onRequestGet(context);
    const data = await response.json();

    // median_gap_pct = round1(0.0555 * 100) = round1(5.55) = 5.6
    assert.equal(data.median_gap_pct, 5.6);

    // mean = 0.551 / 10 = 0.0551 -> 5.51% -> 5.5
    assert.equal(data.mean_gap_pct, 5.5);
  });

  it('handles DB errors by returning 500 status code', async () => {
    const context = createMockErrorContext();
    const response = await onRequestGet(context);

    assert.equal(response.status, 500);

    const data = await response.json();
    assert.equal(data.error, 'Could not compute stats');
  });
});
