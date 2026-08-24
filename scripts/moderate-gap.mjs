#!/usr/bin/env node
/**
 * moderate-gap.mjs — review and moderate attribution-gap submissions.
 *
 *   node scripts/moderate-gap.mjs list
 *   node scripts/moderate-gap.mjs list pending
 *   node scripts/moderate-gap.mjs approve 12 "Unrounded figures, distinct IP, plausible for a mobile-heavy store"
 *   node scripts/moderate-gap.mjs reject  13 "Placeholder pair"
 *   node scripts/moderate-gap.mjs stats
 *
 * WHY A SCRIPT AND NOT AN ADMIN ENDPOINT
 * An authenticated /api/admin/* route would be a new public surface on a
 * production site, guarding a database whose contents are the entire
 * credibility of a page we want cited. The failure mode of a leaked or weak
 * token is someone writing rows into a published benchmark. A local script
 * running through `wrangler` inherits the Cloudflare account auth that already
 * exists, adds no attack surface, and cannot be reached from the internet.
 *
 * A reason is REQUIRED on approve and reject. The value of this dataset is that
 * every included row can be justified; a moderation decision with no recorded
 * reason is indistinguishable from a guess six months later.
 */

import { execFileSync } from 'node:child_process';

const DB = 'attribution-gap';
const MIN_N = 10; // must match functions/api/gap-stats.js

function sql(query) {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', DB, '--remote', '--json', '--command', query],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
  );
  const parsed = JSON.parse(out);
  return parsed[0]?.results ?? [];
}

const esc = (s) => String(s).replace(/'/g, "''");
const pct = (n) => (n * 100).toFixed(1) + '%';

function list(status) {
  const where = status ? `WHERE status = '${esc(status)}'` : '';
  const rows = sql(
    `SELECT id, created_at, meta_reported, actual_orders, window_days, gap_pct,
            platform_note, status, substr(ip_hash,1,8) AS ip, moderation_note
     FROM submissions ${where} ORDER BY created_at DESC`
  );
  if (!rows.length) return console.log(status ? `No ${status} submissions.` : 'No submissions.');

  for (const r of rows) {
    const flag = r.moderation_note?.startsWith('AUTO-FLAG') ? '  ⚠ AUTO-FLAGGED' : '';
    console.log(
      `\n#${r.id}  ${r.created_at}  [${r.status}]${flag}\n` +
      `   ${r.meta_reported} reported / ${r.actual_orders} actual over ${r.window_days}d  =  ${pct(r.gap_pct)}\n` +
      `   platform: ${r.platform_note ?? '—'}   ip: ${r.ip ?? '—'}` +
      (r.moderation_note ? `\n   note: ${r.moderation_note}` : '')
    );
  }
  console.log(`\n${rows.length} row(s).`);
}

function setStatus(status, id, reason) {
  if (!/^\d+$/.test(id ?? '')) throw new Error('id must be a number');
  if (!reason || reason.trim().length < 10) {
    throw new Error(
      'A reason of at least 10 characters is required.\n' +
      'Every row in a published benchmark has to be defensible — record why.'
    );
  }
  const today = new Date().toISOString().slice(0, 10);
  const note = `${status === 'approved' ? 'Approved' : 'Rejected'} ${today}: ${reason.trim()}`;
  sql(
    `UPDATE submissions
     SET status = '${status}', moderated_at = '${today}', moderation_note = '${esc(note)}'
     WHERE id = ${id}`
  );
  console.log(`#${id} → ${status}`);
  stats();
}

function stats() {
  const counts = sql(`SELECT status, COUNT(*) AS n FROM submissions GROUP BY status`);
  const approved = sql(`SELECT gap_pct FROM submissions WHERE status='approved' ORDER BY gap_pct ASC`);
  const n = approved.length;

  console.log('\n── dataset ──');
  for (const c of counts) console.log(`   ${c.status.padEnd(9)} ${c.n}`);

  if (n === 0) return console.log(`\n   0 of ${MIN_N} approved. Nothing publishable.`);

  const g = approved.map((r) => r.gap_pct);
  const median = n % 2 ? g[(n - 1) / 2] : (g[n / 2 - 1] + g[n / 2]) / 2;
  const mean = g.reduce((a, b) => a + b, 0) / n;

  console.log(`\n   approved ${n} of ${MIN_N} needed to publish`);
  console.log(`   median ${pct(median)}   mean ${pct(mean)}   range ${pct(g[0])}–${pct(g[n - 1])}`);
  if (n < MIN_N) {
    console.log(`   ${MIN_N - n} more required. /api/gap-stats is returning ready:false and publishing nothing.`);
  }
  // At small N a single extreme value dominates the median. Say so rather than
  // letting a two-row dataset read as a finding.
  if (n > 0 && n < 5) {
    console.log(`   ⚠ N=${n} is too small to be stable — one more row can move the median by tens of points.`);
  }
}

const [cmd, arg, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'list') list(arg);
  else if (cmd === 'approve') setStatus('approved', arg, rest.join(' '));
  else if (cmd === 'reject') setStatus('rejected', arg, rest.join(' '));
  else if (cmd === 'stats') stats();
  else {
    console.log('usage: moderate-gap.mjs list [status] | approve <id> "<reason>" | reject <id> "<reason>" | stats');
    process.exit(1);
  }
} catch (err) {
  console.error(`\n${err.message}\n`);
  process.exit(1);
}
