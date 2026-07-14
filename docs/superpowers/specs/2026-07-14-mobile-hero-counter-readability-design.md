# Mobile hero glyph readability

## Context

The mobile hero already gives the `DAVID GUERRA` canvas wordmark the intended
80% viewport-width footprint. Its readability problem is topological, not
dimensional: at the phone breakpoint each glyph pixel is one canvas cell, and
generic one-cell 4-neighbor dilation removes the identifying negative space
from several letters.

An initial automatic counter-preservation design was rendered and rejected.
It made the `D` too hollow while leaving the open forms of `G` and `E`
ambiguous. David then edited every mobile glyph in a temporary pixel editor and
approved the resulting masks.

The change must preserve the approved thick pixel character, wordmark size,
grid grain, rest composition, and Hybrid tear interaction.

## Design

### Direct user-authored mobile masks

At the phone layout (`clusterSize === 1`), the default dilated name treatment
will render these final masks exactly:

```text
D          A          V          I        G          U          E          R
.1111..    ..111..    .1...1.    11111    ..1111.    111.111    .111111    11111..
111111.    .11111.    111.111    11111    .111111    111.111    1111111    111111.
1111111    111.111    111.111    .111.    1111111    111.111    1111111    111.111
111.111    111.111    111.111    .111.    111....    111.111    111....    111.111
111.111    1111111    111.111    .111.    111.111    111.111    111111.    111111.
111.111    1111111    111.111    .111.    111..11    111.111    111111.    11111..
1111111    111.111    .11111.    .111.    1111111    111.111    111....    111111.
111111.    111.111    .11111.    11111    .111111    1111111    1111111    111.111
.1111..    111.111    ..111..    11111    ..1111.    .11111.    .111111    111..11
```

`1` is a lit name cell and `.` is an empty cell. Mobile rendering will not run
generic dilation, flood-fill counter detection, or any other topology-changing
pass over these masks.

Each mask occupies the same one-cell envelope that the current dilation creates
around its base glyph. It is placed one row and one column before the existing
base-glyph origin. Glyph origins still advance by the original base-glyph width
plus the existing one-cell gap, so adjacent mask envelopes can share cells in
the same way as the current dilated treatment. This preserves the current
position, pitch, line spacing, cluster size, and approximately 80% wordmark
width.

The explicit `weight: 'base'` path retains the original undilated 5×7 glyphs.
Tablet and desktop (`clusterSize >= 2`) retain the existing generic one-cell
4-neighbor dilation. The user-authored masks are mobile-only.

The rejected enclosed-counter flood-fill helper is removed rather than kept as
dead or competing behavior.

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

- Unit-test the complete single-cell mobile name topology against the exact
  masks above, including the centered `D`, `A`, and `R` openings and the edited
  `G` and `E` cuts.
- Unit-test that the explicit mobile `weight: 'base'` path still returns the
  original undilated glyphs.
- Keep the existing multi-cell dilation test to prove tablet and desktop remain
  unchanged.
- Unit-test the mobile-only 2.5 DPR cap and uncapped non-mobile behavior.
- Keep existing layout, interaction, settling, and reduced-motion tests green.
- Browser-check dark and light at 375×812 against the editor-approved alphabet,
  plus overflow, console health, and unchanged overall composition.
- Recheck desktop to ensure the approved dilated treatment is unchanged.

## Non-goals

- Increasing or repositioning the mobile wordmark.
- Altering the approved masks after export from the editor.
- Changing the tablet/desktop alphabet, grid grain, confetti, colors, or copy.
- Retuning Hybrid tear radii or spring behavior.
- Implementing the separate Hero-to-About hand-off ticket.
