import { describe, it, expect, vi } from 'vitest';
import { onRequestPost, onRequestOptions } from './submit-gap.js';

describe('submit-gap API', () => {
  const createMockContext = (bodyData, headers = {}, dbRunReject = false) => {
    return {
      request: {
        json: vi.fn().mockImplementation(async () => {
          if (bodyData === 'INVALID_JSON') throw new Error('Invalid JSON');
          return bodyData;
        }),
        headers: {
          get: vi.fn((key) => headers[key] || null)
        }
      },
      env: {
        DB: {
          prepare: vi.fn().mockReturnValue({
            bind: vi.fn().mockReturnValue({
              run: vi.fn().mockImplementation(async () => {
                if (dbRunReject) throw new Error('DB Error');
                return {};
              })
            })
          })
        }
      }
    };
  };

  describe('onRequestOptions', () => {
    it('returns CORS headers', async () => {
      const response = await onRequestOptions();
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://stackarchitect.xyz');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    });
  });

  describe('onRequestPost', () => {
    it('returns 400 on invalid JSON', async () => {
      const context = createMockContext('INVALID_JSON');
      const response = await onRequestPost(context);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid JSON');
    });

    it('returns 400 if meta_reported is missing or negative', async () => {
      const context = createMockContext({ actual_orders: 100, window_days: 30 });
      const response = await onRequestPost(context);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain('meta_reported must be a non-negative integer');

      const context2 = createMockContext({ meta_reported: -1, actual_orders: 100, window_days: 30 });
      const response2 = await onRequestPost(context2);
      expect(response2.status).toBe(400);
    });

    it('returns 400 if actual_orders is zero or negative', async () => {
      const context = createMockContext({ meta_reported: 10, actual_orders: 0, window_days: 30 });
      const response = await onRequestPost(context);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain('actual_orders must be a positive integer');
    });

    it('returns 400 if window_days is invalid', async () => {
      const context = createMockContext({ meta_reported: 10, actual_orders: 100, window_days: 0 });
      const response = await onRequestPost(context);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain('window_days must be 1–365');

      const context2 = createMockContext({ meta_reported: 10, actual_orders: 100, window_days: 400 });
      const response2 = await onRequestPost(context2);
      expect(response2.status).toBe(400);
    });

    it('returns 400 if meta_reported exceeds actual_orders', async () => {
      const context = createMockContext({ meta_reported: 101, actual_orders: 100, window_days: 30 });
      const response = await onRequestPost(context);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain('meta_reported cannot exceed actual_orders');
    });

    it('returns 422 if actual_orders < 20', async () => {
      const context = createMockContext({ meta_reported: 5, actual_orders: 10, window_days: 30 });
      const response = await onRequestPost(context);
      expect(response.status).toBe(422);
      expect((await response.json()).error).toContain('actual_orders must be at least 20');
    });

    it('successfully processes valid submission', async () => {
      const context = createMockContext({
        meta_reported: 80,
        actual_orders: 100,
        window_days: 30,
        platform_note: 'Test note'
      }, {
        'CF-Connecting-IP': '127.0.0.1',
        'User-Agent': 'Test-Agent'
      });

      const response = await onRequestPost(context);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);

      // Verify DB logic
      const prepareMock = context.env.DB.prepare;
      expect(prepareMock).toHaveBeenCalled();
      const bindMock = prepareMock.mock.results[0].value.bind;
      expect(bindMock).toHaveBeenCalled();

      const bindArgs = bindMock.mock.calls[0];
      expect(bindArgs[0]).toBe(80); // meta
      expect(bindArgs[1]).toBe(100); // orders
      expect(bindArgs[2]).toBe(30); // windowDays
      expect(bindArgs[3]).toBe(0.2); // gap
      expect(bindArgs[4]).toBe('Test note'); // note
      expect(typeof bindArgs[5]).toBe('string'); // ipHash
      expect(bindArgs[6]).toBe('Test-Agent'); // ua
    });

    it('handles DB errors by returning 500 status code', async () => {
      const context = createMockContext({
        meta_reported: 80,
        actual_orders: 100,
        window_days: 30
      }, {}, true);

      const response = await onRequestPost(context);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Could not store submission');
    });
  });
});
