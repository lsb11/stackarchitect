import { OGImageRoute } from 'astro-og-canvas';

const rawPages = import.meta.glob('/src/pages/**/*.astro', { eager: true, query: '?raw', import: 'default' });
const rawBlog = import.meta.glob('/src/content/blog/**/*.md', { eager: true, query: '?raw', import: 'default' });

const pages = {};

// Parse Astro pages
for (const [path, raw] of Object.entries(rawPages)) {
  if (typeof raw !== 'string') continue;
  let titleMatch = raw.match(/<Base[^>]*title=["']([^"']+)["']/i);
  let title = titleMatch ? titleMatch[1] : 'Stack Architect';
  
  // Clean up title (remove " | Stack Architect" or " — Stack Architect")
  title = title.replace(/\s*[|—]\s*Stack Architect.*/i, '').trim();

  let route = path.replace('/src/pages/', '').replace('.astro', '').replace(/\/index$/, '');
  if (route === 'index') route = 'home'; // Root maps to /og/home.png

  pages[route] = { title };
}

// Parse Markdown blog posts
for (const [path, raw] of Object.entries(rawBlog)) {
  if (typeof raw !== 'string') continue;
  let titleMatch = raw.match(/title:\s*['"]?([^'"\n]+)['"]?/i);
  let title = titleMatch ? titleMatch[1] : 'Stack Architect Blog';
  
  let route = path.replace('/src/content/', '').replace(/\.md$/, '').replace(/\/index$/, '');
  pages[route] = { title };
}

// Fonts are vendored, not fetched. Left unset, astro-og-canvas downloads Noto
// Sans from api.fontsource.org on every build — a third-party host inside the
// deploy path. It returns 403 to some egress ranges, and when it does the OG
// route throws and takes the whole `astro build` down with it, so a Cloudflare
// deploy fails for a reason that has nothing to do with the commit.
// These two files are Inter (SIL OFL 1.1, licence alongside them), derived from
// the @fontsource/inter package this repo already depends on, so the cards now
// use the site's own typeface instead of a fallback.
const OG_FONTS = [
  './src/assets/fonts/Inter-Regular.ttf',
  './src/assets/fonts/Inter-Bold.ttf',
];

const getRouter = async () => {
  return await OGImageRoute({
    pages: pages,
    getImageOptions: (path, page) => ({
      title: page?.title || 'Stack Architect',
      bgGradient: [[12, 15, 13], [24, 32, 28]],
      border: { color: [52, 211, 119], width: 10, side: 'block-start' },
      padding: 80,
      fonts: OG_FONTS,
    })
  });
};

export const getStaticPaths = async (context) => {
  const router = await getRouter();
  return router.getStaticPaths(context);
};

export const GET = async (context) => {
  const router = await getRouter();
  return router.GET(context);
};
