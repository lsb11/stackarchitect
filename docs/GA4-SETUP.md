# GA4 configuration — the half that is not in this repo

Property: **G-TE6Z6CW514**. The tag and every event it sends live in
`src/layouts/Base.astro` (between the `GA4_PLACEHOLDER` comments), with its
data in `src/data/analytics.ts` and its tests in
`tests/analytics-tracker.test.js`.

**None of what follows is code.** Key events, custom dimensions, channel
groups and data filters are property settings in the GA4 admin UI. Shipping
the events without doing this leaves the property in exactly the state that
prompted the work: traffic recorded, nothing marked as a conversion, and no
way to read a partner or a placement out of a report.

Two facts that shape every step below:

- **Custom dimensions are not retroactive.** GA4 keeps the parameter on the
  event either way, but it cannot be used as a dimension in a report until it
  is registered. Register them before you care about the data, not after.
- **Data filters are not retroactive either.** An internal-traffic filter
  excludes events from the moment it goes Active. It does not clean history.

Recorded here rather than in `CLAUDE.md` because it is step-by-step
configuration, but it is the same category as the Cloudflare zone rules: real
behaviour that nothing in this repo can show you.

---

## 1. Mark the key events

`Admin → Data display → Events`, then the **Mark as key event** toggle.

| Event | Key? | Why |
|---|---|---|
| `affiliate_click` | **yes** | A reader left for a partner. This is how the site earns. |
| `begin_checkout` | **yes** | A reader opened a Stripe Payment Link. Carries `value`, `currency` and `items`. |
| `kit_click` | no | A reader moved toward a product page. A funnel step; marking it would inflate the conversion rate with intent that costs nothing. |
| `email_signup` | your call | Marking it is defensible. Decide once and leave it. |
| `page_view`, `scroll_depth`, `outbound_click`, `tool_use` | no | Engagement, not outcome. |

An event has to have been **collected at least once** before it appears in
that list. To mark one before it has fired, use `Create event` to declare the
name, or send yourself a test click first — with `?sa_internal=1` on the URL,
so your own test does not land in the reports (see §4).

`begin_checkout` is a GA4 *recommended* event, so `value`, `currency` and
`items` are understood with no further setup and it feeds the ecommerce
purchase-journey report. It is **not** a key event by default — only
`purchase` is.

**`value` is not revenue.** It fires when the reader opens Stripe. Nothing on
this site knows whether the payment completed, so read it as intent priced at
list. Real revenue lives in Stripe, and
`client_reference_id` is what joins the two — see the comment in
`Base.astro` for the `source__b64payload` format.

## 2. Register the custom dimensions

`Admin → Data display → Custom definitions → Create custom dimension`.
Scope **Event** for all of these. The limit is 50 event-scoped dimensions on a
standard property, so this is not a tight budget.

| Dimension name | Event parameter | What it answers |
|---|---|---|
| Partner | `partner` | Which affiliate earns. `make`, `tidio`, `systeme`, … |
| Source tag | `source_tag` | Which *placement* earned it — `tools-hero`, `stocky-swap-n1`. The `?source=` on the `/go/` link. |
| Source page | `source_page` | Which page the click happened on. |
| Product | `product` | `complete-kit`, `capi-shield`, … |
| CTA source | `cta_source` | The `data-cta` string, i.e. which CTA slot. |
| Link text | `link_text` | Which anchor wording earns clicks. |
| Link position | `link_position` | Depth down the page, in tens; `sticky` for the fixed CTA. |
| AI source | `ai_source` | `perplexity`, `chatgpt`, `claude`, `gemini`, `copilot`, or empty. |
| Landing path | `landing_path` | The page that started the session. |

`partner` and `source_tag` are separate dimensions on purpose. Until
21 Sep 2026 the tracker sent one mangled value — `make/?source=tools-n1` —
because it sliced the slug off the raw `href` and every `/go/` link on the
site carries a `?source=`. That is one distinct partner value per placement,
so *nothing* could be grouped by partner. `partner` now says who pays and
`source_tag` says which placement earned it, which is the pair that makes
"which page earns money" a question GA4 can answer.

Good first report: **Explore → Free form**, rows `Source page`, columns
`Partner`, metric `Key events`.

## 3. The AI assistant channel

`Admin → Data display → Channel groups → Create new channel group`. Name it
something like `Default + AI`, add a channel **AI Assistant**, and drag it
**above** Organic Search and Referral — channel rules are first-match-wins.

Condition — `Source` **matches regex**:

```
^(perplexity|chatgpt|claude|gemini|copilot)$|^(www\.)?(perplexity\.ai|chatgpt\.com|chat\.openai\.com|openai\.com|claude\.ai|gemini\.google\.com|bard\.google\.com|aistudio\.google\.com|copilot\.microsoft\.com|copilot\.cloud\.microsoft|m365\.cloud\.microsoft)$
```

Both halves are needed, and they do different jobs.

The **first half** matches the canonical values the tag now sets. When it sees
a referrer from a known assistant *and* the URL carries no `utm_source`, it
sets `campaign_source` to one canonical slug and leaves `campaign_medium` as
`referral`. That collapses `chatgpt.com`, `chat.openai.com` and `openai.com`
into a single `chatgpt` line instead of three. The medium stays `referral`
deliberately: inventing one — `ai_assistant`, say — would drop all of this
traffic into **Unassigned** in the *default* channel group, which is the
report you will forget you stopped being able to trust.

The **second half** matches raw hostnames. It catches history collected
before this shipped (custom channel groups do apply to data already in the
property, but the canonicalisation only starts now), and any visit where the
tag did not get to run.

**The honest limit.** Assistants that strip the `Referer` header arrive as
Direct, and no channel group and no client-side code can recover a referrer
the browser never sent. So this line is a floor on GEO traffic, not a
measurement of it. `ai_source` as a dimension has exactly the same blind
spot — it is derived from the same referrer. Treat the number as "AI traffic
we can prove", and do not quietly start reporting it as "AI traffic".

Given the property's history — see the GSC section of `CLAUDE.md`, and a
desktop CTR of 0.03% against 3.86% on mobile — expect this channel to be
small and to contain machine retrieval as well as people. It is worth having
because it is a line you can watch, not because it will be large.

## 4. Define internal traffic

Two mechanisms. **Set up both**; each one covers the other's failure.

### a. The IP rule (primary)

`Admin → Data collection and modification → Data streams` → the web stream →
`Configure tag settings` → `Show all` → `Define internal traffic` → `Create`.

- **Rule name:** anything, e.g. `Home`.
- **traffic_type value:** leave it as `internal`. The filter in §4c matches
  this exact string.
- **Match type:** `IP address equals` for a single address, or
  `IP address is in range (CIDR notation)` for a block.

Get your addresses:

```sh
curl -4 https://ifconfig.me   # IPv4
curl -6 https://ifconfig.me   # IPv6, if your ISP gives you one
```

Add a rule for each. Add the phone on mobile data too if you browse the site
that way — it is a different address entirely.

### b. The device flag (backstop)

A home IP moves. The day it does, the IP rule silently stops matching and
your own visits start landing in the reports again with nothing to indicate
that they have. So the browser can mark itself instead, once:

```
https://stackarchitect.xyz/?sa_internal=1   # mark this browser internal
https://stackarchitect.xyz/?sa_internal=0   # undo it
```

The flag is kept in `localStorage`, so it survives sessions and does not
depend on the address you happen to be on. It sets exactly the same
`traffic_type=internal` parameter the IP rule does, so it needs no extra
filter. Do this in every browser and profile you use, including your phone.

It is a backstop, not a replacement: clearing site data clears it, and it
needs JavaScript. That is why the IP rule stays primary.

Note that events are **tagged, not dropped** — they are still sent, carrying
`traffic_type=internal`. The exclusion is the filter's job, which is what
lets you verify it in Testing (below) before anything is thrown away.

### c. Activate the filter

`Admin → Data collection and modification → Data filters`. A filter called
**Internal Traffic** already exists on every property, and it ships in
**Testing**, which means *it is doing nothing*. This is the step people miss.

1. Leave it in `Testing` for a day.
2. Verify: `Explore → Free form`, add the dimension **Test data filter name**.
   Your own sessions should appear under the internal-traffic filter's name
   and nobody else's should. Check both mechanisms — visit from your IP, and
   from a browser you flagged with `?sa_internal=1`.
3. When it looks right, set the filter state to **Active**.

Only then is anything excluded, and only from that moment forward.

## 5. What is deliberately *not* here

**No server-side events.** The `/go/*` Pages Function knows about every hit
including the crawlers, and sending from there would be more complete. It is
not done on purpose: `functions/go/_bots.js` is the single source of truth for
what counts as a crawler, and the `clicks` / `bot_hits` tables in D1 are where
that judgement is recorded. A second, differently-filtered count of the same
clicks in GA4 would not reconcile with D1, and the first time the two
disagreed nobody would know which to believe.

GA4 therefore measures **real browser clicks only**, and D1 measures every
request. They answer different questions, and that is the intended
arrangement. When you want a bot-inclusive figure, query D1 — the queries are
in `schema/003-affiliate-clicks.sql` and `schema/004-bot-hits.sql`.

**No Measurement Protocol, no GTM container.**

## 6. Consent, and what it does to the numbers

GA4 only runs for visitors who press Accept on the consent banner. Before
that, gtag.js is not loaded at all, so there is no cookieless modelling
either: a visitor who ignores or rejects the banner is simply absent from
GA4. Expect GA4 totals to sit well below D1's `clicks` counts, which are
cookieless and counted whatever the visitor chose. Compare the two as a
ratio over time, not as equal figures.

Accept grants `analytics_storage` only. The three ad signals stay denied,
so leave Google signals off in `Admin → Data collection`; turning it on
would do nothing useful and would read as a promise the banner does not make.
How it works is in `CLAUDE.md` (Analytics) and the comments in `Base.astro`.
