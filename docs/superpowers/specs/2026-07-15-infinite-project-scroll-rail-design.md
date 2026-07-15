# Infinite Project Scroll Rail Design

## Status

Approved from the interactive prototype on 2026-07-15. This supersedes the desktop three-panel treatment in the earlier Projects rail design. The natural-ratio gallery fix and mobile card deck remain unchanged.

## Selected direction

- Desktop uses a real horizontal, scroll-snapping rail instead of previous/selected/next panels.
- Exactly three equal-width project cards fit in the rail viewport at once.
- Every card follows the carousel artwork's native `1672 / 941` aspect ratio, preventing tall displays from stretching the rail.
- The centered card is the selected project. Its details render immediately below the rail.
- Trackpad scrolling, pointer dragging, adjacent-card clicks, keyboard arrows, footer controls, and a direct project index all select projects.
- Selecting the centered card opens its gallery. Selecting any other visible card centers it first.
- Each card keeps a persistent project title and action/state label so the rail reads as navigation before hover.

## Infinite behavior

- The desktop rail renders repeated project sets and starts on the middle set.
- When scrolling settles in either outer set, the rail jumps to the equivalent card in the middle set without animation.
- Because the repeated cards and scroll offset are identical, this recentering must not create a visible discontinuity.
- The selected project counter, details, project index, and accessible state always use the normalized real project index rather than the repeated-card index.

## Scale and accessibility

- A horizontally scrollable project index sits below the rail, so a larger collection does not require stepping through every item.
- Only the middle repeated set participates in the accessibility tree and tab order; repeated edge sets remain pointer-operable visual copies.
- The section retains Left/Right keyboard navigation and visible focus treatment.
- Reduced-motion users receive immediate centering without smooth scrolling.

## Verification

- Component tests cover the three-card geometry, direct index selection, selected-card gallery behavior, and recentering from both repeated ends.
- Browser QA covers horizontal scrolling/dragging, index selection, gallery opening, console health, and visual sizing at laptop, external-monitor, and mobile viewports.
- Full test, lint, typecheck, and build gates must pass.
