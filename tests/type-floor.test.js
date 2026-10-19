// No text under 11px. On 19 Oct 2026, 1,107 text fragments across the 51
// sitemap pages rendered at 9 to 10.5px (labels, table headers, badges,
// breadcrumbs); 459 declarations were raised to 11px or more. This keeps a
// new 9px or 10px label from coming back in a page's own <style>.
// 8px rules that remain belong to markup no page renders; do not add more.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (p !== join('src', 'pages', 'og')) walk(p, out); }
    else if (/\.(astro|css)$/.test(f)) out.push(p);
  }
  return out;
}

test('no font-size between 9px and 10.5px in src', () => {
  const bad = [];
  for (const f of walk('src')) {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/font-size:\s?(9|9\.5|10|10\.5)px\b|font:\s?\d{3}\s(9|9\.5|10|10\.5)px/g)) {
      bad.push(`${f}: ${m[0]}`);
    }
  }
  assert.deepEqual(bad, [], 'text under 11px:\n' + bad.join('\n'));
});
