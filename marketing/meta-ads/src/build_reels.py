"""Build 9:16 Meta Reels from the studio's real photos and videos.

Run from the repo root:  python3 marketing/meta-ads/src/build_reels.py <workdir>
Needs: ffmpeg, Pillow, fonttools+brotli (to unpack the site's woff2 fonts),
and the raster logo lockup in public/brand.
Output: marketing/meta-ads/reels/*.mp4 (1080x1920, 30 fps, H.264, silent AAC).
"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from fontTools.ttLib import TTFont

ROOT = os.getcwd()
WORK = sys.argv[1]
OUT = os.path.join(ROOT, 'marketing/meta-ads/reels')
os.makedirs(WORK, exist_ok=True); os.makedirs(OUT, exist_ok=True)
W, H, FPS = 1080, 1920, 30
BURG, DEEP, BLUSH, PAPER = (51, 5, 5), (36, 2, 4), (255, 201, 218), (255, 250, 245)

# ---------- fonts ----------
def unpack(name):
    p = os.path.join(WORK, name + '.ttf')
    if not os.path.exists(p):
        f = TTFont(f'public/fonts/{name}-latin.woff2'); f.flavor = None; f.save(p)
    return p
FRAUNCES, DMSANS = unpack('fraunces'), unpack('dm-sans')
def serif(size, wght=600):  # axes: opsz, wght
    f = ImageFont.truetype(FRAUNCES, size); f.set_variation_by_axes([min(144, size / 2), wght]); return f
def sans(size, wght=600):  # axis: wght
    f = ImageFont.truetype(DMSANS, size); f.set_variation_by_axes([wght]); return f

# ---------- logo ----------
LOGO = os.path.join(WORK, 'logo-lockup.png')
if not os.path.exists(LOGO):  # pink-on-black lockup -> blush text on transparent
    src = Image.open('public/brand/nail-hub-lockup.webp').convert('RGB')
    alpha = src.getchannel('R').point(lambda v: min(255, int(v * 1.15)))
    out = Image.new('RGBA', src.size, BLUSH + (0,)); out.putalpha(alpha); out.save(LOGO)

# ---------- drawing helpers ----------
def wrap(draw, text, f, maxw):
    lines, cur = [], ''
    for word in text.split():
        t = (cur + ' ' + word).strip()
        if draw.textlength(t, font=f) <= maxw: cur = t
        else: lines.append(cur); cur = word
    return lines + [cur]

def panel(eyebrow, headline, sub=None, y=300, size=92):
    """Transparent 1080x1920 overlay: burgundy card with text, kept inside Reels safe zone."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    fe, fh, fs = sans(34, 700), serif(size, 560), sans(40, 500)
    maxw = W - 2 * 120
    hl = wrap(d, headline, fh, maxw); sl = wrap(d, sub, fs, maxw) if sub else []
    lh, sh = int(size * 1.08), 54
    h = 70 + (56 if eyebrow else 0) + lh * len(hl) + (20 + sh * len(sl) if sl else 0) + 56
    box = Image.new('RGBA', (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(box)
    bd.rounded_rectangle((70, y, W - 70, y + h), 36, fill=BURG + (226,))
    im = Image.alpha_composite(box, im); d = ImageDraw.Draw(im)
    cy = y + 62
    if eyebrow:
        d.text((W // 2, cy), eyebrow.upper(), font=fe, fill=BLUSH, anchor='mm'); cy += 64
    for l in hl:
        d.text((W // 2, cy + lh // 2 - 8), l, font=fh, fill=PAPER, anchor='mm'); cy += lh
    if sl:
        cy += 20
        for l in sl:
            d.text((W // 2, cy + sh // 2), l, font=fs, fill=BLUSH, anchor='mm'); cy += sh
    return im

def tag(text, x, y):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = sans(40, 700); tw = d.textlength(text.upper(), font=f)
    d.rounded_rectangle((x, y, x + tw + 64, y + 76), 38, fill=BLUSH + (240,))
    d.text((x + 32 + tw / 2, y + 38), text.upper(), font=f, fill=BURG, anchor='mm')
    return im

def cover(img, w=W, h=H):
    r = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    l, t = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((l, t, l + w, t + h))

def still(src, focus_y=0.5):
    """Make a 9:16 frame: portrait photos are cropped to fill; landscape ones sit on a blurred copy."""
    img = Image.open(src).convert('RGB')
    if img.width / img.height < 0.8:
        r = max(W / img.width, H / img.height)
        img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
        t = int((img.height - H) * focus_y); l = (img.width - W) // 2
        return img.crop((l, t, l + W, t + H))
    bg = cover(img).filter(ImageFilter.GaussianBlur(40))
    bg = Image.blend(bg, Image.new('RGB', (W, H), DEEP), 0.35)
    fg = img.resize((W, round(img.height * W / img.width)), Image.LANCZOS)
    bg.paste(fg, (0, (H - fg.height) // 2 + 120))
    return bg

def crop_still(src, cx, cy, w):
    """9:16 crop of width w (source pixels) centred on (cx, cy) as fractions of the photo."""
    img = Image.open(src).convert('RGB'); h = round(w * H / W)
    l = min(max(0, round(cx * img.width - w / 2)), img.width - w)
    t = min(max(0, round(cy * img.height - h / 2)), img.height - h)
    return img.crop((l, t, l + w, t + h)).resize((W, H), Image.LANCZOS)

def end_card(line1, line2, line3):
    im = Image.new('RGB', (W, H), DEEP); d = ImageDraw.Draw(im)
    logo = Image.open(LOGO).convert('RGBA'); logo = logo.resize((800, round(logo.height * 800 / logo.width)), Image.LANCZOS)
    im.paste(logo, ((W - 800) // 2, 330), logo)
    d.text((W // 2, 860), line1, font=serif(76, 520), fill=PAPER, anchor='mm')
    f = sans(46, 700); tw = d.textlength(line2, font=f)
    d.rounded_rectangle((W / 2 - tw / 2 - 48, 940, W / 2 + tw / 2 + 48, 1036), 48, fill=BLUSH)
    d.text((W // 2, 988), line2, font=f, fill=BURG, anchor='mm')
    d.text((W // 2, 1110), line3, font=sans(38, 500), fill=BLUSH, anchor='mm')
    return im

# ---------- ffmpeg segments ----------
ENC = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', str(FPS)]
n = [0]
def save(img):
    n[0] += 1; p = os.path.join(WORK, f'a{n[0]}.png'); img.save(p); return p

def seg_video(src, start, dur, overlays):
    """overlays: list of (Image, appear_at_seconds)."""
    n[0] += 1; out = os.path.join(WORK, f'seg{n[0]}.mp4')
    args = ['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-t', str(dur), '-i', src]
    fc = f'[0:v]scale={W}:{H}:flags=lanczos,setsar=1,fps={FPS}[b0]'
    for i, (img, at) in enumerate(overlays):
        args += ['-loop', '1', '-t', str(dur), '-i', save(img)]
        fc += f';[{i+1}:v]format=rgba,fade=in:st={at}:d=0.35:alpha=1[o{i}];[b{i}][o{i}]overlay=0:0[b{i+1}]'
    args += ['-filter_complex', fc, '-map', f'[b{len(overlays)}]', '-an', *ENC, out]
    subprocess.run(args, check=True); return out

def seg_still(img, dur, overlays=(), zoom=True):
    base = save(img)
    if zoom:  # gentle push-in, rendered from an oversized frame to avoid jitter
        big = Image.open(base).resize((W * 2, H * 2), Image.LANCZOS); base = save(big)
        frames = int(dur * FPS)
        zp = (f"zoompan=z='1+0.06*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
              f":d={frames}:s={W}x{H}:fps={FPS}")
    else:
        zp = f'scale={W}:{H}'
    n[0] += 1; out = os.path.join(WORK, f'seg{n[0]}.mp4')
    args = ['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-t', str(dur), '-i', base]
    fc = f'[0:v]{zp},setsar=1,trim=duration={dur}[b0]'
    for i, (o, at) in enumerate(overlays):
        args += ['-loop', '1', '-t', str(dur), '-i', save(o)]
        fc += f';[{i+1}:v]format=rgba,fade=in:st={at}:d=0.35:alpha=1[o{i}];[b{i}][o{i}]overlay=0:0[b{i+1}]'
    args += ['-filter_complex', fc, '-map', f'[b{len(overlays)}]', '-an', *ENC, out]
    subprocess.run(args, check=True); return out

def join(segs, name):
    lst = os.path.join(WORK, name + '.txt')
    open(lst, 'w').write(''.join(f"file '{s}'\n" for s in segs))
    out = os.path.join(OUT, name + '.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst,
                    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
                    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
                    '-shortest', '-movflags', '+faststart', out], check=True)
    # cover image for the ad (first frame with text)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1.5', '-i', out, '-frames:v', '1',
                    os.path.join(OUT, name + '-cover.jpg')], check=True)
    print('built', out)

V, I = 'public/videos/', 'public/images/'
END = end_card('Request your weekday time', 'lalalandnails.ca', 'Scarborough · Mon–Fri appointments')

NAILART = crop_still(I + 'tier-three-nail-art.webp', 0.47, 0.70, 660)

# Reel 1 — launch: now booking
join([
    seg_video(V + 'long-gel-x.mp4', 0, 4.5, [(panel('Now booking', 'La La Land Nail Hub', 'Scarborough, Toronto', size=76), 0.3)]),
    seg_video(V + 'booking-manicure.mp4', 1, 4.5, [(panel('With Bianca', 'European manicures & structured gel'), 0.2)]),
    seg_video(V + 'faq-manicure.mp4', 0, 4, [(panel('Introductory prices', 'Manicures from $45', 'Gel colour from $60 · Structured gel $75'), 0.2)]),
    seg_still(END, 3.5, zoom=False),
], 'reel-1-now-booking')

# Reel 2 — before & after
HEAD = panel(None, 'Before & after', 'Real sets by Bianca', y=300, size=88)
join([
    seg_still(still(I + 'policies-before.webp'), 2.0, [(HEAD, 0.1), (tag('Before', 70, 1150), 0.3)]),
    seg_still(still(I + 'policies-after.webp'), 2.6, [(HEAD, 0), (tag('After', 70, 1150), 0.1)]),
    seg_still(still(I + 'red-manicure-before.webp'), 2.0, [(HEAD, 0), (tag('Before', 70, 1150), 0.1)]),
    seg_still(still(I + 'red-manicure-1440.webp'), 2.6, [(HEAD, 0), (tag('After', 70, 1150), 0.1)]),
    seg_still(still(I + 'pricing-red-manicure-1440.webp', 0.55), 2.4,
              [(panel('Introductory prices', 'Gel manicure from $60'), 0.2)]),
    seg_still(END, 3.5, zoom=False),
], 'reel-2-before-after')

# Reel 3 — meet Bianca + portfolio
join([
    seg_still(still(I + 'bianca-ashley.webp', 0.2), 3.0,
              [(panel('Meet Bianca', 'Owner & gel manicurist', y=1010, size=70), 0.3)]),
    seg_still(still(I + 'olive-cat-eye-manicure.webp', 0.55), 1.8, [(tag('Cat-eye almond', 70, 1150), 0.1)]),
    seg_still(still(I + 'structured-pink-french.webp'), 1.8, [(tag('Pink French', 70, 1150), 0.1)]),
    seg_still(still(I + 'tier-one-pink.webp', 0.5), 1.8, [(tag('Long almond', 70, 1150), 0.1)]),
    seg_still(NAILART, 1.8, [(tag('Nail art', 70, 1150), 0.1)]),
    seg_still(still(I + 'pricing-red-manicure-1440.webp', 0.55), 1.8, [(tag('Classic red', 70, 1150), 0.1)]),
    seg_still(END, 3.5, zoom=False),
], 'reel-3-meet-bianca')

# ---------- variations ----------
# Reel 4 — question hook (A/B against reel 1)
join([
    seg_video(V + 'booking-manicure.mp4', 1, 4.0, [(panel(None, 'Looking for a nail tech in Scarborough?', size=80), 0.2)]),
    seg_video(V + 'long-gel-x.mp4', 0.5, 4.0, [(panel('Now booking', 'Bianca is taking new clients', 'La La Land Nail Hub', size=76), 0.2)]),
    seg_video(V + 'faq-manicure.mp4', 0.8, 3.5, [(panel('Introductory prices', 'Manicures from $45'), 0.2)]),
    seg_still(END, 3.5, zoom=False),
], 'reel-4-question-hook')

# Reel 5 — soft gel tips
join([
    seg_video(V + 'long-gel-x.mp4', 0, 5.5, [(panel('Add length', 'Soft gel tips', 'Starting at $65', size=96), 0.3)]),
    seg_still(still(I + 'tier-one-pink.webp', 0.5), 3.0, [(panel(None, 'Pick your shape & length', 'Almond · Oval · Square · Squoval', size=74), 0.2)]),
    seg_still(END, 3.5, zoom=False),
], 'reel-5-soft-gel-tips')

# Reel 6 — structured gel
join([
    seg_video(V + 'booking-manicure.mp4', 0.5, 5.5, [(panel('Signature', 'Structured gel manicure', '$75 · builder gel on your natural nails', size=80), 0.3)]),
    seg_still(still(I + 'structured-pink-french.webp'), 3.0, [(panel(None, 'Dry manicure + builder gel + colour', size=70), 0.2)]),
    seg_video(V + 'faq-manicure.mp4', 0.8, 3.0, [(panel('Now booking', 'With Bianca in Scarborough', size=74), 0.2)]),
    seg_still(END, 3.5, zoom=False),
], 'reel-6-structured-gel')

# Reel 7 — nail art add-ons
join([
    seg_still(NAILART, 3.0, [(panel('Nail art', 'Add art from +$10', 'Dots & hearts to detailed designs', size=84), 0.3)]),
    seg_still(still(I + 'olive-cat-eye-manicure.webp', 0.55), 2.0, [(tag('Cat-eye', 70, 1150), 0.1)]),
    seg_video(V + 'long-gel-x.mp4', 2, 3.0, [(tag('French swoosh', 70, 1150), 0.1)]),
    seg_still(still(I + 'structured-pink-french.webp'), 2.0, [(tag('Pink French', 70, 1150), 0.1)]),
    seg_still(crop_still(I + 'tier-three-nail-art.webp', 0.47, 0.70, 660), 2.0,
              [(panel(None, 'Send Bianca your inspo', 'Add photos or links when you request a time', size=76), 0.2)]),
    seg_still(END, 3.5, zoom=False),
], 'reel-7-nail-art')

# Reel 8 — one appointment per weekday
join([
    seg_video(V + 'faq-manicure.mp4', 0, 4.5, [(panel(None, 'One appointment per weekday', 'Just you and Bianca', size=80), 0.3)]),
    seg_still(still(I + 'manicure-prep.webp', 0.35), 3.0, [(panel('European manicure', 'Detailed dry prep & natural nail care', size=70), 0.2)]),
    seg_still(still(I + 'pricing-red-manicure-1440.webp', 0.55), 2.6, [(panel('Introductory prices', 'Manicures from $45'), 0.2)]),
    seg_still(END, 3.5, zoom=False),
], 'reel-8-one-a-day')

# Reel 9 — short 8-second cut for Stories
join([
    seg_video(V + 'long-gel-x.mp4', 0, 5.0, [(panel('Scarborough', 'New nail studio now booking', 'Manicures from $45', size=80), 0.2)]),
    seg_still(END, 3.0, zoom=False),
], 'reel-9-short-story')
