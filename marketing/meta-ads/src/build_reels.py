"""Build 9:16 Meta Reels from the studio's real photos and videos.

Run from the repo root:  python3 marketing/meta-ads/src/build_reels.py <workdir>
Needs: ffmpeg, Pillow, fonttools+brotli (to unpack the site's woff2 fonts) and the
logo PNGs made by export_logos.cjs.
Output: marketing/meta-ads/reels/*.mp4 (1080x1920, 30 fps, H.264, silent AAC).

Style: small phone-style caption "stickers" in brand colours, written in Bianca's
first-person voice, kept inside the Reels safe zone (y 270-1248) and off the nails.
"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from fontTools.ttLib import TTFont

ROOT = os.getcwd()
WORK = sys.argv[1]
ONLY = sys.argv[2:]  # optional reel-name filters
OUT = os.path.join(ROOT, 'marketing/meta-ads/reels')
BRAND = os.path.join(ROOT, 'marketing/meta-ads/brand')
os.makedirs(WORK, exist_ok=True); os.makedirs(OUT, exist_ok=True)
W, H, FPS = 1080, 1920, 30
BURG, DEEP, BLUSH, BLUSH_LIGHT, PAPER = (51, 5, 5), (36, 2, 4), (255, 210, 222), (255, 231, 238), (255, 250, 245)

def unpack(name):
    p = os.path.join(WORK, name + '.ttf')
    if not os.path.exists(p):
        f = TTFont(f'public/fonts/{name}-latin.woff2'); f.flavor = None; f.save(p)
    return p
FRAUNCES, DMSANS = unpack('fraunces'), unpack('dm-sans')
def serif(size, wght=560):  # axes: opsz, wght
    f = ImageFont.truetype(FRAUNCES, size); f.set_variation_by_axes([min(144, size / 2), wght]); return f
def sans(size, wght=700):  # axis: wght
    f = ImageFont.truetype(DMSANS, size); f.set_variation_by_axes([wght]); return f

def logo(colour, width):
    im = Image.open(os.path.join(BRAND, f'logo-{colour}.png')).convert('RGBA')
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)

def blank(): return Image.new('RGBA', (W, H), (0, 0, 0, 0))

def cap(lines, y, dark=False, size=50, x=None):
    """Caption sticker: one rounded pill per line, like phone-made Reels text. x=None centres."""
    if isinstance(lines, str): lines = [lines]
    im = blank(); d = ImageDraw.Draw(im); f = sans(size)
    bg, fg = (BURG, PAPER) if dark else (BLUSH, BURG)
    ph, pad = round(size * 1.62), round(size * 0.56)
    for i, line in enumerate(lines):
        tw = d.textlength(line, font=f); w = tw + 2 * pad
        l = (W - w) / 2 if x is None else x
        t = y + i * (ph - 6)
        d.rounded_rectangle((l, t, l + w, t + ph), ph * 0.36, fill=bg + (246,))
        d.text((l + pad + tw / 2, t + ph / 2 - 1), line, font=f, fill=fg, anchor='mm')
    return im

def watermark(colour='blush', y=288, width=200):
    """Small logo at the top of the safe zone, with a soft shadow so it reads on any footage."""
    lg = logo(colour, width); im = blank(); pos = ((W - width) // 2, y)
    if colour != 'burgundy':
        sh = blank(); sh.paste(Image.new('RGBA', lg.size, (20, 0, 2, 150)), pos, lg)
        im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(9)))
    im.paste(lg, pos, lg); return im

def fill(src, focus_y=0.5):
    """Portrait photo cropped to fill the 9:16 frame."""
    img = Image.open(src).convert('RGB'); r = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    t = int((img.height - H) * focus_y); l = (img.width - W) // 2
    return img.crop((l, t, l + W, t + H))

def card(src, width=960, y=400, label=None, caption=None):
    """Photo as a rounded 'sticker' on brand blush with the burgundy logo: keeps the whole
    photo visible and inside the safe zone (used for landscape and low-res photos)."""
    bg = Image.new('RGBA', (W, H), BLUSH_LIGHT + (255,))
    img = Image.open(src).convert('RGB')
    ph = round(img.height * width / img.width); img = img.resize((width, ph), Image.LANCZOS)
    x = (W - width) // 2
    sh = blank(); ImageDraw.Draw(sh).rounded_rectangle((x + 6, y + 18, x + width + 6, y + ph + 18), 44, fill=BURG + (70,))
    bg = Image.alpha_composite(bg, sh.filter(ImageFilter.GaussianBlur(22)))
    mask = Image.new('L', (width, ph), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, width, ph), 44, fill=255)
    bg.paste(img, (x, y), mask)
    bg = Image.alpha_composite(bg, watermark('burgundy'))
    sm = Image.open(os.path.join(BRAND, 'submark-blush.png')).convert('RGBA').resize((330, 306), Image.LANCZOS)
    bg.paste(sm, ((W - 330) // 2, 1500), sm)  # quiet tone-on-tone brand mark in the lower third
    if label: bg = Image.alpha_composite(bg, cap(label, y + 26, dark=True, size=40, x=x + 26))
    if caption: bg = Image.alpha_composite(bg, cap(caption, y + ph + 34, dark=True))
    return bg.convert('RGB')

def end_card(line='request your weekday spot'):
    im = Image.new('RGBA', (W, H), DEEP + (255,)); d = ImageDraw.Draw(im)
    lg = logo('blush', 820); im.paste(lg, ((W - 820) // 2, 420), lg)
    d.text((W // 2, 930), line, font=serif(64, 480), fill=PAPER, anchor='mm')
    im = Image.alpha_composite(im, cap('lalalandnails.ca', 1000, size=48))
    ImageDraw.Draw(im).text((W // 2, 1160), 'Scarborough  ·  by appointment, Mon–Fri', font=sans(36, 500), fill=BLUSH, anchor='mm')
    return im.convert('RGB')

# ---------- ffmpeg segments ----------
ENC = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS)]
n = [0]
def save(img):
    n[0] += 1; p = os.path.join(WORK, f'a{n[0]}.png'); img.save(p); return p
def newseg():
    n[0] += 1; return os.path.join(WORK, f'seg{n[0]}.mp4')

def overlay_chain(args, dur, overlays, base_label):
    """Append overlay inputs to args; overlays are (Image, appear_at_seconds). Each pops in."""
    fc = ''
    for i, (img, at) in enumerate(overlays):
        args += ['-loop', '1', '-t', str(dur), '-i', save(img)]
        k = len([a for a in args if a == '-i']) - 1
        src = base_label if i == 0 else f'b{i}'
        fade = f'fade=in:st={at}:d=0.22:alpha=1' if at > 0 else 'null'
        fc += f';[{k}:v]format=rgba,{fade}[o{i}];[{src}][o{i}]overlay=0:0[b{i+1}]'
    return fc, (f'b{len(overlays)}' if overlays else base_label)

def run(args, fc, last, out):
    subprocess.run(args + ['-filter_complex', fc, '-map', f'[{last}]', '-an', *ENC, out], check=True); return out

def clip(src, start, dur, caps=(), wm='blush'):
    args = ['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-t', str(dur), '-i', src]
    fc = f'[0:v]scale={W}:{H}:flags=lanczos,setsar=1,fps={FPS}[v]'
    ov = ([(watermark(wm), 0)] if wm else []) + list(caps)
    more, last = overlay_chain(args, dur, ov, 'v')
    return run(args, fc + more, last, newseg())

def photo(img, dur, caps=(), wm='blush', zoom=True):
    base = save(img)
    if zoom:  # gentle push-in, rendered from an oversized frame to avoid jitter
        base = save(Image.open(base).resize((W * 2, H * 2), Image.LANCZOS)); fr = int(dur * FPS)
        zp = f"zoompan=z='1+0.05*on/{fr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={fr}:s={W}x{H}:fps={FPS}"
    else:
        zp = f'scale={W}:{H},fps={FPS}'
    args = ['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-t', str(dur), '-i', base]
    fc = f'[0:v]{zp},setsar=1,trim=duration={dur}[v]'
    ov = ([(watermark(wm), 0)] if wm else []) + list(caps)
    more, last = overlay_chain(args, dur, ov, 'v')
    return run(args, fc + more, last, newseg())

def wipe(a, b, hold_a=1.5, hold_b=2.2, t=0.45):
    """Before -> after: card A wipes to card B."""
    dur = hold_a + hold_b
    args = ['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-t', str(hold_a + t), '-r', str(FPS), '-i', save(a),
            '-loop', '1', '-t', str(hold_b), '-r', str(FPS), '-i', save(b)]
    fc = (f'[0:v]format=yuv420p,setsar=1[a];[1:v]format=yuv420p,setsar=1[b];'
          f'[a][b]xfade=transition=wipeleft:duration={t}:offset={hold_a},trim=duration={dur}[v]')
    return run(args, fc, 'v', newseg())

def join(name, make):
    if ONLY and not any(o in name for o in ONLY): return
    segs = make()
    lst = os.path.join(WORK, name + '.txt')
    open(lst, 'w').write(''.join(f"file '{s}'\n" for s in segs))
    out = os.path.join(OUT, name + '.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst,
                    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
                    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
                    '-shortest', '-movflags', '+faststart', out], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '2', '-i', out, '-frames:v', '1', '-q:v', '2',
                    os.path.join(OUT, name + '-cover.jpg')], check=True)
    print('built', out)

V, I = 'public/videos/', 'public/images/'
ALMOND, FRENCH, FIST = V + 'long-gel-x.mp4', V + 'booking-manicure.mp4', V + 'faq-manicure.mp4'
def end(line='request your weekday spot'): return photo(end_card(line), 2.2, wm=None, zoom=False)
# caption slots that sit in empty space on each video
A1, A2 = 470, 556          # almond clip: above the hand
F1, F2 = 400, 486          # French clip: on the dark sleeve, above the hands (they move down)
T1, T2 = 440, 526          # fist clip: above the hand

join('reel-1-now-booking', lambda: [
    clip(ALMOND, 0, 4.4, [(cap("hi, I'm Bianca", A1), 0.3), (cap('my books are open in Scarborough', A2), 1.2)]),
    clip(FRENCH, 1, 4.2, [(cap('European manicures', F1), 0.2), (cap('+ structured gel', F2), 1.0)]),
    clip(FIST, 0.6, 3.6, [(cap('manicures start at $45', T1), 0.2)]),
    end()])

join('reel-2-before-after', lambda: [
    wipe(card(I + 'policies-before.webp', label='before', caption='what she came in with'),
         card(I + 'policies-after.webp', label='after', caption='clean, shaped, cared for')),
    wipe(card(I + 'red-manicure-before.webp', label='before', caption='bare nails'),
         card(I + 'red-manicure-1440.webp', label='after', caption='this red though')),
    photo(fill(I + 'pricing-red-manicure-1440.webp', 0.55), 2.6, [(cap('gel manicures from $60', 410), 0.3)]),
    end('come see me in Scarborough')])

join('reel-3-meet-bianca', lambda: [
    photo(fill(I + 'bianca-ashley.webp'), 3.0, [(cap("hi, I'm Bianca", 1090), 0.3), (cap('your nail tech in Scarborough', 1176), 1.1)]),
    photo(card(I + 'olive-cat-eye-manicure.webp', width=700, y=400, label='cat-eye'), 1.5, wm=None, zoom=False),
    photo(card(I + 'structured-pink-french.webp', label='pink French'), 1.5, wm=None, zoom=False),
    clip(ALMOND, 2.5, 1.7, [(cap('long almond', 470), 0)]),
    photo(card(I + 'tier-three-nail-art-closeup.webp', width=700, y=400, label='nail art'), 1.5, wm=None, zoom=False),
    photo(fill(I + 'pricing-red-manicure-1440.webp', 0.55), 2.4, [(cap('which one are you getting?', 410), 0.2)]),
    end()])

join('reel-4-question-hook', lambda: [
    clip(FRENCH, 1, 3.6, [(cap('looking for a nail tech', F1), 0.1), (cap('in Scarborough?', F2), 0.1)]),
    clip(ALMOND, 0.5, 4.0, [(cap("hi, that's me", A1), 0.2), (cap("I'm taking new clients", A2), 1.1)]),
    clip(FIST, 0.8, 3.4, [(cap('manicures start at $45', T1), 0.2)]),
    end()])

join('reel-5-soft-gel-tips', lambda: [
    clip(ALMOND, 0, 5.2, [(cap('want more length?', A1), 0.3), (cap('soft gel tips, from $65', A2), 1.3)]),
    photo(fill(I + 'tier-one-pink.webp'), 3.0, [(cap('you pick the shape', 440), 0.2), (cap("I'll make it yours", 526), 1.0)]),
    end()])

join('reel-6-structured-gel', lambda: [
    clip(FRENCH, 0.5, 5.0, [(cap('structured gel', F1), 0.3), (cap('on your natural nails · $75', F2), 1.2)]),
    photo(card(I + 'structured-pink-french.webp', caption='dry manicure + builder gel + colour'), 2.8, wm=None, zoom=False),
    clip(FIST, 0.8, 3.0, [(cap('now booking in Scarborough', T1), 0.2)]),
    end()])

join('reel-7-nail-art', lambda: [
    photo(card(I + 'tier-three-nail-art-closeup.webp', width=700, y=400, caption='nail art starts at +$10'), 2.8, wm=None, zoom=False),
    photo(card(I + 'olive-cat-eye-manicure.webp', width=700, y=400, label='cat-eye'), 1.7, wm=None, zoom=False),
    clip(ALMOND, 2, 2.6, [(cap('French swoosh', 470), 0)]),
    photo(card(I + 'structured-pink-french.webp', label='pink French'), 1.7, wm=None, zoom=False),
    photo(fill(I + 'tier-three-nail-art.webp', 0.5), 2.8, [(cap('send me your inspo pics', 440), 0.2), (cap("I'll tell you what works", 526), 1.0)]),
    end()])

join('reel-8-one-a-day', lambda: [
    clip(FIST, 0, 4.4, [(cap('I take one client a day', T1), 0.3), (cap("so it's just you and me", T2), 1.3)]),
    photo(fill(I + 'manicure-prep.webp', 0.0), 3.0, [(cap('detailed dry prep', 1010), 0.2), (cap('+ natural nail care', 1096), 0.9)], wm=None),
    photo(fill(I + 'pricing-red-manicure-1440.webp', 0.55), 2.6, [(cap('manicures start at $45', 410), 0.2)]),
    end()])

join('reel-9-short-story', lambda: [
    clip(ALMOND, 0, 5.0, [(cap('Scarborough, my books are open', A1), 0.2), (cap('manicures start at $45', A2), 1.2)]),
    end()])
