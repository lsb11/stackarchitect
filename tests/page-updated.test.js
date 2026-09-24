// tests/page-updated.test.js — every sitemap page has a recorded "Updated" date,
// and none claims to be newer than the last change to its source file.
// Lives in `npm test`, not the build: it needs git history (see page-updated.mjs).
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

test('page-updated.json covers the sitemap and never post-dates a source file', { skip: !existsSync('dist/sitemap-0.xml') && 'run `npm run build` first' }, () => {
  execFileSync(process.execPath, ['scripts/page-updated.mjs', '--check'], { stdio: 'pipe' });
});
