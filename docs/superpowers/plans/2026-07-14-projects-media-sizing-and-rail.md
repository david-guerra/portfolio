# Projects Media Sizing and Rail Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove empty bordered space from the project gallery and make the desktop carousel's neighboring projects visibly identifiable and clickable.

**Architecture:** Keep the existing component boundaries. `ProjectGalleryDialog` receives an aspect-driven media frame; `ProjectsSection` receives wider, persistently labeled neighbor buttons with the approved continuous-rail treatment. The project model, mobile deck, and interaction state remain unchanged.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, Vite, native `<dialog>`.

## Global Constraints

- Gallery aspect ratio is exactly `1586 / 992`; the full screenshot remains visible with `object-contain` and no cropping.
- Desktop neighbors use `clamp(190px, 18vw, 270px)` width.
- Resting neighbor treatment is 64% brightness, 82% saturation, and 0.45px blur.
- Outer-edge shade is 28% and clears by the midpoint so the inner neighbor edge stays visible.
- Hover and keyboard focus use 82% brightness, 95% saturation, and no blur.
- Persistent labels show project title plus `← Previous` or `Next →` on an opaque dark chip.
- Existing ordering, copy, assets, click targets, wraparound, drag, keyboard navigation, footer controls, and mobile swipe deck do not change.
- Reduced motion removes filter transitions; dark and light themes must remain readable.

---

### Task 1: Make the gallery frame follow the capture aspect ratio

**Files:**
- Modify: `tests/projects.component.test.tsx:151-196`
- Modify: `src/features/projects/ProjectGalleryDialog.tsx:91-103`

**Interfaces:**
- Consumes: existing `ProjectGalleryDialogProps` and `Project.gallery` image data.
- Produces: a `data-testid="project-gallery-frame"` frame whose border exactly wraps a `1586 / 992` image area.

- [ ] **Step 1: Write the failing gallery sizing test**

In the existing `opens the truthful gallery, switches and wraps frames, and closes both ways` test, add these assertions immediately after `gallery = within(dialog)`:

```tsx
const galleryFrame = gallery.getByTestId('project-gallery-frame')
const galleryImage = gallery.getByRole('img', {
    name: 'Arcade hub showing Connect Four, Sudoku, and Game of Life',
})

expect(galleryFrame.classList).toContain('aspect-[1586/992]')
expect(galleryFrame.classList).toContain('shrink-0')
expect(galleryFrame.classList).not.toContain('flex-1')
expect(galleryImage.classList).toContain('h-full')
expect(galleryImage.classList).not.toContain('max-h-[48dvh]')
expect(galleryImage.classList).not.toContain('wide:max-h-[50dvh]')
```

- [ ] **Step 2: Run the targeted test and verify RED**

Run:

```bash
npm test -- --run tests/projects.component.test.tsx -t "opens the truthful gallery"
```

Expected: FAIL because `project-gallery-frame` does not exist.

- [ ] **Step 3: Implement the aspect-driven frame**

Replace the growing media frame and capped image in `ProjectGalleryDialog.tsx` with:

```tsx
<div
    data-testid="project-gallery-frame"
    className={`aspect-[1586/992] shrink-0 overflow-hidden border bg-bg ${ACCENT_BORDER[project.accent]}`}
>
    <img
        src={image.image}
        alt={image.alt}
        className="h-full w-full object-contain"
    />
</div>
```

Do not change the thumbnail row, counter, copy column, dialog width, or mobile overflow rules.

- [ ] **Step 4: Run the targeted test and verify GREEN**

Run:

```bash
npm test -- --run tests/projects.component.test.tsx -t "opens the truthful gallery"
```

Expected: PASS with the gallery interaction test green.

- [ ] **Step 5: Commit the gallery sizing fix**

```bash
git add tests/projects.component.test.tsx src/features/projects/ProjectGalleryDialog.tsx
git commit -m "fix: fit project gallery frame to artwork"
```

---

### Task 2: Make desktop neighbor projects read as a continuous carousel

**Files:**
- Modify: `tests/projects.component.test.tsx:92-151`
- Modify: `src/features/projects/ProjectsSection.tsx:184-245`

**Interfaces:**
- Consumes: existing `previous`, `next`, `ACCENT_BORDER`, `ACCENT_TEXT`, and `selectRelative` values in `ProjectsSection`.
- Produces: visible neighbor buttons with exact width/filter classes and persistent directional labels; no new component props or state.

- [ ] **Step 1: Write the failing neighbor discoverability test**

Add this test after `wraps with buttons and arrows, responds to drag, and delegates Arcade navigation`:

```tsx
test('keeps desktop neighbor projects wide, dark, and visibly labeled', () => {
    const { getByRole } = render(
        <ProjectsSection onScrollNext={() => undefined} />,
    )
    const previous = getByRole('button', { name: 'Show previous project: Fest' })
    const next = getByRole('button', { name: 'Show next project: CleanVoice' })
    const previousImage = previous.querySelector('img')
    const nextImage = next.querySelector('img')

    expect(previous.classList).toContain('w-[clamp(190px,18vw,270px)]')
    expect(next.classList).toContain('w-[clamp(190px,18vw,270px)]')
    expect(previous.classList).toContain('border-orange')
    expect(next.classList).toContain('border-lavender')
    expect(within(previous).getByText('Fest')).toBeTruthy()
    expect(within(previous).getByText('← Previous')).toBeTruthy()
    expect(within(next).getByText('CleanVoice')).toBeTruthy()
    expect(within(next).getByText('Next →')).toBeTruthy()

    for (const image of [previousImage, nextImage]) {
        expect(image).not.toBeNull()
        expect(image?.classList).toContain('brightness-[0.64]')
        expect(image?.classList).toContain('saturate-[0.82]')
        expect(image?.classList).toContain('blur-[0.45px]')
        expect(image?.classList).toContain('group-hover:brightness-[0.82]')
        expect(image?.classList).toContain('group-focus-visible:brightness-[0.82]')
        expect(image?.classList).toContain('motion-reduce:transition-none')
    }
})
```

- [ ] **Step 2: Run the targeted test and verify RED**

Run:

```bash
npm test -- --run tests/projects.component.test.tsx -t "keeps desktop neighbor projects wide"
```

Expected: FAIL because the buttons still use `w-[140px]` and do not expose persistent project labels.

- [ ] **Step 3: Implement the previous-project neighbor**

Replace the previous-project button with:

```tsx
<button
    type="button"
    aria-label={`Show previous project: ${previous.title}`}
    onClick={() => selectRelative(-1)}
    className={`group relative hidden w-[clamp(190px,18vw,270px)] shrink-0 cursor-pointer overflow-hidden rounded-l-card border wide:block ${ACCENT_BORDER[previous.accent]} ${FOCUS_RING}`}
>
    <img
        src={previous.carouselImage}
        alt=""
        className="h-full w-full scale-[1.012] object-cover object-right brightness-[0.64] saturate-[0.82] blur-[0.45px] transition-[filter] motion-reduce:transition-none group-hover:brightness-[0.82] group-hover:saturate-[0.95] group-hover:blur-none group-focus-visible:brightness-[0.82] group-focus-visible:saturate-[0.95] group-focus-visible:blur-none"
    />
    <span className="absolute inset-0 bg-linear-to-r from-bg/[0.28] via-transparent via-50% to-transparent" />
    <span className={`absolute right-3 bottom-3 left-3 flex items-center justify-between gap-2 border-b bg-bg px-2.5 py-2 text-[0.6875rem] ${ACCENT_BORDER[previous.accent]}`}>
        <span className="text-ink">{previous.title}</span>
        <span className={ACCENT_TEXT[previous.accent]}>← Previous</span>
    </span>
</button>
```

- [ ] **Step 4: Implement the next-project neighbor**

Replace the next-project button with:

```tsx
<button
    type="button"
    aria-label={`Show next project: ${next.title}`}
    onClick={() => selectRelative(1)}
    className={`group relative hidden w-[clamp(190px,18vw,270px)] shrink-0 cursor-pointer overflow-hidden rounded-r-card border wide:block ${ACCENT_BORDER[next.accent]} ${FOCUS_RING}`}
>
    <img
        src={next.carouselImage}
        alt=""
        className="h-full w-full scale-[1.012] object-cover object-left brightness-[0.64] saturate-[0.82] blur-[0.45px] transition-[filter] motion-reduce:transition-none group-hover:brightness-[0.82] group-hover:saturate-[0.95] group-hover:blur-none group-focus-visible:brightness-[0.82] group-focus-visible:saturate-[0.95] group-focus-visible:blur-none"
    />
    <span className="absolute inset-0 bg-linear-to-l from-bg/[0.28] via-transparent via-50% to-transparent" />
    <span className={`absolute right-3 bottom-3 left-3 flex items-center justify-between gap-2 border-b bg-bg px-2.5 py-2 text-[0.6875rem] ${ACCENT_BORDER[next.accent]}`}>
        <span className="text-ink">{next.title}</span>
        <span className={ACCENT_TEXT[next.accent]}>Next →</span>
    </span>
</button>
```

- [ ] **Step 5: Run the targeted test and verify GREEN**

Run:

```bash
npm test -- --run tests/projects.component.test.tsx -t "keeps desktop neighbor projects wide"
```

Expected: PASS with the new discoverability contract green.

- [ ] **Step 6: Run the complete Projects component suite**

Run:

```bash
npm test -- --run tests/projects.component.test.tsx
```

Expected: all Projects component tests pass; the existing wraparound, drag, mobile deck, gallery, and App scrolling tests remain green.

- [ ] **Step 7: Commit the desktop rail revision**

```bash
git add tests/projects.component.test.tsx src/features/projects/ProjectsSection.tsx
git commit -m "fix: reveal adjacent projects in carousel"
```

---

### Task 3: Verify the real responsive composition

**Files:**
- Modify only if a browser failure is first reproduced by a new failing test in `tests/projects.component.test.tsx`.

**Interfaces:**
- Consumes: completed Tasks 1 and 2.
- Produces: browser evidence and a green repository verification gate; no new runtime interface.

- [ ] **Step 1: Start or reuse the local Vite server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/portfolio/` in the in-app browser.

- [ ] **Step 2: Verify the tall gallery repro is green**

At 1220×1198, navigate to Projects and open the Arcade gallery. Measure the bordered frame and painted `object-contain` image using the image's intrinsic `1586 / 992` ratio.

Expected:

```text
frame aspect ratio: within 1% of 1.59879
unpainted bordered height: <= 2%
horizontal overflow: 0px
```

Capture a screenshot and compare it to the user's reported dead-zone screenshot.

- [ ] **Step 3: Verify desktop neighbor clarity and hierarchy**

At 1586×992 and 1220×1198, verify before hover:

```text
each side width: 190px to 270px
filter includes brightness(0.64), saturate(0.82), blur(0.45px)
left label: Fest + ← Previous
right label: CleanVoice + Next →
selected project remains wider than either neighbor
```

Hover and keyboard-focus each side. Verify blur becomes `0px`, brightness becomes `0.82`, saturation becomes `0.95`, and clicking still wraps correctly.

- [ ] **Step 4: Verify mobile remains unchanged**

At 393×780, verify the native swipe deck still has an edge peek, `01 / 03` counter, pagination dots, no document-level horizontal overflow, and working gallery open/close controls. Verify the new aspect-driven gallery frame stays within the dialog.

- [ ] **Step 5: Verify both themes and runtime health**

Toggle dark/light theme at desktop and mobile widths. Confirm neighbor labels remain readable, all project images have nonzero natural dimensions, reduced-motion classes are present, and browser console warnings/errors are empty.

- [ ] **Step 6: Run the complete repository gate**

Run each command independently:

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

Expected: 57 Node tests and all Vitest component tests pass; lint, TypeScript, production build, and diff check exit 0.

- [ ] **Step 7: Confirm the worktree is clean**

Run:

```bash
git status --short
```

Expected: no output. If browser QA required an additional test-first fix, commit that fix with a message naming the reproduced cause before checking cleanliness again.
