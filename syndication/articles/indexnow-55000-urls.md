---
title: "My 62-page site sent Bing 55,000 URLs. I found out four months later."
published: true
canonical_url: https://stackarchitect.xyz/blog/indexnow-55000-urls-62-page-site/
cover_image: https://stackarchitect.xyz/og/og-indexnow-55000-cover.png
tags: webdev, seo, cloudflare, astro
description: "An Astro IndexNow integration and Cloudflare Crawler Hints sent Bing 55,000 URLs for a 62-page site. How it happened, four things that misled me about indexing, and the checks to run first."
---

**Two submitters I had forgotten about sent Bing about 55,000 IndexNow URLs for a 62-page site between April and September 2026: an Astro integration that re-sent every page on every build, because its change cache lived in a gitignored file, and Cloudflare Crawler Hints, which pings IndexNow whenever a deploy changes the HTML.**

I run [Stack Architect](https://stackarchitect.xyz/), a static Astro site on Cloudflare Pages with free Shopify automation guides. It has 38 pages in its sitemap today and had 62 at the time. Google has indexed one of them, the homepage. For months I treated that as a mystery to solve with one more technical fix.

This is what I found instead, in the order I found it. Three were real problems, two of them running for months. Four were tools and dashboards telling me something that wasn't true. All of it is dated, and most of it you can check on your own site in under ten minutes.

## The number

On 18 September 2026 I exported the IndexNow report from Bing Webmaster Tools. It showed about **55,000 URLs submitted since 22 April**, for a site with 62 pages in its sitemap.

The busiest days were 23 July (4,886 URLs), 22 July (2,508) and 21 July (2,392). Even on quiet days, 20 to 77 URLs were still going out. Over the same period Bing indexed **33** URLs, every one of them before 24 July, and then crawled nothing new for eight weeks.

I hadn't written anything that sent 55,000 URLs. Two things I'd switched on and forgotten had.

## Culprit 1: an IndexNow integration that couldn't remember anything

On 28 April I added an Astro IndexNow integration. It's the kind of package you install in a minute: on every build it collects the pages in `dist/` and tells IndexNow about them, so Bing hears about new content straight away.

It also promised to send only pages that had changed. It did that by hashing each page and comparing the hashes with a cache file it kept in the project root. That file was in my `.gitignore`, which is exactly where a generated cache belongs.

Cloudflare Pages builds every deploy from a fresh clone of the repo. A fresh clone never has the cache file, so on every build the integration found an empty cache, decided every page was new, and submitted all of them.

Three things made it worse:

1. **It ran on preview builds too.** Every branch push built a preview, and every preview submitted the production URLs.
2. **I had an AI coding agent opening branches.** Roughly 50 of the 355 successful builds between 28 April and 6 August were previews of the agent's branches.
3. **It submitted everything in `dist/`.** That included noindex pages and pages that later became redirects.

At 80 to 190 URLs a build, that adds up to the total. The worst days line up with the days I pushed most.

I removed the integration on 6 August. The submissions didn't stop.

**The general lesson:** any "only send what changed" logic that keeps its state on the build machine doesn't work on ephemeral CI. It fails without an error, because from the tool's point of view everything really is new every time.

## Culprit 2: a Cloudflare setting that turned itself back on

After 6 August the only live submitter was **Cloudflare Crawler Hints**, a zone setting that lives in the dashboard, not the repo. It had been switched on at 10:44 UTC on 21 April. Bing's export starts the next day.

[Crawler Hints](https://developers.cloudflare.com/cache/advanced-configuration/crawler-hints/) notifies IndexNow when Cloudflare sees content change. That's sensible for a site whose pages change when their content changes. On a static site that redeploys several times a day, every deploy changes the HTML, so it fired constantly. That was the 20 to 77 a day.

I turned it off on 18 September.

On 19 October I opened Bing's IndexNow page again and found Cloudflare submitting `/_astro/*.woff` font files and `/diagrams/*.svg` images about every 15 minutes. Crawler Hints was on again. Nothing in git had changed. I turned it off a second time and reloaded to confirm it stayed off.

**The general lesson:** dashboard settings are configuration you can't diff, review or roll back. If one matters, write down where it is and check it on a schedule. "I turned that off" is a statement about the past.

## Culprit 3: a redirect rule nobody could see

While checking the zone I found a Cloudflare **Redirect Rule** called "enforce trailing slash". It ran before my own middleware and did the same job, which would have been harmless except for two side effects:

- It added a 301 in front of every affiliate redirect, so each one took two hops instead of one.
- It could match my API routes. A 301 on a `POST` makes most clients retry as a `GET` with no body, and a trailing-slash redirect of exactly that kind is how a form on the site had earlier lost every submission without an error.

None of this was in the repo, so no code review could have caught it. The rule is now switched off, and the setup notes in the repo record that it exists.

## Four things that told me something false

Fixing real problems is the easy part. Most of my wasted time went on things that looked like evidence.

### 1. An AI fetcher's cache

On 9 October a summarising fetch tool showed a page with content I had replaced hours earlier, while the same URL with a throwaway query string showed the new version. I concluded Cloudflare was serving stale HTML to crawlers. I blamed a one-year `Cloudflare-CDN-Cache-Control` header, removed it, and told myself to purge the cache and resubmit.

Then I ran my own check, which fetches each page and reads the response headers. Every HTML response said `cf-cache-status: DYNAMIC`. Cloudflare wasn't caching any of them, because a Pages Function runs on every request. The stale copy was in the fetch tool's own cache.

### 2. A fetcher that invented a status code

In August a fetch tool reported that two subdomain redirects were 302s, which would have been worth fixing. They were 301s. The tool had followed the chain, reported the second hop's destination, and made up a status for the first. One command settles it:

```bash
curl -sI https://audit.stackarchitect.xyz/ | head -3
```

`curl -sI` shows you the first response exactly as the server sent it. Anything that summarises is a different thing, however confident it sounds.

### 3. My own crawler counts

I log page requests per day with the claimed client in a small database table, without cookies, IP addresses or user agents stored. It showed 302 of 518 "Googlebot" requests ending in 404, which looked like Google hitting broken links.

Most of them were vulnerability scanners using a Googlebot User-Agent to probe paths like `/.env` and `/.ssh/id_rsa`. Cloudflare's security events showed every blocked "Googlebot" coming from Google Cloud addresses (35.242.x, 35.246.x), which anyone can rent. The one real Googlebot request that week came from 66.249.x, Google's own network (AS15169).

A User-Agent is a claim. Google's own guidance on [verifying Googlebot](https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot) is to check the IP, by reverse and forward DNS lookup or against its published ranges. For how often Google really crawls you, Search Console's Crawl stats report is the source: this site had 1,380 requests in 90 days, 86% answered 200, average response 111 ms. Healthy.

### 4. My own notes

In August my notes said "Bing indexes the site normally", and I had built a theory on it: Bing was fine, so the problem must be specific to Google. Bing's own export said 5 clicks and 129 impressions in 180 days, with 53 consecutive days of zero impressions at the end. The theory had nothing under it.

Writing a conclusion down makes it feel like a fact. Re-read your notes against the source data before you build on them.

## What the evidence actually says

After all of that, here is where it stands, read directly from both webmaster tools.

Search Console's URL Inspection for a typical page says **Crawled - currently not indexed**: fetched successfully as Googlebot smartphone, crawling and indexing allowed, my canonical accepted, no different canonical chosen by Google. Every page I've tested answers 200 to a browser, Googlebot, Bingbot and the main AI crawlers. Bing's live URL test says the page can be indexed, with no SEO issues.

So Google can fetch every page and is choosing not to index them. That isn't a fault I can fix with a header. It's a judgement about the site: a young domain with few links, whose old URLs returned 404s for three months after a move in April, until I added redirects in July.

Knowing that changed what I work on. I set fifteen general guides that mostly restated vendor documentation to noindex, so Google judges the site on its original work. I add first-hand material, such as screenshots from my own accounts, instead of more words. One guide has gone back into the sitemap on that basis. Whether that works is a question of weeks, and I'll report back either way.

## The IndexNow rules I use now

I still use IndexNow, deliberately and by hand. The script that sends it follows five rules, and they apply to any site:

1. **Only canonical URLs from the live sitemap.** Never redirect sources, noindex pages or anything you wouldn't want indexed.
2. **Only URLs whose `lastmod` changed since the last send.** Don't hash the HTML; a build changes it every time.
3. **Keep the record of what was sent in the repo**, not on the build machine, and commit it after every run.
4. **Cap each run.** Mine stops at 60.
5. **Dry run by default.** Sending takes a flag, and it only happens after a production deploy, never from a build.

Here is the core of it, small enough to adapt:

```js
// Send IndexNow only for sitemap URLs whose lastmod changed since the last run.
import { readFileSync, writeFileSync } from 'node:fs';

const SITE = 'https://example.com';
const KEY = process.env.INDEXNOW_KEY;          // key file served at /<KEY>.txt
const LOG = 'data/indexnow-sent.json';          // committed to the repo
const CAP = 60;
const submit = process.argv.includes('--submit');

const xml = await (await fetch(`${SITE}/sitemap-0.xml`)).text();
const live = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, u]) => ({
  url: u.match(/<loc>([^<]+)/)[1].trim(),
  lastmod: u.match(/<lastmod>([^<]+)/)?.[1].trim() ?? null,
}));

const sent = JSON.parse(readFileSync(LOG, 'utf8'));
const changed = live.filter(({ url, lastmod }) => sent[url] !== lastmod).slice(0, CAP);
console.log(`${changed.length} changed of ${live.length}`);

if (submit && changed.length) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE).host,
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList: changed.map((c) => c.url),
    }),
  });
  if (!res.ok) throw new Error(`IndexNow answered ${res.status}`);
  for (const { url, lastmod } of changed) sent[url] = lastmod;
  writeFileSync(LOG, JSON.stringify(sent, null, 2) + '\n');
}
```

The request format is the one in the [IndexNow documentation](https://www.indexnow.org/documentation). The important part is the last two lines: the record of what was sent is written to a file you commit, so the next run, on any machine, knows what it already did.

## Check these before you blame Google

If your pages aren't being indexed, these take minutes and catch everything above:

1. **Bing Webmaster Tools, IndexNow page.** How many URLs a day, and from which source. If you didn't expect a source, find it.
2. **Your CDN's dashboard settings.** In Cloudflare, Crawler Hints (Caching, Configuration) and every Redirect, Transform and Cache rule. Anything there is configuration your repo doesn't show.
3. **Any build step that calls an outside service.** Does it run on preview builds? Does its "changed" check keep state on the build machine?
4. **`curl -sI` on the URL**, not a summarising tool, for the status code and headers of the first response.
5. **`cf-cache-status` or your CDN's equivalent** before you believe anything about stale caches.
6. **The IP address behind any "Googlebot" in your logs**, and Search Console's Crawl stats for the real numbers.
7. **URL Inspection in Search Console.** If it says the page was fetched, crawling and indexing are allowed and your canonical was accepted, stop looking for a technical fault. What's left is whether Google thinks the page is worth indexing.

The last one is the one I wish I'd accepted sooner.

---

If you've found a dashboard setting that switched itself back on, or a build step quietly calling an outside service on every preview, I'd like to hear about it in the comments. I'll post an update on whether the indexing changes above work.

*Originally published at [stackarchitect.xyz](https://stackarchitect.xyz/blog/indexnow-55000-urls-62-page-site/) by Luke Sandelands.*
