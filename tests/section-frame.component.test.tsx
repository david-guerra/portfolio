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
