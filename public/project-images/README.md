# Project images

Images used by the Projects carousel and gallery modal. Replace an asset by overwriting the
descriptive filename and updating its ledger row. Carousel images target a ~16:9 aspect; gallery
images preserve the source capture's native composition.

The Arcade captures were taken from the shipped portfolio and its production builds across
2026-09-03–04 at commits `57c35be` and `5ed644a`. Each Arcade slot has a light and dark capture;
the manual site theme selects the matching file, while CleanVoice and Fest keep their existing
theme-neutral images. The captures intentionally use still PNGs: motion does not add enough
context to justify autoplay, reduced-motion branching, or a larger default download.

## Performance budget

The Arcade media set is capped at 350 KiB per full image, 60 KiB per thumbnail, and 2 MiB per
active theme. Only the active theme's sources are placed in the page, so the alternate set is not
downloaded up front. The light set totals 622,589 bytes (~608 KiB), the dark set totals 610,943
bytes (~597 KiB), and every individual file is below its cap. Both sets occupy 1,233,532 bytes
(~1.18 MiB) in the repository.

## Carousel

| File | Slot | Source | Format | Dimensions | Bytes | Status |
| --- | --- | --- | --- | --- | ---: | --- |
| `browser-arcade-carousel-light.png` | 01 · Arcade, compiled · light | Production Arcade hub, light desktop capture | PNG | 1600 × 900 | 149,919 | **Current capture** |
| `browser-arcade-carousel-dark.png` | 01 · Arcade, compiled · dark | Production Arcade hub, dark desktop capture | PNG | 1600 × 900 | 142,435 | **Current capture** |
| `applied-ai-carousel.png` | 02 · CleanVoice | Claude Design `assets/project-agent.png` | PNG | 1672 × 941 | 1,085,045 | **Placeholder** — replace after the CleanVoice showcase cleanup |
| `compiler-carousel.png` | 03 · Fest | Claude Design `assets/project-compiler.png` | PNG | 1672 × 941 | 1,314,786 | **Placeholder** — Fest is currently at lexer-complete stage |

## Arcade gallery

| File | Tab | Source | Format | Dimensions | Bytes | Status |
| --- | --- | --- | --- | --- | ---: | --- |
| `arcade-gallery-01-hub-light.png` | Arcade hub · light | Production Arcade hub, light desktop capture | PNG | 1600 × 1000 | 158,997 | **Current capture** |
| `arcade-gallery-01-hub-dark.png` | Arcade hub · dark | Production Arcade hub, dark desktop capture | PNG | 1600 × 1000 | 147,786 | **Current capture** |
| `arcade-gallery-02-connect-four-light.png` | Connect Four · light | Production game in progress, light desktop capture | PNG | 1600 × 1000 | 127,308 | **Current capture** |
| `arcade-gallery-02-connect-four-dark.png` | Connect Four · dark | Production game in progress, dark desktop capture | PNG | 1600 × 1000 | 103,476 | **Current capture** |
| `arcade-gallery-03-sudoku-light.png` | Sudoku · light | Production puzzle in progress with number controls, light responsive interaction crop | PNG | 820 × 512 | 22,600 | **Current capture** |
| `arcade-gallery-03-sudoku-dark.png` | Sudoku · dark | Production puzzle in progress with number controls, dark responsive interaction crop | PNG | 820 × 512 | 22,883 | **Current capture** |
| `arcade-gallery-04-game-of-life-light.png` | Game of Life · light | Production paused “DG” pattern, light desktop capture | PNG | 1600 × 1000 | 110,585 | **Current capture** |
| `arcade-gallery-04-game-of-life-dark.png` | Game of Life · dark | Production paused “DG” pattern, dark desktop capture | PNG | 1600 × 1000 | 149,325 | **Current capture** |

Each light/dark pair uses identical dimensions, so changing the theme does not shift the gallery
layout. The set deliberately covers desktop and responsive compositions. The gallery keeps the
existing descriptive alternative text and renders each capture at its native aspect ratio.

## Gallery thumbnails

Gallery thumbnail derivatives use the original basename plus `-thumbnail.png`. Regenerate them
from the full-resolution source with a maximum dimension of 480px; never replace the full source
with its thumbnail.

| Thumbnail | Full-resolution source | Format | Dimensions | Bytes | Status |
| --- | --- | --- | --- | ---: | --- |
| `arcade-gallery-01-hub-light-thumbnail.png` | `arcade-gallery-01-hub-light.png` | PNG | 480 × 300 | 16,380 | **Current derivative** |
| `arcade-gallery-01-hub-dark-thumbnail.png` | `arcade-gallery-01-hub-dark.png` | PNG | 480 × 300 | 14,991 | **Current derivative** |
| `arcade-gallery-02-connect-four-light-thumbnail.png` | `arcade-gallery-02-connect-four-light.png` | PNG | 480 × 300 | 13,661 | **Current derivative** |
| `arcade-gallery-02-connect-four-dark-thumbnail.png` | `arcade-gallery-02-connect-four-dark.png` | PNG | 480 × 300 | 11,143 | **Current derivative** |
| `arcade-gallery-03-sudoku-light-thumbnail.png` | `arcade-gallery-03-sudoku-light.png` | PNG | 480 × 300 | 9,801 | **Current derivative** |
| `arcade-gallery-03-sudoku-dark-thumbnail.png` | `arcade-gallery-03-sudoku-dark.png` | PNG | 480 × 300 | 8,561 | **Current derivative** |
| `arcade-gallery-04-game-of-life-light-thumbnail.png` | `arcade-gallery-04-game-of-life-light.png` | PNG | 480 × 300 | 13,338 | **Current derivative** |
| `arcade-gallery-04-game-of-life-dark-thumbnail.png` | `arcade-gallery-04-game-of-life-dark.png` | PNG | 480 × 300 | 10,343 | **Current derivative** |
| `applied-ai-carousel-thumbnail.png` | `applied-ai-carousel.png` | PNG | 480 × 270 | 127,627 | **Placeholder derivative** |
| `compiler-carousel-thumbnail.png` | `compiler-carousel.png` | PNG | 480 × 270 | 163,206 | **Placeholder derivative** |

## Social sharing

The site-wide launch card lives at `public/og-image.png`. Replace it by overwriting that file and
keeping the filename stable so the launch metadata does not need to change.

| File | Slot | Status |
| --- | --- | --- |
| `../og-image.png` | Site-wide Open Graph/social preview | **Launch asset** — generated from `myReference/herodark.png`; manually replaceable at the same path |
