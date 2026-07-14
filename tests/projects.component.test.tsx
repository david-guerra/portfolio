import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../src/App.tsx'
import { PROJECTS } from '../src/features/projects/projects.ts'
import ProjectsSection from '../src/features/projects/ProjectsSection.tsx'

vi.mock('../src/components/Hero.tsx', () => ({
    default: () => <div data-testid="hero-stub" />,
}))

afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
})

beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute('open', '')
    }
    HTMLDialogElement.prototype.close = function close() {
        this.removeAttribute('open')
        this.dispatchEvent(new Event('close'))
    }
})

function renderProjects() {
    const { container } = render(<App />)
    const section = container.querySelector('#projects')
    expect(section).not.toBeNull()
    const element = section as HTMLElement
    return { section: element, projects: within(element) }
}

describe('Projects section', () => {
    test('keeps the approved order, maturity claims, and publishable gallery boundaries', () => {
        expect(PROJECTS.map(({ title }) => title)).toEqual([
            'Arcade, compiled',
            'CleanVoice',
            'Fest',
        ])
        expect(PROJECTS.map(({ tag, status }) => `${tag} · ${status}`)).toEqual([
            'C · WebAssembly · Shipped',
            'Voice AI · LiveKit · Hackathon prototype',
            'Language design · C++ · Lexer complete',
        ])
        expect(PROJECTS.map(({ gallery }) => gallery.length)).toEqual([4, 1, 1])
        expect(PROJECTS.every(({ sourceUrl }) => sourceUrl === undefined)).toBe(true)
        expect(PROJECTS[1]?.description).toBe(
            'The hackathon brief was to build an AI voice app with LiveKit. Our team turned it into CleanVoice, a business partner for independent cleaners facing a language barrier with German-speaking clients. The working demo turned a German-language call into a tentative booking shaped by cleaner preferences, then surfaced it in a realtime dashboard with multilingual summaries. I worked primarily on the agent and its data layer.',
        )
        expect(PROJECTS[2]?.description).toBe(
            'Rust and I didn’t quite click, so I did the sensible thing and started designing a language in C++. Fest currently has a full specification and a working lexer; the goal is a statically typed language targeting WebAssembly.',
        )
    })

    test('resolves every public image through the configured Vite base path', async () => {
        vi.stubEnv('BASE_URL', '/portfolio/')
        vi.resetModules()
        const { PROJECTS: basedProjects } = await import('../src/features/projects/projects.ts')
        const images = basedProjects.flatMap((project) => [
            project.carouselImage,
            ...project.gallery.map((item) => item.image),
        ])

        expect(images.every((image) => image.startsWith('/portfolio/project-images/'))).toBe(true)
    })

    test('leads with the approved Arcade project and exact copy', () => {
        const { projects } = renderProjects()
        const desktop = within(projects.getByTestId('projects-desktop-content'))

        expect(projects.getByText('PROJECTS')).toBeTruthy()
        expect(projects.getByText('01 / 03')).toBeTruthy()
        expect(
            projects.getByText(
                'Most experiments stay experiments. These are the ones I kept coming back to.',
            ),
        ).toBeTruthy()
        expect(
            desktop.getByRole('heading', { level: 2, name: 'Arcade, compiled' }),
        ).toBeTruthy()
        expect(desktop.getAllByText('C · WebAssembly')).toHaveLength(2)
        expect(desktop.getByText('Shipped')).toBeTruthy()
        expect(
            desktop.getByText(
                'I wanted to see how much I could get the browser to handle on its own. Sudoku, Connect Four, and Game of Life are written in C and compiled to WebAssembly, with all of the game logic running on your machine.',
            ),
        ).toBeTruthy()
    })

    test('wraps with buttons and arrows, responds to drag, and delegates Arcade navigation', () => {
        const onScrollNext = vi.fn()
        const { container, getByRole, getByText } = render(
            <ProjectsSection onScrollNext={onScrollNext} />,
        )
        const section = container.querySelector('#projects')
        expect(section).not.toBeNull()

        fireEvent.click(getByRole('button', { name: 'Next project' }))
        expect(getByRole('heading', { level: 2, name: 'CleanVoice' })).toBeTruthy()
        expect(getByText('02 / 03')).toBeTruthy()

        fireEvent.click(getByRole('button', { name: 'Previous project' }))
        fireEvent.click(getByRole('button', { name: 'Previous project' }))
        expect(getByRole('heading', { level: 2, name: 'Fest' })).toBeTruthy()

        fireEvent.keyDown(section as HTMLElement, { key: 'ArrowRight' })
        expect(getByRole('heading', { level: 2, name: 'Arcade, compiled' })).toBeTruthy()

        const preview = getByRole('button', { name: 'Open Arcade, compiled gallery' })
        fireEvent.pointerDown(preview, { clientX: 400, pointerId: 1 })
        fireEvent.pointerUp(preview, { clientX: 250, pointerId: 1 })
        expect(getByRole('heading', { level: 2, name: 'CleanVoice' })).toBeTruthy()

        fireEvent.click(getByRole('button', { name: 'Previous project' }))
        fireEvent.click(getByRole('button', { name: 'Play in Arcade ↓' }))
        expect(onScrollNext).toHaveBeenCalledOnce()
    })

    test('provides the approved mobile edge-peek deck with synced counter and dots', () => {
        const { getByRole, getByTestId, getByText } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const deck = getByTestId('projects-mobile-deck')

        expect(deck.classList.contains('snap-x')).toBe(true)
        expect(deck.classList.contains('snap-mandatory')).toBe(true)
        expect(deck.classList.contains('overflow-x-auto')).toBe(true)
        expect(within(deck).getAllByRole('article')).toHaveLength(3)
        expect(getByText('swipe to browse')).toBeTruthy()

        Object.defineProperty(deck, 'clientWidth', { configurable: true, value: 360 })
        fireEvent.scroll(deck, { target: { scrollLeft: 328 } })
        expect(getByText('02 / 03')).toBeTruthy()
        expect(getByRole('heading', { level: 2, name: 'CleanVoice' })).toBeTruthy()

        fireEvent.click(getByRole('button', { name: 'Show Fest' }))
        expect(getByText('03 / 03')).toBeTruthy()
        expect(getByRole('heading', { level: 2, name: 'Fest' })).toBeTruthy()
    })

    test('constrains the desktop flex column so the project footer stays in its pane', () => {
        const { section, projects } = renderProjects()
        const inner = section.firstElementChild
        const desktop = projects.getByTestId('projects-desktop-content')
        const mediaRail = desktop.firstElementChild

        expect(inner).not.toBeNull()
        expect(inner?.classList.contains('wide:h-full')).toBe(true)
        expect(inner?.classList.contains('wide:min-h-0')).toBe(true)
        expect(mediaRail?.classList.contains('min-h-0')).toBe(true)
    })

    test('opens the truthful gallery, switches and wraps frames, and closes both ways', () => {
        const onScrollNext = vi.fn()
        const { getByRole, queryByRole } = render(
            <ProjectsSection onScrollNext={onScrollNext} />,
        )

        fireEvent.click(getByRole('button', { name: 'Open gallery →' }))
        let dialog = getByRole('dialog')
        let gallery = within(dialog)

        expect(gallery.getByTestId('project-gallery-layout').classList).toContain('min-w-0')
        expect(gallery.getByTestId('project-gallery-media').classList).toContain('min-w-0')
        expect(gallery.getByTestId('project-gallery-copy').classList).toContain('min-w-0')
        expect(gallery.getByRole('heading', { level: 2, name: 'Arcade, compiled' })).toBeTruthy()
        expect(gallery.getByText('01 / 04')).toBeTruthy()
        expect(
            gallery.getByRole('img', {
                name: 'Arcade hub showing Connect Four, Sudoku, and Game of Life',
            }),
        ).toBeTruthy()

        fireEvent.click(gallery.getByRole('button', { name: 'Show Sudoku image' }))
        expect(gallery.getByText('03 / 04')).toBeTruthy()
        expect(
            gallery.getByRole('img', { name: 'Sudoku game in progress with its number controls' }),
        ).toBeTruthy()

        fireEvent.click(gallery.getByRole('button', { name: 'Next gallery image' }))
        expect(gallery.getByText('04 / 04')).toBeTruthy()
        fireEvent.click(gallery.getByRole('button', { name: 'Next gallery image' }))
        expect(gallery.getByText('01 / 04')).toBeTruthy()

        expect(gallery.queryByText(/case study/i)).toBeNull()
        expect(gallery.queryByRole('link', { name: /source/i })).toBeNull()

        fireEvent.click(gallery.getByRole('button', { name: 'Close gallery' }))
        expect(queryByRole('dialog')).toBeNull()

        fireEvent.click(getByRole('button', { name: 'Open Arcade, compiled gallery' }))
        dialog = getByRole('dialog')
        gallery = within(dialog)
        fireEvent.click(gallery.getByRole('button', { name: 'Play in Arcade ↓' }))
        expect(onScrollNext).toHaveBeenCalledOnce()
        expect(queryByRole('dialog')).toBeNull()
    })

    test('App advances from the Arcade project action to the rendered Arcade pane', () => {
        const { section, projects } = renderProjects()
        const scroller = section.parentElement
        expect(scroller).not.toBeNull()

        const element = scroller as HTMLElement
        const scrollTo = vi.fn()
        Object.defineProperty(element, 'scrollTo', { configurable: true, value: scrollTo })
        const arcade = element.querySelector('#arcade')
        expect(arcade).not.toBeNull()
        Object.defineProperty(arcade, 'offsetTop', { configurable: true, value: 3140 })

        const desktop = within(projects.getByTestId('projects-desktop-content'))
        fireEvent.click(desktop.getByRole('button', { name: 'Play in Arcade ↓' }))

        expect(scrollTo).toHaveBeenCalledWith({ top: 3140 })
    })
})
