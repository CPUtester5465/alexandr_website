#!/usr/bin/env python3
"""
The measurable half of the fidelity court.

Compares a generated sky against the painting it claims to come from, in two
ways a machine can actually do:

1. PALETTE DISTANCE. Both images k-means'd identically (same tool discipline as
   sample-palette.py), then each generated cluster matched to its nearest
   reference cluster in Lab space. Reports per-pair dE and a share-weighted
   total. dE < 10 is the same paint, < 20 is drifting, above that the sky is
   wearing someone else's colours.

2. THE CONTACT SHEET. Matched crops -- reference top row, generation bottom row
   -- written to one image for the vision half of the court, which judges what
   numbers cannot: mark-making, edge character, whether the same hand made both.

Usage: python3 tools/compare-pano.py <reference.png> <generated.png> <out-prefix>
"""
import sys, random, math
from PIL import Image

def srgb_to_lab(c):
    def f(u):
        u = u/255
        return u/12.92 if u <= 0.04045 else ((u+0.055)/1.055)**2.4
    r,g,b = (f(v) for v in c)
    x = r*0.4124+g*0.3576+b*0.1805; y = r*0.2126+g*0.7152+b*0.0722; z = r*0.0193+g*0.1192+b*0.9505
    def g_(t): return t**(1/3) if t > 0.008856 else 7.787*t+16/116
    fx,fy,fz = g_(x/0.9505), g_(y), g_(z/1.089)
    return (116*fy-16, 500*(fx-fy), 200*(fy-fz))

def kmeans_palette(img, k=6):
    small = img.resize((160, max(1,int(160*img.size[1]/img.size[0]))), Image.LANCZOS)
    px = [small.getpixel((x,y)) for x in range(small.width) for y in range(small.height)]
    labs = [srgb_to_lab(p) for p in px]
    random.seed(7)
    centres = random.sample(labs, k)
    for _ in range(20):
        buckets = [[] for _ in range(k)]
        for i,l in enumerate(labs):
            buckets[min(range(k), key=lambda c: sum((l[j]-centres[c][j])**2 for j in range(3)))].append(i)
        centres = [tuple(sum(labs[i][j] for i in b)/len(b) for j in range(3)) if b else centres[c]
                   for c,b in enumerate(buckets)]
    out = []
    for c,b in enumerate(buckets):
        if not b: continue
        i = min(b, key=lambda n: sum((labs[n][j]-centres[c][j])**2 for j in range(3)))
        out.append({'rgb': px[i], 'lab': labs[i], 'share': len(b)/len(labs)})
    return sorted(out, key=lambda e: -e['share'])

def dE(a,b): return math.sqrt(sum((a[i]-b[i])**2 for i in range(3)))

def main(ref_path, gen_path, prefix):
    ref = Image.open(ref_path).convert('RGB')
    gen = Image.open(gen_path).convert('RGB')

    rp, gp = kmeans_palette(ref), kmeans_palette(gen)
    print(f"{'GEN colour':10} share  ->  nearest REF     dE")
    weighted = 0.0
    for g in gp:
        best = min(rp, key=lambda r: dE(r['lab'], g['lab']))
        d = dE(best['lab'], g['lab'])
        weighted += d * g['share']
        flag = '' if d < 10 else ('  DRIFT' if d < 20 else '  FOREIGN')
        print(f"#{g['rgb'][0]:02X}{g['rgb'][1]:02X}{g['rgb'][2]:02X}  {g['share']:.2f}  ->  "
              f"#{best['rgb'][0]:02X}{best['rgb'][1]:02X}{best['rgb'][2]:02X}      {d:5.1f}{flag}")
    print(f"\nshare-weighted palette distance: {weighted:.1f}   (<10 same paint, <20 drifting, else foreign)")

    # contact sheet: 4 ref crops (grid, centre-biased) over 4 gen crops (across
    # the yaw at eye height, where a sky dome is actually looked at)
    T = 360
    def crops_ref():
        w,h = ref.size; cw = w//2; ch = h//2
        boxes = [(0,0,cw,ch),(cw,0,w,ch),(0,ch,cw,h),(cw,ch,w,h)]
        return [ref.crop(b).resize((T,T), Image.LANCZOS) for b in boxes]
    def crops_gen():
        w,h = gen.size; band_top = int(h*0.28); band_bot = int(h*0.78)
        step = w//4
        return [gen.crop((i*step, band_top, i*step+(band_bot-band_top), band_bot))
                  .resize((T,T), Image.LANCZOS) for i in range(4)]
    sheet = Image.new('RGB', (T*4+50, T*2+70), (24,20,16))
    for i,c in enumerate(crops_ref()): sheet.paste(c, (10+i*(T+10), 10))
    for i,c in enumerate(crops_gen()): sheet.paste(c, (10+i*(T+10), T+40))
    sheet.save(f"{prefix}-contact.jpg", quality=85)
    print(f"contact sheet -> {prefix}-contact.jpg  (top: reference, bottom: generation)")

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
