#!/usr/bin/env python3
"""
Build Alexandr's avatar skin: a 64x64 classic Minecraft skin.

Why this format rather than a bespoke texture layout: it is the one every skin
editor on earth already understands. Alexandr can open the output in any of
them and change his own hair, and nothing here has to know about it.

Every colour below was SAMPLED from photographs, not chosen. The method, because
it matters and naive sampling gets it wrong:

  1. The photographs are overcast phone shots with a heavy blue-grey cast --
     his white T-shirt measured rgb(177, 179, 200) when it is white.
  2. That T-shirt is therefore a grey card sitting in the same light as his
     face. Correcting by it (targeting 225, not 255 -- white cotton in open
     shade reflects about 0.88, and targeting pure white bleaches the skin)
     recovers usable skin and hair values.
  3. It does NOT recover the iris. His eyes sit deep under a fringe, roughly a
     stop and a half down, and the sclera beside them still measures
     rgb(181, 155, 132) after correction. At that size JPEG chroma subsampling
     has eaten the colour: the iris measures neutral grey against its own
     sclera. It is visibly light and low-saturation; the exact hue is the one
     value here that is NOT measured, and it is marked as such below.

Run:  python3 tools/make-avatar-skin.py [out.png]
"""

from PIL import Image
import sys

# ---------------------------------------------------------------------------
# The palette. Sampled unless marked.
# ---------------------------------------------------------------------------

SKIN_LIGHT   = (0xF2, 0xC4, 0xA0)   # forehead / nose, lit
SKIN         = (0xE8, 0xAE, 0x87)   # base face
SKIN_SHADE   = (0xC0, 0x8E, 0x6E)   # under the jaw, inside the ears
SKIN_DEEP    = (0xA9, 0x78, 0x5C)   # neck, deepest crease

HAIR         = (0x4A, 0x36, 0x2C)   # dark brown, the body of it
HAIR_DARK    = (0x30, 0x22, 0x1C)   # shadow between curls
HAIR_LIFT    = (0x6B, 0x4E, 0x3C)   # sun-lifted ends, clear in the summer shot
BROW         = (0x6B, 0x50, 0x39)

EYE_WHITE    = (0xEC, 0xE4, 0xDC)
EYE_IRIS     = (0x7C, 0x8B, 0x84)   # ** NOT MEASURED ** light grey-green.
                                    # See the note at the top. Needs Alexandr
                                    # to confirm; it is one pixel per eye.
EYE_LINE     = (0x2B, 0x27, 0x24)

MOUTH        = (0xA9, 0x74, 0x69)   # lips, lightened -- at 8px a dark mouth reads as a scowl

TEE          = (0xED, 0xED, 0xF0)   # the white graphic tee, his look in 3 of 4 photos
TEE_SHADE    = (0xD2, 0xD2, 0xD8)
PRINT        = (0x1A, 0x1A, 0x1A)   # the black print across the chest

# ** NOT OBSERVABLE ** -- no photograph shows his legs or feet. Placeholders,
# flagged so they are not mistaken for sampled values.
JEANS        = (0x2E, 0x3A, 0x52)
JEANS_SHADE  = (0x24, 0x2E, 0x42)
SHOE         = (0x33, 0x34, 0x3A)

NONE = (0, 0, 0, 0)

# ---------------------------------------------------------------------------
# Classic 64x64 UV layout. (x, y, w, h) per face.
# ---------------------------------------------------------------------------

HEAD = {'top': (8, 0, 8, 8), 'bottom': (16, 0, 8, 8), 'right': (0, 8, 8, 8),
        'front': (8, 8, 8, 8), 'left': (16, 8, 8, 8), 'back': (24, 8, 8, 8)}
HAT = {'top': (40, 0, 8, 8), 'bottom': (48, 0, 8, 8), 'right': (32, 8, 8, 8),
       'front': (40, 8, 8, 8), 'left': (48, 8, 8, 8), 'back': (56, 8, 8, 8)}

BODY = {'top': (20, 16, 8, 4), 'bottom': (28, 16, 8, 4), 'right': (16, 20, 4, 12),
        'front': (20, 20, 8, 12), 'left': (28, 20, 4, 12), 'back': (32, 20, 8, 12)}
JACKET = {k: (v[0], v[1] + 16, v[2], v[3]) for k, v in BODY.items()}

R_ARM = {'top': (44, 16, 4, 4), 'bottom': (48, 16, 4, 4), 'right': (40, 20, 4, 12),
         'front': (44, 20, 4, 12), 'left': (48, 20, 4, 12), 'back': (52, 20, 4, 12)}
R_SLEEVE = {k: (v[0], v[1] + 16, v[2], v[3]) for k, v in R_ARM.items()}

L_ARM = {'top': (36, 48, 4, 4), 'bottom': (40, 48, 4, 4), 'right': (32, 52, 4, 12),
         'front': (36, 52, 4, 12), 'left': (40, 52, 4, 12), 'back': (44, 52, 4, 12)}
L_SLEEVE = {k: (v[0] + 16, v[1], v[2], v[3]) for k, v in L_ARM.items()}

R_LEG = {'top': (4, 16, 4, 4), 'bottom': (8, 16, 4, 4), 'right': (0, 20, 4, 12),
         'front': (4, 20, 4, 12), 'left': (8, 20, 4, 12), 'back': (12, 20, 4, 12)}
R_PANT = {k: (v[0], v[1] + 16, v[2], v[3]) for k, v in R_LEG.items()}

L_LEG = {'top': (20, 48, 4, 4), 'bottom': (24, 48, 4, 4), 'right': (16, 52, 4, 12),
         'front': (20, 52, 4, 12), 'left': (24, 52, 4, 12), 'back': (28, 52, 4, 12)}
L_PANT = {k: (v[0] - 16, v[1], v[2], v[3]) for k, v in L_LEG.items()}


def build() -> Image.Image:
    img = Image.new('RGBA', (64, 64), NONE)
    px = img.load()

    def fill(face, colour):
        x, y, w, h = face
        for i in range(w):
            for j in range(h):
                px[x + i, y + j] = colour + (255,)

    def dot(face, i, j, colour):
        x, y, _, _ = face
        px[x + i, y + j] = colour + (255,) if len(colour) == 3 else colour

    def rows(face, spec):
        """spec: list of 'strings', one char per pixel, keyed by LEGEND."""
        for j, row in enumerate(spec):
            for i, ch in enumerate(row):
                if ch == '.':
                    continue
                dot(face, i, j, LEGEND[ch])

    LEGEND = {
        's': SKIN, 'l': SKIN_LIGHT, 'd': SKIN_SHADE, 'D': SKIN_DEEP,
        'h': HAIR, 'H': HAIR_DARK, 'g': HAIR_LIFT, 'b': BROW,
        'w': EYE_WHITE, 'i': EYE_IRIS, 'k': EYE_LINE, 'm': MOUTH,
        't': TEE, 'T': TEE_SHADE, 'p': PRINT,
        'j': JEANS, 'J': JEANS_SHADE, 'o': SHOE,
    }

    # ---- head ------------------------------------------------------------
    # The base head carries skin and the fringe; the volume of his hair is the
    # hat layer, which is what that layer is for and the only way a block head
    # reads as curly rather than as a helmet.
    for f in HEAD.values():
        fill(f, SKIN)
    fill(HEAD['top'], HAIR)
    fill(HEAD['back'], HAIR)

    rows(HEAD['front'], [
        'hhhhhhhh',   # fringe sits low on his forehead in every photo
        'hhhhhhhh',
        'hhhhhhhh',
        '.bb..bb.',   # brows: straight, not heavy, and NOT covered by the hat
        'swissiws',   # eyes: white outside, iris inside, skin across the bridge
        'sslllss.',   # a lit nose, no outline -- an outlined nose reads as a mask
        '..smms..',
        '.dssssd.',
    ])
    rows(HEAD['right'], [
        'hhhhhhhh', 'hhhhhhhh', 'hhhhhhsl', 'hhhhssss',
        'hhhsssss', 'hhsssssd', 'hhsssdd.', 'hhdddd..',
    ])
    rows(HEAD['left'], [
        'hhhhhhhh', 'hhhhhhhh', 'lshhhhhh', 'sssshhhh',
        'ssssshhh', 'dssssshh', '.ddssshh', '..ddddhh',
    ])
    fill(HEAD['bottom'], SKIN_DEEP)

    # ---- hat layer: the curl ---------------------------------------------
    # Deliberately ragged. A clean silhouette here reads as a bowl cut; his
    # hair is voluminous and breaks up at the edges, with lifted ends.
    rows(HAT['front'], [
        'hHhhhhHh',
        'hhgHhghh',
        'hHh..hHh',   # ragged fringe tips; the gap is where his brows show
        'h......h',   # two strands at the temples only
        '........',
        '........',
        '........',
        '........',
    ])
    rows(HAT['top'], [
        'hHhhhhHh', 'HhhgghhH', 'hhgHHghh', 'hghHHhgh',
        'hhgHHghh', 'HhhgghhH', 'hHhhhhHh', 'hhHhhHhh',
    ])
    rows(HAT['back'], [
        'hHhhhhHh', 'hhgHHghh', 'hHhhhhHh', 'hhgHHghh',
        'hHhhhhHh', 'hhg..ghh', 'hH....Hh', '.h....h.',
    ])
    rows(HAT['right'], [
        'hhhhhhhh', 'hhgHhghh', 'hhhhhhh.', 'hhhhhh..',
        'hhhhh...', 'hhgh....', 'hhh.....', 'hh......',
    ])
    rows(HAT['left'], [
        'hhhhhhhh', 'hhghHghh', '.hhhhhhh', '..hhhhhh',
        '...hhhhh', '....hghh', '.....hhh', '......hh',
    ])

    # ---- body: the white graphic tee -------------------------------------
    for f in BODY.values():
        fill(f, TEE)
    fill(BODY['top'], SKIN_DEEP)          # neck
    rows(BODY['front'], [
        'tTDDDTtt',   # neck opening
        'tttttttt',
        'tppppppt',   # the black print, bold and across the chest
        'tpttttpt',
        'tppppppt',
        'tttttttt',
        'ttppppt.',
        'tttttttt',
        'tttttttt',
        'tttttttt',
        'tTtttttT',
        'TTTTTTTT',
    ])
    rows(BODY['back'], [
        'tTDDDTtt', 'tttttttt', 'tttttttt', 'tttttttt',
        'tttttttt', 'tttttttt', 'tttttttt', 'tttttttt',
        'tttttttt', 'tttttttt', 'tTtttttT', 'TTTTTTTT',
    ])

    # ---- arms: short sleeves, so the forearms are skin --------------------
    for f in R_ARM.values():
        fill(f, SKIN)
    for f in L_ARM.values():
        fill(f, SKIN)
    for arm in (R_ARM, L_ARM):
        fill(arm['top'], TEE)
        for face in ('front', 'back', 'left', 'right'):
            x, y, w, _ = arm[face]
            for i in range(w):
                for j in range(4):        # sleeve ends a third of the way down
                    px[x + i, y + j] = TEE + (255,)
                px[x + i, y + 4] = TEE_SHADE + (255,)

    # ---- legs -------------------------------------------------------------
    for f in R_LEG.values():
        fill(f, JEANS)
    for f in L_LEG.values():
        fill(f, JEANS)
    for leg in (R_LEG, L_LEG):
        for face in ('front', 'back', 'left', 'right'):
            x, y, w, _ = leg[face]
            for i in range(w):
                for j in (10, 11):        # shoes
                    px[x + i, y + j] = SHOE + (255,)
            px[x, y + 5] = JEANS_SHADE + (255,)
        fill(leg['bottom'], SHOE)

    return img


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/avatar/alexandr-skin.png'
    build().save(out)
    print(f'wrote {out}')
