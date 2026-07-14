# Project images

Images used by the Projects carousel and gallery modal. Replace a placeholder by overwriting
the file with a real capture and keeping its descriptive filename. Carousel images target a
~16:9 aspect; gallery images should preserve the final modal's composition.

## Carousel

| File | Slot | Status |
| --- | --- | --- |
| `browser-arcade-carousel.png` | 01 · Arcade, compiled | **Placeholder** — designed mockup from the Claude Design project (`assets/project-arcade.png`) |
| `applied-ai-carousel.png` | 02 · CleanVoice | **Placeholder** — designed mockup from the Claude Design project (`assets/project-agent.png`); replace after the CleanVoice showcase cleanup |
| `compiler-carousel.png` | 03 · Fest | **Placeholder** — designed mockup (code + AST panes) from the Claude Design project (`assets/project-compiler.png`); Fest is currently at lexer-complete stage |

## Arcade gallery

These are temporary modernized design references generated from the four canonical Arcade
screens in `myReference/`. Use them during implementation, then overwrite them with real captures
from the finished application during the dedicated design pass.

| File | Tab | Status |
| --- | --- | --- |
| `arcade-gallery-01-hub.png` | Arcade hub | **Placeholder** — generated from `myReference/arcadeview.png` |
| `arcade-gallery-02-connect-four.png` | Connect Four | **Placeholder** — generated from `myReference/connect4.png` |
| `arcade-gallery-03-sudoku.png` | Sudoku | **Placeholder** — generated from `myReference/sudoku.png` |
| `arcade-gallery-04-game-of-life.png` | Game of Life | **Placeholder** — generated from `myReference/gameoflife.png` |

Placeholder ⇄ final status is tracked in this table; flip the row when you drop in a real image.

## Gallery thumbnails

Gallery thumbnail derivatives use the original basename plus `-thumbnail.png`. They are PNGs
with a maximum dimension of 480px, generated from the corresponding full-resolution source with
`sips -Z 480`. Keep the full-resolution originals for the selected gallery frame; do not overwrite
them when regenerating thumbnails.

| Thumbnail | Full-resolution source | Dimensions |
| --- | --- | --- |
| `arcade-gallery-01-hub-thumbnail.png` | `arcade-gallery-01-hub.png` | 480 × 300 |
| `arcade-gallery-02-connect-four-thumbnail.png` | `arcade-gallery-02-connect-four.png` | 480 × 270 |
| `arcade-gallery-03-sudoku-thumbnail.png` | `arcade-gallery-03-sudoku.png` | 480 × 300 |
| `arcade-gallery-04-game-of-life-thumbnail.png` | `arcade-gallery-04-game-of-life.png` | 480 × 300 |
| `applied-ai-carousel-thumbnail.png` | `applied-ai-carousel.png` | 480 × 270 |
| `compiler-carousel-thumbnail.png` | `compiler-carousel.png` | 480 × 270 |
