import { OGImageRoute } from 'astro-og-canvas';

// Per-page Open Graph cards, rendered at build time into /og/<route>.png.
// Base.astro points og:image here for any page without an explicit ogImage.
//
// The look is the design pack's (og.png): deep navy, blueprint grid, the
// stacked-bars mark, Inter ExtraBold headline. The chrome lives in two sets of
// static assets under src/assets/og/ so the card code only places text:
//   og-bg.png        — background, url and accent rule (1200×630)
//   lockup-<kind>.png — icon + wordmark + "// kind" line, drawn as the logo
// Regenerate those with scripts/og/make_og_assets.py if the brand changes.

const rawPages = import.meta.glob('/src/pages/**/*.astro', { eager: true, query: '?raw', import: 'default' });
const rawBlog = import.meta.glob('/src/content/blog/**/*.md', { eager: true, query: '?raw', import: 'default' });

type Kind = 'default' | 'guide' | 'tool' | 'blog' | 'research';
type Page = { title: string; description: string; kind: Kind };
const pages: Record<string, Page> = {};

function kindFor(route: string): Kind {
  if (route === 'home') return 'default';
  if (route.startsWith('blog/')) return 'blog';
  if (/benchmark|research\//.test(route)) return 'research';
  if (/calculator|estimator|scorer|auditor|^tools$|^free-tools|embed\//.test(route)) return 'tool';
  return 'guide';
}

// Keep the description to two lines on the card; cut on a word boundary.
function clamp(text: string, max = 118): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—–-]+$/, '') + '…';
}

for (const [path, raw] of Object.entries(rawPages)) {
  if (typeof raw !== 'string') continue;
  const baseTag = raw.match(/<Base\b[^>]*>/i)?.[0] ?? '';
  let title = baseTag.match(/\btitle=["']([^"']+)["']/i)?.[1] ?? 'Stack Architect';
  title = title.replace(/\s*[|—]\s*Stack Architect.*/i, '').trim();
  const description = baseTag.match(/\bdescription=["']([^"']+)["']/i)?.[1] ?? '';

  let route = path.replace('/src/pages/', '').replace('.astro', '').replace(/\/index$/, '');
  if (route === 'index') route = 'home';

  pages[route] = { title, description: clamp(description), kind: kindFor(route) };
}

for (const [path, raw] of Object.entries(rawBlog)) {
  if (typeof raw !== 'string') continue;
  const unquote = (s?: string) => s?.trim().replace(/^['"]|['"]$/g, '');
  const title = unquote(raw.match(/^title:\s*(.+)$/m)?.[1]) ?? 'Stack Architect Blog';
  const description = unquote(raw.match(/^description:\s*(.+)$/m)?.[1]) ?? '';

  const route = path.replace('/src/content/', '').replace(/\.md$/, '').replace(/\/index$/, '');
  pages[route] = { title, description: clamp(description), kind: 'blog' };
}

// Fonts are vendored, not fetched. Left unset, astro-og-canvas downloads Noto
// Sans from api.fontsource.org on every build — a third-party host inside the
// deploy path, which 403s some egress ranges and takes `astro build` down.
// Inter (SIL OFL 1.1, licence alongside), derived from @fontsource/inter.
const OG_FONTS = [
  './src/assets/fonts/Inter-Regular.ttf',
  './src/assets/fonts/Inter-ExtraBold.ttf',
];

// Big headline that still fits two lines at 984px measure.
const titleSize = (t: string) => (t.length > 60 ? 56 : t.length > 40 ? 64 : 76);

const getRouter = async () => {
  return await OGImageRoute({
    pages,
    getImageOptions: (_path, page: Page) => ({
      title: page?.title || 'Stack Architect',
      description: page?.description || '',
      bgGradient: [[2, 8, 23]],
      bgImage: { path: './src/assets/og/og-bg.png', fit: 'cover' },
      logo: { path: `./src/assets/og/lockup-${page?.kind ?? 'default'}.png` },
      padding: 72,
      fonts: OG_FONTS,
      font: {
        title: {
          size: titleSize(page?.title || ''),
          weight: 'ExtraBold',
          lineHeight: 1.08,
          color: [246, 248, 250],
          families: ['Inter'],
        },
        description: {
          size: 28,
          lineHeight: 1.4,
          color: [148, 163, 184],
          families: ['Inter'],
        },
      },
    }),
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
