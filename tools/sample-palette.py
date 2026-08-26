#!/usr/bin/env python3
"""
Pull a dimension's palette out of the painting it is built from.

Law 2 of the design system: every colour in a dimension is sampled from its
painting, and recorded with where it came from. Not "inspired by" -- sampled,
so the claim is checkable.

Method: k-means in Lab-ish space over a downsampled image, then for each cluster
report the nearest ACTUAL pixel and its coordinates. Reporting the cluster
centroid would be an average of colours that may not appear anywhere in the
work; reporting a real pixel keeps the palette honest.

Run:  python3 tools/sample-palette.py art-originals/When-Gravity-Sleeps.png 6
"""
from PIL import Image
import sys, json, math, random

def srgb_to_lab(c):
    def f(u):
        u = u / 255
        u = u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4
        return u
    r, g, b = (f(v) for v in c)
    x = r*0.4124 + g*0.3576 + b*0.1805
    y = r*0.2126 + g*0.7152 + b*0.0722
    z = r*0.0193 + g*0.1192 + b*0.9505
    def g_(t): return t ** (1/3) if t > 0.008856 else 7.787*t + 16/116
    fx, fy, fz = g_(x/0.9505), g_(y), g_(z/1.089)
    return (116*fy - 16, 500*(fx-fy), 200*(fy-fz))

def main(path, k):
    im = Image.open(path).convert('RGB')
    W, H = im.size
    small = im.resize((160, int(160 * H / W)), Image.LANCZOS)
    pixels = [(x, y, small.getpixel((x, y))) for x in range(small.width) for y in range(small.height)]
    labs = [srgb_to_lab(p[2]) for p in pixels]

    random.seed(7)                      # deterministic: same painting, same palette
    centres = random.sample(labs, k)
    for _ in range(24):
        buckets = [[] for _ in range(k)]
        for lab in labs:
            best = min(range(k), key=lambda i: sum((lab[j]-centres[i][j])**2 for j in range(3)))
            buckets[best].append(lab)
        centres = [tuple(sum(v[j] for v in b)/len(b) for j in range(3)) if b else centres[i]
                   for i, b in enumerate(buckets)]

    out = []
    for i, centre in enumerate(centres):
        # nearest real pixel to the centroid -- a colour he actually put down
        idx = min(range(len(labs)), key=lambda n: sum((labs[n][j]-centre[j])**2 for j in range(3)))
        x, y, rgb = pixels[idx]
        share = len(buckets[i]) / len(labs)
        out.append({
            'hex': '#%02X%02X%02X' % rgb,
            'source': {'x': round(x * W / small.width), 'y': round(y * H / small.height)},
            'share': round(share, 4),
        })
    out.sort(key=lambda e: -e['share'])
    print(json.dumps({'painting': path.split('/')[-1], 'colours': out}, indent=2))

if __name__ == '__main__':
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 6)
