# Stack Architect Video Production Build

Goal: replace the current YouTube iframe hero with a self-hosted, schema-rich, 
multi-cut video system optimized for max conversion, organic SEO, GEO, and 
AI citation ranking.

## Project structure

Create a sibling project: `../stackarchitect-video/`

```bash
cd ..
npm create video@latest -- --template=blank stackarchitect-video
cd stackarchitect-video
npm install --save remotion @remotion/bundler @remotion/renderer @remotion/google-fonts @remotion/captions @remotion/install-whisper-cpp @remotion/lottie canvas-confetti @vercel/og sharp
npm install --save-dev playwright @types/canvas-confetti
npx playwright install chromium
brew install ffmpeg
```

## Folder layout

```
src/
  Root.tsx                         # registers all 3 compositions
  compositions/
    HeroLoop.tsx                   # 16:9, 1920x1080, 450 frames (15s @ 30fps), no VO, captions only
    HeroLong.tsx                   # 16:9, 1920x1080, 900 frames (30s), full VO
    YouTubeShort.tsx               # 9:16, 1080x1920, 840 frames (28s), full VO + loop hook
  components/
    Caption.tsx                    # burned-in subtitle, scene-aware sizing
    Logo.tsx                       # Stack Architect logo, optional Lottie
    BillingDashboard.tsx           # scene 1: Shopify Apps page mock with red pulse
    VillainStrike.tsx              # scene 2: animated logo + red strikethrough
    ReplacementGrid.tsx            # scene 3: paid → free swap animation
    ScenarioBuild.tsx              # scene 4: Make.com webhook + branches (animated)
    ProofTiles.tsx                 # scene 5: verified mechanic checkmarks + confetti
    OfferSplit.tsx                 # scene 6: free vs $29 dual card
    LoopHook.tsx                   # scene 7: CTA + brief flash to opening frame
    Confetti.tsx                   # rendered confetti via canvas-confetti
  data/
    script.ts                      # SOURCE OF TRUTH: timing, VO chunks, captions
    brand.ts                       # color tokens from stackarchitect index.astro
  scripts/
    generate-voiceover.ts          # ElevenLabs API call, idempotent
    generate-captions.ts           # Whisper.cpp local SRT generation
    capture-broll.ts               # Playwright captures (optional, mocks fallback)
    generate-posters.ts            # Sharp + Remotion still for 3 aspect ratios
    deploy-to-site.ts              # copy outputs to ../stackarchitect/public/videos/

public/
  audio/voiceover.mp3              # generated
  audio/voiceover.json             # Whisper timing JSON
  captions/voiceover.srt           # generated
  captions/voiceover.vtt           # converted
  logos/                           # download SVGs: klaviyo, elevar, triple-whale, stocky, make-com, systeme-io, google-sheets
  lottie/logo-entrance.json        # Lottie of stackarchitect logo entry (download or build)
  broll/                           # optional Playwright captures
  out/                             # final renders go here
```

## Brand tokens — copy from stackarchitect/src/pages/index.astro CSS vars

`data/brand.ts`:
```ts
export const BRAND = {
  bg: '#020617',
  bg2: '#06101e',
  bg3: '#0a1628',
  bg4: '#0f1f35',
  green: '#00c864',
  greenDim: '#00a854',
  greenGlow: 'rgba(0,200,100,.3)',
  greenBg: 'rgba(0,200,100,.08)',
  border: '#1e293b',
  border2: '#263548',
  text: '#f1f5f9',
  text2: '#cbd5e1',
  text3: '#94a3b8',
  red: '#fc8181',
  redBg: 'rgba(252,129,129,.07)',
  amber: '#fcd34d',
  pro: '#fbbf24',
  proBg: 'rgba(251,191,36,.07)',
  fontSans: 'Inter',
  fontMono: 'JetBrains Mono',
};
```

Use `@remotion/google-fonts/Inter` (weights 400, 700, 900) and 
`@remotion/google-fonts/JetBrainsMono` (weights 500, 700). Pre-load via 
continueRender pattern.

## script.ts — SINGLE SOURCE OF TRUTH

```ts
// All frames at 30fps. YouTubeShort uses full timeline. HeroLong uses [0-900]. HeroLoop uses [0-450] silent.
export const FPS = 30;
export const TOTAL_FRAMES_SHORT = 840;     // 28s
export const TOTAL_FRAMES_HERO_LONG = 900; // 30s — adds 2s breathing on offer split
export const TOTAL_FRAMES_HERO_LOOP = 450; // 15s — silent loop

export const URL = 'stackarchitect.xyz';

export const SCENES = [
  {
    id: 'hook',
    start: 0,
    end: 45,
    voText: 'Your Shopify store is leaking $700 a month.',
    captionLines: ['$847/MO LEAK'],
    captionPosition: 'top',
    captionSize: 96,
    captionColor: 'text',
    visual: 'BillingDashboard',
    accent: 'red',
  },
  {
    id: 'villains',
    start: 45,
    end: 135,
    voText: 'Klaviyo. Elevar. Triple Whale. Stocky.',
    captionLines: ['KLAVIYO', 'ELEVAR', 'TRIPLE WHALE', 'STOCKY'],
    captionPosition: 'top',
    captionSize: 88,
    captionColor: 'red',
    captionMode: 'sequential',
    visual: 'VillainStrike',
    villains: ['klaviyo', 'elevar', 'triple-whale', 'stocky'],
  },
  {
    id: 'replacements',
    start: 135,
    end: 255,
    voText: 'Every paid app draining your store has a free version that works just as well.',
    captionLines: ['FREE REPLACEMENTS'],
    captionPosition: 'top',
    captionSize: 80,
    captionColor: 'green',
    visual: 'ReplacementGrid',
    pairs: [
      { from: 'klaviyo', to: 'systeme-io' },
      { from: 'elevar', to: 'make-com' },
      { from: 'triple-whale', to: 'google-sheets' },
      { from: 'stocky', to: 'make-com' },
    ],
  },
  {
    id: 'mechanism',
    start: 255,
    end: 465,
    voText: "One Make.com webhook handles server-side tracking, inventory, P&L and email — for $0.",
    captionLines: ['ONE WEBHOOK', '$0/MONTH'],
    captionPosition: 'middle',
    captionSize: 60,
    captionColor: 'text',
    visual: 'ScenarioBuild',
    branches: ['Meta CAPI', 'Google Enhanced', 'TikTok Events', 'Sheets P&L'],
  },
  {
    id: 'proof',
    start: 465,
    end: 645,
    voText: "Make.com's free tier handles it. Shopify's killing Stocky August 31st. Klaviyo charges per profile now. We've documented every source.",
    captionLines: ['VERIFIED CLAIMS'],
    captionPosition: 'top',
    captionSize: 72,
    captionColor: 'green',
    visual: 'ProofTiles',
    proofs: [
      { label: 'Make.com free tier', source: 'make.com/pricing', frame: 495 },
      { label: 'Stocky shutdown', source: 'Aug 31, 2026', frame: 540 },
      { label: 'Klaviyo Feb 2025', source: 'per-profile billing', frame: 600 },
    ],
    confettiAt: 600,
  },
  {
    id: 'offer',
    start: 645,
    end: 765,
    voText: "Free guides and tools at stackarchitect.xyz. Or skip the build — Complete Kit, $29, ten minutes to live.",
    captionLines: ['FREE OR $29', 'YOUR CALL'],
    captionPosition: 'bottom',
    captionSize: 68,
    captionColor: 'text',
    visual: 'OfferSplit',
  },
  {
    id: 'cta',
    start: 765,
    end: 840,
    voText: 'stackarchitect dot xyz.',
    captionLines: ['stackarchitect.xyz'],
    captionPosition: 'middle',
    captionSize: 80,
    captionColor: 'green',
    captionFont: 'mono',
    visual: 'LoopHook',
    flashOpeningAt: 825, // brief flash of $847/MO LEAK at frame 825 (loop trigger)
  },
];

// Full transcript for VideoObject schema and on-page transcript display
export const TRANSCRIPT = SCENES.map(s => s.voText).join(' ');
```

## Compositions — implementation rules

**HeroLoop (15s, silent, looped):**
- Renders SCENES[0..3] only (hook, villains, replacements, partial mechanism)
- NO Audio component
- Slightly slower pacing on hook (60 frames not 45) — sound-off needs more read time on the dollar number
- Final frame must visually rhyme with first frame for seamless loop
- 16:9 aspect, 1920×1080, 30fps
- Background: `<AbsoluteFill>` with brand.bg + radial gradient overlay matching `bg-grid` pattern from index.astro

**HeroLong (30s, full VO, sound-on):**
- All SCENES, 900 frames total (extra 60 frames padding on offer split)
- 16:9 aspect, 1920×1080, 30fps
- Audio: `<Audio src={voiceoverMp3}/>` aligned at frame 0
- Captions: bottom 25%, 56px Inter Black, white, drop shadow `0 4px 16px rgba(0,0,0,.6)`
- Final frame: static logo + URL, no loop hook (this isn't looped)

**YouTubeShort (28s, full VO, vertical, loop hook):**
- All SCENES, 840 frames total
- 9:16 aspect, 1080×1920, 30fps
- CRITICAL: keep all important visuals 10% inside frame edges (mobile thumb safe zone)
- Captions: top third for hook/villains/replacements, mid for mechanism, bottom for offer/cta
- 96px on hook, 88px villains, 80px most others, 60px mechanism (info density)
- Caption shadow: `0 6px 24px rgba(0,0,0,.7)` (heavier — read on busy mobile feeds)
- Audio: full voiceover.mp3
- LoopHook component MUST flash opening frame at 825 for replay psychology
- First frame is the SHOPIFY APPS BILLING dashboard with $847.32 highlighted — NOT the logo. Critical: the auto-play first frame is your only "thumbnail"

## Component implementation notes

**BillingDashboard.tsx (scene: hook):**
Build a stylized Shopify Admin Apps billing screenshot in pure CSS/divs. 
DON'T use a real screenshot — control the styling. Layout:
- Top: "Apps" tab indicator (matches Shopify Admin grey)
- Rows of fake apps with monthly costs: "Klaviyo $400.00", "Elevar $199.00", "Triple Whale $249.00", "Stocky free", "Misc $-0.68 (test)"
- Total row at bottom: "Total this month: $847.32"
- Frame 15: red pulse circle animates around the "$847.32" total (interpolate scale 0.8→1.2→1.0, opacity 0→1→0.6, color brand.red)
- Frame 30: caption "$847/MO LEAK" punches in from top (translateY -100→0, opacity 0→1)
- Use brand.bg2 as panel background, brand.border for row dividers, brand.text2 for app names, brand.red for the total when it pulses

**VillainStrike.tsx (scene: villains):**
- Each logo enters at frame: 45+(i*22) (so 45, 67, 89, 111)
- Logo enters: scale 0.5→1.0, opacity 0→1, easing easeOutBack
- Red strikethrough draws across logo 8 frames after entry: stroke-dasharray animation, brand.red, 6px stroke
- After 4th villain at frame 111, all 4 logos compress to a 2x2 grid, frame 120-135
- Brand color of each logo: keep authentic where possible (Klaviyo black, Elevar blue, etc.) — recognizability beats brand consistency in this scene

**ReplacementGrid.tsx (scene: replacements):**
- Frame 135: 2x2 grid of paid logos visible (carry over from previous scene)
- Frame 150: paid logos start fading + shrinking (scale → 0.7, opacity → 0.3)
- Frame 165: green replacement logos rise from below (translateY 60→0, opacity 0→1) overlaying paid logos
- Frame 195-255: replacement logos pulse with brand.green glow (box-shadow interpolation)
- Caption "FREE REPLACEMENTS" punches in at frame 180

**ScenarioBuild.tsx (scene: mechanism):**
- This is the visual centerpiece. Animate a Make.com-style scenario builder from scratch:
- Frame 255: blank canvas (brand.bg3, dotted grid pattern)
- Frame 270: Webhook node draws (left side, hexagon shape, brand.green stroke, label "Shopify Webhook")
- Frame 285: connecting line draws right
- Frame 300: Router node appears (center, diamond)
- Frame 315-380: Four branches draw outward from router, each ending in a destination node:
  - Top branch → "Meta CAPI" (blue)
  - Right-top → "Google Enhanced" (yellow/red Google colors)
  - Right-bottom → "TikTok Events" (pink/cyan TikTok)
  - Bottom → "Sheets P&L" (Google Sheets green)
- Frame 380-420: data packets (small green dots) flow from webhook → router → out to each destination, animated with `interpolate`
- Frame 420-465: each destination node lights up brand.green when packet arrives (success state)
- Caption "ONE WEBHOOK" frame 270, "$0/MONTH" frame 400 (lower position)

**ProofTiles.tsx (scene: proof):**
- 3 horizontal tiles, each appears at its `frame` from script.ts data
- Each tile: card style (brand.bg3, brand.border, 1px stroke, 8px radius)
- Inside each tile:
  - Green checkmark (animated draw via SVG stroke-dasharray, 12 frames)
  - Bold label (Inter 600, 24px, brand.text)
  - Source line (mono, 14px, brand.text3)
- Tile 1 enters frame 495: "Make.com free tier — make.com/pricing"
- Tile 2 enters frame 540: "Stocky shutdown — Aug 31, 2026"
- Tile 3 enters frame 600: "Klaviyo Feb 2025 — per-profile billing"
- AT FRAME 600 (third checkmark): trigger Confetti.tsx — green particle burst, 80 particles, 1.5s decay
- Caption "VERIFIED CLAIMS" punches in frame 480

**OfferSplit.tsx (scene: offer):**
- Frame 645: split screen 50/50, animated divider grows from center
- Left half: "FREE STACK" — brand.green border, brand.greenBg fill, list of 4 free tools (CAPI Shield, Stocky Swap, P&L Auto, Replace Klaviyo) with checkmarks
- Right half: "COMPLETE KIT — $29" — brand.pro border, brand.proBg fill, "10 minutes to live", "JSON blueprints", "30-day guarantee"
- Frame 700: subtle glow pulses on both panels alternating (signals "your choice")
- Caption "FREE OR $29 / YOUR CALL" enters frame 700, two lines stacked

**LoopHook.tsx (scene: cta):**
- Frame 765: clear screen with brand.bg + radial green glow center
- Frame 780: Lottie logo entrance (scale + rotation entry, 30 frames)
- Frame 810: URL appears below logo "stackarchitect.xyz" mono 80px brand.green
- Frame 825-832: VERY brief (7 frame, ~0.23s) flash of opening frame composition (the $847/MO LEAK dashboard) — primes loop replay
- Frame 832-840: snap back to logo + URL for clean final frame

## Voiceover generation

`scripts/generate-voiceover.ts`:
- Read script.ts SCENES[].voText, concatenate with SSML pauses:
  - 200ms pause between scenes for natural breath
  - 150ms emphasis pause before "$700", "$0", "$29"
- Use Eleven Labs API endpoint POST /v1/text-to-speech/{voice_id}
- Voice: Brian (free tier, voice_id: nPczCjzI2devNBz1zQrb)
- Model: eleven_turbo_v2_5
- Voice settings: { stability: 0.45, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true }
- Speaking rate: 1.05 (set via SSML `<prosody rate="105%">`)
- Save to public/audio/voiceover.mp3
- Hash script.ts content, save to .voiceover-hash. Skip regeneration if hash matches.
- Read ELEVENLABS_API_KEY from .env.local

If ElevenLabs free tier hits limit, fall back to MacOS native `say` command 
with voice "Daniel" (British male) piped through ffmpeg to mp3. Note in 
console which path was used.

## Caption generation

`scripts/generate-captions.ts`:
- Use @remotion/install-whisper-cpp on first run
- Run model=base.en on public/audio/voiceover.mp3
- Output public/captions/voiceover.srt + voiceover.json (with word-level timings)
- Convert SRT to VTT for the <track> element: simple format swap
- The Caption component will use voiceover.json for frame-accurate burned-in captions

## Playwright B-roll (optional)

`scripts/capture-broll.ts`:
- Try to record real Make.com scenario footage if MAKE_AUTH_STATE_PATH env exists
- Otherwise skip — the React-based ScenarioBuild component is more controlled and on-brand anyway
- This is intentionally optional. Don't block the build on it.

## Posters (3 aspect ratios for VideoObject schema)

`scripts/generate-posters.ts`:
- Render still frame 30 from HeroLong composition (the "$847/MO LEAK" payoff moment) at:
  - 1920×1080 → resize to 1280×720 → JPEG q85 → hero-poster-16x9.jpg
  - Same source → crop to 1024×768 → hero-poster-4x3.jpg
  - Same source → crop to 1080×1080 → hero-poster-1x1.jpg
- Use sharp for resize/crop/quality
- All three published to ../stackarchitect/public/videos/

## Render commands

`package.json`:
```json
{
  "scripts": {
    "audio": "tsx scripts/generate-voiceover.ts",
    "captions": "tsx scripts/generate-captions.ts",
    "broll": "tsx scripts/capture-broll.ts",
    "render:loop": "remotion render src/index.ts HeroLoop public/out/hero-loop.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p",
    "render:loop:webm": "remotion render src/index.ts HeroLoop public/out/hero-loop.webm --codec=vp9 --crf=32",
    "render:long": "remotion render src/index.ts HeroLong public/out/hero-long.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p",
    "render:short": "remotion render src/index.ts YouTubeShort public/out/short.mp4 --codec=h264 --crf=20 --pixel-format=yuv420p",
    "posters": "tsx scripts/generate-posters.ts",
    "deploy": "tsx scripts/deploy-to-site.ts",
    "build": "npm run audio && npm run captions && npm run render:loop && npm run render:loop:webm && npm run render:long && npm run render:short && npm run posters && npm run deploy",
    "build:fast": "npm run render:loop && npm run render:long && npm run render:short"
  }
}
```

## Astro homepage update

After build, modify `../stackarchitect/src/pages/index.astro`:

1. Replace the iframe block at lines 493-498:

```astro
<div class="hero-video-wrap">
  <div class="hero-video-glow"></div>
  <div class="hero-video-box-wide">
    <video 
      autoplay muted loop playsinline preload="metadata"
      poster="/videos/hero-poster-16x9.jpg"
      width="1920" height="1080"
      aria-label="Stack Architect — replace $700 of paid Shopify apps for free"
    >
      <source src="/videos/hero-loop.webm" type="video/webm">
      <source src="/videos/hero-loop.mp4" type="video/mp4">
    </video>
  </div>
  <div class="hero-video-caption">15-second overview · Looped silent — <a href="#full-overview">watch full version with sound ↓</a></div>
</div>
```

2. Add a new "Full Overview" section after the diagnostic, before the Solutions:

```astro
<section id="full-overview" class="section">
  <div class="inner-md">
    <div class="sec-head">
      <span class="tag">30-second overview · How the stack works</span>
      <h2>The complete fix in 30 seconds</h2>
    </div>
    <div class="hero-video-wrap">
      <div class="hero-video-box-wide">
        <video 
          controls preload="metadata"
          poster="/videos/hero-poster-16x9.jpg"
          width="1920" height="1080"
        >
          <source src="/videos/hero-long.mp4" type="video/mp4">
          <track kind="captions" src="/videos/voiceover.vtt" srclang="en" label="English" default>
        </video>
      </div>
      <details class="hero-transcript">
        <summary>Read transcript</summary>
        <p>{TRANSCRIPT_FROM_SCRIPT_TS}</p>
      </details>
    </div>
  </div>
</section>
```

3. Update CSS in the existing `<style>` block:
```css
.hero-video-box-wide {
  padding-bottom: 56.25%;
  max-width: 720px;
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0,200,100,.25);
  background: var(--bg-3);
  box-shadow: 0 24px 60px rgba(0,0,0,.5), 0 0 40px rgba(0,200,100,.08);
}
.hero-video-box-wide video {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}
.hero-transcript {
  font-size: 14px;
  color: var(--text-3);
  margin-top: 24px;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}
.hero-transcript summary {
  cursor: pointer;
  color: var(--g);
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: .1em;
  text-transform: uppercase;
  padding: 8px 0;
}
.hero-transcript p {
  padding: 16px;
  background: var(--bg-2);
  border-radius: 8px;
  border-left: 2px solid var(--g);
  margin-top: 8px;
  line-height: 1.7;
}
```

4. Add VideoObject JSON-LD inside the existing schema graph (find the @graph 
array around line 100-180 in index.astro and append):

```json
{
  "@type": "VideoObject",
  "@id": "https://stackarchitect.xyz/#hero-video",
  "name": "Your Shopify Store Is Leaking $700/Month — The Free Fix in 6 Minutes",
  "description": "30-second overview of how Shopify stores replace $700+/month of paid apps (Klaviyo, Elevar, Triple Whale, Stocky) with free server-side tracking, inventory, email, and P&L tools running on Make.com's free tier. EMQ 8+, iOS-proof, no code, deploys in 6 minutes. Includes 7 free tools and an optional $29 Complete Kit.",
  "thumbnailUrl": [
    "https://stackarchitect.xyz/videos/hero-poster-1x1.jpg",
    "https://stackarchitect.xyz/videos/hero-poster-4x3.jpg",
    "https://stackarchitect.xyz/videos/hero-poster-16x9.jpg"
  ],
  "uploadDate": "2026-04-27T15:00:00+01:00",
  "duration": "PT30S",
  "contentUrl": "https://stackarchitect.xyz/videos/hero-long.mp4",
  "embedUrl": "https://stackarchitect.xyz/#hero-video",
  "transcript": "[INSERT FULL TRANSCRIPT FROM script.ts AT BUILD TIME]",
  "publisher": {
    "@type": "Organization",
    "@id": "https://stackarchitect.xyz/#org",
    "name": "Stack Architect",
    "logo": {
      "@type": "ImageObject",
      "url": "https://stackarchitect.xyz/og.png",
      "width": 1200,
      "height": 630
    }
  },
  "potentialAction": {
    "@type": "SeekToAction",
    "target": "https://stackarchitect.xyz/#t={seek_to_second_number}",
    "startOffset-input": "required name=seek_to_second_number"
  }
}
```

5. Remove the old hero image preload on line 231 (CloudFront URL pointing at 
the old Gemini hero). Verify it's not referenced elsewhere first with:
`grep -n "69a093a668d36" src/pages/index.astro` — if only line 231, delete it.

6. Optionally add the same Open Graph video tags to <head>:
```astro
<meta property="og:video" content="https://stackarchitect.xyz/videos/hero-long.mp4">
<meta property="og:video:type" content="video/mp4">
<meta property="og:video:width" content="1920">
<meta property="og:video:height" content="1080">
```

## Deploy script

`scripts/deploy-to-site.ts`:
```ts
// Copies all final outputs into ../stackarchitect/public/videos/
// Files to copy:
//   public/out/hero-loop.mp4 → ../stackarchitect/public/videos/hero-loop.mp4
//   public/out/hero-loop.webm → ../stackarchitect/public/videos/hero-loop.webm
//   public/out/hero-long.mp4 → ../stackarchitect/public/videos/hero-long.mp4
//   public/out/short.mp4 → KEEP in this project for manual YouTube upload
//   public/captions/voiceover.vtt → ../stackarchitect/public/videos/voiceover.vtt
//   public/audio/voiceover.mp3 → ../stackarchitect/public/videos/voiceover.mp3 (optional, for audio-only listeners)
//   posters/*.jpg → ../stackarchitect/public/videos/

// Use fs.copyFileSync. Create dirs if missing.
// Print final size summary so user knows what's been added.
```

## Execution order

1. Run setup (`npm install` etc.)
2. Build all components and script.ts FIRST. Use placeholder silent audio. 
   Render HeroLong as a sanity check — verify visual timing matches script.ts.
3. Generate ElevenLabs voiceover (`npm run audio`). Listen to it. If wording 
   feels off, edit script.ts and regen.
4. Generate Whisper captions (`npm run captions`)
5. Render all three compositions (`npm run render:loop && render:loop:webm && render:long && render:short`)
6. Generate posters (`npm run posters`)
7. Run deploy script (`npm run deploy`)
8. In stackarchitect repo, update src/pages/index.astro per the Astro section above
9. `git diff` review the index.astro changes — confirm before committing
10. `git add -A && git commit -m "feat: replace YouTube iframe hero with self-hosted video system + VideoObject schema + transcript" && git push`
11. Watch Cloudflare Pages deploy
12. Verify production: 
    - Open https://stackarchitect.xyz in incognito
    - Confirm hero video autoplays muted, loops cleanly
    - Confirm captions render burned-in
    - Click into below-fold full version, confirm sound + subtitle track work
    - Expand transcript, confirm it matches VO
    - Test schema at https://validator.schema.org/ — paste homepage URL, confirm VideoObject parses
13. Manually upload `public/out/short.mp4` to YouTube as a new Short:
    - Title: "Replace $700/month of Shopify apps for free | Stack Architect"
    - Description first line: "Free Shopify automation stack — replace Klaviyo, Elevar, Triple Whale, Stocky for $0. Live in 6 minutes. stackarchitect.xyz"
    - Hashtags (line 3): #shopify #shopifyapps #ecommerce #klaviyo #makecom
    - Pinned comment: "Free tools + step-by-step guides: stackarchitect.xyz"
    - Upload custom captions: use voiceover.srt as the captions file (don't rely on auto-captions for ranking)
    - Schedule for Tuesday or Wednesday 18:00-20:00 UK time (peak Shopify operator browsing window per UK B2B research)

## Quality bar — verify before shipping

- [ ] HeroLoop first frame is the billing dashboard with $847.32, NOT the logo
- [ ] HeroLoop final frame visually rhymes with first frame (seamless loop)
- [ ] YouTubeShort first frame same as HeroLoop first frame (consistency across platforms)
- [ ] Burned-in captions visible at all times in HeroLoop and YouTubeShort
- [ ] HeroLong has WebVTT track for accessibility
- [ ] All three videos use exact same brand colors as index.astro CSS vars
- [ ] Transcript on page matches VO word-for-word
- [ ] VideoObject schema validates at validator.schema.org
- [ ] Posters generated at 3 aspect ratios
- [ ] Hero loop file size under 4MB (compressed for fast LCP)
- [ ] Long file size under 12MB
- [ ] Short file size under 15MB
- [ ] Lighthouse Performance score on homepage >90 after change (vs current iframe)

Start with project setup. Confirm each milestone before continuing. When you 
reach the index.astro modification step, show me the diff before applying.
