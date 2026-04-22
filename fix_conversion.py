#!/usr/bin/env python3
"""
Stack Architect — Conversion + Affiliate CTA hardening
Fixes: hero CTA hierarchy, scanner kit upsell, 11 zero-revenue blog posts.
"""
import re
from pathlib import Path

def read(p): return Path(p).read_text(encoding="utf-8")
def write(p, t): Path(p).write_text(t, encoding="utf-8")
def patch(path, old, new, label):
    t = read(path)
    if old not in t:
        print(f"  SKIP  [{label}] anchor not found — {path}")
        return False
    write(path, t.replace(old, new, 1))
    print(f"  OK    [{label}] → {path}")
    return True

# ══════════════════════════════════════════════════════════════════════════════
# 1. HERO CTA HIERARCHY FIX — index.astro
#    BEFORE: [Calculate Savings (outline)] [Replace Free (green)]
#    AFTER:  [Get the Kit — $29 (gold/primary)] [Start Free (green)] 
#            + "or calculate my savings first ↓" as text below
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 1. Hero CTA hierarchy ────────────────────────────────────────────────")
IDX = "src/pages/index.astro"
t = read(IDX)

# Find the hero-ctas block using regex — handles any whitespace variation
hero_pattern = re.compile(
    r'(<div class="hero-ctas">)\s*'
    r'<a href="#sa-scanner"[^>]*class="btn-outline"[^>]*>.*?</a>\s*'
    r'(<a href="https://www\.make\.com/en/register[^"]*"[^>]*class="btn pulse"[^>]*>)(.*?)(</a>)',
    re.DOTALL
)

HERO_REPLACEMENT = r'''\1
    <a href="/pro" class="btn-pro">Get the Complete Kit — $29 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
    \2class="btn pulse"\4Start Free on Make.com <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>\4'''

new_t, count = hero_pattern.subn(
    lambda m: (
        f'{m.group(1)}\n'
        f'    <a href="/pro" class="btn-pro">Get the Complete Kit — $29 '
        f'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>\n'
        f'    {m.group(2)}{m.group(3)}{m.group(4)}'
    ),
    t
)

if count:
    write(IDX, new_t)
    print(f"  OK    [hero kit CTA added as primary] → {IDX}")
else:
    print(f"  SKIP  [hero] regex did not match — check manually")

# Fix the hero-cta-note to add "or calculate savings" text link
patch(IDX,
    'Powered by <a href="https://www.make.com/en/register?pc=techie123" target="_blank" rel="noopener sponsored">Make.com</a> + <a href="/go/systeme" target="_blank" rel="noopener sponsored">Systeme.io</a> — both free. Most stores never pay a penny.',
    'Or <a href="#sa-scanner" onclick="event.preventDefault();document.getElementById(\'sa-scanner\').scrollIntoView({behavior:\'smooth\'})">calculate your exact savings first ↓</a> · Powered by <a href="https://www.make.com/en/register?pc=techie123" target="_blank" rel="noopener sponsored">Make.com</a> + <a href="/go/systeme" target="_blank" rel="noopener sponsored">Systeme.io</a> — free forever.',
    "hero-cta-note calculate link"
)

# ══════════════════════════════════════════════════════════════════════════════
# 2. SCANNER — add $29 kit CTA after results, before email form
#    Highest-intent moment: user just saw "You're losing $650/mo"
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 2. Scanner kit upsell ────────────────────────────────────────────────")
SCANNER = "src/components/DiagnosticScanner.astro"

patch(SCANNER,
    '<div class="border border-[#4ade80]/20 bg-[#4ade80]/5 p-4">',
    '''<a href="/pro" class="block w-full text-center bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm py-4 px-4 mb-4 transition-colors">
      ⚡ Skip the build — get all 4 automations pre-built for $29 →
    </a>
    <p class="text-xs text-center text-gray-500 mb-5">One-time · instant access · no subscription · or use the free guides below</p>
    <div class="border border-[#4ade80]/20 bg-[#4ade80]/5 p-4">''',
    "scanner kit CTA before email form"
)

# ══════════════════════════════════════════════════════════════════════════════
# 3. BLOG POSTS — add affiliate CTAs to 11 zero-revenue posts
#    Each post gets a contextually appropriate CTA appended
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 3. Blog post affiliate CTAs ──────────────────────────────────────────")

# CTA blocks — markdown format, appended to end of post
MAKE_CTA = """
---

## The Fastest Free Fix

Everything above runs on [Make.com's free plan](https://www.make.com/en/register?pc=techie123) — 1,000 operations/month, webhooks included, no credit card required. It's the automation engine behind every Stack Architect tool.

**[Start free on Make.com →](https://www.make.com/en/register?pc=techie123)**

Want it pre-built? The [Complete Kit ($29)](/pro) gives you ready-to-import JSON blueprints for CAPI Shield, TikTok CAPI, Stocky Swap, and P&L Auto — live in 10 minutes instead of hours.
"""

KIT_AND_MAKE_CTA = """
---

## Deploy in 10 Minutes, Not 8 Hours

Every fix above is available as a ready-to-import Make.com JSON blueprint in the [Complete Kit ($29)](/pro). Four scenarios pre-configured — CAPI Shield, TikTok CAPI, Stocky Swap, P&L Auto. Import, connect your Shopify webhook, done.

**[Get the Complete Kit — $29 →](/pro)**

Prefer to build it yourself? [Start free on Make.com →](https://www.make.com/en/register?pc=techie123) and follow the free setup guides.
"""

STOCKY_CTA = """
---

## Replace Stocky Before August 31 — Free

[Stocky Swap](/stocky-swap) logs every Shopify order to Google Sheets in real time — stock levels, SKU, fulfilment status, full order history. Deploys in 4 minutes via Make.com. Free forever.

**[Deploy Stocky Swap Free →](/stocky-swap)**

Need it faster? The [Complete Kit ($29)](/pro) includes the pre-built Stocky Swap JSON — import in 60 seconds, live before your next order.
"""

TIDIO_CTA = """
---

## Start Free on Tidio

[Tidio's free plan](https://affiliate.tidio.com/5kfhrx3ot6tf) covers most Shopify stores — live chat, Lyro AI (resolves ~70% of queries automatically), and basic helpdesk. No credit card required.

**[Try Tidio Free →](https://affiliate.tidio.com/5kfhrx3ot6tf)**
"""

GORGIAS_CTA = """
---

## Try Both Free

[Tidio's free plan](https://affiliate.tidio.com/5kfhrx3ot6tf) handles most stores well. If you need Shopify-native order editing from the helpdesk, [Gorgias](https://partner.gorgias.com/xclmfdgeizdk) offers a free trial.

**[Try Tidio Free →](https://affiliate.tidio.com/5kfhrx3ot6tf)** · **[Try Gorgias →](https://partner.gorgias.com/xclmfdgeizdk)**
"""

MAKE_WORKSPACE_CTA = """
---

## The Right Tools at the Right Time

When you're ready to scale past the free tier: [Make.com Core ($9/mo)](https://www.make.com/en/register?pc=techie123) gives 10,000 operations/month. [Google Workspace ($7.20/mo)](https://referworkspace.app.goo.gl/sy2C) removes Gmail API limits that silently kill automations at high order volumes.

**[Start free on Make.com →](https://www.make.com/en/register?pc=techie123)** · **[Activate Google Workspace →](https://referworkspace.app.goo.gl/sy2C)**
"""

BFCM_CTA = """
---

## Enter BFCM With Everything Pre-Built

The [Complete Kit ($29)](/pro) gives you all four Make.com blueprints — CAPI Shield, TikTok CAPI, Stocky Swap, P&L Auto — ready to import now. Don't build from scratch under BFCM pressure.

**[Get the Complete Kit — $29 →](/pro)** · **[Start free on Make.com →](https://www.make.com/en/register?pc=techie123)**
"""

# Map: filename → CTA to append
BLOG_CTAS = {
    "how-to-fix-service-invoked-too-many-times-in-google-apps-script.md": MAKE_CTA,
    "how-to-fix-shopify-conversion-tracking-after-ios-updates.md": KIT_AND_MAKE_CTA,
    "scalable-google-sheets-automation-for-high-volume-workflows.md": MAKE_WORKSPACE_CTA,
    "shopify-bfcm-automation-checklist-2026.md": BFCM_CTA,
    "shopify-meta-roas-dropped-2026-fix.md": KIT_AND_MAKE_CTA,
    "shopify-stocky-data-export-before-shutdown.md": STOCKY_CTA,
    "the-complete-guide-to-reliable-shopify-automations.md": MAKE_CTA,
    "tidio-for-shopify-complete-setup-guide.md": TIDIO_CTA,
    "tidio-vs-gorgias-shopify.md": GORGIAS_CTA,
    "when-to-upgrade-free-make-google-workspace.md": MAKE_WORKSPACE_CTA,
    "zapier-vs-shopify-flow-vs-make.md": MAKE_CTA,
}

for filename, cta in BLOG_CTAS.items():
    fpath = f"src/content/blog/{filename}"
    p = Path(fpath)
    if not p.exists():
        print(f"  MISS  {fpath}")
        continue
    text = p.read_text(encoding="utf-8")
    # Check if CTA already appended
    if "make.com/en/register" in text or "go/make" in text or "go/systeme" in text or "/pro)" in text or "tidio.com" in text:
        print(f"  SKIP  [CTA already present] {filename}")
        continue
    p.write_text(text + cta, encoding="utf-8")
    print(f"  OK    [{cta.split(chr(10))[2].strip()[:50]}] → {filename}")

# ══════════════════════════════════════════════════════════════════════════════
# 4. AFFILIATE LINK AUDIT — list all affiliate links found across the site
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 4. Affiliate link inventory ──────────────────────────────────────────")
import subprocess, collections

AFFILIATE_PATTERNS = {
    "Make.com": "make.com/en/register?pc=techie123",
    "Systeme.io": "go/systeme",
    "GetResponse": "getresponsetoday.com",
    "Beehiiv": "beehiiv.com?via=gym-extras",
    "Tidio": "affiliate.tidio.com",
    "Gorgias": "partner.gorgias.com",
    "Google Workspace": "referworkspace.app.goo.gl",
}

src_files = list(Path("src").rglob("*.astro")) + list(Path("src").rglob("*.md"))
counts = collections.defaultdict(int)
for f in src_files:
    try:
        text = f.read_text(encoding="utf-8")
    except:
        continue
    for name, pattern in AFFILIATE_PATTERNS.items():
        if pattern in text:
            counts[name] += 1

print(f"\n  {'Affiliate':<20} {'Pages using it':>15}")
print(f"  {'─'*20} {'─'*15}")
for name, pattern in AFFILIATE_PATTERNS.items():
    c = counts[name]
    status = "✓" if c > 3 else ("⚠ low" if c > 0 else "✗ missing")
    print(f"  {name:<20} {c:>8} pages  {status}")

print("\n── Done. Run: npm run build && npx wrangler pages deploy dist --commit-dirty=true")
