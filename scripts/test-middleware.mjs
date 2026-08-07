// Standalone test of the middleware canonicalisation logic.
// Run: node scripts/test-middleware.mjs
const PRIMARY_HOST = 'stackarchitect.xyz';
const FILE_RE = /\.[a-zA-Z0-9]{2,5}$/;

function resolve(rawUrl) {
  const url = new URL(rawUrl);
  let changed = false;
  if (url.protocol === 'http:') { url.protocol = 'https:'; changed = true; }
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.replace(/^www\./, ''); changed = true;
  }
  if (url.hostname !== PRIMARY_HOST) {
    return changed ? { action: '301', to: url.toString() } : { action: 'next' };
  }
  const p = url.pathname;
  const isApi = p.startsWith('/api/');
  const isGo = p.startsWith('/go/');
  const isFile = FILE_RE.test(p.split('/').pop() || '');
  if (!isApi && !isGo && !isFile && !p.endsWith('/')) { url.pathname = p + '/'; changed = true; }
  return changed ? { action: '301', to: url.toString() } : { action: 'next' };
}

const cases = [
  // [input, expected action, expected destination]
  ['https://www.stackarchitect.xyz/autocrat-quota-fix', '301', 'https://stackarchitect.xyz/autocrat-quota-fix/'],
  ['https://www.stackarchitect.xyz/', '301', 'https://stackarchitect.xyz/'],
  ['http://stackarchitect.xyz/capi-shield/', '301', 'https://stackarchitect.xyz/capi-shield/'],
  ['https://stackarchitect.xyz/capi-shield/', 'next', null],
  ['https://stackarchitect.xyz/capi-shield', '301', 'https://stackarchitect.xyz/capi-shield/'],
  // files must NOT gain a trailing slash
  ['https://stackarchitect.xyz/robots.txt', 'next', null],
  ['https://stackarchitect.xyz/sitemap-index.xml', 'next', null],
  ['https://stackarchitect.xyz/llms.txt', 'next', null],
  ['https://stackarchitect.xyz/5da5f79db68a916df6abb8f7e0fc88b5.txt', 'next', null],
  ['https://stackarchitect.xyz/downloads/ios-attribution-gap-benchmark.json', 'next', null],
  ['https://stackarchitect.xyz/og/og-home.png', 'next', null],
  ['https://www.stackarchitect.xyz/robots.txt', '301', 'https://stackarchitect.xyz/robots.txt'],
  // API routes untouched
  ['https://stackarchitect.xyz/api/gap-stats', 'next', null],
  // query strings preserved
  ['https://www.stackarchitect.xyz/pro?utm_source=x', '301', 'https://stackarchitect.xyz/pro/?utm_source=x'],
  // affiliate cloak (served by _redirects, must reach it with slash form intact)
  ['https://stackarchitect.xyz/go/make', 'next', null],
  ['https://www.stackarchitect.xyz/go/make', '301', 'https://stackarchitect.xyz/go/make'],
];

let pass = 0, fail = 0;
for (const [input, expAction, expTo] of cases) {
  const r = resolve(input);
  const ok = r.action === expAction && (expTo === null || r.to === expTo);
  if (ok) { pass++; console.log(`✓ ${input}\n    → ${r.action}${r.to ? ' ' + r.to : ''}`); }
  else {
    fail++;
    console.log(`✗ ${input}`);
    console.log(`    expected: ${expAction} ${expTo ?? ''}`);
    console.log(`    got:      ${r.action} ${r.to ?? ''}`);
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
