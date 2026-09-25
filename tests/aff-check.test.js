// tests/aff-check.test.js — the offline half of scripts/aff-check.mjs: every
// cloak is monitored, and the verdict logic is right. No network here; the
// live check is `npm run aff:check`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLOAKS } from '../functions/go/_cloaks.js';
import { TRACKING, verdict } from '../scripts/aff-check.mjs';

test('every cloak has a TRACKING entry, and there are none for removed cloaks', () => {
  assert.deepEqual(Object.keys(TRACKING).sort(), Object.keys(CLOAKS).sort());
});

test('a 2xx landing that keeps the credential passes', () => {
  const v = verdict('make', { status: 200, finalUrl: 'https://www.make.com/en/register?pc=techie123' });
  assert.equal(v.state, 'OK');
});

test('a PartnerStack landing passes on the partner key, wherever it lands', () => {
  const finalUrl = 'https://www.gorgias.com/demo?utm_source=affiliates&ps_partner_key=ZDg3ZDUxZTJiYTM5&ps_xid=abc';
  assert.equal(verdict('gorgias', { status: 200, finalUrl }).state, 'OK');
});

test('a 2xx landing that dropped the credential fails', () => {
  const v = verdict('tidio', { status: 200, finalUrl: 'https://www.tidio.com/' });
  assert.equal(v.state, 'FAIL');
  assert.match(v.why, /tracking lost/);
});

test('a 4xx or 5xx fails, a network error fails, a loop fails', () => {
  assert.equal(verdict('beehiiv', { status: 404, finalUrl: 'https://www.beehiiv.com/' }).state, 'FAIL');
  assert.equal(verdict('beehiiv', { status: 502, finalUrl: 'https://www.beehiiv.com/' }).state, 'FAIL');
  assert.equal(verdict('beehiiv', { error: 'network error: ENOTFOUND', finalUrl: 'x' }).state, 'FAIL');
  assert.equal(verdict('beehiiv', { loop: true, finalUrl: 'x' }).state, 'FAIL');
});

test('a bot challenge and a JavaScript hop are unverified, not passed', () => {
  assert.equal(verdict('make', { status: 403, challenge: true, finalUrl: 'x' }).state, 'UNVERIFIED');
  assert.equal(verdict('workspace', { status: 200, finalUrl: 'https://referworkspace.app.goo.gl/sy2C' }).state, 'UNVERIFIED');
  // A dead JS-hop link is still a fail.
  assert.equal(verdict('workspace', { status: 404, finalUrl: 'x' }).state, 'FAIL');
});
