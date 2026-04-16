import os, re, sys

BLOG_DIR = "src/content/blog"

BLOG_TITLES = {
    "free-klaviyo-alternative-shopify-2026.md": "The Only Truly Free Klaviyo Alternative for Shopify 2026",
    "how-much-shopify-apps-really-cost-and-how-to-cut-your-app-bill-in-half.md": "How Much Shopify Apps Really Cost 2026 — Cut Your Bill",
    "how-to-fix-service-invoked-too-many-times-in-google-apps-script.md": "Fix 'Service Invoked Too Many Times' in Google Apps Script",
    "how-to-fix-shopify-conversion-tracking-after-ios-updates.md": "Fix Shopify Conversion Tracking After iOS Updates 2026",
    "how-to-fix-shopify-google-ads-conversion-tracking-2026.md": "Fix Shopify Google Ads Conversion Tracking 2026 — Free",
    "klaviyo-vs-getresponse-shopify-2026.md": "Klaviyo vs GetResponse for Shopify 2026 — Cost Comparison",
    "make-com-shopify-automation-guide.md": "Make.com for Shopify: Free Automation Guide 2026",
    "recover-lost-shopify-conversions-capi-shield.md": "Recover Lost Shopify Conversions with CAPI Shield 2026 — Free",
    "scalable-google-sheets-automation-for-high-volume-workflows.md": "Scalable Google Sheets Automation for Shopify 2026",
    "shopify-ai-playbook-2026.md": "The Complete Shopify AI Playbook 2026",
    "shopify-apps-that-are-a-waste-of-money.md": "Shopify Apps That Are a Waste of Money 2026",
    "shopify-automation-stack-for-small-stores.md": "Shopify Automation Stack for Small Stores 2026 — $0",
    "shopify-google-analytics-4-setup-free-2026.md": "Set Up Google Analytics 4 on Shopify Free 2026 — No Code",
    "shopify-stocky-data-export-before-shutdown.md": "Shopify Stocky Data Export — Save Before Aug 2026 Shutdown",
    "the-complete-guide-to-reliable-shopify-automations.md": "Reliable Shopify Automations 2026 — Architecture Guide",
    "the-lean-shopify-tech-stack-2026.md": "The Lean Shopify Tech Stack 2026 — Replace $700/Mo Free",
    "the-ultimate-guide-to-shopify-inventory-management.md": "Shopify Inventory Management 2026 — Free Systems That Scale",
    "tidio-for-shopify-complete-setup-guide.md": "Tidio for Shopify: Free AI Live Chat Setup Guide 2026",
    "tidio-vs-gorgias-shopify.md": "Tidio vs Gorgias for Shopify 2026 — Which Is Worth It?",
    "when-to-upgrade-free-make-google-workspace.md": "When to Upgrade Free Make.com to Google Workspace — Shopify",
    "zapier-vs-shopify-flow-vs-make.md": "Zapier vs Make vs Shopify Flow 2026 — Honest Comparison",
}

PAGE_TITLES = {
    "src/pages/index.astro": (
        "Free Shopify Automation Stack — Replace Paid Apps, Save $700+/Month | Stack Architect",
        "Free Shopify Automation Stack — Save $700+/Month"),
    "src/pages/best-ai-tools-shopify.astro": (
        "Best AI Tools for Shopify 2026 — 12 Tools Ranked by ROI (Free First)",
        "Best AI Tools for Shopify 2026 — 12 Tools Ranked by ROI"),
    "src/pages/shopify-profit-loss-automation.astro": (
        "Shopify P&amp;L Automation Free (2026) — Live Profit and Loss in Google Sheets | Stack Architect",
        "Shopify P&amp;L Automation Free 2026 — Live in Google Sheets"),
}

apply = "--apply" in sys.argv
pending = []
errors = []

print("=" * 65)
print("TITLE TAG UPDATE — PREVIEW" if not apply else "TITLE TAG UPDATE — APPLYING")
print("=" * 65)
print()

print("BLOG POSTS")
print("-" * 65)
for filename, new_title in sorted(BLOG_TITLES.items()):
    path = os.path.join(BLOG_DIR, filename)
    if not os.path.exists(path):
        errors.append(f"MISSING: {path}")
        continue
    with open(path) as f:
        content = f.read()
    m = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
    if not m:
        errors.append(f"NO TITLE FIELD: {path}")
        continue
    old = m.group(1).strip('"\'')
    if old == new_title:
        print(f"  SKIP (already correct): {filename}")
        continue
    new_content = content.replace(m.group(0), f'title: "{new_title}"', 1)
    print(f"  {filename}")
    print(f"    WAS ({len(old)}c): {old}")
    print(f"    NOW ({len(new_title)}c): {new_title}")
    print()
    pending.append((path, new_content))

print()
print("STANDALONE PAGES")
print("-" * 65)
for path, (old, new) in PAGE_TITLES.items():
    if not os.path.exists(path):
        errors.append(f"MISSING: {path}")
        continue
    with open(path) as f:
        content = f.read()
    if old not in content:
        errors.append(f"TITLE NOT FOUND IN: {path}")
        continue
    new_content = content.replace(old, new, 1)
    print(f"  {path}")
    print(f"    WAS ({len(old.replace('&amp;','&'))}c): {old.replace('&amp;','&')}")
    print(f"    NOW ({len(new.replace('&amp;','&'))}c): {new.replace('&amp;','&')}")
    print()
    pending.append((path, new_content))

if errors:
    print()
    print("WARNINGS")
    for e in errors:
        print(f"  {e}")

print()
print("=" * 65)
print(f"Total changes: {len(pending)}")
if not apply:
    print()
    print("Run with --apply to write changes:")
    print("  python3 update_titles.py --apply")
else:
    for path, new_content in pending:
        with open(path, "w") as f:
            f.write(new_content)
        print(f"  WRITTEN: {path}")
    print()
    print("All done. Now run:")
    print("  git add -A && git commit -m 'seo: trim title tags to under 60 chars' && git push")
print("=" * 65)
