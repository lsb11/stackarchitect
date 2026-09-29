import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasAlt, imgsWithoutAlt } from '../scripts/img-alt-guard.mjs';

test('a written alt passes', () => {
  assert.equal(hasAlt('<img src="/a.png" alt="StockLog movement history">'), true);
});

test('an empty alt passes, quoted or bare, since both mean decorative', () => {
  assert.equal(hasAlt('<img src="/a.png" alt="">'), true);
  assert.equal(hasAlt('<img src="/a.png" alt loading="eager">'), true);
  assert.equal(hasAlt('<img src="/a.png" alt>'), true);
  assert.equal(hasAlt('<img src="/a.png" alt/>'), true);
});

test('no alt attribute fails', () => {
  assert.equal(hasAlt('<img src="/a.png" width="64">'), false);
});

test('an attribute that merely contains "alt" is not an alt', () => {
  assert.equal(hasAlt('<img src="/a.png" data-alt="x">'), false);
  assert.equal(hasAlt('<img src="/alt.png">'), false);
});

test('finds each <img> without alt, including one split across lines', () => {
  const html = '<main><img src="/a.png" alt="A"><img\n  src="/b.png"\n  width="10"></main>';
  assert.deepEqual(imgsWithoutAlt(html), ['<img\n  src="/b.png"\n  width="10">']);
});

test('<img> inside a comment, script or style is not an element and is ignored', () => {
  const html = '<!-- <img src="/x.png"> --><script>el.innerHTML = "<img src=/y.png>";</script><style>/* <img> */</style>';
  assert.deepEqual(imgsWithoutAlt(html), []);
});
