# Contact Dialog Connection Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Broaden the direct-email contact dialog so it welcomes projects, ideas, and non-transactional connection with David's approved copy.

**Architecture:** Keep the existing `ContactDialog` structure and behavior intact. Add exact-copy assertions to its component test first, then replace only the heading and supporting text nodes; the larger direct-email implementation already present in the worktree remains unchanged.

**Tech Stack:** React 19, TypeScript 6, Vitest, Testing Library, Vite 8, Tailwind CSS 4.

## Global Constraints

- Heading must be exactly **Let’s connect.**
- Supporting line must be exactly **Projects, ideas, or simply a hello. My inbox is open.**
- “Direct line,” “Work email,” and “Elsewhere” remain unchanged.
- Layout, themes, work-email link, social links, modal behavior, keyboard handling, and reduced-motion behavior remain unchanged.
- No contact form or third-party contact provider is reintroduced.
- The existing unrelated changes in `public/og-image.png`, `public/project-images/README.md`, and `.superpowers/` must not be staged.

---

### Task 1: Broaden the contact invitation copy

**Files:**
- Modify: `tests/contact-dialog.component.test.tsx:20-37`
- Modify: `src/features/contact/ContactDialog.tsx:78-97`

**Interfaces:**
- Consumes: `ContactDialog({ open: boolean, onRequestClose: () => void })` and its existing semantic dialog markup.
- Produces: exact visible heading `Let’s connect.` and supporting line `Projects, ideas, or simply a hello. My inbox is open.`

- [ ] **Step 1: Write the failing copy test**

Extend the existing `presents the work email with GitHub and LinkedIn alternatives` test immediately after rendering:

```tsx
expect(getByRole('heading', { level: 2, name: 'Let’s connect.' })).toBeTruthy()
expect(
    getByText('Projects, ideas, or simply a hello. My inbox is open.'),
).toBeTruthy()
```

Destructure `getByText` alongside the existing test queries:

```tsx
const { getByRole, getByText, queryByRole } = render(
    <ContactDialog open onRequestClose={() => {}} />,
)
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npx vitest run tests/contact-dialog.component.test.tsx
```

Expected: FAIL because the dialog still renders `Let’s make something useful.` rather than the approved heading.

- [ ] **Step 3: Replace only the two approved text nodes**

In `src/features/contact/ContactDialog.tsx`, keep the existing elements and classes, changing only their text content:

```tsx
<h2
    id="contact-dialog-title"
    className="mt-3 font-sans text-2xl leading-tight text-ink sm:text-3xl"
>
    Let’s connect.
</h2>
```

```tsx
<p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-body sm:text-base">
    Projects, ideas, or simply a hello. My inbox is open.
</p>
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
npx vitest run tests/contact-dialog.component.test.tsx
```

Expected: all `ContactDialog presentation` tests PASS with no new warnings.

- [ ] **Step 5: Run complete automated verification**

Run each command separately:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Expected: every command exits `0`; the test suite retains all existing contact, keyboard, theme, game, and canvas coverage. The existing Node local-storage experimental warning may still appear during `npm test`, but no new warning may be introduced by this copy-only change.

- [ ] **Step 6: Verify the rendered dialog and obtain David's eyeball approval**

Reuse or start the development server:

```bash
npm run dev -- --host 127.0.0.1
```

In the in-app Browser, open the local portfolio and verify:

- the nav `Contact` trigger opens a dialog named `Let’s connect.`;
- the exact supporting line is visible;
- the work-email, GitHub, and LinkedIn destinations are unchanged;
- Escape closes the dialog and restores focus to the trigger;
- the dialog fits without horizontal overflow at desktop and `390×844` mobile;
- dark and light themes remain legible; and
- the browser console contains no app errors or warnings.

Leave the updated dialog visible and pause for David's approval. Do not ship before approval.

- [ ] **Step 7: Commit the coherent direct-email ticket after approval**

The contact files already contain the larger, verified direct-email implementation for the active Wayfinder ticket, so stage that coherent change set together while preserving unrelated user changes:

```bash
git add .github/workflows/deploy.yml \
  docs/superpowers/plans/2026-07-13-contact-popup.md \
  docs/superpowers/plans/2026-07-19-contact-dialog-connection-copy.md \
  package.json package-lock.json \
  src/content/profile.ts \
  src/features/contact/ContactDialog.tsx \
  src/features/contact/ContactProvider.tsx \
  src/features/contact/contactDelivery.ts \
  src/features/contact/contactState.ts \
  src/vite-env.d.ts \
  tests/contact-delivery.test.ts \
  tests/contact-deployment.test.ts \
  tests/contact-dialog.component.test.tsx \
  tests/contact-state.test.ts
git commit -m "feat: replace contact form with work email"
```

Expected: the commit includes only the direct-email ticket and this implementation plan; it excludes `public/og-image.png`, `public/project-images/README.md`, and `.superpowers/`.

- [ ] **Step 8: Ship and resolve the Wayfinder ticket**

Push `main`, watch the GitHub Pages workflow complete, and verify the production contact flow. Then post the resolution on `Contact via work email: retire Web3Forms and hCaptcha`, close it, append its gist/link to the map's **Decisions so far**, and graduate any newly specifiable launch fog without resolving another ticket in this session.
