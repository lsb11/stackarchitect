# Stack Architect

Free Shopify automation tools and diagnostic calculators that replace expensive paid apps — order logging to Google Sheets, server-side tracking helpers, profit/loss automation, and a library of free guides.

🔗 **Live site:** https://stackarchitect.xyz
⭐ **Flagship tool:** [Stocky Swap — free Shopify Stocky replacement](https://stackarchitect.xyz/stocky-swap/)

Built and maintained by Luke (UK).

---

## What's here

- **Automation tools** — e.g. [Stocky Swap](https://stackarchitect.xyz/stocky-swap/) (logs orders to Google Sheets via Make.com), [CAPI Shield](https://stackarchitect.xyz/capi-shield/), [P&L Automation](https://stackarchitect.xyz/shopify-profit-loss-automation/).
- **Free calculators & diagnostics** — app-cost, break-even, attribution-gap, EMQ-score and more (see [`/tools`](https://stackarchitect.xyz/tools/)).
- **Guides & comparisons** — long-form Shopify automation and migration content under [`/shopify-automation-guides`](https://stackarchitect.xyz/shopify-automation-guides/).

Each tool is honest about scope — what it does *and* what it doesn't — so merchants can pick the right fit.

## Tech stack

- [Astro](https://astro.build) — static output (`output: 'static'`)
- `@astrojs/sitemap` — auto-generated sitemap with real `lastmod` dates
- `@astrojs/mdx` — MDX support for content
- Markdown content collection in `src/content/blog/`
- Deployed on **Cloudflare Pages** (Wrangler)

## Project structure

```text
/
├── public/                 # static assets, _redirects, robots.txt
├── src/
│   ├── components/         # shared Astro components
│   ├── content/
│   │   └── blog/           # Markdown blog posts (content collection)
│   └── pages/              # routes — .astro pages + blog/[slug].astro
├── astro.config.mjs        # Astro config + sitemap serialization
└── package.json
```

Astro maps `.astro` / `.md` files in `src/pages/` to routes based on filename. Blog posts live in `src/content/blog/` and render through `src/pages/blog/[slug].astro`.

## Commands

Run from the project root:

| Command                  | Action                                              |
| :----------------------- | :-------------------------------------------------- |
| `npm install`            | Install dependencies                                |
| `npm run dev`            | Start local dev server at `localhost:4321`          |
| `npm run build`          | Build the production site to `./dist/`              |
| `npm run preview`        | Preview the build locally before deploying          |
| `npm run astro ...`      | Run CLI commands like `astro add`, `astro check`    |
| `npm run generate-types` | Generate Cloudflare types via Wrangler              |

## Deployment

Pushes to the default branch build on Cloudflare Pages (project `stackarchitect2`). The build outputs to `./dist/`; the sitemap and `lastmod` dates are generated at build time — check the build log for the `[sitemap] indexed N URL(s)` line to confirm.

---

© Stack Architect · stackarchitect.xyz
