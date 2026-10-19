// Every tool screenshot named in src/data/toolShots.ts exists, carries the
// width and height of the file (so the page reserves the right space and
// does not shift as it loads), and has an entry in the image manifest with
// its text, so the image checks read it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const src = readFileSync('src/data/toolShots.ts', 'utf8');
const shots = [...src.matchAll(/"src": "\/screens\/([a-z-]+\.webp)", "w": (\d+), "h": (\d+)/g)].map((m) => ({ file: m[1], w: +m[2], h: +m[3] }));
const manifest = JSON.parse(readFileSync('scripts/og/og-images.json', 'utf8')).images;

function webpSize(buf) {
  const fourcc = buf.toString('ascii', 12, 16);
  if (fourcc === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (fourcc === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  if (fourcc === 'VP8L') { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
  throw new Error('unknown webp chunk ' + fourcc);
}

test('tool screenshots are listed', () => assert.ok(shots.length >= 6));
for (const s of shots) {
  test(`${s.file}: file, dimensions and manifest entry agree`, () => {
    const path = `public/screens/${s.file}`;
    assert.ok(existsSync(path), `${path} missing`);
    assert.deepEqual(webpSize(readFileSync(path)), { w: s.w, h: s.h });
    const entry = manifest[path];
    assert.ok(entry && entry.text.length > 0, `${path} has no manifest text`);
  });
}
