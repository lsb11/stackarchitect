import { describe, it, expect } from 'vitest';
import { sha256 } from './submit-gap.js';

describe('sha256', () => {
  it('should compute the correct SHA-256 hash for a known IP string', async () => {
    const input = '127.0.0.1';
    // SHA-256 of "127.0.0.1"
    const expected = '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0';
    const result = await sha256(input);
    expect(result).toBe(expected);
  });

  it('should compute the correct SHA-256 hash for an empty string', async () => {
    const input = '';
    // SHA-256 of ""
    const expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const result = await sha256(input);
    expect(result).toBe(expected);
  });

  it('should correctly handle a string with non-ASCII characters', async () => {
    const input = 'hello world 🚀';
    // SHA-256 of "hello world 🚀"
    const expected = '7794bdd7454346eb21712d6fa26d63df3db615cd34f20d9ad5cd455897d7ca8a';
    const result = await sha256(input);
    expect(result).toBe(expected);
  });

  it('should produce deterministic output for the same input', async () => {
    const input = 'some random string to test determinism';
    const result1 = await sha256(input);
    const result2 = await sha256(input);
    expect(result1).toBe(result2);
  });
});
