# Infinite Project Scroll Rail Implementation Plan

**Goal:** Replace the desktop fixed three-panel carousel with the approved, scalable, infinite horizontal rail while keeping the mobile deck and gallery behavior intact.

## Tasks

1. Add failing component tests for three-card geometry, direct selection, and bidirectional infinite recentering.
2. Render the repeated desktop scroll track with native-ratio cards and normalized selection state.
3. Add drag, scroll-snap, direct index, keyboard, footer, and selected-card gallery interactions.
4. Run focused tests and regular typechecking during implementation.
5. Validate laptop, external-monitor, and mobile layouts in the browser.
6. Run the full verification suite, review the diff, and commit the finished branch.

