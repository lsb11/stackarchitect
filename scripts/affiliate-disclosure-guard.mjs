#!/usr/bin/env node
/**
 * Fails the build when a built page shows an affiliate link before it has
 * said, in words, that it carries affiliate links.
 *
 * WHY THIS EXISTS
 * On 24 Sep 2026, 4 of the 51 pages with /go/ links put one ahead of their
 * disclosure: the homepage (12 links before its <Disclosure /> block), and
 * /make-com-shopify/, /tools/ and /stocky-swap/, whose hero button was the
 * affiliate link while the disclosure sat further down. Every one of them had
 * a disclosure. It had drifted below a button that was added or moved later.
 * Placement is what drifts, so placement is what this checks.
 *
 * WHAT IT CHECKS
 * Runs over dist/ after the build. For every HTML page it finds the first
 * affiliate link in document order: an <a> whose href is a /go/ cloak
 * (relative or on stackarchitect.xyz), or whose rel contains "sponsored",
 * which is how this site marks one. It then requires disclosure wording in
 * the visible text before that link. Visible text means text outside
 * <script>, <style>, <template>, <noscript>, comments and tags. The scan
 * stops at the first affiliate link, so a button that says "affiliate"
 * cannot disclose itself. A per-link "affiliate" tag does not match either; the
 * wording has to say what the relationship is (DISCLOSURE below).
 *
 * WHAT IT DOES NOT CHECK
 * - Visibility. The check reads source order, not layout. A disclosure inside
 *   a panel that is hidden until a script runs still counts. The homepage's
 *   scanner plan is one: its disclosure is first in the document, so the
 *   solution cards further down carry their own <Disclosure /> as well.
 * - Distance. A disclosure 5,000 words above the link passes.
 * - Direct links to a vendor with an affiliate code in the URL that skip
 *   /go/ and carry no rel="sponsored". Nothing on the site does that today;
 *   the rel test is what would catch one that was marked properly.
 *
 * Wired into `npm run build`; tests/affiliate-disclosure-guard.test.js tests
 * the parser on fixtures.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Wording that states the relationship. Kept in step with the text of
// src/components/Disclosure.astro and the page-level notes that replace it.
export const DISCLOSURE = new RegExp([
  String.raw`affiliate (links?|commissions?|partners?|relationship|program(me)?|disclosure)`,
  String.raw`\bearns? (a |an )?(small )?(affiliate )?commissions?`,
  String.raw`\bmay earn (a |an )?(small )?commissions?`,
  String.raw`commission if you`,
  String.raw`links? (below|on this page) (are|may be) affiliate`,
].join('|'), 'i');

const GO_HREF = /^(?:https?:\/\/(?:www\.)?stackarchitect\.xyz)?\/go\//i;

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
}

export function isAffiliateLink(openTag) {
  const href = attr(openTag, 'href');
  const rel = attr(openTag, 'rel') || '';
  return (href != null && GO_HREF.test(href)) || /\bsponsored\b/i.test(rel);
}

function decode(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"').replace(/&[a-z]+;|&#\d+;/gi, ' ');
}

/**
 * Returns null when the page has no affiliate link, otherwise
 * { ok, href, text } for its first affiliate link, where `text` is the
 * visible text that precedes it (the last 200 characters, for the error
 * message). Text inside earlier affiliate links cannot occur: the scan stops
 * at the first one.
 */
export function checkHtml(html) {
  const body = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1\s*>/gi, ' ');
  const tag = /<\/?([a-zA-Z][\w-]*)\b[^>]*>/g;
  let text = '', last = 0, m;
  while ((m = tag.exec(body))) {
    text += ' ' + decode(body.slice(last, m.index));
    last = tag.lastIndex;
    if (m[1].toLowerCase() === 'a' && m[0][1] !== '/' && isAffiliateLink(m[0])) {
      const prose = text.replace(/\s+/g, ' ').trim();
      return { ok: DISCLOSURE.test(prose), href: attr(m[0], 'href'), text: prose.slice(-200) };
    }
  }
  return null;
}

function htmlFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

export function findUndisclosed(dist = path.join(ROOT, 'dist')) {
  const failures = [];
  let pages = 0;
  for (const f of htmlFiles(dist)) {
    const r = checkHtml(fs.readFileSync(f, 'utf8'));
    if (!r) continue;
    pages++;
    if (!r.ok) {
      const rel = path.relative(dist, f).split(path.sep).join('/');
      failures.push({ page: '/' + rel.replace(/index\.html$/, ''), href: r.href, before: r.text });
    }
  }
  return { pages, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(dist)) {
    console.error('[affiliate-disclosure-guard] dist/ is missing: run astro build first');
    process.exit(1);
  }
  const { pages, failures } = findUndisclosed(dist);
  if (failures.length) {
    console.error(`[affiliate-disclosure-guard] ${failures.length} page(s) show an affiliate link before any disclosure:`);
    for (const f of failures) console.error(`  ${f.page}  first link ${f.href}\n    text before it ends: "...${f.before.slice(-120)}"`);
    console.error('Put <Disclosure /> (or equivalent wording) above the first /go/ link on each page.');
    process.exit(1);
  }
  console.log(`[affiliate-disclosure-guard] ok: ${pages} page(s) with affiliate links, each disclosed before the first one`);
}
