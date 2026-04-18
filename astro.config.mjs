import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

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
      lastmod: new Date(),
      serialize(item) {
        if (item.url === 'https://stackarchitect.xyz/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (item.url.includes('/blog/')) {
          return { ...item, priority: 0.8, changefreq: 'monthly' };
        }
        if (['/capi-shield','/stocky-swap','/tiktok-events-api-shopify','/replace-klaviyo-free','/shopify-profit-loss-automation','/autocrat-quota-fix','/pro'].some(p => item.url.endsWith(p))) {
          return { ...item, priority: 0.9, changefreq: 'monthly' };
        }
        return { ...item, priority: 0.7, changefreq: 'monthly' };
      },
    }),
    mdx(),
  ],
});
