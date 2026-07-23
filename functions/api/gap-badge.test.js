import { describe, it, expect } from 'vitest';
import { buildBadge, onRequestGet } from './gap-badge.js';

describe('gap-badge', () => {
  describe('buildBadge', () => {
    it('generates valid SVG string', () => {
      const svg = buildBadge('label', 'value', '#000');
      expect(svg).toContain('<svg');
      expect(svg).toContain('label');
      expect(svg).toContain('value');
      expect(svg).toContain('#000');
    });
  });

  describe('onRequestGet', () => {
    const createMockContext = (results) => ({
      env: {
        DB: {
          prepare: () => ({
            all: async () => {
              if (results instanceof Error) {
                throw results;
              }
              return { results };
            }
          })
        }
      }
    });

    it('returns synthesis value when DB throws an error', async () => {
      const context = createMockContext(new Error('DB error'));
      const response = await onRequestGet(context);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');

      const text = await response.text();
      expect(text).toContain('20\u201340% est.');
    });

    it('returns synthesis value when there are fewer than 10 rows', async () => {
      const results = Array.from({ length: 9 }, (_, i) => ({ gap_pct: i * 0.05 }));
      const context = createMockContext(results);
      const response = await onRequestGet(context);

      const text = await response.text();
      expect(text).toContain('20\u201340% est.');
    });

    it('returns median for odd number of rows >= 10', async () => {
      // 11 rows: 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1
      // Median is the 6th element: 0.6 (60.0%)
      const results = Array.from({ length: 11 }, (_, i) => ({ gap_pct: (i + 1) * 0.1 }));
      const context = createMockContext(results);
      const response = await onRequestGet(context);

      const text = await response.text();
      expect(text).toContain('60.0% median (N=11)');
    });

    it('returns median for even number of rows >= 10', async () => {
      // 10 rows: 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0
      // Median is the average of 5th and 6th elements: (0.5 + 0.6) / 2 = 0.55 (55.0%)
      const results = Array.from({ length: 10 }, (_, i) => ({ gap_pct: (i + 1) * 0.1 }));
      const context = createMockContext(results);
      const response = await onRequestGet(context);

      const text = await response.text();
      expect(text).toContain('55.0% median (N=10)');
    });
  });
});
