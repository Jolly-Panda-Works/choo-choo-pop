"""Normalize generated sprite dimensions, preserving their transparent alpha."""
import sys
from pathlib import Path
from PIL import Image

source, destination, size = sys.argv[1], Path(sys.argv[2]), int(sys.argv[3])
if destination.exists():
    raise SystemExit(f'Refusing to overwrite {destination}')
image = Image.open(source).convert('RGBA')
if image.getextrema()[3][0] == 255:
    raise SystemExit(f'Image has no transparency: {source}')
destination.parent.mkdir(parents=True, exist_ok=True)
image.resize((size, size), Image.Resampling.LANCZOS).save(destination)
print(destination)
