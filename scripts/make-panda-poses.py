"""Cuts the 8 panda poses (art/panda/*.webp) out of the 4x2 character sheet.
Usage: python3 scripts/make-panda-poses.py path/to/sheet.png
The sheet is 1536x1024: 4 columns x 2 rows, order = wave, lever, whistle, ticket / point, drive, salute, cheer.
These are opaque portraits (the sheet has a dark background). Final transparent cut-outs: see docs/ART_ASSETS_V2.md.
"""
import sys
from PIL import Image

NAMES = ['wave', 'lever', 'whistle', 'ticket', 'point', 'drive', 'salute', 'cheer']
im = Image.open(sys.argv[1]).convert('RGB')
cw, ch = im.width // 4, im.height // 2
for k, name in enumerate(NAMES):
    cx, cy = k % 4, k // 4
    im.crop((cx * cw, cy * ch, (cx + 1) * cw, (cy + 1) * ch)).resize((288, 384), Image.LANCZOS).save(
        f'public/choo-choo-pop-assets/art/panda/{name}.webp', quality=82, method=6)
