#!/usr/bin/env python3
"""
Stack Architect — Affiliate normalisation + scanner form fix
1. Fix broken scanner Systeme form → Beehiiv (matches homepage behaviour)
2. Normalise all raw affiliate URLs → /go/ redirects in blog + pages
3. Verify all /go/ redirects are in _redirects
"""
from pathlib import Path
import re

def read(p): return Path(p).read_text(encoding="utf-8")
def write(p, t): Path(p).write_text(t, encoding="utf-8")
def patch(path, old, new, label):
    t = read(path)
    if old not in t:
        print(f"  SKIP  [{label}] — not found in {path}")
        return 0
    count = t.count(old)
    write(path, t.replace(old, new))
    print(f"  OK    [{label}] {count}× replaced → {path}")
    return count

# ══════════════════════════════════════════════════════════════════════════════
# 1. FIX SCANNER — replace broken Systeme form with Beehiiv (matches homepage)
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 1. Fix scanner form (Beehiiv) ────────────────────────────────────────")
SCANNER = "src/components/DiagnosticScanner.astro"

OLD_FORM = '''<div class="text-xs text-[#4ade80] uppercase tracking-wide font-bold mb-2">
        GET YOUR FREE REPLACEMENT PLAN
      </div>
      <p class="text-xs text-gray-400 mb-4">
        Enter your email to receive a personalised zero-cost stack guide.
      </p>
      <!-- Systeme.io embed form — replace action URL with your actual Systeme.io form action -->
      <form
        action="https://systeme.io/api/forms/YOUR_FORM_ID/submit"
        method="POST"
        class="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          required
          class="flex-1 bg-black border border-[#1f1f1f] text-white text-sm px-3 py-2 font-mono focus:border-[#4ade80] focus:outline-none"
        />
        <button
          type="submit"
          class="bg-[#4ade80] text-black font-bold text-xs px-4 py-2 uppercase tracking-wide hover:bg-[#22c55e] transition-colors whitespace-nowrap"
        >
          SEND MY PLAN →
        </button>
      </form>'''

NEW_FORM = '''<div class="text-xs text-[#4ade80] uppercase tracking-wide font-bold mb-2">
        GET YOUR FREE DEPLOYMENT GUIDE
      </div>
      <p class="text-xs text-gray-400 mb-3">
        Free weekly Shopify automation tips. Unsubscribe anytime.
      </p>
      <div class="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          id="scanner-email"
          placeholder="your@email.com"
          class="flex-1 bg-black border border-[#1f1f1f] text-white text-sm px-3 py-2 font-mono focus:border-[#4ade80] focus:outline-none"
        />
        <button
          id="scanner-subscribe-btn"
          class="bg-[#4ade80] text-black font-bold text-xs px-4 py-2 uppercase tracking-wide hover:bg-[#22c55e] transition-colors whitespace-nowrap"
        >
          GET FREE GUIDE →
        </button>
      </div>
      <p class="text-xs text-gray-600 mt-2">Powered by Beehiiv · No spam</p>'''

patch(SCANNER, OLD_FORM, NEW_FORM, "scanner broken form → Beehiiv input")

# Add Beehiiv JS handler after the reset button script area
OLD_RESET = '''document.getElementById('reset-btn')?.addEventListener('click', () => {'''
NEW_RESET = '''document.getElementById('scanner-subscribe-btn')?.addEventListener('click', () => {
    const emailInput = document.getElementById('scanner-email') as HTMLInputElement;
    const email = emailInput?.value?.trim();
    if (!email || !email.includes('@')) {
      emailInput.style.borderColor = '#ef4444';
      emailInput.placeholder = 'Enter a valid email';
      return;
    }
    emailInput.style.borderColor = '#4ade80';
    window.open('https://stackarchitect.beehiiv.com/subscribe?email=' + encodeURIComponent(email), '_blank');
    emailInput.value = '';
    const btn = document.getElementById('scanner-subscribe-btn');
    if (btn) { btn.textContent = 'CHECK YOUR INBOX ✓'; btn.style.background = '#22c55e'; }
  });

  document.getElementById('reset-btn')?.addEventListener('click', () => {'''

patch(SCANNER, OLD_RESET, NEW_RESET, "scanner Beehiiv JS handler")

# ══════════════════════════════════════════════════════════════════════════════
# 2. NORMALISE RAW AFFILIATE URLS → /go/ redirects
#    Scope: src/content/blog/*.md and src/pages/*.astro
#    Keeps direct URLs in _redirects and Base.astro intact (source of truth)
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 2. Normalise affiliate URLs → /go/ paths ─────────────────────────────")

# Map: raw URL fragment → /go/ path
# IMPORTANT: systeme URL has two forms — handle both
REPLACEMENTS = [
    # Systeme — raw affiliate URL → /go/systeme
    ("https://systeme.io/?sa=sa0262937272be99703a8ea16153f5dd5ae2a3eea7", "/go/systeme"),
    # Make.com — direct register URL → /go/make  
    ("https://www.make.com/en/register?pc=techie123", "/go/make"),
    # Tidio
    ("https://affiliate.tidio.com/5kfhrx3ot6tf", "/go/tidio"),
    # Gorgias
    ("https://partner.gorgias.com/xclmfdgeizdk", "/go/gorgias"),
    # Google Workspace
    ("https://referworkspace.app.goo.gl/sy2C", "/go/workspace"),
    # GetResponse
    ("https://try.getresponsetoday.com/gejtf3pvvf1u", "/go/getresponse"),
    # Beehiiv affiliate
    ("https://www.beehiiv.com?via=gym-extras", "/go/beehiiv"),
]

# Files to normalise — blog posts and standalone pages
# EXCLUDE: _redirects (source of truth), Base.astro (has preconnect hints), index.astro hero area
NORMALISE_FILES = (
    list(Path("src/content/blog").glob("*.md")) +
    list(Path("src/pages/faq").glob("*.astro")) +
    [
        Path("src/pages/analyzify-alternative.astro"),
        Path("src/pages/elevar-alternative.astro"),
        Path("src/pages/northbeam-alternative.astro"),
        Path("src/pages/triple-whale-alternative.astro"),
        Path("src/pages/stocky-alternative.astro"),
        Path("src/pages/stocky-swap.astro"),
        Path("src/pages/capi-shield.astro"),
        Path("src/pages/tiktok-events-api-shopify.astro"),
        Path("src/pages/replace-klaviyo-free.astro"),
        Path("src/pages/klaviyo-vs-systeme-io.astro"),
        Path("src/pages/shopify-profit-loss-automation.astro"),
        Path("src/pages/autocrat-quota-fix.astro"),
        Path("src/pages/best-ai-tools-shopify.astro"),
        Path("src/pages/shopify-google-ads-conversion-tracking.astro"),
        Path("src/pages/best-free-shopify-apps-2026.astro"),
        Path("src/pages/ultimate-shopify-automation-guide.astro"),
        Path("src/layouts/BlogPost.astro"),
    ]
)

total_replacements = 0
for fpath in NORMALISE_FILES:
    if not fpath.exists():
        continue
    text = read(str(fpath))
    original = text
    for raw_url, go_path in REPLACEMENTS:
        if raw_url in text:
            count = text.count(raw_url)
            text = text.replace(raw_url, go_path)
            print(f"  OK    {count}× {raw_url[:45]}… → {go_path} in {fpath.name}")
            total_replacements += count
    if text != original:
        write(str(fpath), text)

if total_replacements == 0:
    print("  INFO  All affiliate URLs already normalised — no changes needed")
else:
    print(f"\n  Total replacements: {total_replacements}")

# ══════════════════════════════════════════════════════════════════════════════
# 3. VERIFY all /go/ redirects exist in _redirects
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 3. Verify /go/ redirects in public/_redirects ────────────────────────")
REDIRECTS = Path("public/_redirects")
redirects_text = read(str(REDIRECTS))

REQUIRED = {
    "/go/systeme":    "https://systeme.io/?sa=sa0262937272be99703a8ea16153f5dd5ae2a3eea7",
    "/go/make":       "https://www.make.com/en/register?pc=techie123",
    "/go/tidio":      "https://affiliate.tidio.com/5kfhrx3ot6tf",
    "/go/gorgias":    "https://partner.gorgias.com/xclmfdgeizdk",
    "/go/workspace":  "https://referworkspace.app.goo.gl/sy2C",
    "/go/getresponse":"https://try.getresponsetoday.com/gejtf3pvvf1u",
    "/go/beehiiv":    "https://www.beehiiv.com?via=gym-extras",
}

missing = []
for path, url in REQUIRED.items():
    if path in redirects_text:
        print(f"  ✓     {path} → confirmed")
    else:
        print(f"  ✗     {path} MISSING — adding now")
        missing.append(f"{path}      {url}   302")

if missing:
    with open(str(REDIRECTS), "a") as f:
        f.write("\n" + "\n".join(missing) + "\n")
    print(f"  OK    Added {len(missing)} missing redirect(s)")

# ══════════════════════════════════════════════════════════════════════════════
# 4. FINAL AFFILIATE AUDIT — count /go/ usage across all src files
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 4. Final /go/ affiliate usage audit ──────────────────────────────────")
all_src = list(Path("src").rglob("*.astro")) + list(Path("src").rglob("*.md"))
go_counts = {}
for go_path in [r[1] for r in REPLACEMENTS]:
    count = sum(1 for f in all_src if go_path in read(str(f)))
    go_counts[go_path] = count

print(f"\n  {'Redirect':<20} {'Files':>8}  {'Status'}")
print(f"  {'─'*20} {'─'*8}  {'─'*10}")
for go_path, count in sorted(go_counts.items(), key=lambda x: -x[1]):
    status = "✓ strong" if count >= 8 else ("⚠ low" if count >= 2 else "✗ needs work")
    print(f"  {go_path:<20} {count:>8}  {status}")

print("\n── Done. Now run: npm run build && npx wrangler pages deploy dist --commit-dirty=true")
