#!/usr/bin/env python3
"""
Does every face on disk actually carry the alphabets the site is written in?

A subset declaration is not coverage. Pixelify Sans declares Cyrillic and is
missing О and П. Run this after touching fonts, and before believing anybody.

  python3 tools/check-fonts.py    -> exits non-zero if a face has a hole
"""

import glob, os, sys
from fontTools.ttLib import TTFont

ALPHABETS = {
    "ru": "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя",
    "en": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "num": "0123456789",
    "punct": "«»—–·…№",
}

failed = False
for path in sorted(glob.glob("public/fonts/*.woff")):
    font = TTFont(path, fontNumber=0)
    cmap = set()
    for table in font["cmap"].tables:
        cmap |= set(table.cmap.keys())
    holes = {
        name: "".join(c for c in chars if ord(c) not in cmap)
        for name, chars in ALPHABETS.items()
    }
    holes = {k: v for k, v in holes.items() if v}
    name = os.path.basename(path)
    if holes:
        failed = True
        print(f"FAIL  {name:22} {holes}")
    else:
        print(f"ok    {name:22} {len(cmap)} glyphs")

sys.exit(1 if failed else 0)
