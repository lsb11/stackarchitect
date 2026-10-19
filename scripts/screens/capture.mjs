// Captures each free tool in use, on its own default example inputs, from a
// local build (npm run build, then serve dist/ on :4400), and records every
// line of text each image shows in scripts/og/og-images.json, so the image
// checks read them like any other card. Re-run after changing a tool.
//   node scripts/screens/capture.mjs [--base http://localhost:4400]
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const base = (process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:4400').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

export const SHOTS = [
  { file: 'capi-validator-example', route: '/meta-capi-payload-validator/', steps: ['#cv-example', '#cv-check'], el: '.cv-output', pad: 28 },
  { file: 'attribution-gap-example', route: '/shopify-vs-meta-attribution-gap-calculator/', steps: ['.calc-btn'], el: '.calc-card', until: '#ag-result' },
  { file: 'make-vs-zapier-example', route: '/make-vs-zapier-cost-calculator/', steps: ['.calc-btn'], el: '.calc-card', until: '#mz-result' },
  { file: 'emq-checker-example', route: '/meta-emq-score-estimator/', steps: ['.calc-btn'], el: '.calc-card', until: '#emq-result' },
  { file: 'app-stack-auditor-example', route: '/shopify-app-stack-kill-or-keep-auditor/', steps: ['.calc-btn'], el: '.calc-card', until: '#app-result' },
  { file: 'stocky-risk-example', route: '/stocky-migration-risk-scorer/', steps: ['.calc-btn'], el: '.calc-card', until: '#sr-result' },
  { file: 'app-cost-example', route: '/shopify-app-cost-calculator/', steps: [], el: '#sa-calculator .calc-card' },
];

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
await page.addInitScript(() => { try { localStorage.setItem('sa_consent', 'denied'); } catch {} });
const manifestPath = 'scripts/og/og-images.json';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
for (const s of SHOTS) {
  await page.goto(base + s.route);
  for (const sel of s.steps) { await page.click(sel); await page.waitForTimeout(400); }
  const el = page.locator(s.el).first();
  await el.scrollIntoViewIfNeeded();
  const png = `/tmp/${s.file}.png`;
  let text;
  if (s.until) {
    // Crop from the top of the tool to the bottom of its result, leaving out
    // anything the card holds below (the benchmark form, for one).
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(150);
    const box = await el.boundingBox();
    const end = await page.locator(s.until).boundingBox();
    const pad = 24;
    await page.screenshot({ path: png, fullPage: true, clip: { x: box.x, y: box.y, width: box.width, height: end.y + end.height + pad - box.y } });
    text = await page.evaluate(([a, b]) => {
      const card = document.querySelector(a), stop = document.querySelector(b);
      const out = [];
      const walk = (n) => { for (const c of n.children) { if (c === stop) { out.push(c.innerText); return true; } if (c.contains(stop)) { if (walk(c)) return true; } else out.push(c.innerText); } return false; };
      walk(card);
      return out.join('\n');
    }, [s.el, s.until]);
    text = text.split('\n').map((l) => l.trim()).filter(Boolean);
  } else if (s.pad) {
    // An element with no padding of its own gets a margin of the page around it.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(150);
    const box = await el.boundingBox();
    await page.screenshot({ path: png, fullPage: true, clip: { x: box.x - s.pad, y: box.y - 4, width: box.width + 2 * s.pad, height: box.height + 4 + s.pad } });
    text = (await el.innerText()).split('\n').map((l) => l.trim()).filter(Boolean);
  } else {
    await el.screenshot({ path: png });
    text = (await el.innerText()).split('\n').map((l) => l.trim()).filter(Boolean);
  }
  const out = `public/screens/${s.file}.webp`;
  execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('${png}'); im.thumbnail((1600,4000)); im.save('${out}','WEBP',quality=84,method=6)`]);
  const prev = manifest.images[out];
  manifest.images[out] = {
    transcribed: today,
    usedBy: prev?.usedBy ?? [],
    text,
    note: `screenshot of ${s.route} on its default example inputs; written by scripts/screens/capture.mjs, re-run it rather than editing`,
  };
  console.log(out, text.length, 'lines');
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
await browser.close();
