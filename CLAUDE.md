## Active work: Consolidation Release v1
Spec: docs/RUNBOOK-consolidation-v1.md — read it before any structural change.

Context: 176 pages sit in GSC "Crawled – currently not indexed". The cause is a
site-level quality assessment: too many thin and near-duplicate URLs on a
low-authority domain. We are cutting 88 indexable URLs to 58 in ONE deploy,
then freezing the URL set for 60 days.

Hard rules on this branch:
- Merging content means DEDUPLICATING, never concatenating. A 4,500-word page
  assembled by stapling four 1,100-word posts together is still four thin pages.
- Never emit a schema.org Offer without both priceVerifiedDate and priceSourceUrl.
- Zero internal links may point at a path on the left-hand side of public/_redirects.
- Organization @id is always #org, never #organization.
- Person name is always "Luke Sandelands", never "Luke".
- Every indexable page opens with a self-contained 40–60 word answer paragraph.
