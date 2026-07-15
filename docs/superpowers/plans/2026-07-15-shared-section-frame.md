# Shared About and Projects Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the About and Projects structural dividers on external displays without changing the existing MacBook, mobile, or Projects-rail geometry.

**Architecture:** Add a small `SectionFrame` layout primitive that owns the two approved width policies. Projects uses the always-wide `1800px` policy; About uses a `1364px` frame below a `1800px` CSS viewport and an `1800px` structural frame at and above that boundary, while its prose and location metadata remain in nested `1364px` containers.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Vitest, Testing Library, Vite

## Global Constraints

- The current MacBook composition must remain unchanged.
- Below a `1800px` CSS viewport, About remains capped at `1364px`.
- At and above a `1800px` CSS viewport, About and Projects share the same structural width, capped at `1800px`.
- About prose, its content grid, and location metadata remain capped at `1364px` at every viewport.
- Projects rail dimensions and behavior remain unchanged.
- Mobile markup and layout remain visually unchanged.
- Neither pane may introduce document-level horizontal overflow.
- Do not change vertical spacing, typography, colors, copy, modal widths, or navigation widths.

---

### Task 1: Add the shared SectionFrame primitive

**Files:**
- Create: `src/components/SectionFrame.tsx`
- Create: `tests/section-frame.component.test.tsx`

**Interfaces:**
- Consumes: React's `ReactNode` type.
- Produces: `SectionFrame({ variant, className, children })`, where `variant` is `'wide' | 'external-wide'` and the rendered element exposes `data-section-frame={variant}`.

- [ ] **Step 1: Write the failing component tests**

Create `tests/section-frame.component.test.tsx` with the exact width-policy and class-composition assertions:

```tsx
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import SectionFrame from '../src/components/SectionFrame.tsx'

afterEach(cleanup)

describe('SectionFrame', () => {
    test('renders the always-wide project frame policy', () => {
        const { container } = render(
            <SectionFrame variant="wide" className="flex min-h-full">
                Projects
            </SectionFrame>,
        )
        const frame = container.querySelector('[data-section-frame="wide"]')

        expect(frame).not.toBeNull()
        expect(frame?.classList.contains('mx-auto')).toBe(true)
        expect(frame?.classList.contains('w-full')).toBe(true)
        expect(frame?.classList.contains('max-w-[1800px]')).toBe(true)
        expect(frame?.classList.contains('flex')).toBe(true)
        expect(frame?.classList.contains('min-h-full')).toBe(true)
    })

    test('keeps About narrow below 1800px and widens only at the external-display boundary', () => {
        const { container } = render(
            <SectionFrame variant="external-wide">About</SectionFrame>,
        )
        const frame = container.querySelector('[data-section-frame="external-wide"]')

        expect(frame).not.toBeNull()
        expect(frame?.classList.contains('max-w-[1364px]')).toBe(true)
        expect(frame?.classList.contains('min-[1800px]:max-w-[1800px]')).toBe(true)
        expect(frame?.classList.contains('max-w-[1800px]')).toBe(false)
    })
})
```

- [ ] **Step 2: Run the focused test and verify the red state**

Run:

```bash
npx vitest run tests/section-frame.component.test.tsx
```

Expected: FAIL because `src/components/SectionFrame.tsx` does not exist.

- [ ] **Step 3: Add the minimal SectionFrame implementation**

Create `src/components/SectionFrame.tsx`:

```tsx
import type { ReactNode } from 'react'

const FRAME_WIDTH: Record<SectionFrameVariant, string> = {
    wide: 'max-w-[1800px]',
    'external-wide': 'max-w-[1364px] min-[1800px]:max-w-[1800px]',
}

export type SectionFrameVariant = 'wide' | 'external-wide'

export interface SectionFrameProps {
    variant: SectionFrameVariant
    className?: string
    children: ReactNode
}

export default function SectionFrame({
    variant,
    className = '',
    children,
}: SectionFrameProps) {
    return (
        <div
            data-section-frame={variant}
            className={`mx-auto w-full ${FRAME_WIDTH[variant]} ${className}`.trim()}
        >
            {children}
        </div>
    )
}
```

- [ ] **Step 4: Run the focused test and typecheck**

Run:

```bash
npx vitest run tests/section-frame.component.test.tsx
npm run typecheck
```

Expected: both commands PASS.

- [ ] **Step 5: Commit the primitive**

```bash
git add src/components/SectionFrame.tsx tests/section-frame.component.test.tsx
git commit -m "feat: add shared section frame"
```

---

### Task 2: Apply the frame without changing inner layout geometry

**Files:**
- Modify: `src/features/about/AboutSection.tsx:1-79`
- Modify: `src/features/projects/ProjectsSection.tsx:1-490`
- Modify: `tests/about.component.test.tsx:20-113`
- Modify: `tests/projects.component.test.tsx` in the existing desktop rail geometry test

**Interfaces:**
- Consumes: `SectionFrame` and variants `'external-wide'` and `'wide'` from Task 1.
- Produces: an About structural frame that widens only at `1800px`, nested `about-editorial-frame` and `about-footer-meta-frame` containers capped at `1364px`, and an unchanged Projects frame using the shared primitive.

- [ ] **Step 1: Add failing integration assertions**

Add this test to `tests/about.component.test.tsx` after the approved-copy test:

```tsx
test('widens only the structural footer frame on external displays', () => {
    const { section, about } = renderAbout()
    const frame = section.querySelector('[data-section-frame="external-wide"]')
    const editorial = about.getByTestId('about-editorial-frame')
    const metadata = about.getByTestId('about-footer-meta-frame')
    const divider = about.getByTestId('about-footer-divider')
    const heading = about.getByRole('heading', { level: 2, name: HEADLINE })
    const location = about.getByText('Peruvian · Based in Berlin')

    expect(frame).not.toBeNull()
    expect(frame?.classList.contains('max-w-[1364px]')).toBe(true)
    expect(frame?.classList.contains('min-[1800px]:max-w-[1800px]')).toBe(true)
    expect(editorial.classList.contains('max-w-[1364px]')).toBe(true)
    expect(metadata.classList.contains('max-w-[1364px]')).toBe(true)
    expect(editorial.contains(heading)).toBe(true)
    expect(metadata.contains(location)).toBe(true)
    expect(editorial.contains(divider)).toBe(false)
    expect(metadata.contains(divider)).toBe(false)
    expect(frame?.contains(divider)).toBe(true)
})
```

In the existing Projects test named `renders a native-ratio scroll rail with exactly three cards per viewport and a direct index`, add these assertions immediately after obtaining `rail`:

```tsx
const section = rail.closest('#projects')
const frame = section?.querySelector('[data-section-frame="wide"]')

expect(frame).not.toBeNull()
expect(frame?.classList.contains('max-w-[1800px]')).toBe(true)
expect(frame?.classList.contains('wide:h-full')).toBe(true)
expect(frame?.classList.contains('wide:min-h-0')).toBe(true)
```

- [ ] **Step 2: Run the integration tests and verify the red state**

Run:

```bash
npx vitest run tests/about.component.test.tsx tests/projects.component.test.tsx
```

Expected: FAIL because About has no responsive structural frame or nested frame markers and Projects does not yet use `SectionFrame`.

- [ ] **Step 3: Integrate SectionFrame into About**

Replace `src/features/about/AboutSection.tsx` with:

```tsx
import SectionFrame from '../../components/SectionFrame.tsx'

const FOCUS_RING =
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange'

export interface AboutSectionProps {
    onSayHello?: () => void
    onScrollNext: () => void
}

export default function AboutSection({ onSayHello, onScrollNext }: AboutSectionProps) {
    return (
        <section
            id="about"
            aria-labelledby="about-heading"
            className="min-h-full px-5 py-6 wide:h-full wide:snap-start wide:snap-always wide:overflow-y-auto wide:px-14 wide:py-20"
        >
            <SectionFrame variant="external-wide" className="flex min-h-full flex-col">
                <div
                    data-testid="about-editorial-frame"
                    className="mx-auto w-full max-w-[1364px]"
                >
                    <div className="grid wide:grid-cols-12 wide:gap-x-10">
                        <div className="wide:col-span-9">
                            <p className="text-label tracking-[0.12em] text-about-muted uppercase">
                                About
                            </p>
                            <h2
                                id="about-heading"
                                className="mt-5 max-w-[960px] font-sans text-display text-ink wide:mt-8"
                            >
                                Somewhere between systems and products.
                            </h2>
                        </div>

                        <p className="mt-6 max-w-[640px] font-sans text-body-sans text-body wide:col-span-5 wide:col-start-1 wide:mt-14">
                            I study IT-Systems Engineering at the{' '}
                            <a
                                href="https://hpi.de/en/studies/it-systems-engineering-bsc/"
                                target="_blank"
                                rel="noreferrer"
                                className={`text-about-lavender underline decoration-about-lavender/70 underline-offset-4 transition-colors hover:text-about-olive ${FOCUS_RING}`}
                            >
                                Hasso Plattner Institute
                            </a>{' '}
                            and work at Siemens, building productivity tools for project management
                            with <span className="text-about-orange">SPFx</span> and{' '}
                            <span className="text-about-teal">Microsoft Power Platform</span>.
                        </p>

                        <div className="mt-6 wide:col-span-6 wide:col-start-7 wide:mt-24">
                            <p className="max-w-[640px] font-sans text-body-sans text-body">
                                I keep drifting toward systems and low-level details, while my work
                                shows me how much product context changes an engineering problem. I’m
                                now exploring where AI fits into internal workflows, with{' '}
                                <span className="text-about-olive">AI product engineering</span> as
                                the direction I want to grow toward.
                            </p>

                            <div className="hidden text-sm wide:mt-7 wide:block">
                                <button
                                    type="button"
                                    onClick={onSayHello}
                                    className={`cursor-pointer border-b border-about-orange pb-1 text-about-orange transition-colors hover:text-ink ${FOCUS_RING}`}
                                >
                                    Say hello →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="mt-8 wide:mt-auto wide:pt-12">
                    <div
                        data-testid="about-footer-meta-frame"
                        className="mx-auto w-full max-w-[1364px]"
                    >
                        <p className="text-sm tracking-wide text-body">
                            Peruvian · Based in Berlin
                        </p>
                    </div>
                    <div
                        data-testid="about-footer-divider"
                        className="hidden w-full justify-end border-t border-border wide:mt-8 wide:flex wide:pt-6"
                    >
                        <button
                            type="button"
                            onClick={onScrollNext}
                            className={`cursor-pointer text-sm text-dim transition-colors hover:text-body ${FOCUS_RING}`}
                        >
                            Next · Projects ↓
                        </button>
                    </div>
                </footer>
            </SectionFrame>
        </section>
    )
}
```

The outer `SectionFrame` remains the full-height flex container. Do not move `flex`, `min-h-full`, `flex-col`, `wide:mt-auto`, or `wide:pt-12` onto either nested `1364px` wrapper.

- [ ] **Step 4: Integrate SectionFrame into Projects**

Apply these exact changes to `src/features/projects/ProjectsSection.tsx`:

```diff
 import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
+import SectionFrame from '../../components/SectionFrame.tsx'
 import ProjectGalleryDialog from './ProjectGalleryDialog.tsx'
 import { PROJECTS, type Project, type ProjectAccent } from './projects.ts'

@@
-            <div className="mx-auto flex min-h-full w-full max-w-[1800px] flex-col wide:h-full wide:min-h-0">
+            <SectionFrame
+                variant="wide"
+                className="flex min-h-full flex-col wide:h-full wide:min-h-0"
+            >
                 <div className="flex flex-col justify-between gap-4 wide:flex-row wide:items-start">

@@
                     </div>
                 </div>
-            </div>
+            </SectionFrame>
             {galleryProject ? (
```

Do not change rail, index, description, footer, gallery, state, or interaction code.

- [ ] **Step 5: Run focused tests and static gates**

Run:

```bash
npx vitest run tests/section-frame.component.test.tsx tests/about.component.test.tsx tests/projects.component.test.tsx
npm run lint
npm run typecheck
```

Expected: all focused tests, lint, and typecheck PASS.

- [ ] **Step 6: Commit the integration**

```bash
git add src/features/about/AboutSection.tsx src/features/projects/ProjectsSection.tsx tests/about.component.test.tsx tests/projects.component.test.tsx
git commit -m "fix: align section frames on external displays"
```

---

### Task 3: Prove the breakpoint and regression invariants

**Files:**
- Verify only; no production file should change unless a measured invariant fails.

**Interfaces:**
- Consumes: the rendered About and Projects frames from Task 2.
- Produces: evidence that MacBook geometry is unchanged and external-display dividers align.

- [ ] **Step 1: Start the isolated worktree dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite serves the portfolio without startup errors.

- [ ] **Step 2: Verify the responsive geometry in a real browser**

At each viewport, measure `getBoundingClientRect()` for `[data-section-frame]`, `[data-testid="about-editorial-frame"]`, `[data-testid="about-footer-meta-frame"]`, and `[data-testid="about-footer-divider"]`:

| Viewport | Required result |
| --- | --- |
| `393×780` | Mobile composition has no horizontal overflow; About remains naturally scrolling. |
| `1586×992` | About frame, editorial frame, metadata frame, and divider are all `1364px` wide with the same horizontal positions as before this change. |
| `1799×1100` | About remains capped at `1364px`. |
| `1800×1100` | About and Projects structural frames both fill the `1688px` available width after `56px` section padding on each side. |
| `2048×1152` | About and Projects structural frames are both `1800px` wide and share the same `x` coordinate; About editorial and metadata frames remain `1364px`. |

Also confirm that the About→Projects slide, three-card rail, project selection, and gallery opening still behave normally, and that the browser console has no errors or warnings.

- [ ] **Step 3: Run the complete verification suite**

Run:

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
git status --short
```

Expected: all tests and build gates PASS, `git diff --check` prints nothing, and `git status --short` is clean.

- [ ] **Step 4: Review the final branch history and scope**

Run:

```bash
git log --oneline -5
git diff HEAD~2..HEAD --stat
```

Expected: one focused component commit and one focused integration commit; only `SectionFrame`, About/Projects integration, their tests, and this plan/spec documentation are in scope.
