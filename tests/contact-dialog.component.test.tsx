import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import ContactDialog from '../src/features/contact/ContactDialog.tsx'

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

    test('presents the work email with GitHub and LinkedIn alternatives', () => {
        const { getByRole, getByText, queryByRole } = render(
            <ContactDialog open onRequestClose={() => {}} />,
        )

        expect(getByRole('heading', { level: 2, name: 'Let’s connect.' })).toBeTruthy()
        expect(
            getByText('Projects, ideas, or simply a hello. My inbox is open.'),
        ).toBeTruthy()
        expect(
            getByRole('link', { name: 'davidguerras.work@gmail.com' }).getAttribute(
                'href',
            ),
        ).toBe('mailto:davidguerras.work@gmail.com')
        expect(getByRole('link', { name: 'GitHub ↗' }).getAttribute('href')).toBe(
            'https://github.com/david-guerra',
        )
        expect(getByRole('link', { name: 'LinkedIn ↗' }).getAttribute('href')).toBe(
            'https://linkedin.com/in/david-guerrasal',
        )
        expect(queryByRole('form')).toBeNull()
    })

    test('renders its own backdrop and closes on backdrop click', () => {
        const onRequestClose = vi.fn()
        render(<ContactDialog open onRequestClose={onRequestClose} />)

        const backdrop = document.querySelector('[data-testid=contact-backdrop]')
        expect(backdrop).not.toBeNull()
        fireEvent.click(backdrop!)
        expect(onRequestClose).toHaveBeenCalledOnce()
    })

    test('Escape closes the open dialog', () => {
        const onRequestClose = vi.fn()
        render(<ContactDialog open onRequestClose={onRequestClose} />)

        fireEvent.keyDown(document, { key: 'Escape' })
        expect(onRequestClose).toHaveBeenCalledOnce()
    })

    test('marks the app root inert while open and releases it on close', () => {
        const { rerender } = render(
            <ContactDialog open onRequestClose={() => {}} />,
        )
        expect(root.inert).toBe(true)

        rerender(<ContactDialog open={false} onRequestClose={() => {}} />)
        expect(root.inert).toBe(false)
    })
})
