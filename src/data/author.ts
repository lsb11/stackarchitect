/**
 * author.ts — the single definition of Luke Sandelands.
 *
 * WHY THIS FILE EXISTS
 * The Person node used to live inline in Base.astro and the visible byline
 * lived inline in AuthorCard.astro. Two copies of the same facts, edited at
 * different times, is the failure mode that produced the #org/#organization
 * split and the Make Core price drift. Both now read from here, so the
 * rendered byline and the JSON-LD cannot say different things about the
 * same person.
 *
 * AUTHOR         — the facts, once. Consumed by AuthorCard.astro for the
 *                  visible bio and by personSchema below for the JSON-LD.
 * personSchema   — the canonical #luke node. Base.astro emits it on every
 *                  page; no other file may define a Person with this @id.
 *                  Any page needing Luke references { '@id': '.../#luke' }.
 *
 * subjectOf is assembled here, not hand-written: PRIOR_COVERAGE holds the
 * mentions that carry no first-party text, and the contributed quotes come
 * from src/data/press.ts. One list per kind, appended in one place.
 *
 * Person name is always "Luke Sandelands", never "Luke" — see CLAUDE.md.
 */
import { PRESS, type PressMention } from './press';

const SITE = 'https://stackarchitect.xyz';

export const AUTHOR = {
  id: `${SITE}/#luke`,
  name: 'Luke Sandelands',
  alternateName: 'Luke',
  givenName: 'Luke',
  familyName: 'Sandelands',
  image: `${SITE}/luke.jpg`,
  /** Schema jobTitle. The visible card shows `roleLine` instead. */
  jobTitle: 'Shopify Automation Specialist',
  /** The byline's role line — richer than jobTitle, same person. */
  roleLine: 'Founder, Stack Architect · Shopify Automation Specialist',
  url: `${SITE}/about/`,
  description:
    'Shopify automation specialist and creator of Stack Architect. Builds and documents free, open-source server-side tracking, inventory, and email automation tools for Shopify merchants. Hands-on with Make.com, Meta Conversions API, Google Enhanced Conversions, TikTok Events API, and Shopify webhooks.',

  /**
   * The date a human last re-read this profile and confirmed it still
   * describes what Luke actually does. Same distinction as verifiedDate on a
   * page: it is not "when the file changed", so do not bump it on a refactor.
   */
  profileVerified: '2026-09-02',

  /** Links the visible bio renders. Kept here so the card carries no URLs. */
  links: {
    stockLog: 'https://stocklog.onrender.com/',
    validatorRepo: 'https://github.com/lsb11/shopify-capi-validator',
    validatorNpm: 'https://www.npmjs.com/package/shopify-capi-validator',
    about: `${SITE}/about/`,
  },

  /** Luke's OWN identity profiles. The LinkedIn company page belongs on #org. */
  sameAs: [
    'https://www.linkedin.com/in/luke-stackarchitect',
    'https://medium.com/@stackarchitect123',
    'https://github.com/lsb11',
    'https://github.com/lsb11/stackarchitect',
    'https://github.com/lsb11/shopify-capi-validator',
    'https://www.npmjs.com/package/shopify-capi-validator',
    'https://www.connectively.us/p/luke-s',
  ],

  knowsAbout: [
    'Shopify automation', 'server-side tracking', 'Meta Conversions API',
    'Google Enhanced Conversions', 'TikTok Events API', 'Make.com',
    'Google Sheets automation', 'Shopify webhooks', 'Google Apps Script',
    'Shopify app cost reduction', 'email marketing automation',
    'Shopify inventory management', 'Shopify CAPI', 'Elevar alternative',
    'Triple Whale alternative', 'Analyzify alternative', 'Northbeam alternative',
    'Klaviyo alternative', 'Stocky alternative',
  ],
} as const;

/** Shape of a subjectOf entry as schema.org consumes it. */
interface CoverageNode {
  '@type': 'Article' | 'NewsArticle' | 'WebPage';
  '@id'?: string;
  url?: string;
  headline?: string;
  name?: string;
  datePublished?: string;
  author?: Record<string, unknown>;
  publisher?: Record<string, unknown>;
  about?: Record<string, unknown>;
}

/**
 * Coverage that mentions Luke but supplies us no text of our own to quote.
 * Schema only — nothing here may be reproduced as visible copy.
 *
 * These are subjectOf, not sameAs: sameAs is for identity profiles, these are
 * works ABOUT the person. Several are unlinked brand mentions (TechRound names
 * Luke and Stack Architect but does not link here) — subjectOf asserts the work
 * is about him, which is true regardless of linking. Do not read any of these
 * as a backlink.
 */
const PRIOR_COVERAGE: CoverageNode[] = [
  {
    '@type': 'NewsArticle',
    '@id': 'https://techround.co.uk/artificial-intelligence/quite-contrary-the-real-reason-enterprise-ai-pilots-fail-according-to-chase-w-hughes/',
    'url': 'https://techround.co.uk/artificial-intelligence/quite-contrary-the-real-reason-enterprise-ai-pilots-fail-according-to-chase-w-hughes/',
    'headline': 'Quite Contrary: The Real Reason Enterprise AI Pilots Fail, According To Chase W. Hughes',
    'datePublished': '2026-08-12',
    'author': { '@type': 'Person', 'name': 'Gina Marrs' },
    'publisher': {
      '@type': 'Organization',
      'name': 'TechRound',
      'url': 'https://techround.co.uk/',
    },
  },
  {
    '@type': 'Article',
    '@id': 'https://leadersperception.com/luke-sandelands-on-replacing-shopify-apps-with-server-side-pipelines/',
    'url': 'https://leadersperception.com/luke-sandelands-on-replacing-shopify-apps-with-server-side-pipelines/',
    'headline': 'Luke Sandelands on replacing Shopify apps with server-side pipelines',
    'datePublished': '2026-08-11',
    'author': { '@type': 'Person', 'name': 'Eric Zavala' },
    'publisher': {
      '@type': 'Organization',
      'name': 'Leaders Perception',
      'url': 'https://leadersperception.com/',
    },
    'about': { '@id': `${SITE}/#org` },
  },
  {
    '@type': 'Article',
    'headline': 'Deciding when engineering teams should pay down technical debt',
    'url': 'https://ctosync.com/qa/deciding-when-engineering-teams-pay-down-technical-debt/',
    'publisher': { '@type': 'Organization', 'name': 'CTO Sync' },
  },
  {
    // Q&A format, same as the CTO Sync piece. Luke is quoted directly on the
    // determinism-before-modelling rule — the same argument as the TechRound
    // panel, which is why both sit on this node rather than on #org.
    '@type': 'Article',
    'headline': 'Balance Data Pipeline Debt with New Delivery Demands',
    'url': 'https://informaticsmagazine.com/qa/balance-data-pipeline-debt-with-new-delivery-demands/',
    'datePublished': '2026-08-17',
    'publisher': {
      '@type': 'Organization',
      'name': 'Informatics Magazine',
      'url': 'https://informaticsmagazine.com/',
    },
  },
  {
    '@type': 'Article',
    'headline': 'Top Shopify Apps for Automating Your Store',
    'url': 'https://ecommercemanager.co/shopify/top-shopify-apps-for-automating-your-store-in-x/',
    'datePublished': '2026-07-07',
    'publisher': { '@type': 'Organization', 'name': 'eCommerce Manager' },
  },
  {
    '@type': 'Article',
    'headline': 'Going Global: Ecommerce Leaders Share International Expansion Strategies',
    'url': 'https://ecommercemanager.co/ecommerce/going-global-ecommerce-leaders-share-international-expansion-strategies/',
    'datePublished': '2026-07-20',
    'publisher': { '@type': 'Organization', 'name': 'eCommerce Manager' },
  },
  {
    '@type': 'Article',
    'headline': 'Effective Shopify Pop-Up Forms: Tips & Best Practices',
    'url': 'https://ecommercemanager.co/shopify/effective-shopify-pop-up-forms-tips-best-practices/',
    'datePublished': '2026-07-31',
    'publisher': { '@type': 'Organization', 'name': 'eCommerce Manager' },
  },
  {
    '@type': 'WebPage',
    'name': 'Free Shopify Automation Stack on Astro Showcase',
    'url': 'https://astro-what-cms.netlify.app/',
    'publisher': { '@type': 'Organization', 'name': 'Astro' },
  },
  {
    '@type': 'WebPage',
    'name': 'ProductHunt Launch Domain Usage',
    'url': 'https://crunch.id/producthunt-launch-domain-usage-13th-june-2026/',
    'publisher': { '@type': 'Organization', 'name': 'Crunch.id' },
  },
];

/**
 * A contributed quote, as an Article the person is the subject of.
 *
 * It is NOT a Review, Rating, AggregateRating, EndorsementRating or Award, and
 * must never be marked as one. An outlet printing our answer to its question is
 * not an outlet rating us; asserting otherwise is structured-data spam and
 * risks a manual action. scripts/claims-guard.mjs fails the build if any of
 * those types appears near this article's URL.
 */
function contributedQuoteNode(p: PressMention): CoverageNode {
  return {
    '@type': 'Article',
    'headline': p.title,
    'url': p.url,
    'datePublished': p.datePublished,
    'author': { '@type': 'Person', 'name': p.author },
    'publisher': { '@type': 'Organization', 'name': p.outlet },
  };
}

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': AUTHOR.id,
  'name': AUTHOR.name,
  'alternateName': AUTHOR.alternateName,
  'givenName': AUTHOR.givenName,
  'familyName': AUTHOR.familyName,
  'image': AUTHOR.image,
  'jobTitle': AUTHOR.jobTitle,
  'description': AUTHOR.description,
  'url': AUTHOR.url,
  'sameAs': [...AUTHOR.sameAs],
  'subjectOf': [...PRIOR_COVERAGE, ...PRESS.map(contributedQuoteNode)],
  'worksFor': { '@type': 'Organization', '@id': `${SITE}/#org` },
  'knowsAbout': [...AUTHOR.knowsAbout],
};
