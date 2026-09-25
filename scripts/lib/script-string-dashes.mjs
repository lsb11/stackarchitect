/**
 * script-string-dashes.mjs: finds em dashes inside JavaScript string literals,
 * ignoring comments.
 *
 * content-quality-guard rule 8 reads the built HTML, so it only sees text that
 * is on the page when the HTML is served. A calculator writes its result into
 * the page later, from a string literal in an inline <script>, and a data file
 * under src/ can feed a page the guard never builds as a sitemap page. Both
 * slipped through: on 25 Sep 2026 the calculators and data files held em
 * dashes in strings a reader sees, while the built pages passed.
 *
 * The scan is a small tokenizer, not a parser. It tracks line comments, block
 * comments and the three quote styles, and treats `${...}` inside a template
 * literal as code. A regex literal containing a quote could confuse it; none of
 * the scanned files has one, and the tests pin the cases that matter.
 */

import { parse } from 'parse5';

export const EM_DASH = String.fromCharCode(0x2014);

// Two kinds of string are exempt, and only these two.
//  1. A string passed to a string method as code: title.split(<em dash>) in
//     Base.astro reads the separator out of a page title. It is never shown.
//  2. The value of a `pageTitle` key: src/data/products.ts holds the <title>
//     of each /pro/<slug>/ page there, and <title> text is frozen with the URL
//     set. Rule 8 already exempts <title>.
const CODE_ARG = /\.(split|includes|indexOf|lastIndexOf|replace|replaceAll|startsWith|endsWith|join)\(\s*$/;
const TITLE_KEY = /\bpageTitle\s*:\s*$/;

/** Every string literal in `code` that contains an em dash, with its line. */
export function dashesInScript(code) {
  const out = [];
  let i = 0;
  let line = 1;
  const n = code.length;
  // Stack of template-literal depths, so `${ "a <em dash> b" }` inside a template is
  // read as code containing a string.
  const braces = [];
  let start = 0;
  const push = (text, startLine) => {
    const before = code.slice(Math.max(0, start - 40), start);
    if (CODE_ARG.test(before) || TITLE_KEY.test(before)) return;
    if (text.includes(EM_DASH)) out.push({ line: startLine, text: text.replace(/\s+/g, ' ').trim().slice(0, 100) });
  };
  const readString = (quote) => {
    const startLine = line;
    let text = '';
    i++; // opening quote
    while (i < n) {
      const c = code[i];
      if (c === '\\') { text += code.slice(i, i + 2); if (code[i + 1] === '\n') line++; i += 2; continue; }
      if (c === '\n') { line++; if (quote !== '`') break; }
      if (quote === '`' && c === '$' && code[i + 1] === '{') {
        push(text, startLine);
        text = '';
        braces.push(0);
        i += 2;
        return 'template-open';
      }
      if (c === quote) { i++; break; }
      text += c;
      i++;
    }
    push(text, startLine);
    return 'done';
  };
  while (i < n) {
    const c = code[i];
    const d = code[i + 1];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && d === '/') { while (i < n && code[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) { if (code[i] === '\n') line++; i++; }
      i += 2;
      continue;
    }
    if (braces.length) {
      if (c === '{') { braces[braces.length - 1]++; i++; continue; }
      if (c === '}') {
        if (braces[braces.length - 1] === 0) {
          // Back into the template literal that opened this ${ }.
          braces.pop();
          i++;
          const r = readTemplateTail();
          if (r === 'template-open') continue;
          continue;
        }
        braces[braces.length - 1]--;
        i++;
        continue;
      }
    }
    if (c === '"' || c === "'" || c === '`') { start = i; readString(c); continue; }
    i++;
  }
  return out;

  function readTemplateTail() {
    // Continue a template literal after `}` without consuming a new opening quote.
    const startLine = line;
    let text = '';
    while (i < n) {
      const c = code[i];
      if (c === '\\') { text += code.slice(i, i + 2); i += 2; continue; }
      if (c === '\n') line++;
      if (c === '$' && code[i + 1] === '{') { push(text, startLine); braces.push(0); i += 2; return 'template-open'; }
      if (c === '`') { i++; break; }
      text += c;
      i++;
    }
    push(text, startLine);
    return 'done';
  }
}

/**
 * Astro allows `<script ... set:html={...} />`. An HTML parser has no
 * self-closing script, reads it as an open tag and swallows the markup after it
 * as script text, so a paragraph on /refund-policy/ read as code. This finds
 * the end of each <script tag (skipping quotes and {...} attribute values,
 * which may contain '>') and adds the missing close tag.
 */
export function closeSelfClosingScripts(markup) {
  let out = '';
  let i = 0;
  const re = /<script\b/gi;
  let m;
  while ((m = re.exec(markup))) {
    let j = m.index + m[0].length;
    let depth = 0;
    let quote = null;
    for (; j < markup.length; j++) {
      const c = markup[j];
      if (quote) { if (c === quote) quote = null; continue; }
      if (depth > 0) {
        if (c === '"' || c === "'" || c === '`') quote = c;
        else if (c === '{') depth++;
        else if (c === '}') depth--;
        continue;
      }
      if (c === '"' || c === "'") quote = c;
      else if (c === '{') depth++;
      else if (c === '>') break;
    }
    const selfClosing = markup[j - 1] === '/';
    out += markup.slice(i, j + 1) + (selfClosing ? '</script>' : '');
    i = j + 1;
    re.lastIndex = i;
  }
  return out + markup.slice(i);
}

/**
 * The bodies of every <script> element in an .astro or .md source file, found
 * by an HTML parser rather than a regex: a regex also matches `<script` inside
 * a string or an HTML comment, and then reads markup as code. The frontmatter
 * fence is blanked first, keeping line numbers; it is TypeScript, not markup.
 */
export function scriptBlocks(source) {
  const fm = source.match(/^---\n[\s\S]*?\n---/);
  const markup = closeSelfClosingScripts(fm ? fm[0].replace(/[^\n]/g, ' ') + source.slice(fm[0].length) : source);
  const out = [];
  const walk = (n) => {
    if (n.tagName === 'script' && n.sourceCodeLocation) {
      const code = (n.childNodes || []).map((c) => c.value || '').join('');
      out.push({ code, line: n.sourceCodeLocation.startLine, type: (n.attrs || []).find((a) => a.name === 'type')?.value || '' });
    }
    for (const c of n.childNodes || []) walk(c);
    if (n.content) walk(n.content);
  };
  walk(parse(markup, { sourceCodeLocationInfo: true }));
  return out;
}

/** Em dashes in every string value of a parsed JSON document. */
export function dashesInJson(value, path = '$', out = []) {
  if (typeof value === 'string') {
    if (value.includes(EM_DASH)) out.push({ path, text: value.replace(/\s+/g, ' ').trim().slice(0, 100) });
  } else if (Array.isArray(value)) {
    value.forEach((v, k) => dashesInJson(v, `${path}[${k}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) dashesInJson(v, `${path}.${k}`, out);
  }
  return out;
}
