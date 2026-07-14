import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import App from '../src/App.tsx'
import AboutSection from '../src/features/about/AboutSection.tsx'

vi.mock('../src/components/Hero.tsx', () => ({
    default: () => <div data-testid="hero-stub" />,
}))

const HEADLINE = 'Somewhere between systems and products.'
const PARAGRAPH_ONE =
    'I study IT-Systems Engineering at the Hasso Plattner Institute and work at Siemens, building productivity tools for project management with SPFx and Microsoft Power Platform.'
const PARAGRAPH_TWO =
    'I keep drifting toward systems and low-level details, while my work shows me how much product context changes an engineering problem. I’m now exploring where AI fits into internal workflows, with AI product engineering as the direction I want to grow toward.'

afterEach(cleanup)

function renderAbout() {
    const { container } = render(<App />)
    const section = container.querySelector('#about')
    expect(section).not.toBeNull()
    const element = section as HTMLElement
    return { section: element, about: within(element) }
}

describe('About section', () => {
    test('renders the approved copy and semantic controls', () => {
        const { section, about } = renderAbout()
        const paragraphs = [...section.querySelectorAll('p')].map((node) => node.textContent)

        expect(about.getByRole('heading', { level: 2, name: HEADLINE })).toBeTruthy()
        expect(paragraphs).toContain(PARAGRAPH_ONE)
        expect(paragraphs).toContain(PARAGRAPH_TWO)
        expect(about.getByText('Peruvian · Based in Berlin')).toBeTruthy()
        expect(about.getByRole('button', { name: 'Say hello →' })).toBeTruthy()
        expect(about.getByRole('button', { name: 'Next · Projects ↓' })).toBeTruthy()
    })

    test('keeps HPI as the only inline body link and keeps accent phrases unlinked', () => {
        const { section, about } = renderAbout()
        const bodyLinks = section.querySelectorAll('p a')
        const hpi = about.getByRole('link', { name: 'Hasso Plattner Institute' })

        expect(bodyLinks).toHaveLength(1)
        expect(hpi.getAttribute('href')).toBe(
            'https://hpi.de/en/studies/it-systems-engineering-bsc/',
        )
        expect(hpi.getAttribute('target')).toBe('_blank')
        expect(hpi.getAttribute('rel')).toBe('noreferrer')
        expect(about.getByText('SPFx', { selector: 'span' }).closest('a')).toBeNull()
        expect(
            about.getByText('Microsoft Power Platform', { selector: 'span' }).closest('a'),
        ).toBeNull()
        expect(
            about.getByText('AI product engineering', { selector: 'span' }).closest('a'),
        ).toBeNull()
    })

    test('removes repeated profile links and keeps the contact action desktop-only', () => {
        const { about } = renderAbout()

        expect(about.queryByRole('link', { name: 'GitHub ↗' })).toBeNull()
        expect(about.queryByRole('link', { name: 'LinkedIn ↗' })).toBeNull()

        const sayHello = about.getByRole('button', { name: 'Say hello →' })
        const actionRow = sayHello.parentElement
        expect(actionRow).not.toBeNull()
        expect(actionRow?.classList.contains('hidden')).toBe(true)
        expect(actionRow?.classList.contains('wide:block')).toBe(true)

        const nextProjects = about.getByRole('button', { name: 'Next · Projects ↓' })
        const nextRow = nextProjects.parentElement
        expect(nextRow).not.toBeNull()
        expect(nextRow?.classList.contains('hidden')).toBe(true)
        expect(nextRow?.classList.contains('wide:flex')).toBe(true)
    })

    test('uses natural scrolling on mobile and restores snap panes on desktop', () => {
        const { section } = renderAbout()
        const scroller = section.parentElement
        expect(scroller).not.toBeNull()

        expect(scroller?.classList.contains('snap-y')).toBe(false)
        expect(scroller?.classList.contains('snap-mandatory')).toBe(false)
        expect(scroller?.classList.contains('wide:snap-y')).toBe(true)
        expect(scroller?.classList.contains('wide:snap-mandatory')).toBe(true)

        expect(section.classList.contains('min-h-full')).toBe(true)
        expect(section.classList.contains('overflow-y-auto')).toBe(false)
        expect(section.classList.contains('wide:h-full')).toBe(true)
        expect(section.classList.contains('wide:overflow-y-auto')).toBe(true)
    })

    test('delegates its local actions through callbacks', () => {
        const onSayHello = vi.fn()
        const onScrollNext = vi.fn()
        const { getByRole } = render(
            <AboutSection onSayHello={onSayHello} onScrollNext={onScrollNext} />,
        )

        fireEvent.click(getByRole('button', { name: 'Say hello →' }))
        fireEvent.click(getByRole('button', { name: 'Next · Projects ↓' }))

        expect(onSayHello).toHaveBeenCalledOnce()
        expect(onScrollNext).toHaveBeenCalledOnce()
    })

    test('App advances from About to the Projects pane', () => {
        const { section, about } = renderAbout()
        const scroller = section.parentElement
        expect(scroller).not.toBeNull()

        const element = scroller as HTMLElement
        const scrollTo = vi.fn()
        Object.defineProperty(element, 'clientHeight', { configurable: true, value: 800 })
        Object.defineProperty(element, 'scrollTo', { configurable: true, value: scrollTo })
        const projects = element.querySelector('#projects')
        expect(projects).not.toBeNull()
        Object.defineProperty(projects, 'offsetTop', { configurable: true, value: 1975 })
        fireEvent.click(about.getByRole('button', { name: 'Next · Projects ↓' }))

        expect(scrollTo).toHaveBeenCalledWith({ top: 1975 })
    })
})
