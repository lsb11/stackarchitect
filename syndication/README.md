# Syndication — keeping the cross-posted copies honest

Every guide on this site has copies on dev.to, Hashnode and Medium. Those
copies are generated from the site and pushed by one command. Nobody edits
them by hand, because a hand-kept copy drifts away from the page it came from.

## One-time setup (5 minutes)

| Platform | Get the credential | Set it |
|---|---|---|
| dev.to | Settings → Extensions → **DEV Community API Keys** → Generate | `export DEVTO_API_KEY=…` |
| Hashnode | hashnode.com → Settings → **Developer** → Generate new token | `export HASHNODE_PAT=…` |
| Medium | nothing: Medium has no edit API, so the tool prints the steps | — |

Never commit these. Put them in your shell profile or a local `.env` that
stays untracked.

## Every time

```sh
npm run build                          # packs are generated from dist/
npm run syndication:sync               # DRY RUN: prints every post and what it would change
npm run syndication:sync -- --apply    # writes the changes to dev.to and Hashnode
```

Read the dry run before you `--apply`. For every post it shows:

- its current canonical, and whether that is **live**, **retired** (a URL the
  site has since redirected) or **original** (a post with no site page behind it);
- every retracted claim, withdrawn claim and bare affiliate link it found, quoted;
- the action it will take.

| Action | Means |
|---|---|
| `canonical → /x/` | the post points at a retired URL; it will point at the page that replaced it |
| `body ← /x/` | the body is replaced with the current version of that page (see below) |
| `title → "…"` | only when the title itself carries a retracted claim |
| `affiliate links → site pages` | `--minimal` only: `/go/*` links become links to the page that covers the tool |
| `MANUAL: …` | the tool will not touch it; it tells you why |

### What a replaced body contains

The page's own 40–60 word answer paragraph, then its FAQ, then a link to the
full guide. The FAQ text is held to the visible page text verbatim by
`schema-visible-guard`, so every sentence has already passed every guard in
`npm run build`. The packs are written to `syndication/out/` (gitignored):
open them before applying.

The copy deliberately gives the answer and sends readers to the site for the
steps, sources and dates. That is the version assistants can quote, and the
click lands where affiliate links are disclosed.

### Keeping a full article instead

`--minimal` fixes canonicals and links only, and replaces a body only where a
retracted claim is found. Use it for a post whose full text you want to keep.
It will not catch a stale statement that no rule describes, which is exactly
how the "11x" statistic survived in the agentic copies, so the default is the
full replacement.

### Medium

Medium's feed has no canonical, so each post is matched to the page it copies
by, in order: its own "Originally published at" footer (followed through
`_redirects`), an entry in `pages.json` → `"medium"` (Medium URL slug prefix →
site path, for copies with no footer), or a title overlap of at least 50%.
Anything weaker is an original article and is never overwritten; flagged
sentences in one are listed for you to edit by hand.

Only posts that carry a retracted claim or a bare `/go/` link are listed as
needing you. For each, the tool writes `syndication/out/<page>.html`:

1. Open that file in your browser, ⌘A, ⌘C.
2. On Medium: ⋯ → **Edit story**, click in the story, ⌘A, ⌘V, then
   **Save and publish**. Medium keeps formatting pasted from a page; it does
   not convert pasted Markdown.
3. ⋯ → **Story settings → Advanced settings → Canonical link**: the URL the
   tool printed.

Medium's feed only shows the latest ten posts; check older ones the same way.

### dev.to: two posts, one canonical

dev.to refuses a second article with a canonical another one already holds
(HTTP 422). When a retired canonical would resolve to a page another of your
posts already claims, the tool keeps the old canonical (it 301s to the same
page) and still replaces the body.

### Hashnode: "a web page, not the API's JSON"

The tool now says which HTTP status came back. 401/403: make a new token and
`export HASHNODE_PAT=…` again. Anything else: a network block or a Hashnode
outage; retry later. `HASHNODE_HOST` must be the blog's address
(default `stocky-shutdown.hashnode.dev`).

## Adding a new cross-post

Publish it from `npm run syndication:build -- /the-page/`, with the canonical
set to the page. Add the page to `pages.json` so the default build includes it.
