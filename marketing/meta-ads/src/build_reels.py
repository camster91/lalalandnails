"""Build 9:16 Meta Reels from the studio's real photos and videos.

Run from the repo root:  python3 marketing/meta-ads/src/build_reels.py <workdir>
Needs: ffmpeg, Pillow, fonttools+brotli (to unpack the site's woff2 fonts) and the
logo PNGs made by export_logos.cjs.
Output: marketing/meta-ads/reels/*.mp4 (1080x1920, 30 fps, H.264, silent AAC).

Style: small phone-style caption "stickers" in brand colours, written in Bianca's
first-person voice in plain everyday sentences, kept inside the Reels safe zone (y 270-1248) and off the nails.
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

def watermark(colour='blush', y=268, width=340):
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

def card(src, width=940, y=470, label=None, caption=None):
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
    bg = Image.alpha_composite(bg, watermark('burgundy', y=262, width=320))
    sm = Image.open(os.path.join(BRAND, 'submark-blush.png')).convert('RGBA').resize((330, 306), Image.LANCZOS)
    bg.paste(sm, ((W - 330) // 2, 1500), sm)  # quiet tone-on-tone brand mark in the lower third
    if label: bg = Image.alpha_composite(bg, cap(label, y + 26, dark=True, size=40, x=x + 26))
    if caption: bg = Image.alpha_composite(bg, cap(caption, y + ph + 34, dark=True))
    return bg.convert('RGB')

def end_card(line='Request your appointment'):
    im = Image.new('RGBA', (W, H), DEEP + (255,)); d = ImageDraw.Draw(im)
    lg = logo('blush', 820); im.paste(lg, ((W - 820) // 2, 420), lg)
    d.text((W // 2, 930), line, font=serif(64, 480), fill=PAPER, anchor='mm')
    im = Image.alpha_composite(im, cap('lalalandnails.ca', 1000, size=48))
    ImageDraw.Draw(im).text((W // 2, 1160), 'Scarborough  ·  Monday to Friday, by appointment', font=sans(36, 500), fill=BLUSH, anchor='mm')
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
RED = lambda: fill(I + 'pricing-red-manicure-1440.webp', 0.55)
def end(line='Request your appointment'): return photo(end_card(line), 2.2, wm=None, zoom=False)
def tall(src, **kw): return card(src, width=640, y=450, **kw)   # portrait photo as a card
# caption rows under the logo, above the hands
C1, C2 = 480, 566

join('reel-1-now-booking', lambda: [
    clip(ALMOND, 0, 4.4, [(cap("Hi, I'm Bianca.", C1), 0.3), (cap("I'm now booking in Scarborough.", C2), 1.2)]),
    clip(FRENCH, 1, 4.2, [(cap('European manicures', C1), 0.2), (cap('and structured gel', C2), 1.0)]),
    clip(FIST, 0.6, 3.6, [(cap('Manicures start at $45.', C1), 0.2)]),
    end()])

join('reel-2-before-after', lambda: [
    wipe(card(I + 'policies-before.webp', label='Before', caption='Before her appointment'),
         card(I + 'policies-after.webp', label='After', caption='After her manicure')),
    wipe(card(I + 'red-manicure-before.webp', label='Before', caption='Before'),
         card(I + 'red-manicure-1440.webp', label='After', caption='After, in glossy red gel')),
    photo(RED(), 2.6, [(cap('Gel manicures start at $60.', C1), 0.3)]),
    end('Come see me in Scarborough')])

join('reel-3-meet-bianca', lambda: [
    photo(fill(I + 'bianca-ashley.webp'), 3.0, [(cap("Hi, I'm Bianca.", 1090), 0.3), (cap("I'm a nail tech in Scarborough.", 1176), 1.1)], wm=None),
    photo(tall(I + 'olive-cat-eye-manicure.webp', label='Cat-eye'), 1.5, wm=None, zoom=False),
    photo(card(I + 'structured-pink-french.webp', label='Pink French'), 1.5, wm=None, zoom=False),
    clip(ALMOND, 2.5, 1.7, [(cap('Long almond', C1), 0)]),
    photo(tall(I + 'tier-three-nail-art-closeup.webp', label='Nail art'), 1.5, wm=None, zoom=False),
    photo(RED(), 2.4, [(cap('Which one would you pick?', C1), 0.2)]),
    end()])

join('reel-4-question-hook', lambda: [
    clip(FRENCH, 1, 3.6, [(cap('Looking for a nail tech', C1), 0.1), (cap('in Scarborough?', C2), 0.1)]),
    clip(ALMOND, 0.5, 4.0, [(cap("Hi, I'm Bianca.", C1), 0.2), (cap("I'm taking new clients.", C2), 1.1)]),
    clip(FIST, 0.8, 3.4, [(cap('Manicures start at $45.', C1), 0.2)]),
    end()])

join('reel-5-soft-gel-tips', lambda: [
    clip(ALMOND, 0, 5.2, [(cap('Want longer nails?', C1), 0.3), (cap('Soft gel tips start at $65.', C2), 1.3)]),
    photo(fill(I + 'tier-one-pink.webp'), 3.0, [(cap('You choose the shape and length.', C1), 0.2)]),
    end()])

join('reel-6-structured-gel', lambda: [
    clip(FRENCH, 0.5, 5.0, [(cap('Structured gel manicure', C1), 0.3), (cap('on your natural nails, $75', C2), 1.2)]),
    photo(card(I + 'structured-pink-french.webp', caption='Dry manicure, builder gel and colour'), 2.8, wm=None, zoom=False),
    clip(FIST, 0.8, 3.0, [(cap('Now booking in Scarborough', C1), 0.2)]),
    end()])

join('reel-7-nail-art', lambda: [
    photo(tall(I + 'tier-three-nail-art-closeup.webp', caption='Nail art starts at $10 extra.'), 2.8, wm=None, zoom=False),
    photo(tall(I + 'olive-cat-eye-manicure.webp', label='Cat-eye'), 1.7, wm=None, zoom=False),
    clip(ALMOND, 2, 2.6, [(cap('French swoosh', C1), 0)]),
    photo(card(I + 'structured-pink-french.webp', label='Pink French'), 1.7, wm=None, zoom=False),
    photo(fill(I + 'tier-three-nail-art.webp', 0.5), 2.8, [(cap('Send me your inspiration photos.', C1), 0.2)]),
    end()])

join('reel-8-one-a-day', lambda: [
    clip(FIST, 0, 4.4, [(cap('I see one client a day.', C1), 0.3), (cap("It's just you and me.", C2), 1.3)]),
    photo(fill(I + 'manicure-prep.webp'), 3.0, [(cap('Careful dry prep and nail care', 1050), 0.2)], wm=None),
    photo(RED(), 2.6, [(cap('Manicures start at $45.', C1), 0.2)]),
    end()])

join('reel-9-short-story', lambda: [
    clip(ALMOND, 0, 5.0, [(cap('Now booking in Scarborough', C1), 0.2), (cap('Manicures start at $45.', C2), 1.2)]),
    end()])

# ---------- more variations ----------
join('reel-10-how-booking-works', lambda: [
    clip(FIST, 0, 3.0, [(cap('How booking with me works', C1), 0.2)]),
    clip(FRENCH, 1, 3.0, [(cap('1. Pick a weekday time on my site.', C1), 0.1)]),
    photo(fill(I + 'tier-one-pink.webp'), 3.0, [(cap('2. Choose your service.', C1), 0.1), (cap('Add photos if you like.', C2), 0.9)]),
    photo(RED(), 3.0, [(cap("3. I'll confirm the price and details.", C1), 0.1)]),
    end()])

join('reel-11-prices', lambda: [
    photo(fill(I + 'manicure-prep.webp'), 2.6, [(cap('My prices', 1050), 0.2), (cap('European dry manicure, $45', 1136), 0.7)], wm=None),
    photo(RED(), 2.6, [(cap('Gel manicure, $60', C1), 0.1)]),
    clip(FRENCH, 1.5, 2.8, [(cap('Structured gel manicure, $75', C1), 0.1)]),
    clip(ALMOND, 0.5, 2.8, [(cap('Soft gel tips, from $65', C1), 0.1)]),
    end()])

join('reel-12-classic-red', lambda: [
    wipe(card(I + 'red-manicure-before.webp', label='Before', caption='Bare nails before'),
         card(I + 'red-manicure-1440.webp', label='After', caption='Classic red gel after'), hold_a=1.9, hold_b=2.6),
    photo(RED(), 3.2, [(cap('Gel manicure with one colour, $60', C1), 0.3)]),
    end()])

join('reel-13-natural-nails', lambda: [
    wipe(card(I + 'policies-before.webp', label='Before', caption='Prefer short, natural nails?'),
         card(I + 'policies-after.webp', label='After', caption='I do those too.'), hold_a=1.9, hold_b=2.6),
    photo(fill(I + 'manicure-prep.webp'), 3.2, [(cap('European dry manicure, $45', 1050), 0.2), (cap('Careful prep and shaping', 1136), 1.0)], wm=None),
    end()])

join('reel-14-weekdays', lambda: [
    clip(ALMOND, 0, 4.2, [(cap('Free on a weekday?', C1), 0.3), (cap('I book Monday to Friday, 10 to 3.', C2), 1.2)]),
    clip(FIST, 0.6, 3.4, [(cap('One client a day, in Scarborough', C1), 0.2)]),
    photo(RED(), 2.6, [(cap('Manicures start at $45.', C1), 0.2)]),
    end()])

join('reel-15-short-french', lambda: [
    clip(FRENCH, 0.5, 5.0, [(cap('Structured gel manicure, $75', C1), 0.2), (cap('Now booking in Scarborough', C2), 1.2)]),
    end()])

join('reel-16-short-red', lambda: [
    photo(RED(), 5.0, [(cap('Gel manicures start at $60.', C1), 0.2), (cap('Now booking in Scarborough', C2), 1.2)]),
    end()])
