#!/usr/bin/env python3
"""
Injects a standalone Person schema block before </head> on every page
that lacks it. Separate script tag = safe on all formatting patterns.
"""
from pathlib import Path

PERSON_BLOCK = """  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","@id":"https://stackarchitect.xyz/#luke","name":"Luke","jobTitle":"Shopify Automation Specialist","url":"https://stackarchitect.xyz/about","sameAs":["https://www.linkedin.com/in/stack-architect-6766733b0"],"worksFor":{"@type":"Organization","@id":"https://stackarchitect.xyz/#org"},"knowsAbout":["Shopify automation","server-side tracking","Meta Conversions API","Google Enhanced Conversions","TikTok Events API","Make.com","Google Sheets automation","Shopify app cost reduction","email marketing automation","Shopify inventory management","Shopify CAPI","Elevar alternative","Triple Whale alternative","Analyzify alternative","Northbeam alternative","Klaviyo alternative","Stocky alternative"]}</script>"""

TARGETS = [
    # Standalone pages (own <head>)
    "src/pages/index.astro",
    "src/pages/pro.astro",
    "src/pages/elevar-alternative.astro",
    "src/pages/elevar-pricing.astro",
    "src/pages/northbeam-alternative.astro",
    "src/pages/northbeam-pricing.astro",
    "src/pages/triple-whale-alternative.astro",
    "src/pages/stocky-alternative.astro",
    "src/pages/stocky-shutdown.astro",
    "src/pages/stocky-swap.astro",
    "src/pages/capi-shield.astro",
    "src/pages/tiktok-events-api-shopify.astro",
    "src/pages/replace-klaviyo-free.astro",
    "src/pages/klaviyo-vs-systeme-io.astro",
    "src/pages/best-ai-tools-shopify.astro",
    "src/pages/best-free-shopify-apps-2026.astro",
    "src/pages/ultimate-shopify-automation-guide.astro",
    "src/pages/shopify-automation-guides.astro",
    "src/pages/shopify-google-ads-conversion-tracking.astro",
    "src/pages/analyzify-alternative.astro",
    "src/pages/analyzify-pricing.astro",
    "src/pages/autocrat-quota-fix.astro",
    "src/pages/shopify-profit-loss-automation.astro",
    "src/pages/shopify-automation-scanner.astro",
    "src/pages/shopify-app-cost-calculator.astro",
    "src/pages/shopify-app-stack-kill-or-keep-auditor.astro",
    "src/pages/tools.astro",
    "src/pages/stack.astro",
    "src/pages/about.astro",
    # FAQ pages
    "src/pages/faq/index.astro",
    "src/pages/faq/is-klaviyo-free.astro",
    "src/pages/faq/what-is-server-side-tracking-for-shopify.astro",
    "src/pages/faq/what-is-the-shopify-capi.astro",
    "src/pages/faq/what-is-google-enhanced-conversions.astro",
    "src/pages/faq/what-is-make-com.astro",
    "src/pages/faq/how-much-does-triple-whale-cost.astro",
    "src/pages/faq/does-make-com-work-with-shopify.astro",
    "src/pages/faq/what-replaces-stocky-after-august-2026.astro",
    "src/pages/faq/how-do-i-set-up-tiktok-events-api-on-shopify-without-code.astro",
]

ok = skip_present = skip_nohead = missing = 0

for fpath in TARGETS:
    p = Path(fpath)
    if not p.exists():
        print(f"  MISS  {fpath}")
        missing += 1
        continue
    text = p.read_text(encoding="utf-8")
    # Already injected (either by this script or previously)
    if '"#luke"' in text or "'#luke'" in text:
        print(f"  SKIP  [already has Person] {fpath}")
        skip_present += 1
        continue
    # Find </head> — works whether standalone or using Base layout
    if "</head>" not in text:
        print(f"  SKIP  [no </head>] {fpath}")
        skip_nohead += 1
        continue
    # Inject immediately before the FIRST </head>
    new_text = text.replace("</head>", PERSON_BLOCK + "\n  </head>", 1)
    p.write_text(new_text, encoding="utf-8")
    print(f"  OK    {fpath}")
    ok += 1

print(f"\n── Summary ─────────────────────────────────────────────────────────────")
print(f"  Injected : {ok}")
print(f"  Already present : {skip_present}")
print(f"  No </head> (uses Base layout — covered by Base.astro) : {skip_nohead}")
print(f"  File not found : {missing}")
