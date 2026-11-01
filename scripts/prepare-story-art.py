"""Resize generated story panels and encode the game's WebP assets."""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/choo-choo-pop-assets/art/story'
MANIFEST = ROOT / 'docs/story-art-manifest.json'

def main():
    entries = json.loads(MANIFEST.read_text(encoding='utf-8'))
    total = 0
    for entry in entries:
        output = DEST / (entry['panel'] + '.webp')
        with Image.open(entry['source']) as source:
            panel = ImageOps.fit(source.convert('RGB'), tuple(entry['size']), method=Image.Resampling.LANCZOS)
            # Remove subpixel detail before encoding while preserving final dimensions.
            detail_size = tuple(round(edge * 0.35) for edge in panel.size)
            panel = panel.resize(detail_size, Image.Resampling.LANCZOS).resize(panel.size, Image.Resampling.LANCZOS)
            panel.save(output, 'WEBP', quality=85, method=6)
        with Image.open(output) as image:
            assert image.size == tuple(entry['size']), output
        total += output.stat().st_size
        print(f'{output.name}: {entry["size"]}, {output.stat().st_size:,} bytes')
    print(f'Total: {total:,} bytes ({len(entries)} panels)')
    assert total < 2_000_000, 'Story artwork exceeds the 2 MB budget'

if __name__ == '__main__':
    main()
