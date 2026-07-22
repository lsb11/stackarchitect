import { describe, it, expect, vi } from 'vitest';
import { onRequestPost } from './submit-gap.js';

describe('onRequestPost', () => {
  // Helper to construct a mock context
  const createContext = ({ body, ip = '127.0.0.1', userAgent = 'test-agent', dbRunError = false } = {}) => {
    let jsonSpy;
    if (body === 'invalid') {
      jsonSpy = vi.fn().mockRejectedValue(new Error('Invalid JSON'));
    } else {
      jsonSpy = vi.fn().mockResolvedValue(body);
    }

    const request = {
      json: jsonSpy,
      headers: {
        get: (key) => {
          if (key === 'CF-Connecting-IP') return ip;
          if (key === 'User-Agent') return userAgent;
          return null;
        }
      }
    };

    const runMock = dbRunError ? vi.fn().mockRejectedValue(new Error('DB Error')) : vi.fn().mockResolvedValue({});
    const bindMock = vi.fn().mockReturnValue({ run: runMock });
    const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });

    const env = {
      DB: {
        prepare: prepareMock
      }
    };

    return { request, env, runMock, bindMock, prepareMock };
  };

  // Helper to extract JSON body and status from Response
  const getResponse = async (res) => {
    return {
      status: res.status,
      body: await res.json(),
    };
  };

  it('returns 400 error when JSON payload is invalid', async () => {
    const ctx = createContext({ body: 'invalid' });
    const res = await onRequestPost(ctx);
    const data = await getResponse(res);
    expect(data.status).toBe(400);
    expect(data.body).toEqual({ error: 'Invalid JSON' });
  });

  it('returns 400 error when meta_reported is missing or negative', async () => {
    const ctx = createContext({ body: { actual_orders: 100, window_days: 30 } });
    const res = await onRequestPost(ctx);
    const data = await getResponse(res);
    expect(data.status).toBe(400);
    expect(data.body).toEqual({ error: 'meta_reported must be a non-negative integer' });

    const ctx2 = createContext({ body: { meta_reported: -5, actual_orders: 100, window_days: 30 } });
    const res2 = await onRequestPost(ctx2);
    const data2 = await getResponse(res2);
    expect(data2.status).toBe(400);
    expect(data2.body).toEqual({ error: 'meta_reported must be a non-negative integer' });
  });

  it('returns 400 error when actual_orders is missing or non-positive', async () => {
    const ctx = createContext({ body: { meta_reported: 50, window_days: 30 } });
    const res = await onRequestPost(ctx);
    const data = await getResponse(res);
    expect(data.status).toBe(400);
    expect(data.body).toEqual({ error: 'actual_orders must be a positive integer' });

    const ctx2 = createContext({ body: { meta_reported: 50, actual_orders: 0, window_days: 30 } });
    const res2 = await onRequestPost(ctx2);
    const data2 = await getResponse(res2);
    expect(data2.status).toBe(400);
    expect(data2.body).toEqual({ error: 'actual_orders must be a positive integer' });
  });

  it('returns 400 error when window_days is invalid', async () => {
    const ctx = createContext({ body: { meta_reported: 50, actual_orders: 100 } }); // missing
    const res = await onRequestPost(ctx);
    const data = await getResponse(res);
    expect(data.status).toBe(400);
    expect(data.body).toEqual({ error: 'window_days must be 1–365' });

    const ctx2 = createContext({ body: { meta_reported: 50, actual_orders: 100, window_days: 0 } });
    const res2 = await onRequestPost(ctx2);
    const data2 = await getResponse(res2);
    expect(data2.status).toBe(400);
    expect(data2.body).toEqual({ error: 'window_days must be 1–365' });

    const ctx3 = createContext({ body: { meta_reported: 50, actual_orders: 100, window_days: 400 } });
    const res3 = await onRequestPost(ctx3);
    const data3 = await getResponse(res3);
    expect(data3.status).toBe(400);
    expect(data3.body).toEqual({ error: 'window_days must be 1–365' });
  });

  it('returns 400 error when meta_reported exceeds actual_orders', async () => {
    const ctx = createContext({ body: { meta_reported: 150, actual_orders: 100, window_days: 30 } });
    const res = await onRequestPost(ctx);
    const data = await getResponse(res);
    expect(data.status).toBe(400);
    expect(data.body).toEqual({ error: 'meta_reported cannot exceed actual_orders' });
  });

  it('returns 422 error when actual_orders fails the sanity floor check (less than 20)', async () => {
    const ctx = createContext({ body: { meta_reported: 5, actual_orders: 15, window_days: 30 } });
    const res = await onRequestPost(ctx);
    const data = await getResponse(res);
    expect(data.status).toBe(422);
    expect(data.body).toEqual({ error: 'actual_orders must be at least 20 for a meaningful measurement' });
  });

  it('returns 500 error when database insert fails', async () => {
    const ctx = createContext({
      body: { meta_reported: 80, actual_orders: 100, window_days: 30, platform_note: 'test note' },
      dbRunError: true
    });
    const res = await onRequestPost(ctx);
    const data = await getResponse(res);
    expect(data.status).toBe(500);
    expect(data.body).toEqual({ error: 'Could not store submission' });
    expect(ctx.prepareMock).toHaveBeenCalledTimes(1);
    expect(ctx.bindMock).toHaveBeenCalledTimes(1);
    expect(ctx.runMock).toHaveBeenCalledTimes(1);
  });

  it('returns 200 success when all parameters are valid and database insert succeeds', async () => {
    const ctx = createContext({
      body: { meta_reported: 80, actual_orders: 100, window_days: 30, platform_note: 'test note' }
    });
    const res = await onRequestPost(ctx);
    const data = await getResponse(res);

    expect(data.status).toBe(200);
    expect(data.body).toEqual({ ok: true, message: 'Submitted for review. Thank you for contributing real data.' });

    // Check DB call was made with expected parameters
    // meta: 80, orders: 100, windowDays: 30, gap: 0.2, note: 'test note', ipHash: <hashed_ip>, ua: 'test-agent'
    expect(ctx.prepareMock).toHaveBeenCalledTimes(1);
    expect(ctx.bindMock).toHaveBeenCalledTimes(1);
    expect(ctx.runMock).toHaveBeenCalledTimes(1);

    const bindArgs = ctx.bindMock.mock.calls[0];
    expect(bindArgs[0]).toBe(80); // meta
    expect(bindArgs[1]).toBe(100); // orders
    expect(bindArgs[2]).toBe(30); // windowDays
    expect(bindArgs[3]).toBe(0.2); // gap
    expect(bindArgs[4]).toBe('test note'); // note
    expect(bindArgs[5]).toBeTypeOf('string'); // ipHash (length 64 for sha256)
    expect(bindArgs[5].length).toBe(64);
    expect(bindArgs[6]).toBe('test-agent'); // ua
  });
});
