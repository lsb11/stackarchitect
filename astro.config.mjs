import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import indexnow from 'astro-indexnow';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';

// ──────────────────────────────────────────────────────────────────
// LASTMOD CACHE — built once at config load, used by sitemap.serialize
// ──────────────────────────────────────────────────────────────────
// Map of canonical URL (with trailing slash) -> ISO date string
const lastmodCache = new Map();
const BUILD_TIME = new Date();

// Returns ISO string or null
function gitLastModified(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    const out = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

// Walk a directory recursively, returning absolute file paths
function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// Build cache for blog posts from src/content/blog/*.{md,mdx}
function indexBlogPosts() {
  const dir = 'src/content/blog';
  if (!existsSync(dir)) return;
  const files = walk(dir).filter((f) => /\.(md|mdx)$/i.test(f));
  for (const file of files) {
    try {
      const slug = relative(dir, file).replace(/\.(md|mdx)$/i, '');
      const url = `https://stackarchitect.xyz/blog/${slug}/`;
      const raw = readFileSync(file, 'utf8');
      const { data } = matter(raw);

      // Prefer updatedDate, then publishDate, then git, then build time
      let iso = null;
      if (data?.updatedDate) iso = new Date(data.updatedDate).toISOString();
      else if (data?.publishDate) iso = new Date(data.publishDate).toISOString();

      if (!iso) iso = gitLastModified(file);
      if (!iso) iso = BUILD_TIME.toISOString();

      lastmodCache.set(url, iso);
    } catch {
      // skip malformed file silently — falls back to build time at lookup
    }
  }
}

// Build cache for static pages from src/pages/**/*.astro (and .md/.mdx)
function indexStaticPages() {
  const dir = 'src/pages';
  if (!existsSync(dir)) return;
  const files = walk(dir).filter((f) => /\.(astro|md|mdx)$/i.test(f));
  for (const file of files) {
    try {
      const rel = relative(dir, file);
      // Skip dynamic routes ([slug].astro etc.) — they're covered above or generate
      // their own URLs we can't predict statically here
      if (/\[.*\]/.test(rel)) continue;

      // Derive URL path
      let pathPart = rel.replace(/\.(astro|md|mdx)$/i, '');
      if (pathPart === 'index') pathPart = '';
      else if (pathPart.endsWith('/index')) pathPart = pathPart.slice(0, -'/index'.length);

      const url = pathPart === ''
        ? 'https://stackarchitect.xyz/'
        : `https://stackarchitect.xyz/${pathPart}/`;

      const iso = gitLastModified(file) || BUILD_TIME.toISOString();
      lastmodCache.set(url, iso);
    } catch {
      // skip
    }
  }
}

// Build the cache once
indexBlogPosts();
indexStaticPages();

// ──────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────
export default defineConfig({
  site: 'https://stackarchitect.xyz',
  output: 'static',
  trailingSlash: 'always',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
    formats: ['avif', 'webp'],
    quality: 80,
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: true,
      target: 'es2020',
    },
    css: {
      devSourcemap: true,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/sitemap-page'),
      serialize(item) {
        // Look up real lastmod from cache; fall back to build time
        const isoString = lastmodCache.get(item.url) || BUILD_TIME.toISOString();
        const lastmodDate = new Date(isoString);

        // Apply per-URL priority/changefreq (unchanged from existing config)
        if (item.url === 'https://stackarchitect.xyz/') {
          return { ...item, lastmod: lastmodDate, priority: 1.0, changefreq: 'weekly' };
        }
        if (item.url.includes('/blog/')) {
          return { ...item, lastmod: lastmodDate, priority: 0.8, changefreq: 'monthly' };
        }
        const commercialPaths = [
          '/capi-shield/',
          '/stocky-swap/',
          '/tiktok-events-api-shopify/',
          '/replace-klaviyo-free/',
          '/shopify-profit-loss-automation/',
          '/autocrat-quota-fix/',
          '/pro/',
          '/shopify-google-ads-conversion-tracking/',
          '/best-free-shopify-apps-2026/',
        ];
        if (commercialPaths.some((p) => item.url.endsWith(p))) {
          return { ...item, lastmod: lastmodDate, priority: 0.9, changefreq: 'monthly' };
        }
        return { ...item, lastmod: lastmodDate, priority: 0.7, changefreq: 'monthly' };
      },
    }),
    mdx(),
    indexnow({
      key: 'b953b757ff91da6971c05ff7f7e39668',
    }),
  ],
});
