// src/data/toolShots.ts
//
// Screenshots of the free tools in use, on each tool's own default example
// inputs. Written by scripts/screens/capture.mjs from a local build, which
// also records each image's text in scripts/og/og-images.json. Re-run that
// script after changing a tool; never edit the images by hand. `taken` is the
// date of that run.
export const TOOL_SHOTS_TAKEN = '2026-10-20';

export interface ToolShot { id: string; src: string; w: number; h: number; route: string; name: string; alt: string }

export const TOOL_SHOTS: Record<string, ToolShot> = {
  'capi-validator-example': {"id": "capi-validator-example", "src": "/screens/capi-validator-example.webp", "w": 1600, "h": 789, "route": "/meta-capi-payload-validator/", "name": "Meta Conversions API payload validator", "alt": "The payload validator on its example Purchase event: three fails (a millisecond timestamp, a missing event_source_url and a raw email address) and twelve passed checks."},
  'attribution-gap-example': {"id": "attribution-gap-example", "src": "/screens/attribution-gap-example.webp", "w": 1600, "h": 1568, "route": "/shopify-vs-meta-attribution-gap-calculator/", "name": "Shopify vs Meta attribution gap calculator", "alt": "The attribution gap calculator on its worked example: 50,000 Shopify revenue, 42,000 reported by Meta and 15,000 ad spend give a gap of minus 16%, a blended ROAS of 3.33x and a reported ROAS of 2.80x."},
  'make-vs-zapier-example': {"id": "make-vs-zapier-example", "src": "/screens/make-vs-zapier-example.webp", "w": 1600, "h": 1423, "route": "/make-vs-zapier-cost-calculator/", "name": "Make.com vs Zapier cost calculator", "alt": "The Make.com vs Zapier calculator at 500 runs a month with five steps each, comparing the monthly cost on each platform."},
  'emq-checker-example': {"id": "emq-checker-example", "src": "/screens/emq-checker-example.webp", "w": 1600, "h": 2058, "route": "/meta-emq-score-estimator/", "name": "Meta EMQ match-key checker", "alt": "The EMQ match-key checker with only IP address, user agent and the Meta Pixel ticked, scoring the signals sent as low and listing which keys to add first."},
  'app-stack-auditor-example': {"id": "app-stack-auditor-example", "src": "/screens/app-stack-auditor-example.webp", "w": 1600, "h": 2765, "route": "/shopify-app-stack-kill-or-keep-auditor/", "name": "App stack kill-or-keep auditor", "alt": "The app stack auditor on its worked example: the apps ticked, their monthly total, and a kill list naming the free replacement for each category."},
  'stocky-risk-example': {"id": "stocky-risk-example", "src": "/screens/stocky-risk-example.webp", "w": 1600, "h": 1913, "route": "/stocky-migration-risk-scorer/", "name": "Stocky migration risk scorer", "alt": "The Stocky migration risk scorer on a mid-sized example store: a score of 42 out of 100, export now as the recommended move, and the reasoning behind it."},
  'app-cost-example': {"id": "app-cost-example", "src": "/screens/app-cost-example.webp", "w": 1600, "h": 850, "route": "/shopify-app-cost-calculator/", "name": "Shopify app cost calculator", "alt": "The app cost calculator on its typical-store preset: 450 a month on marketing apps, 200 on inventory and 150 on tracking across 12 apps, an $800 monthly spend, and $8,160 a year freed if 85% of it is replaced."},
  'agentic-checker-example': {"id": "agentic-checker-example", "src": "/screens/agentic-checker-example.webp", "w": 1600, "h": 1236, "route": "/blog/shopify-agentic-storefronts-setup-guide-2026/#checker", "name": "Agentic Storefronts eligibility checker", "alt": "The Agentic Storefronts eligibility checker for a UK-based store selling to the United States: ChatGPT, Microsoft Copilot and Meta eligible, Google AI Mode and Gemini not eligible because the store must be based in the United States."},
  'attribution-quote-example': {"id": "attribution-quote-example", "src": "/screens/attribution-quote-example.webp", "w": 1600, "h": 1052, "route": "/shopify-attribution-tools-compared/#quote", "name": "attribution tool cost comparison", "alt": "The attribution tool cost comparison at 5,000 orders a month and 4 destinations: Elevar $650 a month on its Advanced plan, Analyzify $145 a month, Northbeam from $1,500 a month, and Triple Whale quote only."},
};
