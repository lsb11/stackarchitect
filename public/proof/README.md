# public/proof/ — screenshot evidence for /pro/ and /pro/{slug}/

These files are captured by hand and dropped in here. Nothing generates them.
Declared in `src/data/proofShots.ts`; rendered by `src/components/ProofShot.astro`.

Drop a file in and it appears on the next build — no code change needed. Its
`width`/`height` are read from the PNG header at build time, so the attributes
always match the asset and the layout never shifts.

**A missing file is not a build error.** The frame renders in `npm run dev` as a
reminder that the layout is waiting on an asset, and is absent entirely from a
production build. The reasoning is in `src/utils/proof.ts`: a broken image icon
on a page asking a stranger for card details is worse than no section at all.

## Expected files

| File | Appears on | Shows |
|---|---|---|
| `scenario-all-in-one.png` | `/pro/` hero (eager) | All four automations as one Make.com scenario |
| `scenario-stocky-swap.png` | `/pro/stocky-swap/` | Blueprint 03 on the Make.com canvas |
| `scenario-capi-shield.png` | `/pro/capi-shield/` | Blueprint 01 on the Make.com canvas |
| `scenario-tiktok-capi.png` | `/pro/tiktok-capi/` | Blueprint 02 on the Make.com canvas |
| `scenario-pnl-auto.png` | `/pro/pnl-auto/` | Blueprint 04 on the Make.com canvas |
| `proof-meta-events.png` | `/pro/capi-shield/` | Meta Events Manager: server event + match quality |
| `proof-tiktok-200.png` | `/pro/tiktok-capi/` | TikTok Events Manager: CompletePayment + HTTP 200 |
| `proof-sheets-rows.png` | `/pro/stocky-swap/`, `/pro/pnl-auto/` | Sheets log with real rows / Dashboard totals |

## Before committing a screenshot

1. **Redact IDs and tokens** — pixel IDs, access tokens, order IDs, customer data.
   The alt text and captions already say identifiers are redacted, so they must be.
2. **Pin the capture date** in `src/data/proofShots.ts` (`captured: '27 Aug 2026'`).
   Without it the caption falls back to the file's mtime, which is right for a
   screenshot saved straight in and wrong for one copied in later. `npm run dev`
   shows a note under any shot still relying on the fallback.
3. PNG only. The dimension reader parses the PNG IHDR chunk and nothing else.
