import { describe, it, expect, vi } from 'vitest';
import { onRequestGet } from './gap-stats.js';

describe('gap-stats API', () => {
  const createMockContext = (results) => {
    return {
      env: {
        DB: {
          prepare: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results })
          })
        }
      }
    };
  };

  const createMockErrorContext = () => {
    return {
      env: {
        DB: {
          prepare: vi.fn().mockReturnValue({
            all: vi.fn().mockRejectedValue(new Error('DB Error'))
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
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ready).toBe(false);
    expect(data.n).toBe(3);
    expect(data.min_n).toBe(10);
    expect(data.message).toContain('3 of 10 needed');
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
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(response.headers.get('Content-Type')).toBe('application/json');

    const data = await response.json();
    expect(data.ready).toBe(true);
    expect(data.n).toBe(11);

    // Mean = sum / 11 = 1.1 / 11 = 0.1
    // mean_gap_pct = round1(0.1 * 100) = 10
    expect(data.mean_gap_pct).toBe(10);

    // Median = 0.10
    // median_gap_pct = round1(0.10 * 100) = 10
    expect(data.median_gap_pct).toBe(10);
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
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ready).toBe(true);
    expect(data.n).toBe(10);

    // Mean = 1.0 / 10 = 0.10
    // mean_gap_pct = 10
    expect(data.mean_gap_pct).toBe(10);

    // Median = 0.10
    // median_gap_pct = 10
    expect(data.median_gap_pct).toBe(10);
  });

  it('rounds values to 1 decimal place', async () => {
    // Create 10 items to get past MIN_N
    // We want median to be 0.0555 (5.55%) -> rounded to 5.6
    // We want mean to be something with decimals too.
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
    expect(data.median_gap_pct).toBe(5.6);

    // mean = 0.551 / 10 = 0.0551 -> 5.51% -> rounded to 5.5
    expect(data.mean_gap_pct).toBe(5.5);
  });

  it('handles DB errors by returning 500 status code', async () => {
    const context = createMockErrorContext();
    const response = await onRequestGet(context);

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Could not compute stats');
  });
});