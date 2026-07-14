# Projects Media Sizing and Rail Clarity Design

## Status

Approved in the visual companion on 2026-07-14. This is a focused revision of the existing Projects carousel and gallery; project content, ordering, navigation behavior, and the mobile swipe deck stay unchanged.

## Problems

1. The gallery's bordered media frame grows to fill the left column while its image is capped at `50dvh` and uses `object-contain`. At 1220×1198, 342px of the 762px frame is unpainted.
2. Desktop neighbor previews are only 140px wide, start at 45% brightness, and sit under gradients reaching 90% background opacity. They read as decoration rather than clickable adjacent projects.

## Selected direction

### Gallery media frame

- The bordered frame follows each selected image's natural aspect ratio. Current gallery assets are either `1586 / 992` or `1672 / 941`.
- The frame is content-sized and does not flex-grow vertically.
- The image renders at full frame width with automatic height, preserving the complete screenshot without cropping or letterboxing.
- Thumbnail tabs begin immediately below the frame. No bordered empty area may remain below the painted image.
- This natural-ratio rule applies on desktop and mobile. The frame may shift by roughly 20–40px when the selected image ratio changes; existing dialog width and overflow constraints remain responsible for fitting the viewport.
- `object-cover` is rejected because it would crop meaningful UI from portfolio screenshots and would not solve an oversized parent frame by itself.

### Desktop project rail

- Keep the selected B direction: one continuous image rail with neighboring projects extending far enough inward to communicate horizontal movement.
- Each neighbor uses `clamp(190px, 18vw, 270px)` width. The selected project remains the largest frame.
- Resting treatment: 64% brightness, 82% saturation, and 0.45px blur. This is deliberately darker than the approved clarity mock while preserving identifiable imagery.
- Edge shading is limited to a 28% background tint and affects only the outer half of each neighbor. It must not erase the inner edge beside the selected project.
- Each neighbor has a visible project-accent outer border and a persistent bottom label:
  - left: project title plus `← Previous`
  - right: project title plus `Next →`
- Hover and keyboard focus remove the blur, raise brightness to 82%, and raise saturation to 95%. Reduced-motion users receive the same immediate state without a transition.
- Existing click targets, accessible names, wraparound behavior, pointer drag, keyboard arrows, and footer controls remain unchanged.

### Mobile

- The existing native scroll-snap card deck remains unchanged. It already exposes a full edge peek, counter, and pagination dots and does not share the desktop discoverability defect.
- The gallery receives the aspect-ratio fix at mobile widths, preventing horizontal overflow or vertical dead space.

## Component boundaries

- `ProjectsSection` owns neighbor width, visual treatment, persistent labels, and existing carousel interactions.
- `ProjectGalleryDialog` owns the natural-ratio gallery frame.
- `projects.ts` remains the content and asset source. No model changes are required.

## Accessibility and interaction

- Persistent labels are visual content inside the existing previous/next buttons; the current descriptive `aria-label` values remain authoritative.
- Neighbor hover styling must also appear for `:focus-visible`.
- Labels maintain readable contrast against an opaque dark chip rather than relying on image contrast.
- No information or operation depends only on hover.

## Verification

- Add failing component tests before implementation for the aspect-driven, non-growing gallery frame and the wider, labeled neighbor controls.
- Verify every available gallery ratio at 1220×1198: unpainted bordered height must be negligible rather than the current 44.9%.
- Verify desktop composition at 1586×992 and 1220×1198, including neighbor readability before hover and the selected frame's dominance.
- Verify gallery and unchanged swipe deck at 393×780.
- Check dark and light themes, keyboard focus, reduced-motion classes, image loading, runtime warnings, and horizontal overflow.
- Run the full test, lint, typecheck, build, and diff-check gates.

## Out of scope

- New projects or gallery assets
- Changes to project copy or truthfulness constraints
- Route-backed galleries
- Changes to the mobile project-card layout
- Case-study or source-code actions
