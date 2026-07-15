# Shared About and Projects Frame Design

## Status

Approved in conversation on 2026-07-15, subject to one hard constraint: the current MacBook composition must remain unchanged.

## Problem

The About pane caps its structural width at `1364px`, while the Projects pane now caps at `1800px`. On an external display, the About footer divider ends hundreds of pixels before the Projects footer divider. The mismatch is especially visible during the vertical slide between the two panes.

## Selected direction

- Keep the Projects frame unchanged at `1800px` maximum width.
- Give About a two-layer frame:
  - an outer structural frame that remains `1364px` through laptop-sized viewports and expands to the shared `1800px` maximum only at CSS viewport widths of `1800px` and above;
  - an inner editorial frame that remains `1364px` at every viewport width.
- The About heading, paragraphs, and location metadata stay inside the editorial frame.
- The About footer divider and `Next · Projects` control use the outer structural frame. On external monitors, their left and right edges therefore align with the Projects footer divider.
- Projects layout, project-card sizing, scroll behavior, and gallery behavior remain unchanged.

## Shared boundary

A small shared `SectionFrame` component owns the semantic frame widths instead of leaving unrelated `max-w-*` literals in About and Projects. It exposes only the two widths currently needed:

- `wide`: `1800px` maximum at all desktop widths, for Projects;
- `external-wide`: `1364px` maximum below `1800px`, then `1800px`, for the About structural shell.

About keeps a nested `1364px` editorial content container. This avoids widening prose or changing its grid while allowing the structural divider to align on larger displays.

## Responsive invariants

- At `1586×992` and every viewport below `1800px` wide, the About frame, content grid, footer line, and footer control retain their existing `1364px` maximum width.
- At `2048×1152`, both About and Projects structural frames resolve to `1800px`.
- Mobile markup and layout remain visually unchanged.
- Neither pane may introduce document-level horizontal overflow.

## Verification

- Add component coverage before implementation for the two frame variants and About's nested editorial container.
- Compare computed widths and screenshots at `1586×992`, `1799×1100`, `1800×1100`, `2048×1152`, and `393×780`.
- At MacBook width, capture a before/after geometry ledger and require zero width or horizontal-position change for About's content and footer divider.
- At external-monitor width, require the About and Projects footer dividers to have matching widths and horizontal positions.
- Run the complete test, lint, typecheck, build, and diff-check gates.

## Out of scope

- Widening or reflowing About's editorial content
- Changing Projects rail dimensions or interaction
- Changing vertical spacing, typography, colors, or copy
- Aligning unrelated modal or navigation widths
