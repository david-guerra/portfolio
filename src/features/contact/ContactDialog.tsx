import { useEffect, useRef, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { PROFILE_LINKS, WORK_EMAIL } from '../../content/profile.ts'

const FOCUS_RING =
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange'

interface ContactDialogProps {
    open: boolean
    onRequestClose: () => void
}

export default function ContactDialog({ open, onRequestClose }: ContactDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)

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
        if (!open) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onRequestClose()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onRequestClose])

    const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onRequestClose()
    }

    const socialLink = (label: string, href: string) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${label} ↗`}
            className={`group flex items-center justify-between rounded-chip border border-border bg-bg px-4 py-3 text-sm text-body transition-colors hover:border-olive hover:text-ink ${FOCUS_RING}`}
        >
            <span>{label}</span>
            <span aria-hidden="true" className="text-olive transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none">
                ↗
            </span>
        </a>
    )

    return createPortal(
        <div
            data-testid="contact-backdrop"
            onClick={onBackdropClick}
            className={`fixed inset-0 z-40 items-center justify-center bg-black/70 px-5 ${
                open ? 'flex' : 'hidden'
            }`}
        >
            <dialog
                ref={dialogRef}
                open={open}
                aria-modal="true"
                aria-labelledby="contact-dialog-title"
                className="static m-0 w-full max-w-[34rem] rounded-card border border-border bg-surface p-0 text-body"
            >
                <div className="p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs tracking-[0.12em] text-orange uppercase">
                                Direct line
                            </p>
                            <h2
                                id="contact-dialog-title"
                                className="mt-3 font-sans text-2xl leading-tight text-ink sm:text-3xl"
                            >
                                Let’s connect.
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onRequestClose}
                            aria-label="Close contact details"
                            className={`cursor-pointer text-lg leading-none text-dim transition-colors hover:text-ink ${FOCUS_RING}`}
                        >
                            ×
                        </button>
                    </div>

                    <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-body sm:text-base">
                        Projects, ideas, or simply a hello. My inbox is open.
                    </p>

                    <a
                        href={`mailto:${WORK_EMAIL}`}
                        aria-label={WORK_EMAIL}
                        className={`group mt-6 block rounded-card border border-orange bg-bg p-4 transition-colors hover:bg-orange hover:text-bg sm:p-5 ${FOCUS_RING}`}
                    >
                        <span className="block text-xs tracking-[0.12em] text-orange uppercase group-hover:text-bg">
                            Work email
                        </span>
                        <span className="mt-2 flex items-center justify-between gap-3 break-all text-sm text-ink group-hover:text-bg sm:text-base">
                            {WORK_EMAIL}
                            <span
                                aria-hidden="true"
                                className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
                            >
                                ↗
                            </span>
                        </span>
                    </a>

                    <div className="mt-6 border-t border-border pt-5">
                        <p className="mb-3 text-xs tracking-[0.12em] text-dim uppercase">
                            Elsewhere
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {socialLink('GitHub', PROFILE_LINKS.github)}
                            {socialLink('LinkedIn', PROFILE_LINKS.linkedin)}
                        </div>
                    </div>
                </div>
            </dialog>
        </div>,
        document.body,
    )
}
