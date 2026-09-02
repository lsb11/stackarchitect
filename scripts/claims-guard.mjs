#!/usr/bin/env node
/**
 * claims-guard.mjs — fails the build when a page asserts a third-party price
 * without carrying a verification date.
 *
 * WHY A RATCHET AND NOT A FLAG DAY
 * The August 2026 audit found 31 page files asserting third-party prices with
 * no verifiedDate. The obvious "fix" — stamp today's date on all 31 — would
 * assert that a human checked those figures against the vendor's live pricing
 * page. Nobody has. That is manufacturing the exact trust signal the audit
 * exists to make real, and it would be worse than the current state: an
 * undated price is unverified, a falsely dated price is a lie with a
 * timestamp.
 *
 * So the guard ships with the current offenders quarantined in
 * docs/claims-unverified.json. The rules are:
 *
 *   1. A page with third-party price claims and no verifiedDate FAILS the
 *      build — unless it is quarantined.
 *   2. The quarantine can only shrink. Adding to it requires editing the file
 *      by hand, which is a reviewable diff and a deliberate act.
 *   3. A quarantined page that has since gained a verifiedDate, or lost its
 *      price claims, FAILS as stale — so the list cannot rot into a
 *      permanent exemption nobody revisits.
 *
 * Clearing an entry means opening the vendor's pricing page, reading the
 * number, and passing the date you read it as verifiedDate to <Base>. That
 * is the whole job. There is no other way to clear it.
 *
 * ---------------------------------------------------------------------------
 * SECOND CHECK — CANONICAL FIGURES (src/data/claims.json)
 *
 * The ratchet above asks "is this number dated?". It cannot ask "is this
 * number right?", and that is the failure that actually happened: two blog
 * posts drifted from $9 to $12 for Make Core and sat wrong for months, while
 * the kit price lived as a literal inside this file's own allowlist, so
 * moving the kit off $29 broke the build rather than being caught by it.
 *
 * src/data/claims.json names the figures we consider settled — our prices,
 * Make's Core price, Make's free-plan scenario cap, the savings range. This
 * check reads every page and fails the build when one states a number in the
 * right context with the wrong value, or repeats a claim we have retired.
 *
 * There is no quarantine for this one. A quarantine is for work outstanding —
 * a vendor price nobody has verified yet. A contradiction of a canonical
 * figure is not outstanding work, it is a page that is wrong, and the fix is
 * to correct the page or to change claims.json deliberately.
 *
 * ---------------------------------------------------------------------------
 * THIRD CHECK — press credentials. See checkPress() below.
 *
 * ---------------------------------------------------------------------------
 * FOURTH AND FIFTH CHECKS — affiliate integrity. See checkDisclosure() and
 * checkGoTargets() below.
 *
 * Fourth: a page carrying a /go/* cloak must carry <Disclosure /> too. An
 * undisclosed affiliate link is the one failure on this site that is a legal
 * problem and not merely an SEO one, and it had already happened once — the
 * Apps Script quotas post injected a floating /go/make/ CTA from an inline
 * script and disclosed nothing.
 *
 * Fifth: no /go/* cloak may resolve to a domain listed in src/data/apps.json.
 * apps.json is the list of apps this site tells readers to *replace*. Earning
 * a commission on an app we also tell you to drop makes the comparison
 * worthless, whatever the recommendation happens to be. This is what caught
 * /go/gorgias, which paid a $200-500 bounty on a vendor apps.json names as
 * something to swap out for Tidio.
 *
 * Usage:
 *   node scripts/claims-guard.mjs          # exit 1 on violation
 *   node scripts/claims-guard.mjs --list   # print the worklist, always exit 0
 *
 * Runs as part of `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const QUARANTINE = path.join(ROOT, 'docs', 'claims-unverified.json');
const CANONICAL = path.join(ROOT, 'src', 'data', 'claims.json');

const canonical = JSON.parse(fs.readFileSync(CANONICAL, 'utf8'));

/** Every figure under `ours` as a bare number, for the allowlist below. */
const ourPrices = Object.values(canonical.ours)
  .map((c) => c.value)
  .filter((v) => typeof v === 'number');

/**
 * Prices that are ours, not a third party's, and so need no vendor source.
 * Built from src/data/claims.json — $0 (the free stack, the whole premise)
 * plus every figure under `ours`. Everything else is somebody else's number
 * and needs a source and a date.
 *
 * This list used to be a hand-written regex, which is exactly how it went
 * stale: the kit moved to $24 and every mention of the new price read as an
 * undated third-party claim.
 */
const OURS = new RegExp(
  `^\\$(0|${ourPrices.map((v) => String(v).replace('.', '\\.')).join('|')})` +
    `(\\/(mo|month|yr|year))?[,.]?$`
);

const PRICE =
  /\$[0-9][0-9,]*(?:\.[0-9]{2})?(?:\s*[–—-]\s*\$?[0-9][0-9,]*(?:\.[0-9]{2})?)?(?:\s*\/\s*(?:mo|month|yr|year))?\+?/g;

function claimsIn(source) {
  return [...source.matchAll(PRICE)].map((m) => m[0].trim()).filter((p) => !OURS.test(p));
}

function scan() {
  const out = [];

  const pagesDir = path.join(ROOT, 'src', 'pages');
  for (const f of fs.readdirSync(pagesDir).filter((f) => f.endsWith('.astro'))) {
    const rel = `src/pages/${f}`;
    const src = fs.readFileSync(path.join(pagesDir, f), 'utf8');
    out.push({ file: rel, claims: claimsIn(src), dated: /verifiedDate/.test(src) });
  }

  const blogDir = path.join(ROOT, 'src', 'content', 'blog');
  if (fs.existsSync(blogDir)) {
    for (const f of fs.readdirSync(blogDir).filter((f) => /\.mdx?$/.test(f))) {
      const rel = `src/content/blog/${f}`;
      const src = fs.readFileSync(path.join(blogDir, f), 'utf8');
      // Blog posts carry the date in frontmatter, not as a <Base> prop.
      const fm = src.match(/^---\n([\s\S]*?)\n---/);
      const dated = fm ? /^\s*verifiedDate:/m.test(fm[1]) : false;
      out.push({ file: rel, claims: claimsIn(src), dated });
    }
  }

  return out;
}

/**
 * Every text file a reader or a crawler can reach. Wider than the ratchet's
 * scan, which only looks at top-level pages and blog posts: the Make Core
 * price is quoted in components and layouts too, and llms.txt is what a model
 * reads when asked what we charge.
 */
function contentFiles() {
  const roots = [
    ['src', 'pages'],
    ['src', 'content'],
    ['src', 'components'],
    ['src', 'layouts'],
    ['public'],
  ];
  const exts = /\.(astro|md|mdx|ts|js|mjs|json|txt|vtt)$/;
  const skip = /node_modules|\.astro\/|dist\//;
  const found = [];

  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (skip.test(full)) continue;
      if (entry.isDirectory()) walk(full);
      else if (exts.test(entry.name)) found.push(full);
    }
  };

  for (const r of roots) walk(path.join(ROOT, ...r));
  // claims.json states the canonical values; checking it against itself would
  // flag every retired figure it deliberately records.
  return found.filter((f) => f !== CANONICAL);
}

/** Line number of a character offset, for an error a human can act on. */
function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

function checkCanonical() {
  const problems = [];
  const entries = [
    ...Object.entries(canonical.ours).map(([k, v]) => [k, v, 'ours']),
    ...Object.entries(canonical.thirdParty).map(([k, v]) => [k, v, 'thirdParty']),
  ];

  for (const file of contentFiles()) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);

    for (const [id, claim] of entries) {
      // (a) numbers stated in a context that identifies the claim
      for (const pattern of claim.contexts || []) {
        const re = new RegExp(pattern, 'gi');
        for (const m of src.matchAll(re)) {
          const stated = Number(m[1]);
          if (!Number.isFinite(stated) || stated === claim.value) continue;
          // Only flag a value we know to be a stale version of this claim, or
          // one that reads as a straight contradiction. Anything else is
          // probably a sentence the pattern caught by accident.
          const isRetired = (claim.retired || []).includes(stated);
          if (!isRetired) continue;
          problems.push({
            file: rel,
            line: lineOf(src, m.index),
            id,
            found: `$${stated}`,
            expected: `$${claim.value}`,
            why: claim.source
              ? `verified at ${claim.source} on ${claim.verifiedDate}`
              : `ours to set — see ${claim.mirrors}`,
            excerpt: m[0].replace(/\s+/g, ' ').trim().slice(0, 90),
          });
        }
      }

      // (b) phrasings we have retired outright
      for (const f of claim.forbid || []) {
        const re = new RegExp(f.pattern, 'gi');
        for (const m of src.matchAll(re)) {
          problems.push({
            file: rel,
            line: lineOf(src, m.index),
            id,
            found: m[0].replace(/\s+/g, ' ').trim().slice(0, 60),
            expected: String(claim.value),
            why: f.why,
            excerpt: m[0].replace(/\s+/g, ' ').trim().slice(0, 90),
          });
        }
      }
    }
  }

  return problems;
}

/**
 * ---------------------------------------------------------------------------
 * THIRD CHECK — PRESS CREDENTIALS (src/data/claims.json `press`)
 *
 * A press credential is a set of facts about somebody else's publication, and
 * it drifts exactly the way the Make Core price drifted: right on one page, a
 * month out on another. Three things are pinned.
 *
 *  (a) src/data/press.ts must agree with claims.json field for field. press.ts
 *      is what renders; claims.json is the independent copy that catches an
 *      edit to one and not the other.
 *  (b) No page may state a wrong date beside the outlet name.
 *  (c) No page may wrap the mention in Review, Rating, AggregateRating,
 *      endorsement or award markup. A contributed quote is an Article the
 *      person is a subject of. Marking it as a rating of us is
 *      structured-data spam and risks a manual action — see CLAUDE.md.
 *
 * Check (c) is scoped by PROXIMITY, not by file. A page may legitimately carry
 * a Review of somebody else's product — /gorgias-shopify-guide/ rates Gorgias,
 * and that is a real review we wrote. What must never happen is the press
 * mention itself being marked as a rating. Only a rating type within
 * RATING_WINDOW characters of the article URL is close enough to mean "the
 * same node".
 */
function checkPress() {
  const problems = [];
  const press = canonical.press || {};
  const entries = Object.entries(press).filter(([k]) => k !== '_comment');
  if (entries.length === 0) return problems;

  const pressTs = path.join(ROOT, 'src', 'data', 'press.ts');
  const tsSrc = fs.existsSync(pressTs) ? fs.readFileSync(pressTs, 'utf8') : '';

  // Both JSON ("@type": "Review") and the single-quoted TS the schema modules
  // are actually written in ('@type': 'Review').
  const RATING =
    /['"]?@type['"]?\s*:\s*['"](Review|Rating|AggregateRating|EndorsementRating|Award)['"]/g;
  const RATING_WINDOW = 400;

  for (const [id, claim] of entries) {
    // (a) mirror check — every pinned string must appear in press.ts verbatim.
    if (!tsSrc) {
      problems.push({
        file: 'src/data/press.ts', line: 1, id,
        found: 'file missing',
        expected: claim.mirrors || 'src/data/press.ts',
        why: 'claims.json pins a press credential with nothing to mirror it',
        excerpt: claim.url || id,
      });
    } else {
      for (const field of [
        'outlet', 'publication', 'articleAuthor', 'title', 'url',
        'datePublished', 'displayDate', 'attribution',
      ]) {
        const want = claim[field];
        if (!want || tsSrc.includes(want)) continue;
        problems.push({
          file: 'src/data/press.ts', line: 1, id,
          found: `no ${field} matching claims.json`,
          expected: want,
          why: `claims.json press.${id} and ${claim.mirrors} must agree`,
          excerpt: `${field}: ${want}`,
        });
      }
    }

    for (const file of contentFiles()) {
      if (file === pressTs) continue; // press.ts IS the mirror, checked above
      const src = fs.readFileSync(file, 'utf8');
      const rel = path.relative(ROOT, file);

      // (b) a wrong date stated beside the outlet name
      for (const f of claim.forbidNear || []) {
        for (const m of src.matchAll(new RegExp(f.pattern, 'gi'))) {
          problems.push({
            file: rel, line: lineOf(src, m.index), id,
            found: m[0].replace(/\s+/g, ' ').trim().slice(0, 60),
            expected: claim.displayDate || claim.datePublished,
            why: f.why,
            excerpt: m[0].replace(/\s+/g, ' ').trim().slice(0, 90),
          });
        }
      }

      // (c) rating-shaped markup wrapping THIS mention
      if (!claim.url) continue;
      const urlAt = [];
      for (let i = src.indexOf(claim.url); i !== -1; i = src.indexOf(claim.url, i + 1)) {
        urlAt.push(i);
      }
      if (urlAt.length === 0) continue;
      for (const m of src.matchAll(RATING)) {
        if (!urlAt.some((u) => Math.abs(u - m.index) <= RATING_WINDOW)) continue;
        problems.push({
          file: rel, line: lineOf(src, m.index), id,
          found: m[1], expected: 'Article (subjectOf)',
          why: 'a contributed quote is not a review, rating or award — see CLAUDE.md',
          excerpt: m[0],
        });
      }
    }
  }

  return problems;
}

// ───────────────────────────────────────────────────────────────────────────
// AFFILIATE INTEGRITY
// ───────────────────────────────────────────────────────────────────────────

const APPS_JSON = path.join(ROOT, 'src', 'data', 'apps.json');
const REDIRECTS = path.join(ROOT, 'public', '_redirects');
const BLOG_LAYOUT = path.join(ROOT, 'src', 'layouts', 'BlogPost.astro');

/**
 * Comments are not links. Stripping them first is what lets a file document
 * why a cloak was removed — `// Do not reintroduce a /go/gorgias cloak` —
 * without the guard reading that as a live affiliate link.
 */
function stripComments(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

/** Every /go/<slug> cloak referenced in a file, comments excluded. */
function goSlugsIn(source) {
  const slugs = new Set();
  for (const m of stripComments(source).matchAll(/\/go\/([a-z0-9][a-z0-9-]*)/g)) {
    slugs.add(m[1]);
  }
  return slugs;
}

/** Registrable-ish host compare: api.make.com matches make.com. */
function hostMatches(host, domain) {
  return host === domain || host.endsWith('.' + domain);
}

/**
 * FOURTH CHECK — every page with a /go/* link carries <Disclosure />.
 *
 * Markdown posts under src/content/blog are covered by BlogPost.astro, which
 * injects <Disclosure /> whenever the body contains a cloak. That indirection
 * is fine, but it is also a single point of failure for fourteen posts, so
 * the guard verifies the wiring itself rather than trusting it.
 */
function checkDisclosure() {
  const problems = [];
  const HAS_DISCLOSURE = /<Disclosure\s*\/?>/;

  const layoutSrc = fs.existsSync(BLOG_LAYOUT)
    ? fs.readFileSync(BLOG_LAYOUT, 'utf8')
    : '';
  const layoutAutoInjects =
    /hasAffiliateLink\s*=[^\n]*\/go\//.test(layoutSrc) &&
    /hasAffiliateLink\s*&&\s*<Disclosure\s*\/?>/.test(layoutSrc);

  for (const file of contentFiles()) {
    const rel = path.relative(ROOT, file);
    const isPage = rel.startsWith(path.join('src', 'pages')) && rel.endsWith('.astro');
    const isPost =
      rel.startsWith(path.join('src', 'content', 'blog')) && /\.mdx?$/.test(rel);
    if (!isPage && !isPost) continue;

    const src = fs.readFileSync(file, 'utf8');
    const slugs = goSlugsIn(src);
    if (!slugs.size) continue;

    if (isPage) {
      if (!HAS_DISCLOSURE.test(src)) {
        problems.push({
          file: rel,
          slugs: [...slugs],
          why: 'page links /go/* but renders no <Disclosure />',
        });
      }
    } else if (!layoutAutoInjects) {
      problems.push({
        file: rel,
        slugs: [...slugs],
        why: 'BlogPost.astro no longer auto-injects <Disclosure /> for /go/* posts',
      });
    }
  }
  return problems;
}

/**
 * FIFTH CHECK — no cloak resolves to a vendor apps.json says to replace, and
 * every cloak a page uses actually resolves at all.
 */
function checkGoTargets() {
  const problems = [];

  const appsRaw = fs.readFileSync(APPS_JSON, 'utf8');
  const apps = JSON.parse(appsRaw);
  // Any host apps.json cites, not just priceSourceUrl — a vendor named in a
  // brandChange href or a migration step is the same conflict.
  const appDomains = new Map();
  for (const m of appsRaw.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
    const host = m[1].toLowerCase().replace(/^www\./, '');
    if (host.endsWith('stackarchitect.xyz')) continue;
    if (!appDomains.has(host)) appDomains.set(host, host);
  }
  const appNameFor = (host) => {
    const hit = apps.find(
      (a) =>
        typeof a.priceSourceUrl === 'string' &&
        a.priceSourceUrl.toLowerCase().includes(host)
    );
    return hit ? hit.name : null;
  };

  // /go/<slug> → target, from public/_redirects.
  const targets = new Map();
  for (const line of fs.readFileSync(REDIRECTS, 'utf8').split('\n')) {
    const m = line.match(/^\s*\/go\/([a-z0-9][a-z0-9-]*)\/?\s+(\S+)/);
    if (m) targets.set(m[1], m[2]);
  }

  for (const [slug, target] of targets) {
    let host;
    try {
      host = new URL(target).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      problems.push({ slug, target, why: 'target is not a parseable absolute URL' });
      continue;
    }
    for (const domain of appDomains.keys()) {
      if (!hostMatches(host, domain)) continue;
      const name = appNameFor(domain);
      problems.push({
        slug,
        target,
        why:
          `resolves to ${domain}, which src/data/apps.json lists` +
          (name ? ` as ${name} — an app this site tells readers to replace` : ''),
      });
      break;
    }
  }

  // A cloak a page links but _redirects does not declare is a dead link on a
  // revenue path, and it fails silently in production.
  for (const file of contentFiles()) {
    const rel = path.relative(ROOT, file);
    if (rel.startsWith('public')) continue;
    for (const slug of goSlugsIn(fs.readFileSync(file, 'utf8'))) {
      if (targets.has(slug)) continue;
      problems.push({
        slug,
        target: '(none)',
        why: `linked from ${rel} but no /go/${slug} rule exists in public/_redirects`,
      });
    }
  }

  return problems;
}

/**
 * SIXTH CHECK — functions/go/_cloaks.js agrees with public/_redirects.
 *
 * The Function takes precedence over the static rule, and the static rule is
 * the fallback when the Function fails. Two copies of the same destination is
 * the price of that safety net; letting them drift silently is not. A cloak
 * declared in one and not the other, or pointing somewhere different, means
 * the fallback sends readers somewhere the live path does not.
 */
async function checkCloakParity() {
  const problems = [];
  const mod = await import(
    new URL('../functions/go/_cloaks.js', import.meta.url).href
  );
  const cloaks = mod.CLOAKS;

  const declared = new Map();
  for (const line of fs.readFileSync(REDIRECTS, 'utf8').split('\n')) {
    const m = line.match(/^\s*\/go\/([a-z0-9][a-z0-9-]*)\/?\s+(\S+)/);
    if (m) declared.set(m[1], m[2]);
  }

  for (const [slug, target] of declared) {
    if (!cloaks[slug]) {
      problems.push(`/go/${slug} is in public/_redirects but not in functions/go/_cloaks.js`);
    } else if (cloaks[slug].destination !== target) {
      problems.push(
        `/go/${slug} destinations differ:\n` +
          `      _redirects -> ${target}\n` +
          `      _cloaks.js -> ${cloaks[slug].destination}`
      );
    }
  }
  for (const slug of Object.keys(cloaks)) {
    if (!declared.has(slug)) {
      problems.push(
        `/go/${slug} is in functions/go/_cloaks.js but has no public/_redirects rule — ` +
          'the fallback would 404'
      );
    }
    if (!cloaks[slug].subidParam) {
      problems.push(`/go/${slug} has no subidParam in functions/go/_cloaks.js`);
    }
  }
  return problems;
}

const quarantine = fs.existsSync(QUARANTINE)
  ? JSON.parse(fs.readFileSync(QUARANTINE, 'utf8'))
  : { files: {} };

const scanned = scan();
const listMode = process.argv.includes('--list');

const violations = [];
const stale = [];

for (const { file, claims, dated } of scanned) {
  const quarantined = Object.hasOwn(quarantine.files, file);
  if (claims.length > 0 && !dated && !quarantined) {
    violations.push({ file, count: claims.length, sample: [...new Set(claims)].slice(0, 5) });
  }
  if (quarantined && dated) {
    stale.push({ file, why: 'now carries a verifiedDate — remove it from the quarantine' });
  }
  if (quarantined && claims.length === 0) {
    stale.push({ file, why: 'no longer asserts third-party prices — remove it from the quarantine' });
  }
}

const outstanding = scanned.filter(
  (s) => s.claims.length > 0 && !s.dated && Object.hasOwn(quarantine.files, s.file)
);
const verified = scanned.filter((s) => s.claims.length > 0 && s.dated);

if (listMode) {
  console.log('Unverified price claims by file (the worklist):\n');
  for (const s of outstanding.sort((a, b) => b.claims.length - a.claims.length)) {
    console.log(`${String(s.claims.length).padStart(4)}  ${s.file}`);
    console.log(`      ${quarantine.files[s.file]}`);
  }
  console.log(
    `\n${outstanding.length} files quarantined, ${verified.length} verified, ` +
      `${outstanding.reduce((n, s) => n + s.claims.length, 0)} claims outstanding.`
  );
  process.exit(0);
}

let failed = false;

const contradictions = checkCanonical();
if (contradictions.length) {
  failed = true;
  console.error('\n✗ claims-guard: page contradicts a canonical figure in src/data/claims.json\n');
  for (const c of contradictions) {
    console.error(`  ${c.file}:${c.line}`);
    console.error(`    ${c.id}: found ${c.found}, expected ${c.expected} — ${c.why}`);
    console.error(`    …${c.excerpt}…`);
  }
  console.error(
    '\n  Fix the page. If the figure itself has changed, change it in\n' +
      '  src/data/claims.json (and src/data/products.ts for a price we set),\n' +
      '  re-verify any third-party figure against its source, and update the\n' +
      '  verifiedDate to the day you read it.\n'
  );
}

const pressProblems = checkPress();
if (pressProblems.length) {
  failed = true;
  console.error('\n✗ claims-guard: press credential drifted from src/data/claims.json\n');
  for (const c of pressProblems) {
    console.error(`  ${c.file}:${c.line}`);
    console.error(`    ${c.id}: found ${c.found}, expected ${c.expected} — ${c.why}`);
    console.error(`    …${c.excerpt}…`);
  }
  console.error(
    '\n  A press credential is somebody else\'s published fact. Correct the page\n' +
      '  against the article itself, and change src/data/press.ts and the press\n' +
      '  block in src/data/claims.json together — they are checked against each\n' +
      '  other on purpose.\n'
  );
}

const undisclosed = checkDisclosure();
if (undisclosed.length) {
  failed = true;
  console.error('\n✗ claims-guard: affiliate link with no on-page disclosure\n');
  for (const p of undisclosed) {
    console.error(`  ${p.file} — /go/${p.slugs.join(', /go/')}`);
    console.error(`    ${p.why}`);
  }
  console.error(
    '\n  Import src/components/Disclosure.astro and render <Disclosure /> above\n' +
      '  the first affiliate link on the page. For a markdown post the layout\n' +
      '  does it — restore BlogPost.astro\'s hasAffiliateLink injection instead.\n'
  );
}

const cloakDrift = await checkCloakParity();
if (cloakDrift.length) {
  failed = true;
  console.error(
    '\n✗ claims-guard: functions/go/_cloaks.js has drifted from public/_redirects\n'
  );
  for (const p of cloakDrift) console.error(`  ${p}`);
  console.error(
    '\n  Both must declare every cloak with the same destination. _redirects is\n' +
      '  the fallback the Function drops through to on any error, so a difference\n' +
      '  means the safety net points somewhere else.\n'
  );
}

const goConflicts = checkGoTargets();
if (goConflicts.length) {
  failed = true;
  console.error('\n✗ claims-guard: /go/* affiliate cloak does not resolve cleanly\n');
  for (const p of goConflicts) {
    console.error(`  /go/${p.slug} → ${p.target}`);
    console.error(`    ${p.why}`);
  }
  console.error(
    '\n  For an apps.json conflict: we cannot be paid by both sides of a\n' +
      '  comparison. Either drop the cloak and link the vendor directly,\n' +
      '  unsponsored, or remove the app from src/data/apps.json.\n' +
      '  For an undeclared cloak: add both slash variants to public/_redirects\n' +
      '  as 302s, or correct the link.\n'
  );
}

if (violations.length) {
  failed = true;
  console.error('\n✗ claims-guard: page asserts third-party prices with no verifiedDate\n');
  for (const v of violations) {
    console.error(`  ${v.file} — ${v.count} claim(s), e.g. ${v.sample.join(', ')}`);
  }
  console.error(
    '\n  Fix by verifying the figures against the vendor pricing page and passing\n' +
      '  the date you checked as verifiedDate to <Base> (or in blog frontmatter).\n' +
      '  Do not stamp a date you did not check — that is the failure this guard\n' +
      '  exists to prevent.\n'
  );
}

if (stale.length) {
  failed = true;
  console.error('\n✗ claims-guard: stale quarantine entries in docs/claims-unverified.json\n');
  for (const s of stale) console.error(`  ${s.file} — ${s.why}`);
  console.error('');
}

if (failed) process.exit(1);

console.log(
  `✓ claims-guard: ${verified.length} verified, ${outstanding.length} quarantined ` +
    `(${outstanding.reduce((n, s) => n + s.claims.length, 0)} claims outstanding).`
);
