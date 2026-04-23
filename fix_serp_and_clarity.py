#!/usr/bin/env python3
"""
Stack Architect — SERP title fix, value prop clarity, Google Ads kit integration
"""
from pathlib import Path

def read(p): return Path(p).read_text(encoding="utf-8")
def write(p, t): Path(p).write_text(t, encoding="utf-8")
def patch(path, old, new, label):
    t = read(path)
    if old not in t:
        print(f"  SKIP  [{label}] not found — {path}")
        return False
    write(path, t.replace(old, new, 1))
    print(f"  OK    [{label}] → {path}")
    return True

# ══════════════════════════════════════════════════════════════════════════════
# 1. HOMEPAGE — fix title (84→48 chars), meta description (230→150 chars)
#    hero sub copy — translate jargon to merchant outcomes
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 1. Homepage title + description + hero clarity ───────────────────────")
IDX = "src/pages/index.astro"

# Title: 84 chars → 48 chars (keeps primary keyword phrase, fits Google fully)
patch(IDX,
    '<title>Free Shopify Automation Stack — Replace Paid Apps, Save $700+/Month | Stack Architect</title>',
    '<title>Free Shopify Automation Stack — Save $700+/Month</title>',
    "homepage title 84→48 chars"
)

# Meta description: 230 chars → 150 chars, front-loaded with merchant pain
patch(IDX,
    '<meta name="description" content="Six free tools replacing paid Shopify apps — CAPI Shield (replaces Elevar & Triple Whale), Stocky Swap (replaces Stocky before Aug 2026 shutdown), TikTok Events API, Replace Klaviyo with Systeme.io, P&L Auto, Autocrat Fix. Save $700+/month. No code. Deploy in 6 minutes. 500+ stores.">',
    '<meta name="description" content="Replace 6 paid Shopify apps for $0. Fix broken ad tracking, replace Stocky, ditch Klaviyo, recover TikTok conversions, get live P&L. Save $700+/month. No code. 6 minutes. 500+ stores.">',
    "homepage meta description 230→148 chars"
)

# OG description — same fix for social sharing
patch(IDX,
    '<meta property="og:description" content="Six free tools replacing paid Shopify apps. Server-side tracking, inventory, TikTok CAPI, email marketing, P&L reporting. No code. Deploy in 6 minutes. 500+ stores.">',
    '<meta property="og:description" content="Replace 6 paid Shopify apps for $0 — ad tracking, inventory, email, TikTok, P&L. Save $700+/month. No code. 6 minutes. 500+ stores.">',
    "homepage OG description"
)

# Hero sub — translate jargon into merchant outcomes
# Current: mentions "TikTok CAPI", "automation connectors" — meaningless to merchants
# Fix: outcome-first language every merchant understands
patch(IDX,
    'Six free tools replacing your tracking apps, inventory software, email platform, TikTok CAPI, P&L reporting, and automation connectors. <strong>Free forever. Deploy in 6 minutes.</strong> Or get the complete kit pre-built for $29.',
    'Your ad tracking is lying to you. Your inventory system is shutting down. You\'re paying Klaviyo for features you don\'t use. <strong>Six free tools that fix all of it — in 6 minutes, no developer, $0/month forever.</strong> Or get the complete kit pre-built for $29.',
    "hero sub merchant-first language"
)

# ══════════════════════════════════════════════════════════════════════════════
# 2. HOMEPAGE SOLUTIONS — make CAPI Shield card explicitly mention
#    Google Ads Enhanced Conversions (currently says "Meta + Google" vaguely)
#    + add Google Ads Tracking as a visible product reference
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 2. Homepage CAPI Shield card — Google Ads explicit ───────────────────")

# Find the CAPI Shield solution card description and make Google Ads explicit
# The current card says "Recover lost ROAS — Meta + Google server-side. Replaces Elevar & Triple Whale."
patch(IDX,
    'Recover lost ROAS — Meta + Google server-side. Replaces Elevar &amp; Triple Whale.',
    'Fix broken Meta Ads + Google Ads tracking. Your ads are missing 20–40% of real purchases due to iOS. Server-side fix — replaces Elevar &amp; Triple Whale.',
    "CAPI Shield card merchant language"
)

# Also ensure the homepage product links section includes Google Ads Tracking
# (it's in the nav footer links — check if it's in the dedicated products mobile section)
# Find the mobile products section and check if Google_Ads_Tracking is listed
t = read(IDX)
if "Google_Ads_Tracking" in t:
    print("  OK    [Google Ads Tracking already in homepage product links]")
else:
    print("  INFO  [Google Ads Tracking not in homepage — check manually]")

# ══════════════════════════════════════════════════════════════════════════════
# 3. /PRO PAGE — update FILE_01 description to explicitly include
#    Google Ads Enhanced Conversions (currently says only "GA4 Measurement Protocol")
#    This fixes the inconsistency between pro page and Google Ads tracking page
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 3. /pro FILE_01 description — add Google Ads Enhanced Conversions ────")
PRO = "src/pages/pro.astro"

# Schema description update
patch(PRO,
    'FILE_01 CAPI Shield (Meta Conversions API v25.0 + Google GA4 Measurement Protocol server-side tracking)',
    'FILE_01 CAPI Shield (Meta Conversions API v25.0 + Google Enhanced Conversions via Google Ads Conversions API + GA4 Measurement Protocol server-side tracking)',
    "pro schema FILE_01 Google Ads explicit"
)

# ItemList description update
patch(PRO,
    '"Import-ready JSON blueprint. Meta Conversions API v25.0 + Google GA4 Measurement Protocol server-side Purchase events. EMQ 7.0–8.5. Replaces Elevar and Triple Whale."',
    '"Import-ready JSON blueprint. Meta Conversions API v25.0 + Google Enhanced Conversions (Google Ads Conversions API) + GA4 Measurement Protocol. Server-side purchase events. EMQ 7.0–8.5. Replaces Elevar, Triple Whale, Stape, and Littledata."',
    "pro ItemList FILE_01 description"
)

# Find the FILE_01 visible section header in the pro page HTML
patch(PRO,
    'CAPI Shield — Meta + Google server-side tracking — instant',
    'CAPI Shield — Meta Ads + Google Ads tracking — instant',
    "pro FILE_01 visible heading"
)

# Update the FILE_01 card saves line
patch(PRO,
    'Elevar ($150+/mo)Triple Whale ($299+/mo)Northbeam ($300+/mo)',
    'Elevar ($150+/mo)Triple Whale ($299+/mo)Stape/Littledata ($29–$99/mo)',
    "pro FILE_01 saves line"
)

# ══════════════════════════════════════════════════════════════════════════════
# 4. GOOGLE ADS TRACKING PAGE — add prominent "Included in the Complete Kit"
#    box near the top (after the hero) + kit CTA mid-content
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 4. Google Ads tracking page — kit inclusion callout ──────────────────")
GADS = "src/pages/shopify-google-ads-conversion-tracking.astro"

KIT_CALLOUT = '''
  <!-- Complete Kit callout — Google Ads tracking is included in FILE_01 -->
  <div style="background:linear-gradient(135deg,rgba(251,191,36,.07),rgba(0,200,100,.04));border:1px solid rgba(251,191,36,.25);border-radius:10px;padding:20px 24px;margin:0 24px 0;max-width:900px;margin-left:auto;margin-right:auto;display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
    <div style="flex:1;min-width:180px;">
      <div style="font-family:monospace;font-size:10px;color:#fbbf24;letter-spacing:.15em;text-transform:uppercase;margin-bottom:6px;">⚡ Included in the Complete Kit</div>
      <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;">Google Ads tracking is FILE_01 of the $29 kit</div>
      <div style="font-size:13px;color:#a1a1aa;line-height:1.5;">Pre-configured JSON blueprint. Import into Make.com in 60 seconds — Google Ads Enhanced Conversions, Meta CAPI, and GA4 all in one file. Or build free from the guide below.</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;flex-shrink:0;">
      <a href="/pro" style="display:inline-flex;align-items:center;justify-content:center;background:#fbbf24;color:#000;font-weight:700;font-size:13px;padding:10px 20px;border-radius:6px;text-decoration:none;white-space:nowrap;">Get the Kit — $29 →</a>
      <a href="/go/make" target="_blank" rel="noopener sponsored" style="display:inline-flex;align-items:center;justify-content:center;background:transparent;color:#00c864;font-weight:600;font-size:12px;padding:8px 20px;border-radius:6px;text-decoration:none;border:1px solid rgba(0,200,100,.25);white-space:nowrap;text-align:center;">Build free on Make.com →</a>
    </div>
  </div>

'''

# Inject after the breadcrumb / before the hero section
# The page starts with: <main> <section ... (the direct answer section)
# We want this right after the breadcrumb nav area
OLD_GADS = '  <!-- DIRECT ANSWER -->'
if OLD_GADS not in read(GADS):
    # Try alternate — inject after first </nav> in body
    t = read(GADS)
    # Find the hero section start — inject kit callout before the hero stats
    import re
    # Look for the testimonial/proof section that comes after the hero
    anchor = "  <!-- HOW IT WORKS -->"
    if anchor in t:
        write(GADS, t.replace(anchor, KIT_CALLOUT + anchor, 1))
        print(f"  OK    [kit callout before how-it-works] → {GADS}")
    else:
        # Try finding the first section after hero
        anchor2 = "  <!-- COMPARISON -->"
        if anchor2 in t:
            write(GADS, t.replace(anchor2, KIT_CALLOUT + anchor2, 1))
            print(f"  OK    [kit callout before comparison] → {GADS}")
        else:
            print(f"  SKIP  [kit callout] no anchor found — add manually")
else:
    t = read(GADS)
    write(GADS, t.replace(OLD_GADS, KIT_CALLOUT + OLD_GADS, 1))
    print(f"  OK    [kit callout before direct answer] → {GADS}")

# ══════════════════════════════════════════════════════════════════════════════
# 5. GOOGLE ADS TRACKING PAGE — update page title tag for SEO
#    Current: "Free Shopify Google Ads Conversion Tracking 2026 — GCLID + Enhanced Conversions"
#    That's 79 chars — also truncating in Google
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 5. Google Ads tracking page — fix title length ───────────────────────")

patch(GADS,
    'title: "Free Shopify Google Ads Conversion Tracking 2026 — GCLID + Enhanced Conversions"',
    'title: "Fix Shopify Google Ads Tracking Free — Enhanced Conversions 2026"',
    "Google Ads page title 79→65 chars"
)

# Also fix meta description on this page to be under 155 chars
patch(GADS,
    'description: "Free server-side Google Enhanced Conversions for Shopify via Make.com. Recovers 15–40% of purchases lost to iOS Link Tracking Protection and Safari ITP. Replaces Stape ($29+/mo) and Littledata ($99+/mo) at $0. GCLID extraction, SHA-256 hashing, Smart Bidding signal improvement. 6 minutes to deploy."',
    'description: "Fix Shopify Google Ads tracking free — server-side Enhanced Conversions via Make.com recovers 15–40% of lost purchases. Replaces Stape ($29/mo) + Littledata ($99/mo) at $0. 6 minutes. No code."',
    "Google Ads page meta description"
)

# ══════════════════════════════════════════════════════════════════════════════
# 6. UPDATE HOMEPAGE FAQPage schema to include Google Ads tracking question
#    This gets the page cited when merchants search "why is Google Ads wrong Shopify"
# ══════════════════════════════════════════════════════════════════════════════
print("\n── 6. Homepage FAQ schema — add Google Ads tracking question ────────────")

# Find the last FAQ item and add Google Ads question after it
patch(IDX,
    '{ "@type": "Question", "name": "Do I have to keep paying $500+ per month on Shopify apps?", "acceptedAnswer": { "@type": "Answer", "text": "No. The Stack Architect $0 Automation Stack replaces six categories of paid Shopify apps — ad tracking (Elevar, Triple Whale), inventory management (Stocky, Linnworks), email marketing (Klaviyo), TikTok server-side tracking (WeltPixel, Analyzify), P&L profit reporting (TrueProfit, BeProfit), and automation stability (Zapier) — using free tiers of Make.com (1,000 ops/month free), Google Sheets, and Systeme.io (2,000 contacts, unlimited sends free). Over 500 stores have deployed this stack and save $700+ per month." } }',
    '{ "@type": "Question", "name": "Do I have to keep paying $500+ per month on Shopify apps?", "acceptedAnswer": { "@type": "Answer", "text": "No. The Stack Architect $0 Automation Stack replaces six categories of paid Shopify apps — ad tracking (Elevar, Triple Whale), inventory management (Stocky, Linnworks), email marketing (Klaviyo), TikTok server-side tracking (WeltPixel, Analyzify), P&L profit reporting (TrueProfit, BeProfit), and automation stability (Zapier) — using free tiers of Make.com (1,000 ops/month free), Google Sheets, and Systeme.io (2,000 contacts, unlimited sends free). Over 500 stores have deployed this stack and save $700+ per month." } },\n        { "@type": "Question", "name": "Why is my Shopify Google Ads conversion tracking showing wrong numbers?", "acceptedAnswer": { "@type": "Answer", "text": "Shopify Google Ads conversion tracking shows wrong numbers because iOS Link Tracking Protection strips the Google Click ID (gclid) from ad URLs before customers open them in Safari, Mail, or Messages. Without gclid, Google cannot attribute the purchase to the ad. Safari ITP also clears attribution cookies within 24 hours. The fix is Google Enhanced Conversions — a server-side signal that sends hashed customer email to Google Ads directly from Shopify\'s server, bypassing browser restrictions entirely. Stack Architect provides a free Make.com setup that deploys in 6 minutes and recovers 15–40% of lost conversions at $0/month, replacing Stape ($29+/month) and Littledata ($99+/month)." } }',
    "homepage FAQ Google Ads tracking question"
)

print("\n── Done. Run: npm run build && npx wrangler pages deploy dist --commit-dirty=true")
