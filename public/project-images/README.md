# Project images

Images used by the Projects carousel and gallery modal. Replace an asset by overwriting the
descriptive filename and updating its ledger row. Carousel images target a ~16:9 aspect; gallery
images preserve the source capture's native composition.

The Arcade captures were taken from the shipped portfolio and its same-commit production build
across 2026-09-03–04 at commit `57c35be`. They intentionally use still PNGs: motion does not add
enough context to justify autoplay, reduced-motion branching, or a larger default download.

## Performance budget

The Arcade media set is capped at 350 KiB per full image, 60 KiB per thumbnail, and 2 MiB total.
The current carousel image, four gallery images, and four thumbnails total 624,500 bytes
(~610 KiB); every individual file is below its cap.

## Carousel

| File | Slot | Source | Format | Dimensions | Bytes | Status |
| --- | --- | --- | --- | --- | ---: | --- |
| `browser-arcade-carousel.png` | 01 · Arcade, compiled | Production Arcade hub, dark desktop capture | PNG | 1600 × 900 | 142,435 | **Current capture** |
| `applied-ai-carousel.png` | 02 · CleanVoice | Claude Design `assets/project-agent.png` | PNG | 1672 × 941 | 1,085,045 | **Placeholder** — replace after the CleanVoice showcase cleanup |
| `compiler-carousel.png` | 03 · Fest | Claude Design `assets/project-compiler.png` | PNG | 1672 × 941 | 1,314,786 | **Placeholder** — Fest is currently at lexer-complete stage |

## Arcade gallery

| File | Tab | Source | Format | Dimensions | Bytes | Status |
| --- | --- | --- | --- | --- | ---: | --- |
| `arcade-gallery-01-hub.png` | Arcade hub | Production Arcade hub, light desktop capture | PNG | 1600 × 1000 | 158,997 | **Current capture** |
| `arcade-gallery-02-connect-four.png` | Connect Four | Production game in progress, dark desktop capture | PNG | 1600 × 1000 | 103,476 | **Current capture** |
| `arcade-gallery-03-sudoku.png` | Sudoku | Production puzzle in progress with number controls, light responsive interaction crop | PNG | 820 × 512 | 22,600 | **Current capture** |
| `arcade-gallery-04-game-of-life.png` | Game of Life | Production paused “DG” pattern, dark desktop capture | PNG | 1600 × 1000 | 149,325 | **Current capture** |

The set deliberately covers desktop and mobile compositions and both themes. The gallery keeps
the existing descriptive alternative text and renders each capture at its native aspect ratio.

## Gallery thumbnails

Gallery thumbnail derivatives use the original basename plus `-thumbnail.png`. Regenerate them
from the full-resolution source with a maximum dimension of 480px; never replace the full source
with its thumbnail.

| Thumbnail | Full-resolution source | Format | Dimensions | Bytes | Status |
| --- | --- | --- | --- | ---: | --- |
| `arcade-gallery-01-hub-thumbnail.png` | `arcade-gallery-01-hub.png` | PNG | 480 × 300 | 16,380 | **Current derivative** |
| `arcade-gallery-02-connect-four-thumbnail.png` | `arcade-gallery-02-connect-four.png` | PNG | 480 × 300 | 11,143 | **Current derivative** |
| `arcade-gallery-03-sudoku-thumbnail.png` | `arcade-gallery-03-sudoku.png` | PNG | 480 × 300 | 9,801 | **Current derivative** |
| `arcade-gallery-04-game-of-life-thumbnail.png` | `arcade-gallery-04-game-of-life.png` | PNG | 480 × 300 | 10,343 | **Current derivative** |
| `applied-ai-carousel-thumbnail.png` | `applied-ai-carousel.png` | PNG | 480 × 270 | 127,627 | **Placeholder derivative** |
| `compiler-carousel-thumbnail.png` | `compiler-carousel.png` | PNG | 480 × 270 | 163,206 | **Placeholder derivative** |
