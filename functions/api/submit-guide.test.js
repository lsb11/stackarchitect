import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost, onRequestOptions } from './submit-guide.js';

describe('submit-guide API endpoint', () => {
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      SYSTEME_IO_API_KEY: 'test-api-key',
    };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockContext = (body) => ({
    env: mockEnv,
    request: {
      json: vi.fn().mockResolvedValue(body),
    },
  });

  it('should return 400 for missing or invalid email', async () => {
    const context = createMockContext({});
    const response = await onRequestPost(context);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Valid email is required");

    const context2 = createMockContext({ email: "invalidemail" });
    const response2 = await onRequestPost(context2);
    expect(response2.status).toBe(400);
  });

  it('should return 500 if API key is missing', async () => {
    mockEnv.SYSTEME_IO_API_KEY = undefined;
    const context = createMockContext({ email: "test@example.com" });
    const response = await onRequestPost(context);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Server misconfiguration");
  });

  it('should forward request to systeme.io and return 200 on success', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });

    const context = createMockContext({ email: "test@example.com" });
    const response = await onRequestPost(context);

    expect(global.fetch).toHaveBeenCalledWith('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key',
      },
      body: JSON.stringify({ email: "test@example.com", tags: [{ name: 'guides-capture' }] }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it('should use custom tags if provided', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });

    const context = createMockContext({ email: "test@example.com", tags: [{ name: 'custom-tag' }] });
    const response = await onRequestPost(context);

    expect(global.fetch).toHaveBeenCalledWith('https://api.systeme.io/api/contacts', expect.objectContaining({
      body: JSON.stringify({ email: "test@example.com", tags: [{ name: 'custom-tag' }] }),
    }));

    expect(response.status).toBe(200);
  });

  it('should return 500 if upstream fails', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });

    const context = createMockContext({ email: "test@example.com" });
    const response = await onRequestPost(context);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to submit");
  });

  it('OPTIONS should return CORS headers', async () => {
    const response = await onRequestOptions();
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://stackarchitect.xyz');
  });
});
