import HCaptcha from '@hcaptcha/react-hcaptcha'
import {
    useEffect,
    useReducer,
    useRef,
    useState,
    type FormEvent,
    type MouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { PROFILE_LINKS } from '../../content/profile.ts'
import { submitContact } from './contactDelivery.ts'
import { contactReducer, createContactState } from './contactState.ts'

/* Web3Forms' shared free-plan site key — public by design, like the access key. */
const HCAPTCHA_SITE_KEY = '50b2fe65-b00b-4b9e-ad62-3ba471098be2'

const FOCUS_RING =
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange'

const FIELD_CLASSES = `mt-1.5 w-full rounded-chip border border-border bg-bg px-3 py-2 text-sm text-ink ${FOCUS_RING}`

interface ContactDialogProps {
    accessKey: string
    open: boolean
    onRequestClose: () => void
}

function pageTheme(): 'dark' | 'light' {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export default function ContactDialog({
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

    /* Deliberately NOT showModal(): the top layer would paint over hCaptcha's
       body-appended challenge. Containment comes from inert + our own backdrop. */
    useEffect(() => {
        const root = document.getElementById('root')
        if (!root || !open) return
        root.inert = true
        return () => {
            root.inert = false
        }
    }, [open])

    useEffect(() => {
        if (open) dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
    }, [open])

    useEffect(() => {
        /* A theme switch remounts hCaptcha (key below), so drop the old widget's token. */
        const observer = new MutationObserver(() => {
            setCaptchaTheme(pageTheme())
            setCaptchaToken('')
        })
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        })
        return () => observer.disconnect()
    }, [])

    const requestClose = () => {
        if (state.status === 'success') {
            formRef.current?.reset()
            captchaRef.current?.resetCaptcha()
            setCaptchaToken('')
            dispatch({ type: 'reset', configured })
        }
        onRequestClose()
    }

    /* No dependency array: the listener closes over the latest requestClose.
       Keydown inside the hCaptcha challenge iframe never reaches this document,
       so Escape there dismisses only the challenge. */
    useEffect(() => {
        if (!open) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') requestClose()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    })

    const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) requestClose()
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

    const linkedInLink = (label: string) => (
        <a
            href={PROFILE_LINKS.linkedin}
            target="_blank"
            rel="noreferrer"
            className={`text-olive underline decoration-olive/70 underline-offset-4 transition-colors hover:text-ink ${FOCUS_RING}`}
        >
            {label}
        </a>
    )

    return createPortal(
        <div
            data-testid="contact-backdrop"
            onClick={onBackdropClick}
            className={`fixed inset-0 z-40 items-center justify-center bg-black/70 ${
                open ? 'flex' : 'hidden'
            }`}
        >
            <dialog
                ref={dialogRef}
                open={open}
                aria-modal="true"
                aria-labelledby="contact-dialog-title"
                className="static m-0 w-[min(34rem,calc(100%-2.5rem))] rounded-card border border-border bg-surface p-0 text-body"
            >
            <div className="max-h-[calc(100dvh-2.5rem)] overflow-y-auto p-5 sm:p-7">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <h2 id="contact-dialog-title" className="text-lg text-ink">
                        Contact
                    </h2>
                    <button
                        type="button"
                        onClick={requestClose}
                        aria-label="Close contact form"
                        className={`cursor-pointer text-lg leading-none text-dim transition-colors hover:text-ink ${FOCUS_RING}`}
                    >
                        ×
                    </button>
                </div>

                {state.status === 'success' ? (
                    <div role="status" className="space-y-5">
                        <p>Message sent! I’ll get back to you soon.</p>
                        <button
                            type="button"
                            onClick={requestClose}
                            className={`cursor-pointer rounded-chip border border-orange px-3.5 py-1.5 text-sm text-orange transition-colors hover:bg-orange hover:text-bg ${FOCUS_RING}`}
                        >
                            Close
                        </button>
                    </div>
                ) : state.status === 'unavailable' ? (
                    <p role="status">
                        The form isn’t available right now. Reach me on{' '}
                        {linkedInLink('LinkedIn ↗')}
                    </p>
                ) : (
                    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
                        <label className="block text-sm text-dim">
                            <span>Name</span>
                            <input
                                name="name"
                                type="text"
                                autoComplete="name"
                                maxLength={100}
                                required
                                className={FIELD_CLASSES}
                            />
                        </label>
                        <label className="block text-sm text-dim">
                            <span>Email</span>
                            <input
                                name="email"
                                type="email"
                                autoComplete="email"
                                maxLength={254}
                                required
                                className={FIELD_CLASSES}
                            />
                        </label>
                        <label className="block text-sm text-dim">
                            <span>Message</span>
                            <textarea
                                name="message"
                                rows={5}
                                maxLength={5000}
                                required
                                className={`${FIELD_CLASSES} resize-y`}
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
                            <p role="alert" className="text-sm text-orange">
                                Couldn’t send that right now. Try again, or reach me on{' '}
                                {linkedInLink('LinkedIn')}.
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={!captchaToken || state.status === 'submitting'}
                            className={`cursor-pointer rounded-chip border border-orange px-3.5 py-1.5 text-sm text-orange transition-colors hover:bg-orange hover:text-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-orange ${FOCUS_RING}`}
                        >
                            {state.status === 'submitting' ? 'Sending…' : 'Send message'}
                        </button>
                        <p className="text-xs text-dim">
                            Protected by hCaptcha. Messages are processed by{' '}
                            <a
                                href="https://web3forms.com/privacy"
                                target="_blank"
                                rel="noreferrer"
                                className={`underline underline-offset-4 transition-colors hover:text-ink ${FOCUS_RING}`}
                            >
                                Web3Forms
                            </a>
                            .
                        </p>
                    </form>
                )}
            </div>
            </dialog>
        </div>,
        document.body,
    )
}
