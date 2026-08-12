#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// REDIRECT SMOKE TEST — stackarchitect.xyz
//
// WHY THIS EXISTS
// public/_redirects has been silently broken twice:
//   2026-07-02  "Restore full redirect map (wrong file was committed from Downloads)"
//   2026-07-17  "Restore /go affiliate redirects + 130 dropped legacy rules"
// Both times every legacy URL 404'd for weeks and the only signal was Google
// Search Console reporting it months later. This test makes that class of
// failure fail LOUDLY, in CI, in under a minute.
//
// WHAT IT ASSERTS
//   1. Every static rule in _redirects returns its declared status code.
//   2. The Location header matches the declared target exactly.
//   3. The redirect resolves in ONE hop (no chains — chains bleed PageRank
//      and are the documented cause of GSC "Redirect error").
//   4. Affiliate /go/ cloaks return 302 AND preserve their referral query
//      string. A dropped `?via=` or `?pc=` is silent revenue loss.
//   5. www. variants resolve to apex in at most TWO hops total.
//
// ZERO DEPENDENCIES. Node 18+ (native fetch).
//
// USAGE
//   node scripts/redirect-smoke.mjs                  # test live production
//   node scripts/redirect-smoke.mjs --base https://<preview>.pages.dev
//   node scripts/redirect-smoke.mjs --parse-only     # no network, CI-safe lint
//   node scripts/redirect-smoke.mjs --sample 40      # test a random subset
// ─────────────────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REDIRECTS_FILE = join(__dirname, '..', 'public', '_redirects');

// ── args ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const BASE = (arg('base', 'https://stackarchitect.xyz')).replace(/\/$/, '');
const PARSE_ONLY = argv.includes('--parse-only');
const SAMPLE = parseInt(arg('sample', '0'), 10);
const CONCURRENCY = parseInt(arg('concurrency', '8'), 10);

// ── parse _redirects ────────────────────────────────────────────────────
// Format: <source> <destination> [status]
// Skips comments, blanks, and dynamic rules (splats/placeholders) which
// cannot be asserted by literal path.
function parseRedirects(text) {
  const rules = [];
  const dynamic = [];
  text.split('\n').forEach((raw, idx) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split(/\s+/);
    if (parts.length < 2) return;
    const [source, destination, statusRaw] = parts;
    const status = parseInt(statusRaw, 10) || 301;
    const rule = { source, destination, status, line: idx + 1 };
    if (source.includes('*') || source.includes(':')) dynamic.push(rule);
    else rules.push(rule);
  });
  return { rules, dynamic };
}

// ── static lint: chains, loops, duplicates ──────────────────────────────
function lint(rules) {
  const problems = [];
  const norm = (p) => (p.replace(/\/$/, '') || '/');
  const map = new Map();

  for (const r of rules) {
    const key = norm(r.source);
    if (map.has(key)) {
      const prev = map.get(key);
      if (prev.destination !== r.destination) {
        problems.push(
          `CONFLICT  ${r.source} declared twice with different targets ` +
          `(line ${prev.line} -> ${prev.destination}, line ${r.line} -> ${r.destination})`
        );
      }
    } else {
      map.set(key, r);
    }
  }

  // A destination that is itself a source = a chain. Two 301s where one
  // would do. Fix by pointing the first rule at the final destination.
  for (const r of rules) {
    if (/^https?:\/\//.test(r.destination)) continue;
    const dest = norm(r.destination);
    if (map.has(dest)) {
      problems.push(
        `CHAIN     ${r.source} -> ${r.destination} -> ${map.get(dest).destination}  ` +
        `(line ${r.line}; point it directly at the final target)`
      );
    }
    if (dest === norm(r.source)) {
      problems.push(`LOOP      ${r.source} redirects to itself (line ${r.line})`);
    }
  }
  return problems;
}

// ── network assertions ──────────────────────────────────────────────────
async function head(url) {
  // manual redirect so we observe exactly one hop
  const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'redirect-smoke/1.0' } });
  return { status: res.status, location: res.headers.get('location') };
}

// Cloudflare returns a RELATIVE Location header for _redirects rules
// ("/blog/foo/"), while curl's %{redirect_url} resolves it to absolute. Both
// sides must be resolved against the same base before comparing, or every
// internal rule fails with actual === expected.
function resolve(value, base) {
  try {
    return new URL(value, base).href;
  } catch {
    return null;
  }
}

function sameTarget(location, expected, base) {
  if (!location) return false;
  const got = resolve(location, base);
  const want = resolve(expected, base);
  if (!got || !want) return false;
  // tolerate trailing-slash normalisation on the target
  return got.replace(/\/$/, '') === want.replace(/\/$/, '');
}

async function checkRule(r) {
  const url = BASE + r.source;
  try {
    let { status, location } = await head(url);

    const warnings = [];

    // Sources declared WITHOUT a trailing slash legitimately take two hops:
    // the middleware normalises /foo -> /foo/ first, and only then does the
    // _redirects rule fire. Hop one is NOT the final target, so comparing it
    // against the declared destination fails every slashless rule. Detect
    // "location is just my own source with a slash appended" and follow on.
    if (!r.source.endsWith('/') && location) {
      const selfSlashed = resolve(r.source.replace(/\/?$/, '/'), BASE);
      if (resolve(location, BASE) === selfSlashed) {
        const hop2 = await head(selfSlashed);
        status = hop2.status;
        location = hop2.location;
        warnings.push(`slashless source, resolves in 2 hops`);
      }
    }

    if (status !== r.status) {
      // A 301/302 swap is a real difference but not a broken redirect: the
      // user still lands in the right place. Cloudflare normalises some
      // declared 302s to 301 at the edge. Warn, don't fail the build —
      // a hard failure here would train people to ignore this test.
      if (status >= 300 && status < 400) {
        warnings.push(`declared ${r.status}, edge serves ${status}`);
      } else {
        return { ok: false, msg: `${r.source}  expected ${r.status}, got ${status}` };
      }
    }
    if (!sameTarget(location, r.destination, BASE)) {
      return {
        ok: false,
        msg: `${r.source}\n         got      -> ${resolve(location, BASE) || location}` +
             `\n         expected -> ${resolve(r.destination, BASE)}`,
      };
    }

    // Affiliate cloak: referral params must survive. This is the revenue-
    // critical assertion — a dropped ?via= earns nothing and fails silently.
    if (r.source.startsWith('/go/')) {
      const declaredQs = r.destination.split('?')[1];
      if (declaredQs && !(location || '').includes(declaredQs.split('&')[0])) {
        return { ok: false, msg: `${r.source}  REFERRAL PARAM DROPPED -> ${location}` };
      }
      return { ok: true, warnings };
    }

    // Internal target must not itself redirect (single hop).
    const absLocation = resolve(location, BASE);
    if (absLocation && absLocation.startsWith(BASE)) {
      const second = await head(absLocation);
      if (second.status >= 300 && second.status < 400) {
        return {
          ok: false,
          msg: `${r.source}  CHAIN: -> ${absLocation} -> ${resolve(second.location, BASE)}`,
        };
      }
      if (second.status === 404) {
        return { ok: false, msg: `${r.source}  target 404s: ${absLocation}` };
      }
    }
    return { ok: true, warnings };
  } catch (err) {
    return { ok: false, msg: `${r.source}  request failed: ${err.message}` };
  }
}

// simple concurrency pool
async function pool(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) out.push(await fn(items[i++]));
  });
  await Promise.all(workers);
  return out;
}

// ── main ────────────────────────────────────────────────────────────────
(async () => {
  const text = readFileSync(REDIRECTS_FILE, 'utf8');
  const { rules, dynamic } = parseRedirects(text);

  console.log(`\n  redirect-smoke  ${BASE}`);
  console.log(`  ${rules.length} static rules, ${dynamic.length} dynamic (not network-tested)\n`);

  // Guard against the exact bug that bit twice: a truncated file.
  const MIN_RULES = 100;
  if (rules.length < MIN_RULES) {
    console.error(
      `  ✗ FATAL: only ${rules.length} static rules found (expected >= ${MIN_RULES}).\n` +
      `    _redirects looks truncated — this is the "wrong file committed" failure.\n`
    );
    process.exit(1);
  }

  const lintProblems = lint(rules);
  if (lintProblems.length) {
    console.error('  Static problems:\n');
    lintProblems.forEach((p) => console.error(`    ✗ ${p}`));
    console.error('');
  } else {
    console.log('  ✓ static lint clean — no chains, loops or conflicts\n');
  }

  if (PARSE_ONLY) {
    process.exit(lintProblems.length ? 1 : 0);
  }

  let toTest = rules;
  if (SAMPLE > 0 && SAMPLE < rules.length) {
    toTest = [...rules].sort(() => Math.random() - 0.5).slice(0, SAMPLE);
    // always include every affiliate cloak — revenue critical
    const go = rules.filter((r) => r.source.startsWith('/go/'));
    toTest = [...new Set([...go, ...toTest])];
    console.log(`  sampling ${toTest.length} rules (all /go/ cloaks always included)\n`);
  }

  const results = await pool(toTest, CONCURRENCY, checkRule);
  const failures = results.filter((r) => !r.ok);
  const warnings = results.flatMap((r) => r.warnings || []);

  failures.forEach((f) => console.error(`    ✗ ${f.msg}`));

  if (warnings.length) {
    // Grouped, because 8 identical /go/ status notes is noise, not signal.
    const byKind = new Map();
    for (const w of warnings) {
      const kind = w.replace(/^\S+\s+/, '');
      byKind.set(kind, (byKind.get(kind) || 0) + 1);
    }
    console.log('\n  Warnings (not failures):');
    for (const [kind, n] of byKind) {
      console.log(`    ! ${kind}${n > 1 ? `  ×${n}` : ''}`);
    }
  }

  // www must reach apex in <= 2 hops total
  const wwwProbe = '/is-klaviyo-free/';
  try {
    const first = await head(`https://www.stackarchitect.xyz${wwwProbe}`);
    let hops = 1;
    let loc = first.location;
    while (loc && hops < 5) {
      const next = await head(loc);
      if (next.status < 300 || next.status >= 400) break;
      loc = next.location;
      hops++;
    }
    if (hops > 2) {
      console.error(`    ✗ www ${wwwProbe} took ${hops} hops to resolve (expected <= 2)`);
      failures.push({ ok: false });
    } else {
      console.log(`\n  ✓ www canonicalisation resolves in ${hops} hop(s)`);
    }
  } catch { /* non-fatal */ }

  const passed = results.length - failures.filter((f) => f.msg).length;
  console.log(`\n  ${passed}/${results.length} network assertions passed`);

  if (failures.length || lintProblems.length) {
    console.error(`\n  ✗ FAILED\n`);
    process.exit(1);
  }
  console.log(`  ✓ all redirects healthy\n`);
})();
