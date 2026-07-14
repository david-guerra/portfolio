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
            ...project.gallery.flatMap((item) => [item.image, item.thumbnailImage]),
        ])

        expect(images.every((image) => image.startsWith('/portfolio/project-images/'))).toBe(true)
        expect(
            basedProjects.every((project) =>
                project.gallery.every((item) => item.thumbnailImage.endsWith('-thumbnail.png')),
            ),
        ).toBe(true)
    })

    test('leads with the approved Arcade project and exact copy', () => {
        const { projects } = renderProjects()
        const desktop = within(projects.getByTestId('projects-desktop-content'))

        expect(projects.getByText('PROJECTS')).toBeTruthy()
        expect(
            projects.getByText(`01 / ${String(PROJECTS.length).padStart(2, '0')}`),
        ).toBeTruthy()
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

    test('captures the center-card pointer so a desktop drag completes off the original hit area', () => {
        const { getByRole, queryByRole } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const preview = getByRole('button', { name: 'Open Arcade, compiled gallery' })
        const setPointerCapture = vi.fn()
        const hasPointerCapture = vi.fn(() => true)
        const releasePointerCapture = vi.fn()
        Object.defineProperties(preview, {
            setPointerCapture: { configurable: true, value: setPointerCapture },
            hasPointerCapture: { configurable: true, value: hasPointerCapture },
            releasePointerCapture: { configurable: true, value: releasePointerCapture },
        })

        fireEvent.pointerDown(preview, { clientX: 300, pointerId: 7 })
        expect(setPointerCapture).toHaveBeenCalledWith(7)

        fireEvent.pointerUp(preview, { clientX: 100, pointerId: 7 })
        fireEvent.click(preview)

        expect(hasPointerCapture).toHaveBeenCalledWith(7)
        expect(releasePointerCapture).toHaveBeenCalledWith(7)
        expect(getByRole('heading', { level: 2, name: 'CleanVoice' })).toBeTruthy()
        expect(queryByRole('dialog')).toBeNull()
    })

    test('keeps desktop neighbor projects wide, dark, and visibly labeled in every theme', () => {
        const { getByRole } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const previous = getByRole('button', { name: 'Show previous project: Fest' })
        const next = getByRole('button', { name: 'Show next project: CleanVoice' })
        const previousImage = previous.querySelector('img')
        const nextImage = next.querySelector('img')

        expect(previous.classList).toContain('w-[clamp(190px,18vw,270px)]')
        expect(next.classList).toContain('w-[clamp(190px,18vw,270px)]')
        expect(previous.classList).toContain('border-orange')
        expect(next.classList).toContain('border-lavender')
        const previousTitle = within(previous).getByText('Fest')
        const nextTitle = within(next).getByText('CleanVoice')
        const previousDirection = within(previous).getByText('← Previous')
        const nextDirection = within(next).getByText('Next →')

        expect(previousTitle).toBeTruthy()
        expect(previousDirection).toBeTruthy()
        expect(nextTitle).toBeTruthy()
        expect(nextDirection).toBeTruthy()

        expect(previousDirection.classList).toContain('text-[#e8734a]')
        expect(previousDirection.classList).not.toContain('text-orange')
        expect(nextDirection.classList).toContain('text-[#a48ef0]')
        expect(nextDirection.classList).not.toContain('text-lavender')

        for (const title of [previousTitle, nextTitle]) {
            const labelChip = title.parentElement

            expect(labelChip).not.toBeNull()
            expect(labelChip?.classList).toContain('bg-[#0d0d0f]')
            expect(labelChip?.classList).not.toContain('bg-bg')
            expect(title.classList).toContain('text-[#f3e9d2]')
            expect(title.classList).not.toContain('text-ink')
        }

        for (const image of [previousImage, nextImage]) {
            expect(image).not.toBeNull()
            expect(image?.classList).toContain('brightness-[0.64]')
            expect(image?.classList).toContain('saturate-[0.82]')
            expect(image?.classList).toContain('blur-[0.45px]')
            expect(image?.classList).toContain('group-hover:brightness-[0.82]')
            expect(image?.classList).toContain('group-hover:saturate-[0.95]')
            expect(image?.classList).toContain('group-hover:blur-none')
            expect(image?.classList).toContain('group-focus-visible:brightness-[0.82]')
            expect(image?.classList).toContain('group-focus-visible:saturate-[0.95]')
            expect(image?.classList).toContain('group-focus-visible:blur-none')
            expect(image?.classList).toContain('motion-reduce:transition-none')
        }
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

        const scrollTo = vi.fn()
        Object.defineProperty(deck, 'clientWidth', { configurable: true, value: 360 })
        Object.defineProperty(deck, 'scrollTo', { configurable: true, value: scrollTo })
        fireEvent.scroll(deck, { target: { scrollLeft: 328 } })
        expect(getByText('02 / 03')).toBeTruthy()
        expect(getByRole('heading', { level: 2, name: 'CleanVoice' })).toBeTruthy()
        expect(scrollTo).not.toHaveBeenCalled()

        fireEvent.click(getByRole('button', { name: 'Show Fest' }))
        expect(getByText('03 / 03')).toBeTruthy()
        expect(getByRole('heading', { level: 2, name: 'Fest' })).toBeTruthy()
    })

    test('scrolls the mobile deck when section keyboard navigation selects a project', () => {
        const { container, getByRole, getByTestId, getByText } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const section = container.querySelector('#projects')
        const deck = getByTestId('projects-mobile-deck')
        const scrollTo = vi.fn()
        expect(section).not.toBeNull()
        Object.defineProperty(deck, 'clientWidth', { configurable: true, value: 393 })
        Object.defineProperty(deck, 'scrollTo', { configurable: true, value: scrollTo })

        fireEvent.keyDown(section as HTMLElement, { key: 'ArrowRight' })

        expect(getByText('02 / 03')).toBeTruthy()
        expect(getByRole('button', { name: 'Show CleanVoice' }).getAttribute('aria-pressed')).toBe(
            'true',
        )
        expect(scrollTo).toHaveBeenCalledWith({ left: 361 })
    })

    test('syncs the mobile deck to the selected desktop project after a resize', () => {
        const { getByRole, getByTestId, getByText } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const deck = getByTestId('projects-mobile-deck')
        const scrollTo = vi.fn()
        Object.defineProperty(deck, 'clientWidth', { configurable: true, value: 393 })
        Object.defineProperty(deck, 'scrollTo', { configurable: true, value: scrollTo })

        fireEvent.click(getByRole('button', { name: 'Previous project' }))
        expect(getByText('03 / 03')).toBeTruthy()

        fireEvent(window, new Event('resize'))
        expect(scrollTo).toHaveBeenCalledWith({ left: 722 })
    })

    test('defers every below-fold carousel image load and decode', () => {
        const { container } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const carouselImages = container.querySelectorAll('#projects img')

        expect(carouselImages).toHaveLength(6)
        for (const image of carouselImages) {
            expect(image.getAttribute('loading')).toBe('lazy')
            expect(image.getAttribute('decoding')).toBe('async')
        }
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
        expect(section.classList).toContain('focus-visible:outline-2')
        expect(section.classList).toContain('focus-visible:outline-solid')
        expect(section.classList).toContain('focus-visible:outline-offset-[-2px]')
        expect(section.classList).toContain('focus-visible:outline-orange')
    })

    test('opens the truthful gallery, switches and wraps frames, and closes both ways', () => {
        const onScrollNext = vi.fn()
        const { getByRole, queryByRole } = render(
            <ProjectsSection onScrollNext={onScrollNext} />,
        )

        fireEvent.click(getByRole('button', { name: 'Open gallery →' }))
        let dialog = getByRole('dialog')
        let gallery = within(dialog)

        const galleryFrame = gallery.getByTestId('project-gallery-frame')
        const galleryImage = gallery.getByRole('img', {
            name: 'Arcade hub showing Connect Four, Sudoku, and Game of Life',
        })

        expect(galleryFrame.classList).toContain('shrink-0')
        expect(galleryFrame.classList).not.toContain('flex-1')
        expect(galleryImage.classList).toContain('h-auto')
        expect(galleryImage.classList).toContain('w-full')
        expect(galleryImage.classList).not.toContain('h-full')
        expect(galleryImage.classList).not.toContain('max-h-[48dvh]')
        expect(galleryImage.classList).not.toContain('wide:max-h-[50dvh]')
        expect(galleryImage.getAttribute('decoding')).toBe('async')
        expect(galleryImage.getAttribute('src')).toMatch(/arcade-gallery-01-hub\.png$/)

        const galleryLayout = gallery.getByTestId('project-gallery-layout')
        const galleryMedia = gallery.getByTestId('project-gallery-media')
        const galleryCopy = gallery.getByTestId('project-gallery-copy')
        expect(galleryLayout.classList).toContain('min-w-0')
        expect(galleryLayout.classList).toContain('overflow-y-auto')
        expect(galleryLayout.classList).toContain('wide:overflow-hidden')
        expect(galleryMedia.classList).toContain('min-w-0')
        expect(galleryMedia.classList).toContain('wide:overflow-y-auto')
        expect(galleryCopy.classList).toContain('min-w-0')
        expect(galleryCopy.classList).toContain('overflow-y-auto')
        expect(gallery.getByRole('heading', { level: 2, name: 'Arcade, compiled' })).toBeTruthy()
        expect(gallery.getByText('01 / 04')).toBeTruthy()
        expect(
            gallery.getByRole('img', {
                name: 'Arcade hub showing Connect Four, Sudoku, and Game of Life',
            }),
        ).toBeTruthy()

        const galleryThumbnails = gallery
            .getAllByRole('button', { name: /^Show .+ image$/ })
            .map((button) => button.querySelector('img'))
        expect(galleryThumbnails).toHaveLength(4)
        for (const thumbnail of galleryThumbnails) {
            expect(thumbnail).not.toBeNull()
            expect(thumbnail?.getAttribute('src')).toMatch(/-thumbnail\.png$/)
            expect(thumbnail?.getAttribute('loading')).toBe('lazy')
            expect(thumbnail?.getAttribute('decoding')).toBe('async')
        }

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

    test('hides gallery navigation when the selected project has one image', () => {
        const { getByRole, getByTestId } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )

        fireEvent.click(getByRole('button', { name: 'Show next project: CleanVoice' }))
        const desktop = within(getByTestId('projects-desktop-content'))
        fireEvent.click(desktop.getByRole('button', { name: 'Open gallery →' }))

        const gallery = within(getByRole('dialog'))
        expect(gallery.getByText('01 / 01')).toBeTruthy()
        expect(gallery.queryByRole('button', { name: 'Previous gallery image' })).toBeNull()
        expect(gallery.queryByRole('button', { name: 'Next gallery image' })).toBeNull()
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
