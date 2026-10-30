Choo Choo Pop — PNG art package
Date: 2026-10-30

45 final image assets follow the paths from docs/ART_ASSETS.md.
Train, wagon, track and tree GLB requests are delivered as PNG sprites, as requested.
The engine, all three wagons, entry and exit use a strict vertical top-down view.
Train front and gate arrows point right; rotate sprites in the game as needed.
Sprite canvases retain transparent padding. Scale based on visible bounds when integrating.

resources/: app icon, adaptive foreground/background and splash.
art/: gameplay sprites, backgrounds, decorations and UI.
store/: feature graphic and six 1080x1920 screenshots with Persian headlines.

Store screenshots show the authentic existing game build, captured locally.
The new art is not integrated into that build. Recapture screenshots after integration.
Source game code and Android assets were not changed.
Audio is not included in this image package.

All dimensions and transparent sprite alpha channels were checked.
Total final image size: about 4.1 MiB (under the 10 MiB art budget).
The generated rail connectors and repeating textures need visual alignment/seam checks
when placed on the actual game board; this package is not an integration test.
Suggested nine-slice button insets: left/right 48px, top/bottom 32px.
Adaptive icon foreground is centered within the 66% circular safe region.

preview.png is an overview; asset-manifest.json includes sizes and final prompts.
Raster artwork was generated with built-in imagegen; file sizing, PNG compression,
solid adaptive background and screenshot typography were prepared locally.
