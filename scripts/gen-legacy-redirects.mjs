#!/usr/bin/env node
// scripts/gen-legacy-redirects.mjs — compile public/_redirects into a module
// the edge middleware can consult at runtime.
//
// WHY THIS EXISTS (2026-09-18)
// public/_redirects is served by the Pages ASSET server, which runs AFTER
// functions/_middleware.js. So when a slashless legacy URL arrived, the
// middleware appended a trailing slash and returned 301 before _redirects ever
// saw the request; the asset server then issued a SECOND 301 to the real
// destination. 110 of the 231 literal legacy sources resolved in two hops that
// way, and every slashless line in _redirects was unreachable dead code.
//
// The middleware cannot read a file at runtime, so the rules are compiled into
// a module here and imported. public/_redirects REMAINS the source of truth and
// remains deployed: it is the fallback if the Function ever fails to run, and
// it is what the /go/* cloaks still use. tests/legacy-redirects.test.js fails
// if this generated file drifts from it.
//
//   node scripts/gen-legacy-redirects.mjs          # write
//   node scripts/gen-legacy-redirects.mjs --check  # verify in sync, exit 1 if not
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'public/_redirects';
const OUT = 'functions/_legacy-redirects.js';

export function parseRedirects(text) {
  const rules = [];
  for (const [i, raw] of text.split('\n').entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [from, to, status] = line.split(/\s+/);
    if (!from || !to) continue;
    // /go/* affiliate cloaks stay with the asset server. They are 302s to
    // off-site URLs, they already resolve in a single hop, and they are
    // revenue-critical — the middleware must not touch them.
    if (from.startsWith('/go/')) continue;
    rules.push({ from, to, status: Number(status) || 301, line: i + 1 });
  }
  return rules;
}

const rules = parseRedirects(readFileSync(SRC, 'utf8'));

const banner = `// GENERATED FILE — DO NOT EDIT BY HAND.
//
// Source: public/_redirects  ·  Generator: scripts/gen-legacy-redirects.mjs
// Regenerate with:  node scripts/gen-legacy-redirects.mjs
//
// Edit public/_redirects instead, then regenerate. tests/legacy-redirects.test.js
// fails the build if these two drift apart.
//
// /go/* cloaks are deliberately absent: those stay with the Pages asset server.
`;

const body = `${banner}
// Ordered exactly as in public/_redirects. FIRST MATCH WINS, which is what the
// Pages asset server does, so literal rules must stay above the \`:slug\` and
// \`*\` patterns.
export const LEGACY_RULES = ${JSON.stringify(
  rules.map(({ from, to, status }) => ({ from, to, status })),
  null,
  2,
)};

// Matches one path against one rule's \`from\` pattern, supporting the two
// pattern forms public/_redirects actually uses:
//   /tools/:slug   — \`:name\` captures exactly one path segment
//   /faq/*         — \`*\` captures the rest of the path as \`:splat\`
// Returns a map of captures, or null when the rule does not match.
function matchRule(from, path) {
  const params = {};
  if (from.includes('*')) {
    const prefix = from.slice(0, from.indexOf('*'));
    if (!path.startsWith(prefix)) return null;
    params.splat = path.slice(prefix.length);
    return params;
  }
  if (from.includes(':')) {
    const f = from.split('/');
    const p = path.split('/');
    if (f.length !== p.length) return null;
    for (let i = 0; i < f.length; i++) {
      if (f[i].startsWith(':')) {
        if (!p[i]) return null;
        params[f[i].slice(1)] = p[i];
      } else if (f[i] !== p[i]) {
        return null;
      }
    }
    return params;
  }
  return from === path ? params : null;
}

function expand(to, params) {
  return to.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (m, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? params[name] : m,
  );
}

// Resolves a pathname against the compiled rules.
//
// Tries the path as given, then with its trailing slash toggled. That second
// attempt is what collapses the old two-hop chains: 11 legacy sources are
// declared ONLY in their trailing-slash form, so a slashless request used to
// need a slash-adding 301 before it could match anything.
//
// Returns { to, status } or null.
export function resolveLegacy(pathname) {
  const alt = pathname.endsWith('/')
    ? pathname.slice(0, -1) || '/'
    : pathname + '/';
  for (const candidate of [pathname, alt]) {
    if (!candidate) continue;
    for (const rule of LEGACY_RULES) {
      const params = matchRule(rule.from, candidate);
      if (params) return { to: expand(rule.to, params), status: rule.status };
    }
  }
  return null;
}
`;

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    /* missing counts as out of sync */
  }
  if (current !== body) {
    console.error(
      `✗ ${OUT} is out of sync with ${SRC}.\n  Run: node scripts/gen-legacy-redirects.mjs`,
    );
    process.exit(1);
  }
  console.log(`✓ ${OUT} is in sync with ${SRC} (${rules.length} rules)`);
} else {
  writeFileSync(OUT, body);
  console.log(`✓ wrote ${OUT} — ${rules.length} rules from ${SRC} (/go/* excluded)`);
}
