// scripts/lib/indexnow-plan.mjs — which URLs IndexNow may be told about, and
// when. Pure functions, so the rules are tested without touching the network.
//
// WHY IT IS STRICT
// From 22 Apr 2026 this site sent Bing ~55,000 IndexNow URLs for a 62-page
// site (see CLAUDE.md, "IndexNow: deliberately silent"). Bing indexed 33 and
// has crawled nothing since July. The previous scripts/indexnow.mjs defaulted
// to "submit every URL in the sitemap", with no record of what had been sent,
// no cap and no date guard: one careless run away from the same pattern.
//
// Bing matters beyond Bing. ChatGPT search and Copilot ground their answers
// in Bing's index, and on 9 Oct 2026 Ahrefs Brand Radar showed this site with
// zero AI responses on every platform it tracks. Getting Bing to trust the
// site again is the route to being cited by those two assistants.
//
// THE RULES (CLAUDE.md spec, made executable)
// - Only canonical trailing-slash URLs from the built sitemap. Never a
//   redirect source, /go/*, /embed/* or anything not in the sitemap.
// - Only URLs that CHANGED: the live production lastmod differs from the
//   lastmod last sent, recorded in data/indexnow-sent.json (committed).
//   The spec says "differs from the live production sitemap"; compared to
//   the local build, that diff exists only BEFORE a deploy, when the new
//   content is not yet live for Bing to fetch. Comparing live against what
//   was last sent gives the same set, after the deploy, when it is true.
// - Only URLs already deployed: live lastmod must equal the local build's.
// - A hard cap per run.
// - Nothing before the URL freeze lifts.
export const FREEZE_LIFTS = '2026-10-21';
export const DEFAULT_CAP = 60;

export function parseSitemap(xml) {
  const out = new Map();
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) continue;
    out.set(loc.trim(), m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() ?? null);
  }
  return out;
}

export function eligible(url, redirectSources) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (u.hostname !== 'stackarchitect.xyz' || u.protocol !== 'https:') return false;
  const p = u.pathname;
  if (!p.endsWith('/')) return false;
  if (p.startsWith('/go/') || p.startsWith('/embed/') || p.startsWith('/api/')) return false;
  if (redirectSources.has(p) || redirectSources.has(p.replace(/\/$/, ''))) return false;
  return true;
}

// dist, live: Map(url -> lastmod). sent: { [url]: lastmod }.
export function plan({ dist, live, sent, redirectSources, cap = DEFAULT_CAP }) {
  const send = [];
  const skipped = { unchanged: 0, notDeployed: [], notInBuild: [], ineligible: [] };
  for (const [url, liveMod] of live) {
    if (!eligible(url, redirectSources)) { skipped.ineligible.push(url); continue; }
    if (!dist.has(url)) { skipped.notInBuild.push(url); continue; }
    if (dist.get(url) !== liveMod) { skipped.notDeployed.push(url); continue; }
    if (sent[url] && sent[url] === liveMod) { skipped.unchanged++; continue; }
    send.push({ url, lastmod: liveMod });
  }
  const overCap = send.length > cap ? send.splice(cap) : [];
  return { send, overCap, skipped };
}

export function freezeBlocks(now = new Date()) {
  return now.toISOString().slice(0, 10) < FREEZE_LIFTS;
}
