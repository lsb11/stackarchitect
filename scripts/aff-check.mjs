#!/usr/bin/env node
/**
 * aff-check.mjs — is every /go/* cloak still earning?
 *
 * For each cloak in functions/go/_cloaks.js it requests the destination,
 * follows redirects by hand (so every hop is visible), and checks two things
 * on the page it lands on:
 *   1. the final status is 2xx;
 *   2. the referral credential survived the chain. Each partner carries it
 *      differently, so TRACKING below names what must be in the final URL.
 *
 * Three outcomes per cloak:
 *   OK          2xx, and the credential is in the final URL.
 *   FAIL        4xx/5xx, a redirect loop, a network error, or a 2xx page that
 *               has lost the credential. Exit code 1.
 *   UNVERIFIED  the partner blocks scripted requests (a Cloudflare bot
 *               challenge), or finishes the redirect in JavaScript. A script
 *               cannot see the landing page, so the result is neither a pass
 *               nor a fail. Printed with the reason; `--strict` makes it fail.
 *
 * Why UNVERIFIED exists rather than FAIL: on 25 Sep 2026 make.com answered
 * every scripted request with a 403 challenge (cf-mitigated: challenge) while
 * a real browser reached the sign-up page with pc=techie123 intact, and
 * referworkspace.app.goo.gl returns a 200 page that forwards in JavaScript to
 * workspace.google.com/landing/partners/referral/…&utm_content=NSRLIO3. A
 * monitor that always fails on those two teaches you to ignore it. Check them
 * by hand in a browser when the script reports them.
 *
 * Deliberately NOT in `npm run build`: it depends on third-party sites being
 * up, and a partner outage must not block a deploy.
 *
 *   npm run aff:check             # exit 1 on any FAIL
 *   npm run aff:check -- --strict # exit 1 on FAIL or UNVERIFIED
 */
import { pathToFileURL } from 'node:url';
import { CLOAKS } from '../functions/go/_cloaks.js';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

// PartnerStack (GetResponse, Tidio, Gorgias) rewrites the link into the
// vendor's own URL and carries our partner key as ps_partner_key.
const PARTNERSTACK = { param: 'ps_partner_key', value: 'ZDg3ZDUxZTJiYTM5' };

/**
 * slug -> what must be in the final URL's query string. Every cloak needs an
 * entry; tests/aff-check.test.js fails when one is missing, so a new cloak
 * cannot ship unmonitored. `jsHop` marks a link that finishes in JavaScript.
 */
export const TRACKING = {
  beehiiv:         { param: 'via', value: 'gym-extras' },
  getresponse:     PARTNERSTACK,
  gorgias:         PARTNERSTACK,
  make:            { param: 'pc', value: 'techie123' },
  systeme:         { param: 'sa', value: 'sa02742252683e3d56c853555171a010913de57be6' },
  tidio:           PARTNERSTACK,
  'tidio-ai':      PARTNERSTACK,
  'tidio-pricing': PARTNERSTACK,
  workspace:       { jsHop: 'lands on workspace.google.com/landing/partners/referral with utm_content=NSRLIO3' },
};

/** Pure verdict from what the fetch saw; exported for the tests. */
export function verdict(slug, { status, finalUrl, challenge, error, loop }) {
  const want = TRACKING[slug];
  if (!want) return { state: 'FAIL', why: 'no TRACKING entry in scripts/aff-check.mjs' };
  if (error) return { state: 'FAIL', why: error };
  if (loop) return { state: 'FAIL', why: 'more than 10 redirects' };
  if (challenge) return { state: 'UNVERIFIED', why: `HTTP ${status} bot challenge; open it in a browser` };
  if (status < 200 || status > 299) return { state: 'FAIL', why: `HTTP ${status}` };
  if (want.jsHop) return { state: 'UNVERIFIED', why: `HTTP ${status}, forwards in JavaScript; by hand it ${want.jsHop}` };
  const got = new URL(finalUrl).searchParams.get(want.param);
  if (got !== want.value) return { state: 'FAIL', why: `tracking lost: ${want.param}=${want.value} not in final URL` };
  return { state: 'OK', why: `HTTP ${status}, ${want.param} kept` };
}

async function follow(start) {
  let url = start;
  for (let hop = 0; hop <= 10; hop++) {
    let res;
    try {
      res = await fetch(url, {
        redirect: 'manual',
        headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'en-GB,en;q=0.9' },
        signal: AbortSignal.timeout(20000),
      });
    } catch (e) {
      return { error: `network error: ${e.cause?.code || e.message}`, finalUrl: url };
    }
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      url = new URL(loc, url).toString();
      continue;
    }
    return {
      status: res.status,
      finalUrl: url,
      challenge: res.headers.get('cf-mitigated') === 'challenge',
    };
  }
  return { loop: true, finalUrl: url };
}

async function main() {
  const strict = process.argv.includes('--strict');
  const rows = [];
  for (const [slug, cloak] of Object.entries(CLOAKS)) {
    const seen = await follow(cloak.destination);
    rows.push({ slug, ...verdict(slug, seen), finalUrl: seen.finalUrl });
  }
  const w = Math.max(...rows.map((r) => r.slug.length));
  for (const r of rows) {
    console.log(`${r.state.padEnd(10)} /go/${r.slug.padEnd(w)}  ${r.why}\n${' '.repeat(16 + w)}${r.finalUrl}`);
  }
  const bad = rows.filter((r) => r.state === 'FAIL' || (strict && r.state === 'UNVERIFIED'));
  const unverified = rows.filter((r) => r.state === 'UNVERIFIED').length;
  console.log(`\naff:check: ${rows.length} cloaks, ${rows.length - bad.length - (strict ? 0 : unverified)} OK, ${unverified} unverified, ${rows.filter((r) => r.state === 'FAIL').length} failed`);
  process.exit(bad.length ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
