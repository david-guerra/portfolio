import { cleanup, fireEvent, render } from '@testing-library/react'
import { forwardRef } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import ContactDialog from '../src/features/contact/ContactDialog.tsx'

/* The real widget loads a remote script; presentation tests only need a placeholder. */
vi.mock('@hcaptcha/react-hcaptcha', () => ({
    default: forwardRef(function HCaptchaStub() {
        return <div data-testid="hcaptcha-stub" />
    }),
}))

describe('ContactDialog presentation', () => {
    let root: HTMLDivElement

    beforeEach(() => {
        root = document.createElement('div')
        root.id = 'root'
        document.body.appendChild(root)
    })

    afterEach(() => {
        cleanup()
        root.remove()
        vi.restoreAllMocks()
    })

    test('stays out of the top layer so body-level hCaptcha challenges paint above', () => {
        /* jsdom has no showModal; a plant on the prototype catches any call. */
        const showModal = vi.fn()
        const original = HTMLDialogElement.prototype.showModal
        HTMLDialogElement.prototype.showModal = showModal
        try {
            render(<ContactDialog accessKey="key" open onRequestClose={() => {}} />)

            expect(showModal).not.toHaveBeenCalled()
            expect(document.querySelector('dialog')?.open).toBe(true)
        } finally {
            HTMLDialogElement.prototype.showModal = original
        }
    })

    test('renders its own backdrop and closes on backdrop click', () => {
        const onRequestClose = vi.fn()
        render(<ContactDialog accessKey="key" open onRequestClose={onRequestClose} />)

        const backdrop = document.querySelector('[data-testid=contact-backdrop]')
        expect(backdrop).not.toBeNull()
        fireEvent.click(backdrop!)
        expect(onRequestClose).toHaveBeenCalledOnce()
    })

    test('Escape closes the open dialog', () => {
        const onRequestClose = vi.fn()
        render(<ContactDialog accessKey="key" open onRequestClose={onRequestClose} />)

        fireEvent.keyDown(document, { key: 'Escape' })
        expect(onRequestClose).toHaveBeenCalledOnce()
    })

    test('marks the app root inert while open and releases it on close', () => {
        const { rerender } = render(
            <ContactDialog accessKey="key" open onRequestClose={() => {}} />,
        )
        expect(root.inert).toBe(true)

        rerender(<ContactDialog accessKey="key" open={false} onRequestClose={() => {}} />)
        expect(root.inert).toBe(false)
    })
})
