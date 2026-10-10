#!/usr/bin/env node
// scripts/cf-audit.mjs — read-only check of everything outside this repo that
// decides whether search engines and AI crawlers can reach the site.
//
//   node scripts/cf-audit.mjs                 # part 1 only: probe as each crawler
//   CF_API_TOKEN=… node scripts/cf-audit.mjs  # parts 1 and 2: plus Cloudflare settings
//
// Token: Cloudflare dashboard → My Profile → API Tokens → Create Token →
// template "Read all resources" → limit Zone Resources to stackarchitect.xyz.
// Read-only: this script never changes a setting. Do not commit the token.
//
// WHY (10 Oct 2026)
// Google and Bing each show one indexed page and Ahrefs Brand Radar shows no
// AI citations. Every check inside the repo is clean, and several settings
// that can block crawlers live only in the Cloudflare dashboard: "Block AI
// bots", Bot Fight Mode, managed robots.txt, WAF custom rules, Cache Rules,
// Redirect Rules. CLAUDE.md already records two of them causing harm
// unseen (a zone trailing-slash rule; Crawler Hints sending ~55,000 IndexNow
// URLs). This reads them all at once.
const SITE = 'https://stackarchitect.xyz';
const ZONE = 'stackarchitect.xyz';
const problems = [];
const flag = (level, msg) => { problems.push([level, msg]); };

// ── Part 1: fetch as each crawler ─────────────────────────────────────────
// A request from this machine carries the crawler's User-Agent but not its IP,
// so a block of *spoofed* Googlebot/Bingbot is expected and harmless (Cloudflare
// verifies those by IP). A block of GPTBot, ClaudeBot or PerplexityBot here is
// what "Block AI bots" does by User-Agent, and real ones get the same.
const UAS = {
  browser: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Bingbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36',
  GPTBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
  'OAI-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  PerplexityBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
};
console.log('\n1. Fetching pages as each crawler (from this computer)\n');
for (const path of ['/', '/capi-shield/', '/robots.txt']) {
  for (const [name, ua] of Object.entries(UAS)) {
    let line;
    try {
      const r = await fetch(SITE + path, { headers: { 'user-agent': ua }, redirect: 'manual' });
      const body = await r.text();
      const challenged = r.headers.get('cf-mitigated') || /Just a moment|Attention Required|cf-chl|challenge-platform\/h\//i.test(body) && r.status !== 200;
      const robots = r.headers.get('x-robots-tag');
      line = `${String(r.status).padEnd(4)}${challenged ? ' CHALLENGED/BLOCKED' : ''}${robots ? ` x-robots-tag: ${robots}` : ''}`;
      if (r.status !== 200 && !['Googlebot', 'Bingbot'].includes(name)) flag('CRITICAL', `${path} answers ${r.status} to ${name}${challenged ? ' (Cloudflare challenge/block)' : ''}`);
      if (robots && /noindex/i.test(robots)) flag('CRITICAL', `${path} sends X-Robots-Tag: ${robots} to ${name}`);
    } catch (e) { line = `ERROR ${e.message}`; }
    console.log(`  ${path.padEnd(15)} ${name.padEnd(14)} ${line}`);
  }
}
const robotsTxt = await fetch(`${SITE}/robots.txt`).then((r) => r.text()).catch(() => '');
if (/Content-Signal|BEGIN Cloudflare Managed/i.test(robotsTxt)) flag('WARN', 'robots.txt carries Cloudflare-managed content (Content-Signal / managed block): check it does not disallow AI crawlers');
if (/User-agent:\s*(GPTBot|ClaudeBot|PerplexityBot|OAI-SearchBot)[\s\S]{0,200}?Disallow:\s*\/\s*$/im.test(robotsTxt)) flag('CRITICAL', 'robots.txt disallows an AI crawler from the whole site');

// ── Part 2: Cloudflare settings ───────────────────────────────────────────
const token = process.env.CF_API_TOKEN;
if (!token) {
  console.log('\n2. Cloudflare settings: skipped (set CF_API_TOKEN to read them; see the top of this file)');
} else {
  const api = async (p) => {
    const r = await fetch(`https://api.cloudflare.com/client/v4${p}`, { headers: { authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    if (!j.success) return { error: (j.errors || []).map((e) => e.message).join('; ') || `HTTP ${r.status}` };
    return j.result;
  };
  console.log('\n2. Cloudflare settings (read-only)\n');
  const zones = await api(`/zones?name=${ZONE}`);
  const zone = Array.isArray(zones) ? zones[0] : null;
  if (!zone) { console.log(`  ✗ cannot read the zone: ${zones?.error ?? 'not found'}`); }
  else {
    const z = `/zones/${zone.id}`;
    console.log(`  plan: ${zone.plan?.name}   status: ${zone.status}`);

    const bm = await api(`${z}/bot_management`);
    console.log('\n  Bots:', JSON.stringify(bm));
    if (bm && !bm.error) {
      if (bm.ai_bots_protection === 'block') flag('CRITICAL', '"Block AI bots" is ON: GPTBot, ClaudeBot, PerplexityBot etc. are refused at the edge, so no AI assistant can read or cite the site. Security → Bots → turn off "Block AI bots".');
      if (bm.fight_mode) flag('HIGH', 'Bot Fight Mode is ON: it challenges automated clients that are not on Cloudflare\'s verified list, including some AI and SEO crawlers, and it cannot be bypassed with rules on the Free plan. Security → Bots → turn it off for a content site.');
      if (bm.is_robots_txt_managed) flag('WARN', 'Managed robots.txt is ON: Cloudflare prepends its own rules to robots.txt. Check what it adds.');
      if (bm.crawler_protection && bm.crawler_protection !== 'disabled') flag('WARN', `Crawler protection is "${bm.crawler_protection}".`);
      if (bm.enable_js) flag('INFO', 'JavaScript detections are ON: Cloudflare injects a script into every page (the per-request bytes edge:check saw). Harmless to crawlers.');
    }

    const settings = await api(`${z}/settings`);
    if (Array.isArray(settings)) {
      const s = Object.fromEntries(settings.map((x) => [x.id, x.value]));
      const show = ['security_level', 'browser_check', 'challenge_ttl', 'always_use_https', 'ssl', 'min_tls_version', 'email_obfuscation', 'rocket_loader', 'early_hints', 'development_mode', 'cache_level', 'browser_cache_ttl'];
      console.log('\n  Settings:'); for (const k of show) if (k in s) console.log(`    ${k.padEnd(20)} ${JSON.stringify(s[k])}`);
      if (['high', 'under_attack'].includes(s.security_level)) flag('HIGH', `Security level is "${s.security_level}": crawlers get challenged. Set it to "medium" or lower.`);
      if (s.rocket_loader === 'on') flag('WARN', 'Rocket Loader is ON: it rewrites script loading and can break the inline consent/GA4 script and the calculators.');
      if (s.development_mode === 'on') flag('INFO', 'Development mode is ON (caching bypassed).');
    }

    const hints = await api(`${z}/flags/products/cache/changes`);
    if (hints?.crawlhints_enabled) flag('HIGH', 'Crawler Hints is ON again: it sends IndexNow pings on every cache change (CLAUDE.md: ~55,000 URLs). Caching → Configuration → turn off.');

    for (const phase of ['http_request_firewall_custom', 'http_ratelimit', 'http_request_dynamic_redirect', 'http_request_cache_settings', 'http_request_transform', 'http_response_headers_transform', 'http_request_late_transform']) {
      const rs = await api(`${z}/rulesets/phases/${phase}/entrypoint`);
      const rules = rs?.rules ?? [];
      if (!rules.length) continue;
      console.log(`\n  ${phase}:`);
      for (const r of rules) {
        console.log(`    [${r.enabled === false ? 'off' : 'on '}] ${r.action.padEnd(16)} ${r.description || ''}\n          ${r.expression}`);
        if (r.enabled !== false && ['block', 'challenge', 'managed_challenge', 'js_challenge'].includes(r.action) && !/cf\.client\.bot|verified_bot/.test(r.expression)) {
          flag('HIGH', `WAF rule "${r.description || r.expression}" ${r.action}s without exempting verified bots (add "and not cf.client.bot").`);
        }
        if (r.enabled !== false && phase === 'http_request_cache_settings' && /"cache":\s*true|eligible/i.test(JSON.stringify(r.action_parameters || {}))) {
          flag('WARN', `Cache Rule "${r.description}" makes requests cache-eligible: HTML could be served stale after a deploy.`);
        }
      }
    }
    const pr = await api(`${z}/pagerules`);
    if (Array.isArray(pr) && pr.length) { console.log('\n  Page Rules:'); for (const r of pr) console.log(`    ${r.status} ${JSON.stringify(r.targets?.[0]?.constraint?.value)} → ${JSON.stringify(r.actions)}`); }
  }
}

console.log('\n3. Findings\n');
if (!problems.length) console.log('  Nothing found that stops a crawler.');
for (const [level, msg] of problems.sort((a, b) => ['CRITICAL', 'HIGH', 'WARN', 'INFO'].indexOf(a[0]) - ['CRITICAL', 'HIGH', 'WARN', 'INFO'].indexOf(b[0]))) console.log(`  ${level.padEnd(8)} ${msg}`);
console.log('');
process.exit(problems.some(([l]) => l === 'CRITICAL') ? 1 : 0);
