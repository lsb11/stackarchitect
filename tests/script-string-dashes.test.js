// tests/script-string-dashes.test.js: content-quality-guard rule 10, the em
// dash scan over script string literals and src/data files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dashesInScript, scriptBlocks, dashesInJson, closeSelfClosingScripts, EM_DASH } from '../scripts/lib/script-string-dashes.mjs';
import { sourceDashes } from '../scripts/content-quality-guard.mjs';

const D = EM_DASH;

test('flags an em dash in each quote style', () => {
  const code = `a = 'one ${D} two'; b = "three ${D} four"; c = \`five ${D} six\`;`;
  assert.equal(dashesInScript(code).length, 3);
});

test('ignores em dashes in line and block comments', () => {
  const code = `// a comment ${D} here\n/* block ${D} comment */\nconst x = 'clean';`;
  assert.deepEqual(dashesInScript(code), []);
});

test('reports the line the string starts on', () => {
  const code = `const a = 1;\n\nmsg.textContent = 'Could not submit ${D} please try again.';`;
  assert.equal(dashesInScript(code)[0].line, 3);
});

test('reads code inside ${} and keeps scanning the template after it', () => {
  const code = `x = \`total \${n > 1 ? 'items' : 'item'} ${D} done\`;`;
  const hits = dashesInScript(code);
  assert.equal(hits.length, 1);
  assert.match(hits[0].text, /done/);
});

test('a string used as a code argument is exempt: title.split(<dash>)', () => {
  assert.deepEqual(dashesInScript(`const h = title.split('${D}')[0];`), []);
});

test('a pageTitle value is exempt: <title> text is frozen', () => {
  assert.deepEqual(dashesInScript(`{ pageTitle: 'Meta CAPI ${D} Blueprint', name: 'x' }`), []);
  assert.equal(dashesInScript(`{ title: 'Meta CAPI ${D} Blueprint' }`).length, 1);
});

test('script blocks come from a parser: a <script in frontmatter or a string is not a block', () => {
  const src = `---\nconst snippet = '<script>alert("${D}")</script>';\n---\n<p>Text ${D} here</p>\n<script>const m = 'ok';</script>`;
  const blocks = scriptBlocks(src);
  assert.equal(blocks.length, 1);
  assert.deepEqual(dashesInScript(blocks[0].code), []);
});

test('a self-closing Astro <script ... /> does not swallow the markup after it', () => {
  const src = `<script type="application/ld+json" set:html={JSON.stringify({ a: 1 })} />\n<p>Visible ${D} text</p>`;
  assert.match(closeSelfClosingScripts(src), /\/><\/script>/);
  const blocks = scriptBlocks(src);
  assert.equal(blocks.length, 1);
  assert.deepEqual(dashesInScript(blocks[0].code), []);
});

test('JSON: every string value is checked, with its path', () => {
  const hits = dashesInJson({ a: 'fine', b: [{ c: `bad ${D} value` }] });
  assert.deepEqual(hits.map((h) => h.path), ['$.b[0].c']);
});

test('sourceDashes fails a src tree with a calculator string and a data file, and passes a clean one', () => {
  const root = mkdtempSync(join(tmpdir(), 'dash-'));
  const src = join(root, 'src');
  mkdirSync(join(src, 'pages'), { recursive: true });
  mkdirSync(join(src, 'data'), { recursive: true });
  writeFileSync(join(src, 'pages', 'calc.astro'), `---\nconst t = 'x';\n---\n<main></main>\n<script>grade = 'Good ${D} minor gaps remain';</script>`);
  writeFileSync(join(src, 'data', 'notes.json'), JSON.stringify({ note: `Early access ${D} not yet available.` }));
  writeFileSync(join(src, 'data', 'claims.json'), JSON.stringify({ pattern: `[-${D}]` }));
  const hits = sourceDashes(src.replace(/\\/g, '/'));
  assert.equal(hits.length, 2, JSON.stringify(hits));
  writeFileSync(join(src, 'pages', 'calc.astro'), `<main></main>\n<script>grade = 'Good: minor gaps remain';</script>`);
  writeFileSync(join(src, 'data', 'notes.json'), JSON.stringify({ note: 'Early access: not yet available.' }));
  assert.deepEqual(sourceDashes(src.replace(/\\/g, '/')), []);
});

test('the repository source has no em dash in a script string or data file', () => {
  assert.deepEqual(sourceDashes('src'), []);
});
