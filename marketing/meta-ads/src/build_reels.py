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

def cap(lines, y, dark=False, size=54, x=None):
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

def watermark(colour='badge', y=258, width=340):
    """Logo at the top of the safe zone. 'badge' puts the blush logo on a burgundy tag so it
    reads on light and dark footage alike; 'burgundy' is the bare logo for blush backgrounds."""
    im = blank()
    if colour == 'badge':
        lg = logo('blush', width); px, py = 44, 30
        bw, bh = width + 2 * px, lg.height + 2 * py; x = (W - bw) // 2
        ImageDraw.Draw(im).rounded_rectangle((x, y, x + bw, y + bh), 46, fill=BURG + (238,))
        im.paste(lg, (x + px, y + py), lg); return im
    lg = logo(colour, width); im.paste(lg, ((W - width) // 2, y), lg); return im

def fill(src, focus_y=0.5):
    """Portrait photo cropped to fill the 9:16 frame."""
    img = Image.open(src).convert('RGB'); r = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    t = int((img.height - H) * focus_y); l = (img.width - W) // 2
    return img.crop((l, t, l + W, t + H))

def blush_page():
    bg = Image.new('RGBA', (W, H), BLUSH_LIGHT + (255,))
    sm = Image.open(os.path.join(BRAND, 'submark-blush.png')).convert('RGBA').resize((330, 306), Image.LANCZOS)
    bg.paste(sm, ((W - 330) // 2, 1540), sm)  # quiet tone-on-tone brand mark in the lower third
    return bg

def card(src, width=1010, y=590, label=None, caption=None):
    """Landscape photo as a rounded card on brand blush: logo, caption, then the whole photo."""
    bg = blush_page()
    img = Image.open(src).convert('RGB')
    ph = round(img.height * width / img.width); img = img.resize((width, ph), Image.LANCZOS)
    x = (W - width) // 2
    sh = blank(); ImageDraw.Draw(sh).rounded_rectangle((x + 6, y + 18, x + width + 6, y + ph + 18), 44, fill=BURG + (70,))
    bg = Image.alpha_composite(bg, sh.filter(ImageFilter.GaussianBlur(22)))
    mask = Image.new('L', (width, ph), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, width, ph), 44, fill=255)
    bg.paste(img, (x, y), mask)
    bg = Image.alpha_composite(bg, watermark('burgundy', y=262, width=320))
    if caption: bg = Image.alpha_composite(bg, cap(caption, 468, dark=True))
    if label: bg = Image.alpha_composite(bg, cap(label, y + 26, dark=True, size=42, x=x + 26))
    return bg.convert('RGB')

def big(src, y0=0):
    """Portrait photo at full width, anchored so the nails sit inside the safe zone; blush below."""
    img = Image.open(src).convert('RGB')
    img = img.resize((W, round(img.height * W / img.width)), Image.LANCZOS)
    # only show the lower brand mark when the photo leaves room for it
    bg = blush_page() if y0 + img.height < 1480 else Image.new('RGBA', (W, H), BLUSH_LIGHT + (255,))
    bg.paste(img, (0, y0))
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

def clip(src, start, dur, caps=(), wm='badge'):
    args = ['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-t', str(dur), '-i', src]
    fc = f'[0:v]scale={W}:{H}:flags=lanczos,setsar=1,fps={FPS}[v]'
    ov = ([(watermark(wm), 0)] if wm else []) + list(caps)
    more, last = overlay_chain(args, dur, ov, 'v')
    return run(args, fc + more, last, newseg())

def photo(img, dur, caps=(), wm='badge', zoom=True, amount=0.05):
    base = save(img)
    if zoom:  # gentle push-in, rendered from an oversized frame to avoid jitter
        base = save(Image.open(base).resize((W * 2, H * 2), Image.LANCZOS)); fr = int(dur * FPS)
        zp = f"zoompan=z='1+{amount}*on/{fr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={fr}:s={W}x{H}:fps={FPS}"
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
          f'[a][b]xfade=transition=wipeleft:duration={t}:offset={hold_a},trim=duration={dur},'
          f"scale={W*2}:{H*2}:flags=bicubic,zoompan=z='1+0.04*on/{int(dur*FPS)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
          f':d=1:s={W}x{H}:fps={FPS}[v]')
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
FIST0 = 0.8   # the fist clip opens on a palm; the nails are in view from here
RED = lambda: fill(I + 'pricing-red-manicure-1440.webp', 0.55)
PREP = lambda: fill(I + 'manicure-prep.webp')
OLIVE = lambda: big(I + 'olive-cat-eye-manicure.webp')                 # nails land mid-frame
ART = lambda: big(I + 'tier-three-nail-art-closeup.webp', 330)
def end(line='Request your appointment'): return photo(end_card(line), 2.2, wm=None, zoom=False)
# caption rows under the logo, above the nails
C1, C2 = 506, 590
LOW1, LOW2 = 1050, 1134   # for the prep photo, where the hand is at the top

# A price is only shown over the service it belongs to.
join('reel-1-now-booking', lambda: [
    clip(ALMOND, 0, 4.4, [(cap("Hi, I'm Bianca.", C1), 0.3), (cap("I'm now booking in Scarborough.", C2), 1.2)]),
    clip(FRENCH, 1, 4.2, [(cap('European manicures', C1), 0.2), (cap('and structured gel', C2), 1.0)]),
    clip(FIST, FIST0, 3.6, [(cap('Gel manicures start at $60.', C1), 0.2)]),
    end()])

join('reel-2-before-after', lambda: [
    wipe(card(I + 'policies-before.webp', label='Before', caption='Before her appointment'),
         card(I + 'policies-after.webp', label='After', caption='After her manicure')),
    wipe(card(I + 'red-manicure-before.webp', label='Before', caption='Before'),
         card(I + 'red-manicure-1440.webp', label='After', caption='After, in glossy red gel')),
    photo(RED(), 2.6, [(cap('Gel manicures start at $60.', C1), 0.3)], amount=0.08),
    end('Come see me in Scarborough')])

join('reel-3-meet-bianca', lambda: [
    photo(fill(I + 'bianca-ashley.webp'), 3.0, [(cap("Hi, I'm Bianca.", 1080), 0.3), (cap("I'm a nail tech in Scarborough.", 1164), 1.1)], wm=None),
    photo(OLIVE(), 1.6, [(cap('Cat-eye', C1), 0)]),
    photo(card(I + 'structured-pink-french.webp', caption='Pink French'), 1.6, wm=None),
    clip(ALMOND, 2.5, 1.7, [(cap('Long almond', C1), 0)]),
    photo(ART(), 1.6, [(cap('Nail art', 1180), 0)]),
    photo(RED(), 2.4, [(cap('Which one would you pick?', C1), 0.2)], amount=0.08),
    end()])

join('reel-4-question-hook', lambda: [
    clip(FRENCH, 1, 3.6, [(cap('Looking for a nail tech', C1), 0.1), (cap('in Scarborough?', C2), 0.1)]),
    clip(ALMOND, 0.5, 4.0, [(cap("Hi, I'm Bianca.", C1), 0.2), (cap("I'm taking new clients.", C2), 1.1)]),
    clip(FIST, FIST0, 3.4, [(cap('Gel manicures start at $60.', C1), 0.2)]),
    end()])

join('reel-5-soft-gel-tips', lambda: [
    clip(ALMOND, 0, 4.6, [(cap('Want longer nails?', C1), 0.3), (cap('Soft gel tips start at $65.', C2), 1.3)]),
    photo(OLIVE(), 3.0, [(cap('You choose the shape and length.', C1), 0.2)]),
    end()])

join('reel-6-structured-gel', lambda: [
    clip(FRENCH, 0.5, 5.0, [(cap('Structured gel manicure', C1), 0.3), (cap('on your natural nails, $75', C2), 1.2)]),
    photo(card(I + 'structured-pink-french.webp', caption='Dry manicure, builder gel and colour'), 2.8, wm=None),
    clip(FIST, FIST0, 3.0, [(cap('Now booking in Scarborough', C1), 0.2)]),
    end()])

join('reel-7-nail-art', lambda: [
    photo(ART(), 2.8, [(cap('Nail art starts at $10 extra.', 1180), 0.2)]),
    photo(OLIVE(), 1.8, [(cap('Cat-eye', C1), 0)]),
    clip(ALMOND, 2, 2.6, [(cap('French swoosh', C1), 0)]),
    photo(card(I + 'structured-pink-french.webp', caption='Pink French'), 1.8, wm=None),
    photo(fill(I + 'tier-three-nail-art.webp', 0.5), 2.8, [(cap('Send me your inspiration photos.', C1), 0.2)]),
    end()])

join('reel-8-one-a-day', lambda: [
    clip(FIST, 0.7, 4.3, [(cap('I see one client a day.', C1), 0.3), (cap("It's just you and me.", C2), 1.3)]),
    photo(PREP(), 3.0, [(cap('European dry manicure, $45', LOW1), 0.2)], wm=None),
    photo(RED(), 2.6, [(cap('Gel manicures start at $60.', C1), 0.2)], amount=0.08),
    end()])

join('reel-9-short-story', lambda: [
    clip(ALMOND, 0, 5.0, [(cap('Now booking in Scarborough', C1), 0.2), (cap('Soft gel tips start at $65.', C2), 1.2)]),
    end()])

# ---------- more variations ----------
join('reel-10-how-booking-works', lambda: [
    clip(FRENCH, 1, 3.0, [(cap('How booking with me works', C1), 0.2)]),
    clip(ALMOND, 0.5, 3.0, [(cap('1. Pick a weekday time on my site.', C1), 0.1)]),
    photo(OLIVE(), 3.0, [(cap('2. Choose your service.', C1), 0.1), (cap('Add photos if you like.', C2), 0.9)]),
    clip(FIST, FIST0, 3.2, [(cap("3. I'll confirm the price and details.", C1), 0.1)]),
    end()])

join('reel-11-prices', lambda: [
    photo(PREP(), 2.6, [(cap('My prices', LOW1), 0.2), (cap('European dry manicure, $45', LOW2), 0.7)], wm=None),
    photo(RED(), 2.6, [(cap('Gel manicure, $60', C1), 0.1)], amount=0.08),
    clip(FRENCH, 1.5, 2.8, [(cap('Structured gel manicure, $75', C1), 0.1)]),
    clip(ALMOND, 0.5, 2.8, [(cap('Soft gel tips, from $65', C1), 0.1)]),
    end()])

join('reel-12-classic-red', lambda: [
    wipe(card(I + 'red-manicure-before.webp', label='Before', caption='Bare nails before'),
         card(I + 'red-manicure-1440.webp', label='After', caption='Classic red gel after'), hold_a=1.9, hold_b=2.6),
    photo(RED(), 3.2, [(cap('Gel manicure with one colour, $60', C1), 0.3)], amount=0.09),
    end()])

join('reel-13-natural-nails', lambda: [
    wipe(card(I + 'policies-before.webp', label='Before', caption='Prefer short, natural nails?'),
         card(I + 'policies-after.webp', label='After', caption='I do those too.'), hold_a=1.9, hold_b=2.6),
    photo(PREP(), 3.2, [(cap('European dry manicure, $45', LOW1), 0.2), (cap('Careful prep and shaping', LOW2), 1.0)], wm=None, amount=0.08),
    end()])

join('reel-14-weekdays', lambda: [
    clip(FRENCH, 0.5, 4.4, [(cap('Free on a weekday?', C1), 0.3), (cap('I book Monday to Friday, 10 to 3.', C2), 1.2)]),
    clip(FIST, FIST0, 3.8, [(cap('One client a day, in Scarborough', C1), 0.2)]),
    end()])

join('reel-15-short-french', lambda: [
    clip(FRENCH, 0.5, 5.0, [(cap('Structured gel manicure, $75', C1), 0.2), (cap('Now booking in Scarborough', C2), 1.2)]),
    end()])

join('reel-16-short-red', lambda: [
    photo(RED(), 5.0, [(cap('Gel manicures start at $60.', C1), 0.2), (cap('Now booking in Scarborough', C2), 1.2)], amount=0.12),
    end()])
