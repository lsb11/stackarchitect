// One source for a page's FAQ: the same array renders the visible questions
// and answers and generates the FAQPage JSON-LD, so the two cannot drift.
//
// Until 25 Sep 2026 each page carried a hand-written FAQPage block beside its
// hand-written FAQ markup. 179 answers across 66 pages no longer matched what
// a reader saw, several of them on substance (a plan price, an included
// allowance). scripts/schema-visible-guard.mjs now fails the build on any
// FAQPage question or answer that is not, after stripping tags and
// whitespace, the exact text of an element on the page.

export interface Faq {
  /** The question, plain text. */
  q: string;
  /** The answer as HTML: inline tags and links allowed. */
  a: string;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

/** Answer HTML as the plain text a reader sees. */
export function faqText(html: string): string {
  return html
    .replace(/<\/(p|li|div|h[1-6])>|<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, ' ')
    .trim();
}

/** The FAQPage node for `faqs`, built from exactly what the page displays. */
export function faqPage(faqs: Faq[], id?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(id ? { '@id': id } : {}),
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: faqText(a) },
    })),
  };
}
