/**
 * The two in-browser tools make no network request.
 *
 * WHY THIS EXISTS
 * /meta-capi-payload-validator/ tells readers they can paste a real Meta
 * Conversions API event, customer details included, because "it runs entirely
 * in your browser, so nothing you paste is sent anywhere". The Apps Script
 * error explainer in the quotas post says the same of a pasted error. That is
 * a promise about code, so it is tested rather than trusted: one fetch() added
 * to either tool, or to a package it imports, would quietly make it false.
 *
 * WHAT IT CHECKS
 *   1. The tools' source modules (src/scripts/) never mention fetch,
 *      XMLHttpRequest, sendBeacon or WebSocket, and never call gtag or
 *      dataLayer directly: their only analytics goes through the consent-gated
 *      tracker in Base.astro (the sa:tool event, which passes on numbers only).
 *   2. After a build, the same for what actually ships: the JavaScript chunk
 *      that holds each tool on its built page, plus every chunk it imports.
 *      That covers the npm packages' code as bundled. It also confirms the
 *      rules came from the packages (a string from each package is in the
 *      bundle) rather than from a copy.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = path.join(ROOT, 'dist');

// `fetch` as a standalone identifier: not "UrlFetch", not "url-fetch-calls".
const NETWORK = [
  ['fetch', /(?<![\w$-])fetch(?![\w$-])/],
  ['XMLHttpRequest', /XMLHttpRequest/],
  ['sendBeacon', /sendBeacon/],
  ['WebSocket', /WebSocket/],
];
const DIRECT_ANALYTICS = [
  ['gtag', /(?<![\w$-])gtag(?![\w$-])/],
  ['dataLayer', /dataLayer/],
];

const TOOLS = [
  {
    name: 'Meta CAPI payload validator',
    source: 'src/scripts/capi-validator.ts',
    page: 'meta-capi-payload-validator/index.html',
    marker: 'capi_validator',
    fromPackage: 'event_time looks like milliseconds',
  },
  {
    name: 'Apps Script error explainer',
    source: 'src/scripts/quota-explainer.ts',
    page: 'blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/index.html',
    marker: 'quotas-explainer-workspace',
    fromPackage: 'service using too much computer time for one day',
  },
];

function offences(code, rules) {
  return rules.filter(([, re]) => re.test(code)).map(([name]) => name);
}

for (const t of TOOLS) {
  test(`${t.name}: source makes no network request and no direct analytics call`, () => {
    const code = fs.readFileSync(path.join(ROOT, t.source), 'utf8');
    assert.deepEqual(offences(code, NETWORK), [], `${t.source} mentions a network API`);
    assert.deepEqual(offences(code, DIRECT_ANALYTICS), [], `${t.source} calls analytics directly`);
  });
}

/** Module scripts on a built page: [{ file, code }], inline ones included. */
function pageScripts(html) {
  const out = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1];
    if (!/type="module"/.test(attrs)) continue;
    const src = attrs.match(/\ssrc="([^"]+)"/);
    if (src) out.push(src[1]);
    else out.push({ inline: m[2] });
  }
  return out;
}

/** A chunk and every chunk it imports, statically or dynamically. */
function chunkGraph(entry) {
  const seen = new Map();
  const visit = (file) => {
    if (seen.has(file)) return;
    const code = fs.readFileSync(file, 'utf8');
    seen.set(file, code);
    for (const m of code.matchAll(/(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) {
      visit(path.resolve(path.dirname(file), m[1]));
    }
  };
  visit(entry);
  return seen;
}

for (const t of TOOLS) {
  const built = path.join(DIST, t.page);
  test(`${t.name}: the shipped bundle makes no network request`, { skip: !fs.existsSync(built) && 'run `npm run build` first' }, () => {
    const html = fs.readFileSync(built, 'utf8');
    const graphs = [];
    for (const s of pageScripts(html)) {
      if (typeof s === 'string') {
        graphs.push(chunkGraph(path.join(DIST, s.replace(/^\//, ''))));
      } else {
        graphs.push(new Map([['(inline)', s.inline]]));
      }
    }
    const mine = graphs.filter((g) => [...g.values()].some((code) => code.includes(t.marker)));
    assert.equal(mine.length, 1, `expected exactly one module script on ${t.page} to hold the ${t.name}`);
    const all = [...mine[0].entries()];
    assert.ok(all.some(([, code]) => code.toLowerCase().includes(t.fromPackage)),
      `the ${t.name} bundle does not contain the package's rules ("${t.fromPackage}"): is it still importing the package?`);
    for (const [file, code] of all) {
      const rel = path.relative(ROOT, file);
      assert.deepEqual(offences(code, NETWORK), [], `${rel} mentions a network API`);
      assert.deepEqual(offences(code, DIRECT_ANALYTICS), [], `${rel} calls analytics directly`);
    }
  });
}
