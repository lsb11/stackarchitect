import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.stackarchitect.xyz',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      lastmod: new Date(),
      customPages: [
        'https://www.stackarchitect.xyz/',
        'https://www.stackarchitect.xyz/shopify-automation-guides',
        'https://www.stackarchitect.xyz/tools',
        'https://www.stackarchitect.xyz/capi-shield',
        'https://www.stackarchitect.xyz/stocky-swap',
        'https://www.stackarchitect.xyz/tiktok-events-api-shopify',
        'https://www.stackarchitect.xyz/replace-klaviyo-free',
        'https://www.stackarchitect.xyz/shopify-profit-loss-automation',
        'https://www.stackarchitect.xyz/autocrat-quota-fix',
        'https://www.stackarchitect.xyz/best-ai-tools-shopify',
        'https://www.stackarchitect.xyz/ultimate-shopify-automation-guide',
        'https://www.stackarchitect.xyz/shopify-automation-scanner',
        'https://www.stackarchitect.xyz/shopify-app-cost-calculator',
        'https://www.stackarchitect.xyz/about',
        'https://www.stackarchitect.xyz/sitemap',
      ],
      serialize(item) {
        if (item.url === 'https://www.stackarchitect.xyz/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        const productPages = [
          '/capi-shield',
          '/stocky-swap',
          '/tiktok-events-api-shopify',
          '/replace-klaviyo-free',
          '/shopify-profit-loss-automation',
          '/ultimate-shopify-automation-guide',
          '/shopify-automation-guides',
        ];
        if (productPages.some((p) => item.url.endsWith(p))) {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
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
