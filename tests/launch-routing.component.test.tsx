import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import App from '../src/App.tsx'
import ContactProvider from '../src/features/contact/ContactProvider.tsx'

vi.mock('../src/components/Hero.tsx', () => ({
    default: () => <div data-testid="hero-stub" />,
}))

afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/')
    vi.restoreAllMocks()
})

describe('retired hash routes', () => {
    test('redirects a legacy section route and scrolls the app shell there', () => {
        const scrollTo = vi.fn()
        Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
            configurable: true,
            value: scrollTo,
        })
        window.history.replaceState(null, '', '#/projects')

        render(
            <ContactProvider>
                <App />
            </ContactProvider>,
        )

        expect(window.location.hash).toBe('#projects')
        expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
    })

    test('redirects the legacy contact route into the current contact dialog', () => {
        window.history.replaceState(null, '', '#/contact')

        render(
            <ContactProvider>
                <App />
            </ContactProvider>,
        )

        expect(window.location.hash).toBe('#contact')
        expect(document.querySelector('dialog[open]')).not.toBeNull()
    })

    test('redirects a retired hash entered after the app is already open', () => {
        render(
            <ContactProvider>
                <App />
            </ContactProvider>,
        )

        window.history.replaceState(null, '', '#/contact')
        fireEvent(window, new HashChangeEvent('hashchange'))

        expect(window.location.hash).toBe('#contact')
        expect(document.querySelector('dialog[open]')).not.toBeNull()
    })
})
