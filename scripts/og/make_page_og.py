"""
make_page_og.py — renders the per-page OG cards in public/og/ that carry
text, and records what each one says in scripts/og/og-images.json.

    python3 -m venv .venv-og && .venv-og/bin/pip install -r scripts/og/requirements.txt
    .venv-og/bin/python scripts/og/make_page_og.py

WHY THIS EXISTS
The per-page cards were made once, on 14 Jul 2026 (0e928b0), by a script that
never entered the repo. Two of them rotted where no grep could see:
og-complete-kit.png kept saying "$29 one-time" after the kit went to $24 and
then $19.99, and og-capi-shield.png kept saying "Meta & Google" after the site
stopped claiming Google. A price change is now a re-run of this file, and
tests/og-images.test.js fails when a card depicts a constant that has moved.

WHAT IT OWNS
Only the cards returned by cards() below. The other cards in public/og/ are still the
14 Jul bitmaps; their text is transcribed by hand into og-images.json so the
test can read it. To bring one under this script, add it to CARDS, re-run,
and delete its transcription.

LAYOUT
Everything that is the same on every card (grid, frame, corner brackets,
brand lockup, URL) is scripts/og/card-template.png: the 14 Jul CAPI Shield
card with its variable regions repainted as bare grid (`--rebuild-template`
shows how). Only the variable text is drawn here. Sizes, tracking and
baselines were fitted to the 14 Jul cards by pixel overlap, not by eye.
"""
import hashlib, json, re, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / 'scripts/og/card-template.png'
MANIFEST = ROOT / 'scripts/og/og-images.json'
FONT = str(ROOT / 'src/assets/fonts/Inter-%s.ttf')
SS = 2  # supersample

WHITE = (242, 246, 250); GREEN = (52, 211, 153); ORANGE = (245, 158, 11)
SLATE = (143, 166, 189); RULE = (73, 90, 110)
BG = (10, 22, 40); GRID = (14, 28, 50); GRID_MAJOR = (20, 39, 66)
# (weight, size, tracking px, pen x, baseline y)
EYEBROW = ('Bold', 24.7, 0.7, 76, 173)
HEADLINE = ('ExtraBold', 72, 0, 75, (300, 388))
PRICE = ('ExtraBold', 67, -2, 76, 510)       # "$19.99 one-time"
ZERO = ('ExtraBold', 86, -2, 76, 517)      # the big green "$0"
ASIDE = ('Regular', 30, 0, None, 517)        # small text after the "$0"
FOOTER = ('Regular', 24.5, 0.25, 76, 584)


def read_constant(name):
    """A numeric `export const NAME = n;` from src/data/products.ts."""
    src = (ROOT / 'src/data/products.ts').read_text()
    m = re.search(rf'export const {name}\s*=\s*([0-9.]+)\s*;', src)
    if not m:
        sys.exit(f'{name} not found in src/data/products.ts')
    return float(m.group(1))


def format_price(n):
    # mirrors formatPrice() in src/data/products.ts
    return f'${int(n)}' if float(n).is_integer() else f'${n:.2f}'


def cards():
    kit = read_constant('KIT_PRICE')
    return {
        'public/og/og-capi-shield.png': {
            'usedBy': ['/capi-shield/'],
            'eyebrow': 'CAPI SHIELD · META SERVER-SIDE TRACKING',
            'headline': ['Fix broken Meta Ads', 'attribution — free'],
            'zero': '$0', 'aside': "on Make.com's free plan",
            'footer': 'Meta Conversions API · Replaces Elevar · ~6-min setup',
            'depicts': {},
        },
        'public/og/og-complete-kit.png': {
            'usedBy': ['/pro/'],
            'eyebrow': 'THE COMPLETE KIT',
            'headline': ['Every scenario pre-built.', 'Live in 10 minutes.'],
            'price': f'{format_price(kit)} one-time',
            'footer': '4 Make.com blueprints · 2 Sheets templates · 30-day guarantee',
            'depicts': {'KIT_PRICE': kit},
        },
    }


def font(weight, size):
    return ImageFont.truetype(FONT % weight, size * SS)


def draw_text(d, x, baseline, text, style, fill):
    """Draws tracked text with its pen at x on baseline; returns ink (left, right)."""
    weight, size, track = style[:3]
    f = font(weight, size)
    pen = x * SS; left = right = None
    for ch in text:
        bb = f.getbbox(ch, anchor='ls')
        if bb[2] > bb[0]:
            left = pen + bb[0] if left is None else min(left, pen + bb[0])
            right = pen + bb[2] if right is None else max(right, pen + bb[2])
        d.text((pen, baseline * SS), ch, font=f, fill=fill, anchor='ls')
        pen += f.getlength(ch) + track * SS
    return left / SS, right / SS


def render(spec):
    base = Image.open(TEMPLATE).convert('RGB')
    W, H = base.size
    big = base.resize((W * SS, H * SS), Image.NEAREST)
    d = ImageDraw.Draw(big)

    l, r = draw_text(d, EYEBROW[3], EYEBROW[4], spec['eyebrow'], EYEBROW, SLATE)
    d.rectangle([(l - 2) * SS, 188 * SS, (r + 2) * SS, 190 * SS - 1], fill=RULE)

    for line, baseline in zip(spec['headline'], HEADLINE[4]):
        draw_text(d, HEADLINE[3], baseline, line, HEADLINE, WHITE)

    if 'price' in spec:
        draw_text(d, PRICE[3], PRICE[4], spec['price'], PRICE, ORANGE)
    else:
        _, r = draw_text(d, ZERO[3], ZERO[4], spec['zero'], ZERO, GREEN)
        draw_text(d, r + 22, ASIDE[4], spec['aside'], ASIDE, SLATE)

    draw_text(d, FOOTER[3], FOOTER[4], spec['footer'], FOOTER, SLATE)

    # Downsample, then keep the template's own pixels wherever no text landed,
    # so its 1px grid and frame lines stay exactly as they were.
    small = big.resize((W, H), Image.LANCZOS)
    changed = np.abs(np.asarray(small, int) - np.asarray(base, int)).sum(2) > 0
    return Image.composite(small, base, Image.fromarray((changed * 255).astype('uint8')))


def text_of(spec):
    out = [spec['eyebrow'], *spec['headline']]
    out += [spec['price']] if 'price' in spec else [f"{spec['zero']} {spec['aside']}"]
    return out + [spec['footer'], 'STACK ARCHITECT', 'stackarchitect.xyz']


def rebuild_template(source):
    """Repaints the variable regions of a 14 Jul card as bare grid."""
    im = Image.open(source).convert('RGB'); px = im.load()
    def grid(x, y):
        vx, hy = x % 40 == 0, y % 40 == 0
        vM, hM = x % 200 == 0, y % 200 == 0
        if vx and hy:
            return {(True, True): (25, 48, 79), (True, False): (22, 42, 71),
                    (False, True): (22, 42, 71)}.get((vM, hM), (17, 33, 58))
        if vx: return GRID_MAJOR if vM else GRID
        if hy: return GRID_MAJOR if hM else GRID
        return BG
    for (x0, y0, x1, y1) in [(40, 140, 1160, 546), (50, 555, 895, 600)]:
        for y in range(y0, y1):
            for x in range(x0, x1):
                px[x, y] = grid(x, y)
    im.save(TEMPLATE, optimize=True)
    print(f'wrote {TEMPLATE.relative_to(ROOT)}')


def main():
    if sys.argv[1:2] == ['--rebuild-template']:
        return rebuild_template(sys.argv[2])
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {'images': {}}
    for path, spec in cards().items():
        out = ROOT / path
        render(spec).save(out, optimize=True)
        manifest['images'][path] = {
            'generator': 'scripts/og/make_page_og.py',
            'usedBy': spec['usedBy'],
            'text': text_of(spec),
            'depicts': spec['depicts'],
            'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
        }
        print(f'wrote {path}')
    manifest['images'] = dict(sorted(manifest['images'].items()))
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    print(f'updated {MANIFEST.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
