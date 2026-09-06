import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import SiteNav from '../src/components/SiteNav.tsx'

afterEach(cleanup)

describe('SiteNav keyboard presentation', () => {
    test('gives every interactive control the brand focus indicator', () => {
        const { getAllByRole } = render(
            <SiteNav
                active={null}
                theme="dark"
                onNavigate={vi.fn()}
                onToggleTheme={vi.fn()}
                onContact={vi.fn()}
            />,
        )

        const controls = [
            ...getAllByRole('button'),
            ...getAllByRole('link'),
        ]
        expect(controls.length).toBeGreaterThan(0)
        for (const control of controls) {
            expect(control.classList).toContain('focus-visible:outline-2')
            expect(control.classList).toContain('focus-visible:outline-orange')
        }
    })
})
