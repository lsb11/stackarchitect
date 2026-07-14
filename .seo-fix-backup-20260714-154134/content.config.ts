import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    updatedDate: z.string().optional(),
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
    canonical: z.string(),
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
