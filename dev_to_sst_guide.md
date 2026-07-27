---
title: Recover 20–40% of invisible<br>Shopify conversions — free
published: false
canonical_url: https://stackarchitect.xyz/blog/shopify-server-side-tracking-complete-setup-guide/
tags: shopify, webhooks, analytics, webdev
---

[Home](https://stackarchitect.xyz/)
&rsaquo;
[Guides](https://stackarchitect.xyz/shopify-automation-guides/)
&rsaquo;
Shopify Server-Side Tracking: Free Setup Guide 2026



Free Setup &middot; No Code &middot; Under 20 Minutes &middot; Meta + Google + TikTok


&#10003; UPDATED JULY 2026 — VERIFIED FREE TIER &middot; iOS 26


# Recover 20–40% of invisible<br>Shopify conversions — free

Your Shopify dashboard shows 68 orders. Meta shows 41. Google Ads shows 29. TikTok shows 18. **The gap is real revenue your ad algorithms are optimising blind on.** This guide fixes it free in under 20 minutes using Make.com — no code, no app, no agency.


- Meta CAPI
- Google Enhanced Conversions
- TikTok Events API



- **20–40%** Conversions recovered

- **17.8%** Lower CPA w/ CAPI (Meta, '26)

- **$0** Cost vs $225+/mo Elevar

- **18 min** Setup time




[Start Free on Make.com &rarr;](https://stackarchitect.xyz/go/make)
[Jump to Setup](#setup)






TL;DR — 6 Key Points


01Server-side tracking sends purchase events from Shopify's backend directly to Meta, Google and TikTok — bypassing browsers, ad blockers and iOS ATT.

02iOS App Tracking Transparency and Safari ITP now block 30–40% of browser pixel events. Server-side is the only reliable fix.

03The Make.com webhook method costs $0/month. Elevar charges from $225/month for the same result. Triple Whale uses GMV-based pricing that scales with store revenue.

04Full three-platform build takes ~18 minutes: one Shopify webhook, three Make.com HTTP modules, zero code. No developer needed.

05Always run browser pixel AND server events simultaneously. Use matching event_id values for deduplication so you count one purchase, not two.

06TikTok requires **CompletePayment** not "Purchase". Include hashed email, phone, IP and user agent to achieve Event Match Quality score 8+.





**IOS IMPACT:** [What iOS 14–18 actually broke in your Shopify tracking — step-by-step diagnostic and the exact settings to restore attribution.](https://stackarchitect.xyz/blog/how-to-fix-shopify-conversion-tracking-after-ios-updates/)



Contents

- [Direct answer (60 seconds)](#direct-answer)
- [What is server-side tracking?](#what-is)
- [Why it matters in 2026](#why-2026)
- [2020–2026 privacy timeline](#privacy-timeline)
- [Pixel vs CAPI vs hybrid](#architecture-matrix)
- [EMQ benchmarks](#emq-benchmarks)
- [What you need](#prerequisites)
- [Complete 7-step setup](#setup)
- [Meta CAPI deep dive](#meta-capi)
- [Google Enhanced Conversions](#google-enhanced)
- [TikTok Events API](#tiktok-events)
- [Free vs paid comparison](#comparison)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq-section)





DIRECT ANSWER


## Shopify Server-Side Tracking Explained in 60 Seconds

**Shopify server-side tracking is a method of sending purchase, checkout, and add-to-cart events from Shopify's backend directly to Meta, Google, and TikTok — bypassing the customer's browser entirely.** It is the only reliable way to track conversions in 2026 because iOS App Tracking Transparency, Safari's Intelligent Tracking Prevention, ad blockers, and consent banner rejections now combine to block 30–40% of browser pixel events on the average Shopify store.

The mechanism is straightforward. When a Shopify order is paid, Shopify fires an <code>orders/paid</code> webhook. That webhook is intercepted by an automation tool — Make.com is the free standard — which receives the order payload (email, phone, total, line items, customer IP, user agent), hashes the personal data with SHA-256, and posts a signed event to three endpoints: Meta's Conversions API, Google's Enhanced Conversions endpoint, and TikTok's Events API. The browser pixel still fires alongside this for deduplication; both events share the same <code>event_id</code> so each platform counts one conversion, not two.

The result is what Meta calls a higher Event Match Quality (EMQ) score — typically jumping from 4–5 (browser-only) to 8–9 (server + browser hybrid) — which feeds richer signal back into the ad platform's machine learning. Higher EMQ directly lowers cost-per-acquisition because the algorithm can find lookalikes more accurately.

### Quick answer table


- **What it is:** Server-to-server transmission of conversion events, fired by Shopify webhooks instead of browser JavaScript.
- **Why it's needed in 2026:** iOS ATT, Link Tracking Protection (introduced in iOS 17 and still enforced in iOS 26), Safari ITP 2.3+, and consent rejection block roughly one in three browser pixel events.
- **What it costs:** $0/month using the Make.com webhook method. From $145/month using managed services (Analyzify, Triple Whale, Elevar).
- **How long it takes:** 18 minutes for a working Make.com setup. 2–3 hours if you want full GTM Server-Side Container deployment on Google Cloud Run.
- **What you need:** Shopify Admin access, Meta Business Manager access token, Google Ads conversion ID, TikTok Pixel ID, a free Make.com account.
- **What you should track:** <code>Purchase</code> (Meta), <code>conversion</code> (Google), <code>CompletePayment</code> (TikTok). Note: TikTok does not use "Purchase" — this is the most common setup error.
- **Expected uplift:** 20–40% additional reported conversions, 1–3 point Meta EMQ improvement, 10–25% lower cost-per-purchase as the algorithm receives cleaner signal.





DEFINITION


## What is Server Side Tagging (Shopify Server-Side Tracking)?

Server-side tracking (also called Conversions API, server-to-server tracking, or S2S tracking) sends conversion events directly from your web server to advertising platforms — completely bypassing the customer's browser. Instead of relying on a JavaScript pixel in the browser to fire when a purchase completes, a webhook fires from Shopify's backend the moment payment is confirmed, routing event data directly to Meta's Conversions API, Google's Enhanced Conversions endpoint, and TikTok's Events API.

The key distinction is where the event originates. A browser pixel depends on the customer's device: their browser settings, installed extensions, network conditions, and whether they accepted your cookie banner. A server event originates from Shopify's infrastructure — it fires regardless of what the customer's browser does, making it immune to ad blockers, iOS privacy restrictions, and Safari's Intelligent Tracking Prevention.

### Server-side vs browser pixel: the architecture





The complete $0 architecture: one webhook, one Make.com scenario, three ad platforms fed server-to-server. Nothing in this path can be blocked client-side.



&#x2715; Browser pixel only


1Customer completes purchase

2Thank-you page loads in browser

3Pixel JavaScript tries to fire

4Ad blocker / ITP / ATT blocks it

5Conversion never recorded






&#x2713; Server-side tracking


1Customer completes purchase

2Shopify backend fires webhook instantly

3Make.com receives full order payload

4HTTP module POSTs to Meta/Google/TikTok

5Conversion recorded every time








Server-side tracking does not replace your browser pixel — it runs in parallel with it. The pixel handles upper-funnel events (ViewContent, AddToCart, InitiateCheckout) that server webhooks cannot capture since they only fire on confirmed payment. Together, the two methods give each ad platform the most complete signal possible.




WHY IT MATTERS IN 2026


## Why Server-Side Tracking Is Non-Negotiable in 2026

The browser tracking environment has degraded dramatically since 2021 and continues to worsen. iOS 14.5 introduced App Tracking Transparency (ATT), requiring explicit opt-in for cross-app tracking — approximately 62% of iOS users decline. iOS 17 added Link Tracking Protection, which strips UTM and click-ID parameters from URLs in Safari Private Browsing and Mail. Safari's [Intelligent Tracking Prevention](https://webkit.org/tracking-prevention/) deletes first-party cookies after 7 days and blocks all third-party cookies. Firefox Enhanced Tracking Protection blocks third-party cookies by default. Chrome's Privacy Sandbox continues its phased rollout despite delays.

The cumulative effect: on a typical Shopify store with normal UK or US traffic mix, 30–40% of actual purchases are invisible to your browser pixel. Your ad platforms are optimising delivery on incomplete data — which means higher CPAs, suppressed ROAS, and budget allocated to audiences that look unprofitable but aren't.

### How much data are you actually losing?




Estimated browser pixel loss by platform (2026 UK/US traffic mix)

Meta

~35%

Google

~28%

TikTok

~22%




iOS 17/18 specific impact
Safari's Link Tracking Protection in iOS 17+ strips **fbclid** and **gclid** parameters from URLs, breaking click-attribution for users who tap your ads in Safari. Server-side CAPI with hashed email matching is the only way to attribute these conversions. If your store has more than 40% iOS traffic, this alone justifies implementing CAPI.




Server-side tracking does not recover every lost event — it recovers the events that were lost due to browser restrictions, not events from users who genuinely did not convert. The 20–40% recovery figure represents real purchases that happened but were invisible to your pixel. It tracks the measured iOS attribution loss documented in the [Shopify iOS attribution gap benchmark](https://stackarchitect.xyz/shopify-ios-attribution-gap-benchmark/), where every figure is individually sourced.




2020–2026 TIMELINE


## How iOS, Chrome and Safari Broke Browser Pixels: A Dated Timeline

Server-side tracking did not become essential overnight. It became essential because of seven specific platform changes between 2020 and 2026, each of which removed a slice of the data browser pixels used to capture. Understanding the timeline matters because it explains why the *same* Shopify store reporting 95% of Meta conversions in 2019 now reports 60–70% in 2026 with no change to its setup. Nothing is broken — the rules changed underneath the pixel.

### April 2021 — iOS 14.5 and App Tracking Transparency

Apple shipped App Tracking Transparency in iOS 14.5, requiring every app to display a permission prompt before accessing the Identifier for Advertisers (IDFA). Industry opt-in rates settled at 20–25% globally and 16–18% in the US. For Shopify stores, the immediate effect was that Meta lost the ability to attribute roughly 75% of in-app Instagram and Facebook conversions on iOS devices. Meta's Aggregated Event Measurement protocol launched in response, capping each domain to eight tracked events with a 24–72 hour delayed-attribution window. Meta CAPI was Meta's recommended remediation from this date forward.

### September 2021 — Safari ITP 2.3 enforcement on Shopify checkouts

Safari's Intelligent Tracking Prevention had existed since 2017, but version 2.3's seven-day cap on first-party cookies set via document.cookie reached full enforcement on Shopify domains in late 2021. Stores using legacy <code>_fbp</code> and <code>_fbc</code> cookies set client-side saw return-visitor attribution windows collapse from 30 days to seven. The fix — setting these cookies server-side via HTTP <code>Set-Cookie</code> headers with a maximum 30-day lifetime — required either Shopify Plus access to checkout extensibility or a server-side tagging container.

### October 2022 — iOS 16 link tracking parameter stripping

iOS 16's Mail, Messages and Safari Private Mode began stripping known click-tracking parameters from URLs — including <code>fbclid</code>, <code>gclid</code> and <code>ttclid</code>. Stores relying on URL parameters to attribute paid traffic lost the click identifier the moment a user shared a product link via iMessage. Server-side tracking partially mitigates this by capturing the <code>fbc</code>/<code>fbp</code> values at order creation rather than at click time, but the fundamental loss of click attribution on shared links remains a 2026-era reality.

### September 2023 — iOS 17 Link Tracking Protection

iOS 17 extended parameter stripping into Mail and Messages by default for all users, not just Private Mode. Combined with iOS 17's expanded ATT prompts, average attribution loss for Shopify Meta campaigns measured by Meta's own conversion-lift studies reached 28–34% on iOS traffic.

### 2024 — Google Consent Mode v2 mandatory in EEA

From March 2024, Google Ads and GA4 in the European Economic Area required Consent Mode v2 with explicit <code>ad_storage</code> and <code>ad_user_data</code> signals. Stores without correctly configured Consent Mode v2 saw EEA conversion reporting drop to zero in Google Ads. Server-side tracking via Google Enhanced Conversions partially preserves attribution because hashed first-party data (email, phone) is sent server-side and matched to logged-in Google accounts, sidestepping the cookie-consent dependency.

### 2025 — Chrome third-party cookie deprecation pivot

Google walked back its 2020 commitment to remove third-party cookies in Chrome and instead shipped a per-user opt-in choice in 2025. The practical result for Shopify stores is roughly 20–30% of Chrome users now operate without third-party cookies, which breaks cross-domain pixel matching for retargeting audiences. Server-side first-party data transmission is the only durable counter.

### 2026 — iOS 18 advanced fingerprinting protection and Apple Intelligence

iOS 18 introduced advanced fingerprinting protections in Safari Private Mode, blocking screen-resolution, canvas, audio-context and font-list reads commonly used by browser pixels for probabilistic matching. Apple Intelligence summaries also began surfacing third-party content without driving the click that would normally fire a pixel. The cumulative attribution gap on browser-only pixel setups now ranges from 30% (best case, mostly Android traffic) to 45% (DTC stores with majority iOS audiences).


What the timeline means in practice
If your Shopify store launched before 2021 and still relies on Shopify's default Meta pixel app or a basic GTM client-side container, your reported ROAS is mathematically understated by 25–40% versus reality. You are over-paying for attribution gaps. The 18-minute Make.com setup recovers the majority of this gap at $0/month.






ARCHITECTURE MATRIX


## Browser Pixel vs Server-Side CAPI vs Hybrid: Which Setup You Actually Need

There are exactly three viable conversion-tracking architectures for a Shopify store in 2026. Most guides recommend hybrid by default without explaining when the simpler options are acceptable. Here is the honest decision framework, with the named failure modes for each approach so you can pick on facts, not vibes.

### Option 1 — Browser pixel only (Shopify default)

The native Meta Pixel app, Google Tag in <code>theme.liquid</code>, and TikTok Pixel app fire JavaScript events from the customer's browser. This is what every Shopify store starts with and what 70% of stores never move beyond.

**Where it works:** stores under $5,000/month ad spend, audiences that skew Android, and merchants who do not run lookalike or retargeting campaigns. If your decisions are not algorithmically driven, signal degradation matters less.

**Named failure modes:**


- *iOS attribution gap* — 30–45% of iOS purchases never report back to Meta.
- *Ad-blocker silence* — uBlock Origin, Brave browser, and Pi-hole networks block pixel script downloads entirely. No event fires at all.
- *Consent rejection* — in EEA/UK markets, 30–55% of users decline marketing cookies. With Consent Mode v2 active, pixel events are conversion-modelled rather than directly observed, halving precision.
- *Page-load drop-off* — 8–12% of purchase events fire late or not at all because the customer closed the tab or hit a thank-you page redirect before the pixel completed its network request.
- *Bot inflation* — pixel scripts execute for any browser-like client, including the 15–25% bot share on the average Shopify store. Audiences become polluted.


**CASE STUDY:** [CAPI Shield: how server-side events recovered 20–40% of purchases invisible to pixel-only tracking — EMQ scores and deduplication data included.](https://stackarchitect.xyz/blog/recover-lost-shopify-conversions-capi-shield/)

### Option 2 — Server-side CAPI only (no browser pixel)

You disable the browser pixel entirely and rely solely on webhook-fired server events. This sounds clean and is occasionally recommended in privacy-focused communities. It is wrong for every commercial Shopify store.

**Where it works:** nowhere, in practice. The closest legitimate use case is a B2B Shopify Plus store where every transaction is invoiced manually after a sales call — a tiny minority.

**Named failure modes:**


- *No view-content data* — product views, search events and add-to-cart events are extremely awkward to fire server-side because they do not generate a Shopify webhook. Meta's lookalike models depend on these mid-funnel signals.
- *No browser cookies for matching* — without the pixel setting <code>_fbc</code> and <code>_fbp</code>, your CAPI events arrive with degraded match keys. Meta EMQ scores cap around 5–6 even with hashed PII.
- *No Advanced Matching auto-collection* — the browser pixel auto-hashes form-field email and phone. Server-only setups must manually capture and pass these.
- *Lookalike audience starvation* — without browser-pixel page-view density, custom audiences for retargeting drop below the 1,000-user minimum required to run.


### Option 3 — Hybrid: browser pixel + server-side CAPI with deduplication

Both fire. Both share an <code>event_id</code>. Meta, Google and TikTok deduplicate on the platform side and count one conversion. This is the architecture every documented case study at scale uses — Shopify itself uses it for native apps, so does Klaviyo for its predictive analytics integrations, and every reputable agency from Common Thread Collective to Triple Whale defaults to hybrid.

**Where it works:** any Shopify store running $1,000/month or more in paid social, paid search or TikTok Ads. The marginal cost of adding server-side to an existing pixel setup is 18 minutes and $0 if you use the Make.com webhook method.

**Named failure modes:**


- *Missing event_id* — if both events fire without a shared identifier, conversions double-count. Meta will report 1.6–1.9x actual purchases.
- *Mismatched event names* — firing "Purchase" in the browser and "CompletePayment" server-side on TikTok prevents deduplication. Same event, two different platforms' APIs use different names.
- *Webhook silence on free Shopify plans* — Shopify Basic limits webhook reliability under sustained load; the fix is the Make.com retry policy, which catches missed deliveries and retries with exponential backoff for 24 hours.


### The matrix


- **Browser only:** simplicity 10/10, signal quality 4/10, EMQ ceiling 5/10, monthly cost $0, data loss 30–45%.
- **CAPI only:** simplicity 6/10, signal quality 5/10, EMQ ceiling 6/10, monthly cost $0, data loss 25–35% (mid-funnel events missing).
- **Hybrid (recommended):** simplicity 7/10, signal quality 9/10, EMQ ceiling 9/10, monthly cost $0–$500 depending on stack, data loss 5–15%.


The cheapest path to hybrid in 2026 is the Make.com webhook method documented in the setup section of this guide. Make.com's free tier covers up to 1,000 credits/month, which is sufficient for any Shopify store under approximately 250 orders per month. Above that volume, the Core plan at $12/month covers 10,000 credits — [free Make.com account here](https://stackarchitect.xyz/go/make).




EMQ BENCHMARKS


## Event Match Quality Benchmarks: What "Good" Looks Like in 2026

Event Match Quality is Meta's 1–10 score for how confidently it can match an inbound CAPI event to a real Facebook or Instagram user. It is the single most actionable diagnostic in server-side tracking because it directly correlates with cost-per-acquisition in Meta's machine-learning bidding. Stores at EMQ 8+ consistently report 12–28% lower cost-per-purchase than equivalent stores at EMQ 5–6. This section gives you the benchmark ranges, the specific match keys that move each score, and the failure modes that cap your EMQ regardless of effort.

### The Meta EMQ scale, decoded

Meta publishes EMQ in Events Manager under each event source. The score is calculated daily on a rolling 7-day basis from the match keys present in your CAPI payloads. The bands map to this:


- **EMQ 9–10 (excellent):** Hashed email + phone + first name + last name + city + state + zip + IP + user agent + <code>fbc</code> + <code>fbp</code> + external_id. Achievable only with logged-in customers or post-purchase events from Shopify.
- **EMQ 7–8 (very good):** Hashed email + phone + zip + IP + user agent + <code>fbc</code> + <code>fbp</code>. The realistic ceiling for guest-checkout Shopify stores using the Make.com webhook method.
- **EMQ 5–6 (acceptable):** Hashed email + IP + user agent only. The default for stores running CAPI without browser-pixel cookie capture.
- **EMQ 3–4 (poor):** IP + user agent only. This is what bot traffic and malformed payloads look like; Meta will downweight your data in lookalike construction.
- **EMQ 0–2 (broken):** Missing or malformed payloads. Investigate immediately; events are likely not being attributed.


### Match-key impact, ranked by lift

Not all match keys move EMQ equally. Based on Meta's own documentation and observed behaviour across multiple Shopify deployments, here is the ranked impact of each key on EMQ score:


- **Email (em):** +2.0 to +2.5 points. The single highest-leverage match key. Always SHA-256 hash, lowercase, trim whitespace.
- **Phone (ph):** +1.5 to +2.0 points. Must be E.164 format (e.g. <code>447700900123</code>, no <code>+</code>, no spaces) before hashing.
- **External ID (external_id):** +1.0 to +1.5 points. Use Shopify's <code>customer.id</code>. Hash it.
- **Click ID (fbc):** +0.5 to +1.0 points. Capture from the URL parameter <code>fbclid</code> or from the browser pixel cookie at order creation.
- **Browser ID (fbp):** +0.5 to +0.7 points. Read from the <code>_fbp</code> cookie set by the Meta browser pixel.
- **First name + last name + city + state + zip:** +0.3 to +0.6 points combined. Hash each individually.
- **IP address (client_ip_address):** +0.2 to +0.4 points. Must be the customer's IP, not Shopify's or Make.com's server IP — the most common Make.com setup error.
- **User agent (client_user_agent):** +0.1 to +0.3 points. Captured from the order's <code>browser_user_agent</code> field in the Shopify order payload.


### Google Enhanced Conversions match-rate benchmarks

Google does not publish an equivalent to EMQ. Instead, Enhanced Conversions reports a match rate as a percentage in the Google Ads conversion-action diagnostic panel. The benchmarks for Shopify stores are:


- **70%+ match rate:** excellent. Achieved with hashed email + phone + name + address.
- **50–70% match rate:** good. Typical for hashed email + phone only.
- **30–50% match rate:** acceptable, but indicates many guest checkouts with throwaway emails.
- **Below 30%:** investigate immediately. Often indicates SHA-256 hashing is being applied incorrectly (e.g. hashing already-hashed values) or that the <code>user_data</code> object is missing required fields.


### TikTok Events API match scoring

TikTok measures event quality differently. The diagnostic appears as "Event Match Score" in TikTok Events Manager, scored 0–100. The benchmarks:


- **80–100:** excellent. Hashed email + phone + IP + user agent + TikTok Click ID (<code>ttclid</code>) all present.
- **60–80:** good. Most match keys present, possibly missing <code>ttclid</code> (organic/direct traffic legitimately won't have it).
- **40–60:** acceptable for direct/organic traffic only. Investigate for paid-traffic events.
- **Below 40:** something is wrong. Check that the event name is <code>CompletePayment</code>, not <code>Purchase</code> — this is the single most common TikTok integration error.


### Common EMQ-killer mistakes (and their fixes)


- **Hashing the wrong format:** emails must be lowercased and trimmed before hashing. Phones must be E.164 digits-only. <code>"User@Example.com "</code> hashed raw will not match Meta's expected hash of <code>"user@example.com"</code>.
- **Sending Shopify's server IP:** if you use Shopify's native Meta CAPI integration, it sends the customer's IP correctly. If you use Make.com, you must explicitly map <code>order.client_details.browser_ip</code>, not the IP of the Make.com runtime.
- **Double-hashing:** Shopify's order payload contains plaintext email and phone. Hash these once, server-side, before posting to Meta. Re-hashing already-hashed values produces a useless string.
- **Missing external_id:** the simplest +1.0 EMQ point most Shopify stores leave on the table. Pass <code>order.customer.id</code> as <code>external_id</code> after hashing.
- **Stale fbp/fbc:** <code>_fbp</code> cookies expire after 90 days. If your store has a long sales cycle and the cookie has expired by purchase time, fall back to the email + phone + external_id combination.



Diagnostic checklist
Open Meta Events Manager → Data Sources → your pixel → Settings tab. Check "Event Match Quality". If you see anything below 7.0 after running CAPI for 7 days, work down the match-key impact list above starting with email format, then phone E.164, then external_id, then IP source. Each fix typically lifts EMQ within 48 hours.






PREREQUISITES


## What You Need Before Starting

You need four things before you begin. All are free. None require a developer.


- **A Make.com account** — free plan covers 1,000 credits/month, sufficient for stores up to ~300 orders/month. [Sign up free here](https://stackarchitect.xyz/go/make).
- **Meta Pixel ID and Conversions API Access Token** — found in Meta Events Manager &rarr; your pixel &rarr; Settings &rarr; Conversions API &rarr; Generate access token.
- **Google Ads Conversion ID and label** — found in Google Ads &rarr; Tools &rarr; Measurement &rarr; Conversions &rarr; your purchase conversion &rarr; Tag setup.
- **TikTok Pixel ID and Events API Access Token** — found in TikTok Events Manager &rarr; your pixel &rarr; Settings &rarr; Events API &rarr; Generate access token.


Keep all four credentials in a secure note — you will paste them into Make.com HTTP modules during setup. Never share your access tokens publicly or commit them to GitHub.




7-STEP SETUP

## Complete Setup: The Make.com Webhook Method

This method fires directly from Shopify's backend on payment confirmation — no browser dependency, no thank-you page required, no Shopify app to install. Total time: 18 minutes.

**GOOGLE ADS:** [Google Enhanced Conversions via Make.com webhook for Shopify — no GTM container, no server hosting, no monthly cost.](https://stackarchitect.xyz/blog/how-to-fix-shopify-google-ads-conversion-tracking-2026/)



1


Create your free Make.com account

Sign up at [Make.com](https://stackarchitect.xyz/go/make) — no credit card required. The free plan gives you 1,000 credits/month. **One Shopify order = 4 credits** (the webhook trigger plus one HTTP module per platform), so the free plan covers ~250 orders/month. Create a new scenario and name it "Shopify Server-Side Tracking".

&#9201; 2 minutes





2


Add a Webhooks trigger module

In your new scenario, click the empty module circle. Search for **Webhooks** &rarr; **Custom webhook**. Click Add, name it "Shopify order webhook", save. Make.com generates a unique webhook URL — **copy it now**. This URL is your secure endpoint that Shopify will POST order data to.

&#9201; 2 minutes





3


Add the Shopify Order Payment webhook

In Shopify Admin &rarr; **Settings &rarr; Notifications &rarr; Webhooks**, click Create webhook. Set:<br>
Event: **Order payment** &bull; Format: JSON &bull; URL: paste your Make.com webhook URL
Save. Shopify will POST the full order payload to Make.com every time a payment is confirmed — not on order creation, not on fulfilment, on confirmed payment only.


&#9201; 2 minutes





4


META Add Meta CAPI HTTP module

Add an **HTTP &rarr; Make a request** module. Configure:<br>
URL: https://graph.facebook.com/v24.0/YOUR_PIXEL_ID/events?access_token=YOUR_TOKEN<br>Method: POST &bull; Body type: Raw &bull; Content type: JSON
*Use the current Graph API version — Meta deprecates older versions roughly every two years. Check the [Graph API changelog](https://developers.facebook.com/docs/graph-api/changelog/) for the latest <code>vXX.0</code> and swap it into the URL.*
In the body, map: event_name = Purchase, event_id = order ID, event_time = Unix timestamp, value = order total, currency = currency code. In user_data: SHA-256 hash email and phone before sending.


&#9201; 5 minutes





5


GOOGLE Add Google Enhanced Conversions module

Add a second **HTTP &rarr; Make a request** module branching from the same webhook trigger. Google Enhanced Conversions matches server data to logged-in Google accounts using hashed user data. Send SHA-256 hashed email, phone, first_name, last_name alongside the conversion value and order ID. This improves match rate significantly above email-only matching.

&#9201; 4 minutes





6


TIKTOK Add TikTok Events API module

Add a third HTTP module. POST to https://business-api.tiktok.com/open_api/v1.3/event/track/.<br>
**Critical:** use event_name = **CompletePayment**, not "Purchase". TikTok's algorithm only recognises CompletePayment as a purchase event. Include hashed email, hashed phone, customer IP address, and user agent from the Shopify order payload. These four signals together drive Event Match Quality above 8/10.


&#9201; 4 minutes





7


Activate and verify all three platforms

Switch the Make.com scenario **On**. Place a test order on your store. Check within 60 seconds:<br>
Meta: Events Manager &rarr; Test Events &rarr; look for Purchase, source: server<br>Google: Ads &rarr; Conversions &rarr; Diagnostics &rarr; Enhanced conversions status<br>TikTok: Events Manager &rarr; Test Events &rarr; look for CompletePayment
All three should show green. If any shows yellow, see the Troubleshooting section below.


&#9201; 3 minutes







#### Ready to start? Create your free Make.com account

No credit card. Free plan covers 250 orders/month. Full three-platform build takes ~18 minutes.

[Start Free &rarr;](https://stackarchitect.xyz/go/make)



META CAPI


## Meta Conversions API: Complete Configuration

<p>Meta's Conversions API (CAPI) is the server-side counterpart to the Meta Pixel. It was introduced after Apple's iOS 14.5 ATT update and has since become Meta's primary recommended tracking method for e-commerce. When your browser pixel fires and your CAPI event fires for the same purchase, Meta deduplicates them using the event_id field — so you see one conversion, not two. The full [Meta Conversions API documentation](https://developers.facebook.com/docs/marketing-api/conversions-api) covers all available parameters and the required fields for e-commerce events.
### The exact Meta CAPI payload

Every field below improves your Event Match Quality score. The more fields you send, the better Meta can match the event to a real user in its database and attribute the conversion correctly.




Full Meta CAPI payload structure
<p>**Endpoint:** POST https://graph.facebook.com/v24.0/&#123;PIXEL_ID&#125;/events?access_token=&#123;TOKEN&#125; *(use the current Graph API version — see Meta's [changelog](https://developers.facebook.com/docs/graph-api/changelog/))*<br><br>
Required: event_name Purchase &bull; event_time Unix timestamp &bull; action_source website &bull; event_id Shopify order ID (must match browser pixel)<br><br>
User data (all SHA-256 hashed): em email &bull; ph phone &bull; fn first name &bull; ln last name &bull; ct city &bull; zp zip code &bull; country 2-letter code &bull; client_ip_address raw IP &bull; client_user_agent raw UA<br><br>
Custom data: currency &bull; value &bull; order_id &bull; content_ids array of SKUs &bull; num_items quantity</p>



### Deduplication: the most important step

Without deduplication, every purchase generates two "Purchase" events in Meta Events Manager — one from your browser pixel and one from CAPI. This inflates your reported ROAS and causes Meta's algorithm to optimise on false data. The fix is simple: set the same event_id value in both events. In your browser pixel, pass eventID: '&#123;&#123;order.id&#125;&#125;' in the Purchase event parameters. In Make.com, pass the same order ID as event_id. Meta matches them and counts one conversion.

### Testing Meta CAPI

In Meta Events Manager, navigate to **Test Events**. You will see a Test Event Code. Add this as a test_event_code parameter in your Make.com HTTP module during testing. Place a real test order. Within 60 seconds you should see a Purchase event appear with source labelled "Server". Once confirmed, remove the test_event_code from your production scenario.




GOOGLE ENHANCED CONVERSIONS


## Google Enhanced Conversions: Setup & Verification

Google Enhanced Conversions improves conversion measurement accuracy by sending hashed first-party customer data alongside your conversion tags. When a customer who is logged into a Google account makes a purchase on your store, Google can match the hashed data to their Google profile and attribute the conversion even if no cookie was set — including cross-device conversions where the customer first clicked your ad on desktop but purchased on mobile.

There are two implementation approaches: via Google Tag Manager Server-Side container, or via the Google Ads Enhanced Conversions for Web feature. For Make.com users, the simplest approach is to configure Enhanced Conversions for Web in Google Ads and send the hashed data in your existing conversion tag, then complement this with an order-level upload via the Make.com HTTP module.

### Data fields that improve Google match rate




High impactEmail (SHA-256)
Primary match signal. Must be lowercase, trimmed, then hashed.

High impactPhone (SHA-256)
E.164 format (+447911123456) then hashed. Significantly improves mobile attribution.

Medium impactFirst + Last Name
Lowercase, trimmed, SHA-256 hashed. Improves match for users without email history.

Medium impactPostal address
Street, city, postal code, country. Useful for cross-device attribution.




SHA-256 hashing in Make.com
In Make.com, use the built-in sha256(lowercase(trim(email))) function to hash customer data. Apply this to every user data field before sending. Never send raw PII to any advertising platform — all platforms require SHA-256 hashing as a condition of their API terms.




### Verifying Google Enhanced Conversions

In Google Ads, navigate to **Tools &rarr; Measurement &rarr; Conversions**. Click your purchase conversion action, then **Diagnostics**. The Enhanced conversions tab shows your match rate percentage. A match rate above 40% is good; above 60% is excellent. If your rate is below 20%, check that you are hashing email correctly (lowercase and trimmed before hashing) and that phone numbers are in E.164 format.

Prefer a ready-made version? [**CAPI Shield**](https://stackarchitect.xyz/capi-shield/) is the pre-built Make.com scenario for Meta CAPI and Google Enhanced Conversions — import it and go, no manual webhook build required.




TIKTOK EVENTS API


## TikTok Events API: Maximising Event Match Quality

TikTok's Events API uses an Event Match Quality (EMQ) score to measure how well your server events can be matched to TikTok users. Scores range from 0–10. A score above 7 is considered good; above 9 is excellent. The EMQ score directly affects TikTok's ability to attribute conversions and optimise delivery — a higher score means more conversions attributed and better ROAS.

The single most important difference between TikTok and Meta/Google: TikTok requires the event name **CompletePayment**, not "Purchase". If you send "Purchase" to TikTok's Events API, it will appear in your Events Manager but will not be used for purchase campaign optimisation. This is the most common TikTok setup mistake.

### TikTok EMQ signal hierarchy




Critical (+3 EMQ)Email (SHA-256)
Strongest matching signal. Send as lowercase SHA-256 hash.

Critical (+3 EMQ)Phone (SHA-256)
E.164 format, then SHA-256. Essential for mobile-first TikTok audience.

High (+2 EMQ)External ID
Your internal customer ID from Shopify. Hashed SHA-256.

Medium (+1 EMQ)IP + User Agent
Raw IP address and full user agent string. Send unhashed from Shopify order payload.




TikTok API endpoint
**POST** https://business-api.tiktok.com/open_api/v1.3/event/track/<br>Headers: Access-Token: YOUR_TOKEN &bull; Content-Type: application/json<br>Required body fields: pixel_code &bull; event CompletePayment &bull; timestamp ISO 8601 &bull; event_id order ID &bull; context.user with hashed signals &bull; context.ip &bull; context.user_agent &bull; properties.currency &bull; properties.value




Sending all four high-impact signals (email, phone, external_id, IP/UA) typically achieves an EMQ score of 8–9/10. A higher match score directly improves TikTok's ability to attribute conversions and optimise delivery — the same server-side principle Meta quantified in April 2026, when it reported advertisers using the Conversions API for web events saw an average 17.8% lower cost per result than those without it. Check your EMQ score in TikTok Events Manager &rarr; your pixel &rarr; Overview &rarr; Event Match Quality.

The pre-built TikTok version is [**TikTok Events API for Shopify**](https://stackarchitect.xyz/tiktok-events-api-shopify/) — the same CompletePayment setup, ready to import in minutes.




FREE VS PAID COMPARISON

## Make.com Free vs Elevar vs Triple Whale vs Analyzify

Server-side tracking is a solved problem. The question is whether you need to pay $99–$950/month for a managed solution or whether the free Make.com method gives you equivalent tracking quality. Here is the honest comparison.



[Table data omitted for Markdown - please format manually if needed]




The tracking quality difference between Make.com and paid solutions like Elevar is minimal for stores sending the same data fields. Elevar's premium justifies itself primarily through managed GTM setup, data layer configuration, and attribution reporting dashboards — not through superior API access. Both hit the same Meta CAPI and TikTok Events API endpoints with the same payload structure. The key advantage of paid solutions is that they handle edge cases automatically (order edits, refunds, subscription renewals). If your store processes over 1,000 orders/month, Make.com's Core plan at $12/month is still dramatically cheaper than any managed alternative.

**Our recommendation:** Start with Make.com free. If you grow to 300+ daily orders or need refund/edit tracking and multi-currency handling, evaluate Elevar at that point. Until then, the Make.com method gives you 95% of the tracking quality at 0% of the cost.




META'S FREE ONE-CLICK CAPI


## What About Meta's New One-Click Conversions API? (April 2026 Update)

In April 2026 Meta launched a Meta-enabled Conversions API — a free, one-click setup inside Events Manager that turns on server-side tracking for Meta with no developer, no code, and no ongoing maintenance. If your only goal is Meta CAPI, this is now the fastest route, and you should use it: it is genuinely easier than building a webhook, and it is free. We would be doing you a disservice not to say so.

So when does the Make.com method in this guide still make sense? Three honest cases:


- **You run more than just Meta.** Meta's one-click setup covers Meta only. The Make.com webhook fires one Shopify order to Meta, Google Enhanced Conversions *and* TikTok Events API in a single scenario, with a shared <code>event_id</code> across all three. One source of truth, three platforms, no per-platform native setup to maintain separately.
- **You want control over the payload.** The native setup is a black box — you get what Meta sends. With Make.com you decide exactly which match keys go out, how IP and user-agent are mapped, and how refunds or order edits are handled. That control is what moves EMQ from 6 to 8+.
- **You don't want to depend on each platform's native tool.** Native integrations change on the platform's schedule, not yours. A single Make.com scenario you own keeps your tracking portable if you switch platforms or one native tool degrades.


The honest summary: if you advertise on Meta alone and want the simplest possible setup, use Meta's one-click native CAPI — it's free and excellent for that one job. If you run Meta + Google + TikTok, or you want control over match quality and a portable setup you own, the Make.com method below is still the most capable free option. Many stores run both: native one-click for Meta as a baseline, and the Make.com scenario for Google and TikTok.




TROUBLESHOOTING


## Troubleshooting Common Server-Side Tracking Issues

### Events not appearing in Meta Events Manager

Check in this order: (1) Is your Make.com scenario switched **On**? Scenarios default to Off. (2) Did you place a test order on a published product, not a draft? Shopify's Order payment webhook only fires for real checkout orders, not test orders placed via the Shopify admin. (3) Is your access token correct and unexpired? Meta access tokens generated via Events Manager do not expire, but tokens generated via the Graph API Explorer expire after one hour. (4) Is your Pixel ID correct? The Pixel ID in your Make.com URL must match the pixel you are viewing in Events Manager.

### Double-counting conversions (seeing 2x purchases)

This means deduplication is not working. Both your browser pixel and CAPI are firing but with different event_id values. Fix: ensure your browser pixel Purchase event passes eventID set to the Shopify order ID. In Make.com, ensure event_id is mapped to the same order ID field from the webhook payload. Both values must be identical strings.

### TikTok events show but EMQ score is low (&lt;5)

Low EMQ almost always means missing user data fields. Check: (1) Is email being sent and SHA-256 hashed? It must be lowercase before hashing. (2) Is phone in E.164 format (+447911123456) before hashing? (3) Are IP address and user agent mapped from the Shopify order payload? In Make.com, map browser_ip from the order webhook for IP and client_details.user_agent for user agent.

### Google Enhanced Conversions match rate below 20%

The most common cause is incorrect email hashing. Google requires: lowercase the email &rarr; trim whitespace &rarr; SHA-256 hash &rarr; send. If any step is skipped, the hash will not match Google's database. In Make.com use: sha256(lowercase(trim(email))). Also verify you are sending phone in E.164 format before hashing.

### Make.com scenario fails with HTTP 400 error

A 400 error from any platform API means your payload is malformed. The most common causes: (1) Missing required fields — check the platform's API docs for required vs optional fields. (2) Incorrect data types — value must be a number, not a string. (3) Invalid timestamp — event_time must be a Unix timestamp (seconds since epoch), not a date string. In Make.com, use the toUnix(now) function to generate the correct timestamp format.





#### Want the Make.com scenario pre-built?

CAPI Shield is our free pre-configured Meta + Google server-side tracking setup for Shopify stores. Zero configuration required. Want all of it — Meta, Google, and TikTok — as one importable bundle? The [Complete Kit](https://stackarchitect.xyz/pro/) has all four scenarios ready in 10 minutes.

[Get CAPI Shield Free &rarr;](https://stackarchitect.xyz/capi-shield/)



FAQ

## Frequently Asked Questions


<details class="sa-faq"><summary>What is Shopify server-side tracking and how does it work?</summary>Shopify server-side tracking sends purchase events directly from your server to ad platforms (Meta, Google, TikTok) without going through the customer's browser. When a Shopify order is paid, a webhook fires to Make.com which routes the event to each platform's API endpoint — bypassing iOS restrictions, ad blockers, and cookie limitations. It works alongside your existing browser pixel, not instead of it.

</details>
<details class="sa-faq"><summary>Do I need to remove my browser pixel when setting up server-side tracking?</summary>No — keep your browser pixel running alongside server-side tracking. The pixel captures upper-funnel events (ViewContent, AddToCart, InitiateCheckout) that server webhooks don't cover since they only fire on confirmed payment. Set a matching event_id in both your pixel and server events so each platform deduplicates and you see one conversion, not two.

</details>
<details class="sa-faq"><summary>How much of my lost Shopify conversion data will server-side tracking recover?</summary>Most Shopify stores recover 20–40% of previously invisible conversions after deploying server-side tracking, consistent with measured iOS attribution loss of 28–45% on browser-only pixels. Meta reported in April 2026 that advertisers running the Conversions API for web events saw an average 17.8% lower cost per result versus those without it. The exact figure depends on your traffic mix — stores with high iOS and mobile traffic typically see higher recovery rates. The gap between your Shopify dashboard and ad platform reports should narrow significantly within 24–72 hours.

</details>
<details class="sa-faq"><summary>Is server-side tracking GDPR compliant?</summary>The data flows through your own Make.com workspace — you control what is sent and can delete the scenario at any time. All personally identifiable information (email, phone) is SHA-256 hashed before transmission as required by each platform's API specification. Ensure your store privacy policy discloses server-side conversion data sharing with advertising platforms. For GDPR-specific advice consult a legal professional.

</details>
<details class="sa-faq"><summary>How long before I see results after setting up server-side tracking?</summary>Server events start flowing immediately after your first paid order. More conversions will appear in your ad platform reporting within 24–48 hours. Meaningful CPA and ROAS improvement typically takes 7–14 days as ad platform algorithms recalibrate delivery optimisation using the more complete conversion signal.

</details>
<details class="sa-faq"><summary>How often does Make.com's free tier actually fail or rate-limit?</summary>The Make.com free plan limit is 1,000 credits/month, refreshing on the 1st of each month. One Shopify order = 4 credits (webhook trigger + Meta + Google + TikTok), so the free tier handles ~250 orders/month before hitting the cap. Make.com does not "fail" mid-month — it pauses your scenario and emails you. Real failure modes are different: a temporary Meta API outage, an expired access token, or a malformed payload. These are caught in Make.com's execution log under each scenario, and re-runs are free.

</details>
<details class="sa-faq"><summary>Will server-side tracking keep working as iOS tightens privacy further?</summary>Yes. Server-side tracking is specifically designed to be immune to iOS browser-level restrictions because the event originates from Shopify's server, not the customer's iPhone. Every iOS release since 17 has extended Link Tracking Protection and tightened Safari's Intelligent Tracking Prevention — both of which only affect browser pixels. CAPI, Google Enhanced Conversions, and TikTok Events API will continue to function exactly as documented. If anything, server-side tracking becomes more valuable with each iOS release.

</details>
<details class="sa-faq"><summary>Do I still need server-side tracking if I'm using Shopify's native Customer Events / Web Pixels?</summary>Yes. Shopify's Web Pixels framework is still browser-based — it loads in a sandboxed iframe in the customer's browser and is subject to the same ad blocker and ITP restrictions as a regular pixel. It improves reliability slightly versus a raw Meta Pixel install, but does not match the recovery rate of a true server-side webhook firing from Shopify's backend on confirmed payment. Run Web Pixels for upper-funnel events (PageView, AddToCart) and the Make.com webhook method for the Purchase event.

</details>
<details class="sa-faq"><summary>What is the difference between Meta CAPI and Shopify's native data sharing?</summary>Shopify's native Maximum data sharing setting enables their own CAPI integration, but it is still partially browser-triggered — if the thank-you page pixel fails to execute, the server event may not fire. The Make.com webhook method fires directly from Shopify's backend on payment confirmation with zero browser dependency, making it more reliable.

</details>
<details class="sa-faq"><summary>Can I set up Shopify server-side tracking without a developer?</summary>Yes. The Make.com webhook setup requires no code. You configure a Shopify webhook in Settings, build an HTTP module in Make.com's visual drag-and-drop interface, and paste your API credentials. Most store owners complete the setup in under 20 minutes. No developer, no agency, no Shopify app installation required.

</details>
<details class="sa-faq"><summary>Does server-side tracking work with Shopify's native Maximum data sharing?</summary>Yes — the Make.com webhook method works independently of and alongside Shopify's native data sharing. You do not need to disable native CAPI. Running both adds redundancy: if one delivery method has a transient failure, the other ensures the event still reaches the platform. Use matching event_id values in both so platforms deduplicate correctly.

</details>
<details class="sa-faq"><summary>How much does Shopify server-side tracking cost?</summary>The Make.com webhook method costs $0/month for Shopify stores under approximately 250 orders per month, since each order consumes 4 Make.com credits (one per platform: Meta, Google, TikTok) and the free tier covers 1,000 credits monthly. Above 250 orders/month, the Make.com Core plan at $12/month covers 10,000 credits — sufficient for stores up to roughly 3,300 orders/month. Managed alternatives like Elevar (from $225/month) and Triple Whale (GMV-based) achieve the same tracking quality at significantly higher cost. The premium pays for managed onboarding and dashboards, not for superior API access.

</details>
<details class="sa-faq"><summary>What Event Match Quality (EMQ) score is good for Meta CAPI on Shopify?</summary>Meta scores Event Match Quality from 1 to 10. For Shopify stores using the Make.com webhook method, EMQ 7–8 is the realistic ceiling and represents very good performance — achieved by sending hashed email, phone, zip, IP, user agent, <code>fbc</code> and <code>fbp</code>. Scores of 9–10 are excellent but typically require logged-in customer data with full address fields. Anything below 5 indicates missing match keys: investigate email format (lowercase + trim before SHA-256), phone format (E.164 digits-only before SHA-256), and the <code>external_id</code> field (Shopify <code>customer.id</code>, hashed). Stores at EMQ 8+ consistently report 12–28% lower cost-per-purchase than equivalent stores at EMQ 5–6.

</details>
<details class="sa-faq"><summary>Why is my TikTok event match quality low even with server-side tracking?</summary>The single most common cause is sending the event name "Purchase" instead of <code>CompletePayment</code>. TikTok's Events API requires <code>CompletePayment</code> as the event name for purchase events — sending "Purchase" (which works for Meta) results in low Event Match Score and prevents purchase-campaign optimisation. Other common causes: missing hashed email, missing IP address (you must map <code>order.client_details.browser_ip</code> from the Shopify webhook payload, not the Make.com runtime IP), missing TikTok Click ID (<code>ttclid</code>) for paid traffic, and missing user agent. Sending all four high-impact signals (email, phone, IP/UA, external_id) typically lifts TikTok Event Match Score to 80–100.

</details>
<details class="sa-faq"><summary>Is Shopify server-side tracking free?</summary>Yes — the tracking itself is free to implement. The [Make.com webhook method](#setup) in this guide costs **$0/month** for stores under ~250 orders/month, because each order uses 4 Make.com credits and the free tier covers 1,000. Above that, Make.com Core is $12/month for 10,000 credits. The platform APIs — Meta CAPI, Google Enhanced Conversions, TikTok Events API — are all free to use. You only pay if you choose a *managed* tool: Elevar runs from $200/month and Triple Whale from $149/month, but they charge for dashboards and managed onboarding, not for better tracking access. The same events reach the same endpoints either way. See the [free vs paid comparison](#comparison) for the full breakdown.

</details>
<details class="sa-faq"><summary>Shopify server-side tracking vs Elevar — what's the difference?</summary>Both send the same server-side events to the same destinations (Meta CAPI, Google, TikTok) — the difference is who builds and maintains the pipeline. **Elevar** is a managed service from $200/month: it provisions a server-side GTM container, supplies a pre-built Shopify data layer, monitors delivery with alerts, and handles refunds and order edits automatically. The **free Make.com webhook method** delivers the same events and the same Event Match Quality ceiling, but you build the scenario yourself in ~18 minutes and maintain it. Choose Make.com for zero cost and full control; choose Elevar if managed monitoring, automatic edge-case handling, and a reporting dashboard justify the monthly fee at your ad spend. For most stores under 1,000 orders/month, the Make.com method delivers the tracking quality without the recurring cost.

</details>
<details class="sa-faq"><summary>Do I need server-side GTM (sGTM) for Shopify server-side tracking?</summary>No. Server-side Google Tag Manager is *one* way to do server-side tracking, but it requires provisioning and paying for a Google Cloud tagging server and configuring containers — overkill for most Shopify stores. The Make.com webhook method skips GTM entirely: Shopify fires an order webhook directly to Make.com, which POSTs to each platform's API. You get the same server-to-server delivery with no server to host or maintain. sGTM earns its complexity only for large stores with dedicated analytics engineers needing custom tag logic across many destinations; for everyone else, the webhook method is simpler, free, and equally effective for conversion tracking.

</details>



RELATED GUIDES

## More Free Shopify Tracking & Automation Guides


[Shopify Agentic Storefronts 2026 — Sell on ChatGPT & Google AI Mode](https://stackarchitect.xyz/blog/shopify-agentic-storefronts-setup-guide-2026/)
[Fix Google Apps Script Quota Errors Free — Complete Guide 2026](https://stackarchitect.xyz/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/)
[CAPI Shield — Free Pre-Built Server-Side Tracking for Shopify](https://stackarchitect.xyz/capi-shield/)
[Free TikTok Events API Blueprint on GitHub — Import in 6 Minutes](https://github.com/lsb11/shopify-automation-blueprints)
[All Free Shopify Automation Guides — Replace $700/Month of Apps](https://stackarchitect.xyz/shopify-automation-guides/)