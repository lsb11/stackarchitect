from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, random
S=2  # supersample
W,H=1200,630
OUT='src/assets/og/'
INTER='src/assets/fonts/Inter-ExtraBold.ttf'
JBM5='scripts/og/JetBrainsMono-Medium.ttf'
BG=(2,8,23); GREEN=(26,201,110); MINT=(140,240,176); SLATE=(120,134,160)

def pyramid(d, cx, top, unit, alpha_scale=1.0, colors=None):
    # 4 bars matching the brand mark: widths 146,216,286,356 over a 755 tile; bar h 48, gap 22
    widths=[146,216,286,356]; k=unit/755
    for i,w in enumerate(widths):
        c = (colors or [MINT,GREEN,GREEN,GREEN])[i]
        x0=cx-w*k/2; y0=top+i*70*k
        d.rounded_rectangle([x0,y0,x0+w*k,y0+48*k], radius=12*k, fill=c+(int(255*alpha_scale),))

# ---------- background ----------
bg=Image.new('RGBA',(W*S,H*S),BG+(255,))
# vertical wash
wash=Image.new('RGBA',(W*S,H*S)); wd=ImageDraw.Draw(wash)
for y in range(H*S):
    t=y/(H*S); wd.line([(0,y),(W*S,y)],fill=(4,18,22,int(120*(1-t))))
bg=Image.alpha_composite(bg,wash)
# green glow top-left behind lockup + cool glow bottom-right
glow=Image.new('RGBA',(W*S,H*S)); gd=ImageDraw.Draw(glow)
gd.ellipse([-260*S,-340*S,620*S,300*S],fill=(26,201,110,48))
gd.ellipse([760*S,260*S,1500*S,900*S],fill=(20,120,160,38))
glow=glow.filter(ImageFilter.GaussianBlur(140*S))
bg=Image.alpha_composite(bg,glow)
# blueprint grid, fading in from the right
grid=Image.new('RGBA',(W*S,H*S)); gr=ImageDraw.Draw(grid)
step=42*S
for x in range(0,W*S,step):
    gr.line([(x,0),(x,H*S)],fill=(90,140,170,26),width=S)
for y in range(0,H*S,step):
    gr.line([(0,y),(W*S,y)],fill=(90,140,170,26),width=S)
mask=Image.new('L',(W*S,H*S)); md=ImageDraw.Draw(mask)
for x in range(W*S):
    t=x/(W*S); md.line([(x,0),(x,H*S)],fill=int(255*min(1,max(0,(t-0.25)/0.5))))
bg.paste(Image.alpha_composite(bg,grid),(0,0),mask)
# big ghost pyramid, right side, cropped by bottom edge
ghost=Image.new('RGBA',(W*S,H*S)); gh=ImageDraw.Draw(ghost)
k=760/755
for i,w in enumerate([146,216,286,356]):
    cx=985*S; x0=cx-w*k*S/2; y0=(210+i*70*k)*S
    box=[x0,y0,x0+w*k*S,y0+48*k*S]
    gh.rounded_rectangle(box,radius=int(12*k*S),fill=(26,201,110,10 if i else 16),outline=(80,220,140,48 if i else 70),width=2*S)
# dimension ticks, blueprint style
tick=(80,220,140,40)
gh.line([(985*S-178*k*S,185*S),(985*S+178*k*S,185*S)],fill=tick,width=S)
for xx in (985*S-178*k*S,985*S+178*k*S): gh.line([(xx,177*S),(xx,193*S)],fill=tick,width=S)
bg=Image.alpha_composite(bg,ghost)
# url, top-right, aligned with lockup baseline area
d=ImageDraw.Draw(bg)
f=ImageFont.truetype(JBM5,20*S)
url='stackarchitect.xyz'
tw=d.textlength(url,font=f)
d.text((W*S-72*S-tw, 94*S), url, font=f, fill=SLATE+(255,), anchor='lm')
# green accent rule along the very bottom left
d.rectangle([0,H*S-6*S,300*S,H*S],fill=GREEN+(255,))
bg=bg.resize((W,H),Image.LANCZOS).convert('RGB')
bg.save(OUT+'og-bg.png',optimize=True)

# ---------- lockups ----------
def lockup(label, name):
    h=64; w=900
    im=Image.new('RGBA',(w*S,h*S),(0,0,0,0)); d=ImageDraw.Draw(im)
    # icon tile
    d.rounded_rectangle([0,0,h*S-1,h*S-1],radius=16*S,fill=(9,16,30,255),outline=(40,52,72,255),width=2*S)
    pyramid(d, h*S/2, 17*S, 58*S)
    fw=ImageFont.truetype(INTER,28*S)
    x=(h+18)*S
    d.text((x,4*S),'Stack ',font=fw,fill=(245,247,250,255))
    x2=x+d.textlength('Stack ',font=fw)
    d.text((x2,4*S),'Architect',font=fw,fill=GREEN+(255,))
    fm=ImageFont.truetype(JBM5,17*S)
    d.text((x,42*S),'// '+label,font=fm,fill=SLATE+(255,))
    bbox=im.getbbox(); im=im.crop((0,0,bbox[2]+2*S,h*S))
    im=im.resize((im.width//S,h),Image.LANCZOS)
    im.save(OUT+f'lockup-{name}.png',optimize=True)

for label,name in [('the lean shopify automation stack','default'),('field guide','guide'),('free tool','tool'),('from the blog','blog'),('open benchmark data','research')]:
    lockup(label,name)
print('ok')
