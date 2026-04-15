import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://stackarchitect.xyz',
  output: 'static',
  trailingSlash: 'never',

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
      lastmod: new Date(),
      serialize(item) {
        if (item.url === 'https://www.stackarchitect.xyz/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (item.url.includes('/blog/')) {
          return { ...item, priority: 0.8, changefreq: 'monthly' };
        }
        return { ...item, priority: 0.6, changefreq: 'monthly' };
      },
    }),
    mdx(),
  ],
});
