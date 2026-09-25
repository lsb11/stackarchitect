# Affiliate links

## Where a cloak lives

Every partner link goes through a `/go/<slug>` cloak. A cloak is declared in
two places, and `scripts/claims-guard.mjs` fails the build if they disagree:

- `functions/go/_cloaks.js` holds the destination, the partner's sub-ID
  parameter and the plain vendor URL the crawler gate uses.
- `public/_redirects` holds both slash variants as `302`. This is the fallback
  if the Function fails.

Tests for the resolver are in `functions/go/cloak.test.js`.

## Partners (25 Sep 2026)

| Slug | Partner | Network |
|---|---|---|
| `beehiiv` | beehiiv | direct (`via=`) |
| `getresponse` | GetResponse | PartnerStack |
| `gorgias` | Gorgias | PartnerStack |
| `make` | Make.com | direct (`pc=`) |
| `systeme` | Systeme.io | direct (`sa=`) |
| `tidio`, `tidio-ai`, `tidio-pricing` | Tidio | PartnerStack |
| `workspace` | Google Workspace | Google referral programme |

Gorgias and Tidio both pay, and `apps.json` recommends replacing Gorgias with
Tidio. The owner restored `/go/gorgias` on 25 Sep 2026 knowing this. The build
allows it through one named exception, `GORGIAS_BOTH_SIDES` in
`claims-guard.mjs`. The pages that compare the two say in words that both
pay. Any other cloak that points at a vendor in `apps.json` still fails the
build.

## Rules for a placement

The build enforces these. `content-quality-guard.mjs` checks the caps and
`affiliate-disclosure-guard.mjs` checks disclosure order:

- At most 1 affiliate button and 3 inline affiliate links per page.
- The disclosure (`<Disclosure />`, or text that states the relationship)
  comes before the first affiliate link on the page.
- Every affiliate link has `rel="sponsored nofollow noopener"`. The Markdown
  pipeline adds it to `/go/` links automatically.

These are conventions. No guard checks them yet:

- The button goes to the partner most relevant to the page's main topic. It
  sits after the section where the reader understands the solution, never
  above the first H2. A page with no relevant partner gets no button.
- Link text says what happens next ("Create a free Make.com account"), with
  no figures or claims packed into the anchor.
- Inline affiliate links only in a sentence that names the tool.
- Each link carries `?source=<page-slug>-<placement>`, unique on the site.
  The resolver caps a tag at 64 characters. The one page whose slug is too
  long for that,
  `/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/`,
  keeps `google-apps-script-quotas-floating-cta`.

GA4 receives `affiliate_click` with `partner` and `source_tag` from the single
tracker in `Base.astro`. D1 counts every request in `clicks`. A new cloak
needs no analytics change.

## Monitoring: `npm run aff:check`

`scripts/aff-check.mjs` requests every cloak's destination, follows each
redirect by hand, and checks that the final page is 2xx and still carries the
referral credential (`TRACKING` in the script names it per partner). It is
not part of the build, because a partner outage must not block a deploy.

- **OK**: 2xx, and the credential is present.
- **FAIL** (exit 1): 4xx/5xx, network error, redirect loop, or the credential
  was stripped.
- **UNVERIFIED**: the partner blocks scripts (Cloudflare challenge), or the
  link forwards in JavaScript. Open it in a browser. `--strict` turns this
  into a failure.

On 25 Sep 2026: 7 OK, 2 UNVERIFIED, 0 failed. Both unverified links were then
checked by hand in a browser. `make` blocks every scripted request with a
403 challenge, but a browser reaches the sign-up page with `pc=techie123`.
`workspace` forwards in JavaScript to
`workspace.google.com/landing/partners/referral/…&utm_content=NSRLIO3`.

`tests/aff-check.test.js` (in `npm test`) fails if a cloak has no `TRACKING`
entry, so a new cloak cannot go unmonitored.

Run it after adding or changing a cloak, and whenever a partner's dashboard
shows clicks falling off.
