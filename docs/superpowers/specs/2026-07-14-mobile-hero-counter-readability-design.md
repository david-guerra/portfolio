# Mobile hero counter readability

## Context

The mobile hero already gives the `DAVID GUERRA` canvas wordmark the intended
80% viewport-width footprint. Its readability problem is topological, not
dimensional: at the phone breakpoint each glyph pixel is one canvas cell, and
the approved one-cell 4-neighbor dilation consumes the enclosed counters in
`D`, `A`, and `R`. Those letters read as solid blobs.

The change must preserve the approved thick pixel character, wordmark size,
grid grain, rest composition, and Hybrid tear interaction.

## Design

### Counter-safe mobile dilation

At the phone layout (`clusterSize === 1`), glyph construction will distinguish
enclosed blank regions from exterior blank space. It will apply the existing
4-neighbor dilation into exterior space while protecting enclosed counters.

Counter detection happens per glyph before the glyph is placed into the name
layout. Blank glyph pixels reachable from the glyph bounding-box edge are
exterior; blank pixels not reachable from an edge are counters. The protected
counter cells are omitted from the dilation ring.

Tablet and desktop glyph construction remains unchanged. The mobile wordmark
keeps its existing position, 80% width, pitch, line spacing, and cluster size.

### Generous mobile DPR cap

Canvas backing resolution will use:

```text
viewport width < 560px: min(devicePixelRatio, 2.5)
otherwise:             devicePixelRatio
```

The 2.5 cap retains more than two physical pixels per CSS pixel while reducing
a DPR-3 phone's backing-pixel count by about 31%. At 375×761, the combined main
and offscreen canvas backing storage falls from roughly 20.5 MB to 14.3 MB.

The existing performance architecture remains authoritative: cached offscreen
rest layer, active-cell delta drawing, 60fps cap, early spring retirement,
sub-pixel impulse pruning, and zero animation work while idle.

## Testing

- Unit-test that mobile `D`, `A`, and `R` counters remain empty after dilation.
- Unit-test that exterior neighbors are still added, proving strokes remain
  dilated rather than reverting to the base glyphs.
- Unit-test the mobile-only 2.5 DPR cap and uncapped non-mobile behavior.
- Keep existing layout, interaction, settling, and reduced-motion tests green.
- Browser-check dark and light at 375×812 for letter identity, overflow, console
  health, and unchanged overall composition.
- Recheck desktop to ensure the approved dilated treatment is unchanged.

## Non-goals

- Increasing or repositioning the mobile wordmark.
- Changing the glyph alphabet, grid grain, confetti, colors, or copy.
- Retuning Hybrid tear radii or spring behavior.
- Implementing the separate Hero-to-About hand-off ticket.
