# Project images

Images used by the Projects carousel and gallery modal. Replace an asset by overwriting the
descriptive filename and updating its ledger row. Carousel images target a ~16:9 aspect; gallery
images preserve the source capture's native composition.

The Arcade captures were taken from the shipped portfolio and its production builds across
2026-09-03–04 at commits `57c35be` and `5ed644a`. Each Arcade slot has a light and dark capture;
the manual site theme selects the matching file. Yoshida uses theme-neutral captures from its
[public showcase](https://github.com/david-guerra/Yoshida/blob/main/docs/showcase.md), made with
fictional data. Its optional silent video uses `preload="none"` and appears only in the gallery.

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
| `yoshida-cleaner-requests.jpg` | 02 · Yoshida | Yoshida cleaner dashboard, staged tentative request | JPEG | 1280 × 720 | 51,769 | **Current capture** |
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

## Yoshida gallery

These files come from `david-guerra/Yoshida/docs/media` on 2026-09-25. The source showcase
documents each image's provenance: the caller receipt was reconstructed from a saved verified
call, the tentative request and review screens were staged through the real manual form, and the
confirmed and declined records came from two verified fictional spoken calls. The video is a
silent illustrative replay with timed text, ending on an actual app capture. It is not footage
of a live call. The portfolio repeats these distinctions in the gallery captions.

| File | Gallery item | Dimensions | Bytes |
| --- | --- | --- | ---: |
| `yoshida-demo-poster.jpg` | Demo video poster, frame from the illustrated replay | 1600 × 900 | 64,849 |
| `yoshida-caller-receipt.jpg` | Caller receipt | 1280 × 720 | 61,865 |
| `yoshida-cleaner-requests.jpg` | Needs review and carousel | 1280 × 720 | 51,769 |
| `yoshida-cleaner-review.jpg` | Request details | 1280 × 720 | 40,509 |
| `yoshida-cleaner-decision-controls.jpg` | Decision controls | 1280 × 720 | 37,527 |
| `yoshida-cleaner-confirmed.jpg` | Confirmed | 1280 × 720 | 52,978 |
| `yoshida-cleaner-declined.jpg` | Declined | 1280 × 720 | 52,887 |
| `yoshida-cleaner-mobile.jpg` | Mobile view | 375 × 812 | 28,416 |

Each Yoshida still and poster has a `-thumbnail.jpg` derivative, at most 480 × 270 pixels.
The portrait mobile capture is centered in a 480 × 270 thumbnail so its full height stays visible.
The eight thumbnails total under 90 KiB. The original JPEGs contain no EXIF, IPTC, or XMP
metadata, per the source showcase. The video and WebVTT file live in `../project-videos/`:

| File | Format | Dimensions / duration | Bytes |
| --- | --- | --- | ---: |
| `yoshida-silent-demo.mp4` | H.264 MP4 | 1600 × 900 / 58 seconds | 3,623,760 |
| `yoshida-silent-demo.vtt` | WebVTT timed text | 58 seconds | 784 |

## Gallery thumbnails

The PNG gallery thumbnail derivatives use the original basename plus `-thumbnail.png`.
Regenerate them from the full-resolution source with a maximum dimension of 480px; never replace
the full source with its thumbnail. Yoshida's JPEG derivatives are listed above.

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
| `compiler-carousel-thumbnail.png` | `compiler-carousel.png` | PNG | 480 × 270 | 163,206 | **Placeholder derivative** |

## Social sharing

The site-wide launch card lives at `public/og-image.png`. Replace it by overwriting that file and
keeping the filename stable so the launch metadata does not need to change.

| File | Slot | Status |
| --- | --- | --- |
| `../og-image.png` | Site-wide Open Graph/social preview | **Launch asset** — generated from `myReference/herodark.png`; manually replaceable at the same path |
