import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import indexnow from 'astro-indexnow';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';

// ──────────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────────
const SITE = 'https://stackarchitect.xyz';
const BLOG_DIR = 'src/content/blog';
const PAGES_DIR = 'src/pages';

// Frontmatter field names we'll accept for "last updated" / "published",
// in priority order. First match wins.
const UPDATED_FIELDS = [
  'updatedDate',
  'updated',
  'lastUpdated',
  'dateModified',
  'modified',
  'lastmod',
];
const PUBLISHED_FIELDS = [
  'publishDate',
  'publishedDate',
  'pubDate',
  'datePublished',
  'date',
];

// ──────────────────────────────────────────────────────────────────
// LASTMOD CACHE — built once at config load, used by sitemap.serialize
// ──────────────────────────────────────────────────────────────────
// Map of canonical URL (with trailing slash) -> ISO 8601 date string
const lastmodCache = new Map();
const BUILD_TIME_ISO = new Date().toISOString();

// Convert any value to a valid ISO string, or null if invalid.
function toIsoOrNull(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Pick the first non-empty frontmatter field from a list of names.
function pickField(data, fields) {
  if (!data || typeof data !== 'object') return null;
  for (const f of fields) {
    if (data[f]) return data[f];
  }
  return null;
}

// Returns ISO string from `git log -1 --format=%cI -- <file>`, or null.
// %cI = committer date, strict ISO 8601. Robust across timezones.
function gitLastModified(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    const out = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return toIsoOrNull(out);
  } catch {
    return null;
  }
}

// Walk a directory recursively, returning absolute file paths.
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

// Build cache for blog posts from src/content/blog/**/*.{md,mdx}
function indexBlogPosts() {
  if (!existsSync(BLOG_DIR)) return;
  const files = walk(BLOG_DIR).filter((f) => /\.(md|mdx)$/i.test(f));
  for (const file of files) {
    try {
      const slug = relative(BLOG_DIR, file).replace(/\.(md|mdx)$/i, '');
      const url = `${SITE}/blog/${slug}/`;

      const raw = readFileSync(file, 'utf8');
      const { data } = matter(raw);

      // Priority: updated > published > git commit > build time
      let iso =
        toIsoOrNull(pickField(data, UPDATED_FIELDS)) ||
        toIsoOrNull(pickField(data, PUBLISHED_FIELDS)) ||
        gitLastModified(file) ||
        BUILD_TIME_ISO;

      lastmodCache.set(url, iso);
    } catch {
      // skip malformed file silently — falls back to build time at lookup
    }
  }
}

// Build cache for static pages from src/pages/**/*.{astro,md,mdx}
function indexStaticPages() {
  if (!existsSync(PAGES_DIR)) return;
  const files = walk(PAGES_DIR).filter((f) => /\.(astro|md|mdx)$/i.test(f));
  for (const file of files) {
    try {
      const rel = relative(PAGES_DIR, file);

      // Skip dynamic routes ([slug].astro etc.) — they generate their own URLs
      // we can't predict statically here. Their lastmod will fall back to build time.
      if (/\[.*\]/.test(rel)) continue;

      // Skip API endpoints and 404 pages — these don't go in the sitemap anyway
      if (rel === '404.astro' || rel.startsWith('api/')) continue;

      // Derive URL path
      let pathPart = rel.replace(/\.(astro|md|mdx)$/i, '');
      if (pathPart === 'index') pathPart = '';
      else if (pathPart.endsWith('/index')) pathPart = pathPart.slice(0, -'/index'.length);

      const url = pathPart === '' ? `${SITE}/` : `${SITE}/${pathPart}/`;

      // For .md/.mdx pages we can also read frontmatter dates
      let iso = null;
      if (/\.(md|mdx)$/i.test(file)) {
        try {
          const raw = readFileSync(file, 'utf8');
          const { data } = matter(raw);
          iso =
            toIsoOrNull(pickField(data, UPDATED_FIELDS)) ||
            toIsoOrNull(pickField(data, PUBLISHED_FIELDS));
        } catch {
          /* fall through to git */
        }
      }

      iso = iso || gitLastModified(file) || BUILD_TIME_ISO;
      lastmodCache.set(url, iso);
    } catch {
      // skip
    }
  }
}

// Build the cache once at config load
indexBlogPosts();
indexStaticPages();

// Brief build-time log so you can verify in your deploy output that the
// sitemap is using real dates and not the build timestamp for everything.
if (lastmodCache.size > 0) {
  const allBuildTime = [...lastmodCache.values()].every((d) => d === BUILD_TIME_ISO);
  // eslint-disable-next-line no-console
  console.log(
    `[sitemap] indexed ${lastmodCache.size} URL(s) with lastmod dates` +
      (allBuildTime ? ' — WARNING: all fell back to build time' : '')
  );
}

// ──────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────
export default defineConfig({
  site: SITE,
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
        // Look up real lastmod from cache; fall back to build time as last resort.
        // Pass as ISO string — that's what @astrojs/sitemap's SitemapItem expects.
        const lastmod = lastmodCache.get(item.url) || BUILD_TIME_ISO;

        // Homepage
        if (item.url === `${SITE}/`) {
          return { ...item, lastmod, priority: 1.0, changefreq: 'weekly' };
        }

        // Blog posts
        if (item.url.includes('/blog/')) {
          return { ...item, lastmod, priority: 0.8, changefreq: 'monthly' };
        }

        // Commercial / product hub pages
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
          return { ...item, lastmod, priority: 0.9, changefreq: 'monthly' };
        }

        // Everything else
        return { ...item, lastmod, priority: 0.7, changefreq: 'monthly' };
      },
    }),
    mdx(),
    indexnow({
      key: 'b953b757ff91da6971c05ff7f7e39668',
    }),
  ],
});
