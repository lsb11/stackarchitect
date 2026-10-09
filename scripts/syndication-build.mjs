#!/usr/bin/env node
// scripts/syndication-build.mjs — write the syndicated version of pages to
// syndication/out/, for pasting where no API can (Medium) and for reading
// before anything is pushed.
//
//   npm run build && npm run syndication:build            # every page already syndicated
//   npm run syndication:build -- --all                    # every sitemap page
//   npm run syndication:build -- /capi-shield/            # named pages
//
// Each file is the page's own answer paragraph, its FAQ (held to the visible
// page text by schema-visible-guard), and a link back. Nothing in it is
// written by hand. See scripts/lib/syndication.mjs for why.
import fs from 'node:fs';
import path from 'node:path';
import { loadSiteState, writePack, scanText } from './lib/syndication.mjs';

const state = loadSiteState(process.cwd());
const argv = process.argv.slice(2);
const listed = JSON.parse(fs.readFileSync('syndication/pages.json', 'utf8')).pages;
const pages = argv.includes('--all') ? [...state.live] : (argv.filter((a) => a.startsWith('/')).length ? argv.filter((a) => a.startsWith('/')) : listed);

let bad = 0;
for (const p of pages) {
  if (!state.live.has(p)) { console.log(`✗ ${p} is not a live sitemap page`); bad++; continue; }
  const file = writePack(p, state);
  const issues = scanText(fs.readFileSync(file, 'utf8'), state);
  if (issues.length) { bad++; console.log(`✗ ${p}: ${issues[0].kind} "${issues[0].text}"`); continue; }
  console.log(`✓ ${path.relative(process.cwd(), file)}`);
}
process.exit(bad ? 1 : 0);
