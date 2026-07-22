import { describe, it, expect } from 'vitest';
import { buildBadge } from './gap-badge.js';

describe('buildBadge', () => {
  it('should generate an SVG with the correct label and value', () => {
    const svg = buildBadge('test label', 'test value', '#ff0000');
    expect(svg).toContain('<svg');
    expect(svg).toContain('test label');
    expect(svg).toContain('test value');
    expect(svg).toContain('#ff0000');
  });

  it('should calculate the correct width', () => {
    const label = 'a'; // length 1
    const value = 'b'; // length 1
    // CHAR_W = 6.6, PAD = 10
    // lw = Math.round(1 * 6.6 + 20) = Math.round(26.6) = 27
    // vw = Math.round(1 * 6.6 + 20) = Math.round(26.6) = 27
    // w = 54
    const svg = buildBadge(label, value, '#000');
    expect(svg).toContain('width="54"');

    // Check rects and text positioning
    expect(svg).toContain('<rect width="27" height="20" fill="#0a0a0a"/>');
    expect(svg).toContain('<rect x="27" width="27" height="20" fill="#062e17"/>');
    expect(svg).toContain(`<text x="${27 / 2}" y="14" fill="#e8eef4">a</text>`);
    expect(svg).toContain(`<text x="${27 + 27 / 2}" y="14" fill="#000" font-weight="bold">b</text>`);
  });

  it('should properly escape special characters', () => {
    const svg = buildBadge('label <&>', 'value <&>', '#000');
    expect(svg).toContain('label &lt;&amp;&gt;');
    expect(svg).toContain('value &lt;&amp;&gt;');
  });

  it('should properly set aria-label and title', () => {
    const svg = buildBadge('hello', 'world', '#000');
    expect(svg).toContain('aria-label="hello: world"');
    expect(svg).toContain('<title>hello: world</title>');
  });
});
