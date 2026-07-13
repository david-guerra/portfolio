# Contact Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small, accessible Web3Forms contact dialog that keeps David's email address off the page, offers LinkedIn as a fallback, and works on the static GitHub Pages deployment.

**Architecture:** A `ContactProvider` owns one native `<dialog>` and exposes `openContact(trigger)` through context, so navigation and About can open the same modal without owning its state. A pure `submitContact` boundary normalizes Web3Forms responses for deterministic Node tests. hCaptcha is isolated to the dialog, while the GitHub Actions workflow injects the existing access key at build time.

**Tech Stack:** React 19.2.7, TypeScript 6.0.3, Tailwind CSS 4.3.2, native HTML `<dialog>`, `@hcaptcha/react-hcaptcha` 2.0.2, Web3Forms browser API, Node 24 test runner, GitHub Actions, GitHub Pages.

## Global Constraints

- Execute after **Design system, nav, and theming** and **About section** have landed.
- Use one centered native `<dialog>`; do not add a drawer, route, or portfolio backend.
- Navigation and About open the same dialog through `openContact(trigger: HTMLElement)`.
- GitHub is `https://github.com/david-guerra`; LinkedIn is `https://linkedin.com/in/david-guerrasal`.
- The form contains only Name, Email, Message, hCaptcha, and `Send message`.
- The exact success copy is `Message sent! I’ll get back to you soon.`
- The exact failure copy is `Couldn’t send that right now. Try again, or reach me on LinkedIn.`
- The disclosure is `Protected by hCaptcha. Messages are processed by Web3Forms.` and links Web3Forms to `https://web3forms.com/privacy`.
- Keep unfinished values only in the mounted page session; do not use local storage or another persistence layer.
- Treat `VITE_WEB3FORMS_ACCESS_KEY` as public client configuration even though GitHub Actions sources it from `WEB3FORMS_ACCESS_KEY`.
- Missing configuration must not issue a request; show the LinkedIn fallback instead.
- Use Web3Forms' shared free-plan hCaptcha site key `50b2fe65-b00b-4b9e-ad62-3ba471098be2` with `reCaptchaCompat={false}`.
- Preserve both themes by reading `document.documentElement.dataset.theme` (`dark` or `light`) and resetting hCaptcha if that value changes.
- Do not add attachments, auto-replies, analytics, saved drafts, or a mailto link.

## Planned File Structure

- `src/content/profile.ts` — canonical GitHub and LinkedIn URLs.
- `src/features/contact/contactDelivery.ts` — Web3Forms request and normalized result.
- `src/features/contact/contactState.ts` — pure visible-state reducer.
- `src/features/contact/ContactDialog.tsx` — form, hCaptcha, dialog behavior, and visitor-facing states.
- `src/features/contact/ContactProvider.tsx` — singleton ownership, context, and focus restoration.
- `src/features/contact/ContactButton.tsx` — style-transparent trigger used by navigation and About.
- `tests/contact-delivery.test.ts` — request/result contract.
- `tests/contact-state.test.ts` — state transition contract.
- `tests/contact-deployment.test.ts` — CI environment and Vite declaration contract.
- `src/components/SiteNav.tsx` — consumes profile links and `ContactButton`; produced by the design-system task.
- `src/features/about/AboutSection.tsx` — consumes profile links and `ContactButton`; produced by the About task.
- `src/main.tsx` — mounts the singleton provider.
- `src/vite-env.d.ts` — declares the contact configuration variable.
- `.github/workflows/deploy.yml` — exposes the existing Actions secret to the Vite build.
- `package.json` and `package-lock.json` — pin the hCaptcha React wrapper.

---

### Task 1: Web3Forms delivery boundary

**Files:**
- Create: `src/features/contact/contactDelivery.ts`
- Create: `tests/contact-delivery.test.ts`

**Interfaces:**
- Consumes: `ContactSubmission`, an access-key string, and an optional `typeof fetch` test seam.
- Produces: `submitContact(submission, accessKey, fetchImpl?): Promise<ContactDeliveryResult>`.
- Produces: `ContactDeliveryResult = { ok: true } | { ok: false; kind: 'unavailable' | 'rate-limited' | 'rejected' | 'network' }`.

- [ ] **Step 1: Write the failing delivery tests**

```ts
// tests/contact-delivery.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
    submitContact,
    type ContactSubmission,
} from '../src/features/contact/contactDelivery.ts'

const submission: ContactSubmission = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Let us build something.',
    captchaToken: 'captcha-token',
}

test('missing configuration does not issue a request', async () => {
    const unexpectedFetch: typeof fetch = async () => {
        assert.fail('fetch must not run without an access key')
    }

    const result = await submitContact(submission, '', unexpectedFetch)
    assert.deepEqual(result, { ok: false, kind: 'unavailable' })
})

test('successful submission sends the expected Web3Forms payload', async () => {
    const fakeFetch: typeof fetch = async (input, init) => {
        assert.equal(input, 'https://api.web3forms.com/submit')
        assert.equal(init?.method, 'POST')
        assert.deepEqual(init?.headers, {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        })
        assert.deepEqual(JSON.parse(String(init?.body)), {
            access_key: 'public-routing-key',
            subject: 'New portfolio message',
            from_name: 'David Guerra portfolio',
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            message: 'Let us build something.',
            'h-captcha-response': 'captcha-token',
        })
        return Response.json({ success: true })
    }

    const result = await submitContact(submission, 'public-routing-key', fakeFetch)
    assert.deepEqual(result, { ok: true })
})

test('rate limiting is distinguishable from other rejection', async () => {
    const fakeFetch: typeof fetch = async () =>
        Response.json({ success: false }, { status: 429 })

    const result = await submitContact(submission, 'public-routing-key', fakeFetch)
    assert.deepEqual(result, { ok: false, kind: 'rate-limited' })
})

test('provider rejection is normalized', async () => {
    const fakeFetch: typeof fetch = async () =>
        Response.json({ success: false }, { status: 400 })

    const result = await submitContact(submission, 'public-routing-key', fakeFetch)
    assert.deepEqual(result, { ok: false, kind: 'rejected' })
})

test('network failure is normalized', async () => {
    const fakeFetch: typeof fetch = async () => {
        throw new TypeError('network unavailable')
    }

    const result = await submitContact(submission, 'public-routing-key', fakeFetch)
    assert.deepEqual(result, { ok: false, kind: 'network' })
})
```

- [ ] **Step 2: Run the focused tests and verify the red state**

Run: `node --test tests/contact-delivery.test.ts`

Expected: FAIL because `src/features/contact/contactDelivery.ts` does not exist.

- [ ] **Step 3: Implement the minimal delivery boundary**

```ts
// src/features/contact/contactDelivery.ts
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

export interface ContactSubmission {
    name: string
    email: string
    message: string
    captchaToken: string
}

export type ContactDeliveryResult =
    | { ok: true }
    | {
          ok: false
          kind: 'unavailable' | 'rate-limited' | 'rejected' | 'network'
      }

export async function submitContact(
    submission: ContactSubmission,
    accessKey: string,
    fetchImpl: typeof fetch = fetch,
): Promise<ContactDeliveryResult> {
    if (!accessKey.trim()) {
        return { ok: false, kind: 'unavailable' }
    }

    try {
        const response = await fetchImpl(WEB3FORMS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                access_key: accessKey,
                subject: 'New portfolio message',
                from_name: 'David Guerra portfolio',
                name: submission.name.trim(),
                email: submission.email.trim(),
                message: submission.message.trim(),
                'h-captcha-response': submission.captchaToken,
            }),
        })

        if (response.status === 429) {
            return { ok: false, kind: 'rate-limited' }
        }

        const payload = (await response.json()) as { success?: boolean }
        return response.ok && payload.success === true
            ? { ok: true }
            : { ok: false, kind: 'rejected' }
    } catch {
        return { ok: false, kind: 'network' }
    }
}
```

- [ ] **Step 4: Run the focused and full test suites**

Run: `node --test tests/contact-delivery.test.ts`

Expected: 5 tests PASS.

Run: `npm test`

Expected: the existing 16 worker tests plus the 5 contact delivery tests PASS.

- [ ] **Step 5: Commit the delivery boundary**

```bash
git add src/features/contact/contactDelivery.ts tests/contact-delivery.test.ts
git commit -m "feat: add Web3Forms delivery boundary"
```

---

### Task 2: Contact state machine

**Files:**
- Create: `src/features/contact/contactState.ts`
- Create: `tests/contact-state.test.ts`

**Interfaces:**
- Consumes: whether an access key is configured plus `started`, `succeeded`, `failed`, and `reset` actions.
- Produces: `createContactState(configured): ContactState` and `contactReducer(state, action): ContactState`.

- [ ] **Step 1: Write the failing reducer tests**

```ts
// tests/contact-state.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
    contactReducer,
    createContactState,
} from '../src/features/contact/contactState.ts'

test('missing configuration starts unavailable', () => {
    assert.deepEqual(createContactState(false), { status: 'unavailable' })
})

test('configured form moves through submit and success', () => {
    const idle = createContactState(true)
    const submitting = contactReducer(idle, { type: 'started' })
    const success = contactReducer(submitting, { type: 'succeeded' })

    assert.deepEqual(idle, { status: 'idle' })
    assert.deepEqual(submitting, { status: 'submitting' })
    assert.deepEqual(success, { status: 'success' })
})

test('failure preserves the normalized reason', () => {
    const state = contactReducer(
        { status: 'submitting' },
        { type: 'failed', kind: 'rate-limited' },
    )

    assert.deepEqual(state, { status: 'error', kind: 'rate-limited' })
})

test('reset returns to the correct configured state', () => {
    assert.deepEqual(
        contactReducer({ status: 'success' }, { type: 'reset', configured: true }),
        { status: 'idle' },
    )
    assert.deepEqual(
        contactReducer({ status: 'error', kind: 'network' }, { type: 'reset', configured: false }),
        { status: 'unavailable' },
    )
})
```

- [ ] **Step 2: Run the focused tests and verify the red state**

Run: `node --test tests/contact-state.test.ts`

Expected: FAIL because `src/features/contact/contactState.ts` does not exist.

- [ ] **Step 3: Implement the reducer**

```ts
// src/features/contact/contactState.ts
import type { ContactDeliveryResult } from './contactDelivery.ts'

type FailureKind = Exclude<ContactDeliveryResult, { ok: true }>['kind']

export type ContactState =
    | { status: 'idle' }
    | { status: 'submitting' }
    | { status: 'success' }
    | { status: 'error'; kind: FailureKind }
    | { status: 'unavailable' }

export type ContactAction =
    | { type: 'started' }
    | { type: 'succeeded' }
    | { type: 'failed'; kind: FailureKind }
    | { type: 'reset'; configured: boolean }

export function createContactState(configured: boolean): ContactState {
    return configured ? { status: 'idle' } : { status: 'unavailable' }
}

export function contactReducer(
    _state: ContactState,
    action: ContactAction,
): ContactState {
    switch (action.type) {
        case 'started':
            return { status: 'submitting' }
        case 'succeeded':
            return { status: 'success' }
        case 'failed':
            return { status: 'error', kind: action.kind }
        case 'reset':
            return createContactState(action.configured)
    }
}
```

- [ ] **Step 4: Run the focused tests, typecheck, and lint**

Run: `node --test tests/contact-state.test.ts`

Expected: 4 tests PASS.

Run: `npm run typecheck`

Expected: exits 0.

Run: `npm run lint`

Expected: both commands exit 0.

- [ ] **Step 5: Commit the state machine**

```bash
git add src/features/contact/contactState.ts tests/contact-state.test.ts
git commit -m "feat: model contact form states"
```

---

### Task 3: Contact dialog and provider

**Files:**
- Create: `src/content/profile.ts`
- Create: `src/features/contact/ContactDialog.tsx`
- Create: `src/features/contact/ContactProvider.tsx`
- Create: `src/features/contact/ContactButton.tsx`
- Modify: `src/main.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `submitContact`, `contactReducer`, `VITE_WEB3FORMS_ACCESS_KEY`, and the root `data-theme` value.
- Produces: `useContact(): { openContact(trigger: HTMLElement): void }`.
- Produces: `ContactButton`, a normal button that forwards visual props and calls the shared dialog.
- Produces: `PROFILE_LINKS.github` and `PROFILE_LINKS.linkedin`.

- [ ] **Step 1: Install the pinned hCaptcha wrapper**

Run: `npm install @hcaptcha/react-hcaptcha@2.0.2`

Expected: `package.json` and `package-lock.json` add `@hcaptcha/react-hcaptcha` at 2.0.2.

- [ ] **Step 2: Add canonical profile links**

```ts
// src/content/profile.ts
export const PROFILE_LINKS = {
    github: 'https://github.com/david-guerra',
    linkedin: 'https://linkedin.com/in/david-guerrasal',
} as const
```

- [ ] **Step 3: Implement the dialog**

Create `src/features/contact/ContactDialog.tsx` with these exact behaviors:

```tsx
import HCaptcha from '@hcaptcha/react-hcaptcha'
import {
    useEffect,
    useReducer,
    useRef,
    useState,
    type FormEvent,
    type MouseEvent,
} from 'react'
import { PROFILE_LINKS } from '../../content/profile.ts'
import { submitContact } from './contactDelivery.ts'
import { contactReducer, createContactState } from './contactState.ts'

const HCAPTCHA_SITE_KEY = '50b2fe65-b00b-4b9e-ad62-3ba471098be2'

interface ContactDialogProps {
    accessKey: string
    open: boolean
    onRequestClose: () => void
}

function pageTheme(): 'dark' | 'light' {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function ContactDialog({
    accessKey,
    open,
    onRequestClose,
}: ContactDialogProps) {
    const configured = Boolean(accessKey.trim())
    const dialogRef = useRef<HTMLDialogElement>(null)
    const formRef = useRef<HTMLFormElement>(null)
    const captchaRef = useRef<HCaptcha>(null)
    const [captchaToken, setCaptchaToken] = useState('')
    const [captchaTheme, setCaptchaTheme] = useState(pageTheme)
    const [state, dispatch] = useReducer(
        contactReducer,
        configured,
        createContactState,
    )

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (open && !dialog.open) dialog.showModal()
        if (!open && dialog.open) dialog.close()
    }, [open])

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const nextTheme = pageTheme()
            setCaptchaTheme((current) => {
                if (current !== nextTheme) setCaptchaToken('')
                return nextTheme
            })
        })
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        })
        return () => observer.disconnect()
    }, [])

    const close = () => dialogRef.current?.close()

    const onDialogClose = () => {
        if (state.status === 'success') {
            formRef.current?.reset()
            captchaRef.current?.resetCaptcha()
            setCaptchaToken('')
            dispatch({ type: 'reset', configured })
        }
        onRequestClose()
    }

    const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) close()
    }

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!captchaToken || state.status === 'submitting') return

        dispatch({ type: 'started' })
        const data = new FormData(event.currentTarget)
        const result = await submitContact(
            {
                name: String(data.get('name') ?? ''),
                email: String(data.get('email') ?? ''),
                message: String(data.get('message') ?? ''),
                captchaToken,
            },
            accessKey,
        )

        if (result.ok) {
            dispatch({ type: 'succeeded' })
            return
        }

        captchaRef.current?.resetCaptcha()
        setCaptchaToken('')
        dispatch({ type: 'failed', kind: result.kind })
    }

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="contact-dialog-title"
            className="m-auto w-[min(34rem,calc(100%-2rem))] border border-[var(--line2)] bg-[var(--panel)] p-0 text-[var(--cream)] backdrop:bg-black/70"
            onClick={onBackdropClick}
            onClose={onDialogClose}
        >
            <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-7">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <h2 id="contact-dialog-title" className="text-lg font-semibold">
                        Contact
                    </h2>
                    <button type="button" onClick={close} aria-label="Close contact form">
                        ×
                    </button>
                </div>

                {state.status === 'success' ? (
                    <div role="status" className="space-y-5">
                        <p>Message sent! I’ll get back to you soon.</p>
                        <button type="button" onClick={close}>Close</button>
                    </div>
                ) : state.status === 'unavailable' ? (
                    <p role="status">
                        The form isn’t available right now. Reach me on{' '}
                        <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer">
                            LinkedIn ↗
                        </a>
                    </p>
                ) : (
                    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
                        <label className="block">
                            <span>Name</span>
                            <input
                                name="name"
                                type="text"
                                autoComplete="name"
                                maxLength={100}
                                required
                                className="mt-1 w-full border border-[var(--line2)] bg-[var(--bg)] px-3 py-2"
                            />
                        </label>
                        <label className="block">
                            <span>Email</span>
                            <input
                                name="email"
                                type="email"
                                autoComplete="email"
                                maxLength={254}
                                required
                                className="mt-1 w-full border border-[var(--line2)] bg-[var(--bg)] px-3 py-2"
                            />
                        </label>
                        <label className="block">
                            <span>Message</span>
                            <textarea
                                name="message"
                                rows={5}
                                maxLength={5000}
                                required
                                className="mt-1 w-full resize-y border border-[var(--line2)] bg-[var(--bg)] px-3 py-2"
                            />
                        </label>
                        <HCaptcha
                            key={captchaTheme}
                            ref={captchaRef}
                            sitekey={HCAPTCHA_SITE_KEY}
                            theme={captchaTheme}
                            reCaptchaCompat={false}
                            onVerify={setCaptchaToken}
                            onExpire={() => setCaptchaToken('')}
                            onError={() => setCaptchaToken('')}
                        />
                        {state.status === 'error' && (
                            <p role="alert">
                                Couldn’t send that right now. Try again, or reach me on{' '}
                                <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer">
                                    LinkedIn
                                </a>.
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={!captchaToken || state.status === 'submitting'}
                        >
                            {state.status === 'submitting' ? 'Sending…' : 'Send message'}
                        </button>
                        <p className="text-xs text-[var(--dim)]">
                            Protected by hCaptcha. Messages are processed by{' '}
                            <a href="https://web3forms.com/privacy" target="_blank" rel="noreferrer">
                                Web3Forms
                            </a>.
                        </p>
                    </form>
                )}
            </div>
        </dialog>
    )
}
```

- [ ] **Step 4: Implement the singleton provider and style-transparent trigger**

```tsx
// src/features/contact/ContactProvider.tsx
import {
    createContext,
    useContext,
    useRef,
    useState,
    type ReactNode,
} from 'react'
import { ContactDialog } from './ContactDialog.tsx'

interface ContactContextValue {
    openContact: (trigger: HTMLElement) => void
}

const ContactContext = createContext<ContactContextValue | null>(null)

export function ContactProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false)
    const triggerRef = useRef<HTMLElement | null>(null)

    const openContact = (trigger: HTMLElement) => {
        triggerRef.current = trigger
        setOpen(true)
    }

    const closeContact = () => {
        setOpen(false)
        requestAnimationFrame(() => triggerRef.current?.focus())
    }

    return (
        <ContactContext.Provider value={{ openContact }}>
            {children}
            <ContactDialog
                accessKey={import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? ''}
                open={open}
                onRequestClose={closeContact}
            />
        </ContactContext.Provider>
    )
}

export function useContact(): ContactContextValue {
    const value = useContext(ContactContext)
    if (!value) throw new Error('useContact must be used inside ContactProvider')
    return value
}
```

```tsx
// src/features/contact/ContactButton.tsx
import type { ButtonHTMLAttributes } from 'react'
import { useContact } from './ContactProvider.tsx'

export function ContactButton({
    onClick,
    type = 'button',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    const { openContact } = useContact()

    return (
        <button
            {...props}
            type={type}
            onClick={(event) => {
                onClick?.(event)
                if (!event.defaultPrevented) openContact(event.currentTarget)
            }}
        />
    )
}
```

- [ ] **Step 5: Mount the provider once at the application root**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ContactProvider } from './features/contact/ContactProvider.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ContactProvider>
            <App />
        </ContactProvider>
    </StrictMode>,
)
```

- [ ] **Step 6: Verify compilation before integrating consumers**

Run: `npm run typecheck`

Run: `npm run lint`

Run: `npm run build`

Expected: all commands exit 0; the build may omit a usable access key locally, but it must not fail.

- [ ] **Step 7: Commit the dialog unit**

```bash
git add package.json package-lock.json src/content/profile.ts src/features/contact src/main.tsx
git commit -m "feat: add accessible contact dialog"
```

---

### Task 4: Navigation and About integration

**Files:**
- Modify: `src/components/SiteNav.tsx`
- Modify: `src/features/about/AboutSection.tsx`

**Interfaces:**
- Consumes: `ContactButton` and `PROFILE_LINKS` from Task 3.
- Produces: navigation links `GitHub ↗`, `LinkedIn ↗`, and `Contact`; About links `GitHub ↗`, `LinkedIn ↗`, and `Say hello →`.

- [ ] **Step 1: Replace the navigation contact action with the shared trigger**

Import `PROFILE_LINKS` and `ContactButton`, then make the navigation action group semantically equivalent to:

```tsx
<div className="nav-actions">
    <a href={PROFILE_LINKS.github} target="_blank" rel="noreferrer">GitHub ↗</a>
    <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
    <ContactButton className="contact-button">Contact</ContactButton>
</div>
```

Keep the visual class names established by **Design system, nav, and theming** on the two links and button; only replace their element/content wiring.

- [ ] **Step 2: Add the About contact row**

Import the same two modules and make the About action group semantically equivalent to:

```tsx
<div className="about-actions">
    <ContactButton className="contact-button">Say hello →</ContactButton>
    <a href={PROFILE_LINKS.github} target="_blank" rel="noreferrer">GitHub ↗</a>
    <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
</div>
```

Keep the visual class names established by **About section**; do not introduce a second dialog or duplicate form markup.

- [ ] **Step 3: Run static verification**

Run: `npm run typecheck`

Run: `npm run lint`

Run: `npm run build`

Expected: all commands exit 0; both consumers compile against `ContactButton` and `PROFILE_LINKS`.

- [ ] **Step 4: Verify both triggers in the browser**

Run: `npm run dev`

Expected:

- Navigation `Contact` opens the centered dialog.
- Closing restores focus to navigation `Contact`.
- About `Say hello →` opens the same dialog instance.
- Closing restores focus to `Say hello →`.
- GitHub and LinkedIn open their correct external URLs.
- No mailto link or literal personal email appears in the page source.

- [ ] **Step 5: Commit consumer integration**

```bash
git add src/components/SiteNav.tsx src/features/about/AboutSection.tsx
git commit -m "feat: connect portfolio contact actions"
```

---

### Task 5: Deployment configuration contract

**Files:**
- Create: `tests/contact-deployment.test.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the existing GitHub Actions secret `WEB3FORMS_ACCESS_KEY`.
- Produces: the browser build variable `VITE_WEB3FORMS_ACCESS_KEY`.

- [ ] **Step 1: Write the failing deployment contract test**

```ts
// tests/contact-deployment.test.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('the Pages build receives the existing Web3Forms secret', () => {
    const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8')
    assert.match(
        workflow,
        /VITE_WEB3FORMS_ACCESS_KEY:\s*\$\{\{\s*secrets\.WEB3FORMS_ACCESS_KEY\s*\}\}/,
    )
})

test('Vite declares the contact configuration variable', () => {
    const declarations = readFileSync('src/vite-env.d.ts', 'utf8')
    assert.match(declarations, /readonly VITE_WEB3FORMS_ACCESS_KEY: string/)
})
```

- [ ] **Step 2: Run the focused test and verify the red state**

Run: `node --test tests/contact-deployment.test.ts`

Expected: 2 tests FAIL because neither contract is present in the fresh app.

- [ ] **Step 3: Declare the Vite variable**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WEB3FORMS_ACCESS_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
```

- [ ] **Step 4: Inject the existing Actions secret into the build step**

Change only the workflow's `Build` step to:

```yaml
      - name: Build
        run: npm run build
        env:
          VITE_WEB3FORMS_ACCESS_KEY: ${{ secrets.WEB3FORMS_ACCESS_KEY }}
```

The value may be empty on untrusted pull requests; the application must still build and show its unavailable fallback.

- [ ] **Step 5: Run focused and full verification**

Run: `node --test tests/contact-deployment.test.ts`

Expected: 2 tests PASS.

Run: `npm run typecheck`

Run: `npm test`

Run: `npm run build`

Expected: all commands exit 0 without requiring a local key.

- [ ] **Step 6: Commit the deployment contract**

```bash
git add tests/contact-deployment.test.ts src/vite-env.d.ts .github/workflows/deploy.yml
git commit -m "ci: configure portfolio contact delivery"
```

---

### Task 6: Accessibility, theme, failure, and deployed-flow verification

**Files:**
- Modify if verification finds a defect: `src/features/contact/ContactDialog.tsx`
- Modify if verification finds a defect: `src/features/contact/ContactProvider.tsx`
- Modify if verification finds a defect: `src/components/SiteNav.tsx`
- Modify if verification finds a defect: `src/features/about/AboutSection.tsx`

**Interfaces:**
- Consumes: the finished contact feature and deployed GitHub Pages build.
- Produces: evidence that the approved design works end to end.

- [ ] **Step 1: Run the complete local quality gate**

Run: `npm run lint`

Run: `npm run typecheck`

Run: `npm test`

Run: `npm run build`

Expected: every command exits 0 and all worker/contact tests pass.

- [ ] **Step 2: Verify keyboard and focus behavior**

Run: `npm run dev`

Using only the keyboard, verify:

- Tab reaches navigation `Contact`.
- Enter opens the dialog and focus moves inside it.
- Tab cannot escape behind the modal.
- Escape closes it and focus returns to navigation `Contact`.
- About `Say hello →` repeats the same behavior and receives restored focus.
- The close button has the accessible name `Close contact form`.
- Backdrop click closes the dialog without navigating or scrolling the page.

- [ ] **Step 3: Verify responsive and theme behavior**

At 360×800, 768×1024, and 1440×900, verify:

- the dialog stays within the viewport and its inner content scrolls when needed;
- the page behind it does not receive clicks;
- dark and light themes both keep text, inputs, focus indicators, and hCaptcha legible; and
- toggling theme remounts hCaptcha and clears an old token instead of submitting it.

- [ ] **Step 4: Verify every visible form state**

Verify:

- empty fields and an invalid email are rejected by native validation;
- the submit button is disabled before hCaptcha and during the request;
- successful delivery shows exactly `Message sent! I’ll get back to you soon.`;
- closing success resets fields and hCaptcha;
- a simulated rejected/network request keeps all three field values and shows exactly `Couldn’t send that right now. Try again, or reach me on LinkedIn.`;
- the error-state LinkedIn link opens `https://linkedin.com/in/david-guerrasal`; and
- a local build without `VITE_WEB3FORMS_ACCESS_KEY` issues no request and shows the unavailable fallback.

- [ ] **Step 5: Verify privacy-facing output**

Inspect the rendered DOM and production bundle. Confirm:

- `davidgs.ser@gmail.com` is absent;
- no mailto link exists;
- no local-storage write occurs;
- the disclosure reads `Protected by hCaptcha. Messages are processed by Web3Forms.`; and
- Web3Forms links to `https://web3forms.com/privacy`.

- [ ] **Step 6: Verify a real deployed submission**

Push the completed branch through the normal GitHub Pages workflow. On the deployed site, submit a synthetic message with a recognizable subject/body and verify that it reaches the configured inbox once. Do not use personal third-party data in the test.

Expected: the UI shows the exact success copy and one matching notification reaches the configured inbox.

- [ ] **Step 7: Commit only if verification required fixes**

If Steps 1–6 exposed a defect, add only the files changed to fix that defect and commit:

```bash
git add src/features/contact/ContactDialog.tsx src/features/contact/ContactProvider.tsx src/components/SiteNav.tsx src/features/about/AboutSection.tsx
git commit -m "fix: harden portfolio contact flow"
```

If no files changed, record the verification evidence on the Wayfinder ticket without creating an empty commit.

## Reference Material

- Design: `docs/superpowers/specs/2026-07-13-contact-popup-design.md`
- [Web3Forms API reference](https://docs.web3forms.com/getting-started/api-reference)
- [Web3Forms hCaptcha guide](https://docs.web3forms.com/getting-started/customizations/spam-protection/hcaptcha)
- [Web3Forms access-key FAQ](https://docs.web3forms.com/getting-started/faq)
- [Web3Forms privacy policy](https://web3forms.com/privacy)
- [`@hcaptcha/react-hcaptcha` 2.0.2](https://www.npmjs.com/package/@hcaptcha/react-hcaptcha)
