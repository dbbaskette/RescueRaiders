#!/usr/bin/env python3
"""Run python3 assets/process.py with Pillow to rebuild sprites, backdrop and icons.
src_ files are authoring masters. The runtime downloads the eight WebP sprites
and backdrop.jpg. Team paint, hit flashes and wreck shading use these same sprites.
"""
from PIL import Image, ImageDraw
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

def key_and_crop(src_file):
    im = Image.open(src_file).convert('RGBA')
    if src_file == 'src_van.png':
        return im.crop(im.getbbox())
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            spill = min(r, b) - g
            if spill >= 80:
                px[x, y] = (0, 0, 0, 0)
            elif spill > 0:
                # Neutralize the key colour even on partially covered edge pixels.
                coverage = min(1, (80 - spill) / 30)
                px[x, y] = (r - spill, g, b - spill, round(a * coverage))
    return im.crop(im.getbbox())


def finish_details(im, name):
    # Coordinates refer to the fixed export sizes in SPRITES. Keep the heli
    # canvas extent so the animated rotor mast has a stable registration point.
    draw = ImageDraw.Draw(im)
    if name == 'heli':
        for box in [(0, 0, 96, 16), (124, 0, 224, 16), (0, 0, 224, 4)]:
            draw.rectangle(box, fill=(0, 0, 0, 0))
        # Cool reflections in the two inset canopy panes.
        for pane in [[(43,39),(57,33),(55,40),(45,44)], [(70,32),(84,27),(80,36),(69,39)]]:
            draw.polygon(pane, fill=(55,75,82,232))
            draw.line(pane[:2], fill=(133,157,157,245))
    elif name == 'aa':
        for pane in [[(28,60),(38,59),(37,67),(26,69)], [(59,59),(69,58),(66,65),(57,67)]]:
            draw.polygon(pane, fill=(60,78,83,235))
    elif name == 'hq':
        for x in (76, 502):
            draw.rectangle((x, 22, x+19, 27), fill=(0,0,0,0))


def sprites():
    for name, (src, tw) in SPRITES.items():
        im = key_and_crop(src)
        th = max(1, round(im.height * tw / im.width))
        im = im.resize((tw, th), Image.Resampling.LANCZOS)
        finish_details(im, name)
        im.save(f'{name}.webp', quality=89, method=6)
        print(f'{name}.webp {im.size}')

    # backdrop: downscale + slight darken for mood
    bd = Image.open('src_backdrop.png').convert('RGB')
    bd = bd.resize((2048, round(bd.height * 2048 / bd.width)), Image.LANCZOS)
    bd.save('backdrop.jpg', quality=82)
    print('backdrop.jpg', bd.size)


def icons():
    """App icons for the web manifest: the helicopter over the dusk sky used in the game."""
    heli = Image.open('heli.webp').convert('RGBA')
    sky = [(0.0, (62, 76, 92)), (0.52, (176, 160, 142)), (0.74, (222, 176, 132)), (0.75, (58, 56, 46)), (1.0, (24, 27, 24))]

    def colour(t):
        for (t0, c0), (t1, c1) in zip(sky, sky[1:]):
            if t <= t1:
                k = (t - t0) / (t1 - t0) if t1 > t0 else 0
                return tuple(round(a + (b - a) * k) for a, b in zip(c0, c1))
        return sky[-1][1]

    for name, size, width in (('icon-192.png', 192, 0.84), ('icon-512.png', 512, 0.84), ('icon-maskable-512.png', 512, 0.6)):
        im = Image.new('RGBA', (size, size))
        px = im.load()
        for y in range(size):
            c = colour(y / (size - 1)) + (255,)
            for x in range(size):
                px[x, y] = c
        w = round(size * width)
        h = round(heli.height * w / heli.width)
        craft = heli.resize((w, h), Image.LANCZOS)
        im.alpha_composite(craft, ((size - w) // 2, round(size * 0.44) - h // 2))
        im.convert('RGB').save(name, optimize=True)
        print(name, im.size)


if __name__ == '__main__':
    import sys
    if 'icons' not in sys.argv:
        sprites()
    icons()
