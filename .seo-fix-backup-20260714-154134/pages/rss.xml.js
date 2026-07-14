// /rss.xml — full-site feed for crawl discovery.
// Google, Bing and AI crawlers (GPTBot, ClaudeBot, PerplexityBot) all poll
// RSS feeds far more frequently than sitemaps. New posts get discovered in
// minutes instead of days. Advertised via <link rel="alternate"> in Base.astro.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

const SITE = 'https://stackarchitect.xyz';

export async function GET() {
  const posts = (await getCollection('blog', ({ data }) => !data.noindex)).sort(
    (a, b) =>
      new Date(b.data.updatedDate ?? b.data.publishDate).valueOf() -
      new Date(a.data.updatedDate ?? a.data.publishDate).valueOf()
  );

  return rss({
    title: 'Stack Architect — Free Shopify Automation',
    description:
      'Free tools and guides that replace $700+/month of paid Shopify apps — server-side tracking, inventory, email, TikTok Events API, and P&L automation.',
    site: SITE,
    trailingSlash: true,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      link: `${SITE}/blog/${post.id.replace(/\.(md|mdx)$/i, '')}/`,
      pubDate: new Date(post.data.publishDate),
      categories: [post.data.category],
    })),
    customData: '<language>en-gb</language>',
  });
}
