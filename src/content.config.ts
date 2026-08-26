import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    // On-page H1. Distinct from `title`, which is the <title>/SERP variant and
    // is length-constrained. Rendered by BlogPost.astro above #answer; falls
    // back to `title` when absent.
    heading: z.string().optional(),
    description: z.string(),
    // Self-contained 40–60 word answer to the post's target question, rendered
    // as <p id="answer"> above the body. Must read correctly quoted in
    // isolation — it is the unit an LLM lifts verbatim. Runbook §3.1.
    answer: z.string().optional(),
    ogImage: z.string().optional(),
    publishDate: z.string(),
    updatedDate: z.string().optional(),
    // Date a human last checked this post's factual claims (pricing, plan
    // limits, eligibility rules) against their live source. Distinct from
    // updatedDate, which only means the content changed. Threaded to
    // Base.astro, which renders it on-page and prefers it for dateModified.
    // Until this field existed, no blog post could carry a verification date
    // at all — 319 price claims across the collection were structurally
    // unverifiable. Format: YYYY-MM-DD.
    verifiedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    category: z.enum([
      'tracking',
      'inventory',
      'email',
      'automation',
      'workflow',
      'ai',
      'support',
      'product',
    ]),
    badge: z.string().optional(),
    badgeType: z.enum(['urgent', 'new', 'comparison', 'hot', 'default']).default('default'),
    readTime: z.number(),
    canonical: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    noindex: z.boolean().default(false),
    faqs: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .optional(),
    relatedGuides: z
      .array(
        z.object({
          title: z.string(),
          href: z.string(),
          badge: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const collections = { blog };
