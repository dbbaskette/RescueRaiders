#!/usr/bin/env python3
"""Chroma-key magenta backgrounds -> clean transparent game sprites.

Enemy red tint, hit flash and wreck shading are computed in the browser from these base images
(shadePixels in index.html), so no tinted copies are written. The large HQ sprite ships as WebP.
"""
from PIL import Image
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# name: (src, target_draw_width_px)
SPRITES = {
    'heli':    ('src_heli.png',    260),
    'tank':    ('src_tank.png',    190),
    'aa':      ('src_aa.png',      220),
    'van':     ('src_van.png',     200),
    'soldier': ('src_soldier.png',  60),
    'balloon': ('src_balloon.png', 240),
    'bunker':  ('src_bunker.png',  220),
    'hq':      ('src_hq.png',      600),
}
WEBP = {'hq'}

def key_and_crop(src_file):
    im = Image.open(src_file).convert('RGBA')
    w, h = im.size
    px = im.load()

    # Sample background magenta from image corners
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg_m = min(min(p[0], p[2]) - p[1] for p in corners)
    cut_hi = min(80, max(50, bg_m - 15))
    cut_lo = cut_hi - 30

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            m = min(r, b) - g
            if m >= cut_hi:
                px[x, y] = (0, 0, 0, 0)
            elif m > cut_lo:
                na = int(255 * (1 - (m - cut_lo) / (cut_hi - cut_lo)))
                ng = max(g, (r + b) // 2 - m)
                px[x, y] = (r, ng, b, na)
            elif m > 10:
                ng = max(g, (r + b) // 2 - int(m * 1.3))
                px[x, y] = (r, ng, b, a)

    # Tight autocrop to actual object pixels
    bbox = im.getchannel('A').getbbox()
    if bbox:
        im = im.crop(bbox)
    return im

for name, (src, tw) in SPRITES.items():
    im = key_and_crop(src)
    th = max(1, round(im.height * tw / im.width))
    im = im.resize((tw, th), Image.LANCZOS)
    if name in WEBP:
        im.save(f'{name}.webp', quality=90, method=6)
    else:
        im.save(f'{name}.png', optimize=True)
    print(f'{name} {im.size} (alpha bbox: {im.getchannel("A").getbbox()})')

# backdrop: downscale + slight darken for mood
bd = Image.open('src_backdrop.png').convert('RGB')
bd = bd.resize((2048, round(bd.height * 2048 / bd.width)), Image.LANCZOS)
bd.save('backdrop.jpg', quality=82)
print('backdrop.jpg', bd.size)
