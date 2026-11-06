import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../src/App.tsx'
import { PROJECTS } from '../src/features/projects/projects.ts'
import ProjectsSection from '../src/features/projects/ProjectsSection.tsx'
import ProjectGalleryDialog from '../src/features/projects/ProjectGalleryDialog.tsx'

vi.mock('../src/components/Hero.tsx', () => ({
    default: () => <div data-testid="hero-stub" />,
}))

afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
    vi.useRealTimers()
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
            'Couple HQ',
            'Yoshida',
            'Arcade, compiled',
        ])
        expect(PROJECTS.map(({ tag, status }) => `${tag} · ${status}`)).toEqual([
            'Next.js · Supabase · Private household app',
            'Voice AI · LiveKit · Hackathon prototype',
            'C · WebAssembly · Shipped',
        ])
        expect(PROJECTS.map(({ gallery }) => gallery.length)).toEqual([8, 8, 4])
        expect(PROJECTS.map(({ sourceUrl }) => sourceUrl)).toEqual([
            undefined,
            'https://github.com/david-guerra/Yoshida',
            undefined,
        ])
        expect(PROJECTS[1]?.description).toBe(
            'Our team built Yoshida at a LiveKit hackathon to help independent cleaners communicate with German-speaking clients. The prototype turns a German-language call into a tentative booking and shows it in a realtime dashboard with multilingual summaries. I built the voice agent and later helped integrate and refine the frontend and backend.',
        )
    })

    test("renders every Arcade action from the project's semantic capability after rename and reorder", () => {
        const originalProjects = [...PROJECTS]
        const [coupleProject, cleanVoiceProject, arcadeProject] = originalProjects
        const renamedArcadeProject = {
            ...arcadeProject,
            title: 'Renamed Arcade project',
            action: 'play-arcade' as const,
        }
        const mutableProjects = PROJECTS as unknown as Array<(typeof PROJECTS)[number]>
        const reorderedProjects = [cleanVoiceProject, renamedArcadeProject, coupleProject]
        let unmount: (() => void) | undefined

        mutableProjects.splice(0, mutableProjects.length, ...reorderedProjects)

        try {
            const rendered = render(<ProjectsSection onScrollNext={() => undefined} />)
            unmount = rendered.unmount
            const mobileArticles = within(rendered.getByTestId('projects-mobile-deck')).getAllByRole(
                'article',
            )
            const desktop = within(rendered.getByTestId('projects-desktop-content'))

            expect.soft(arcadeProject?.action).toBe('play-arcade')
            expect
                .soft(
                    within(mobileArticles[0]).queryByRole('button', {
                        name: 'Play in Arcade',
                    }),
                )
                .toBeNull()
            expect
                .soft(
                    within(mobileArticles[1]).queryByRole('button', {
                        name: 'Play in Arcade',
                    }),
                )
                .not.toBeNull()
            expect.soft(desktop.queryByRole('button', { name: 'Play in Arcade ↓' })).toBeNull()

            fireEvent.click(
                within(rendered.getByRole('navigation', { name: 'Project index' })).getByRole(
                    'button',
                    { name: 'Select project: Renamed Arcade project' },
                ),
            )
            expect.soft(desktop.queryByRole('button', { name: 'Play in Arcade ↓' })).not.toBeNull()

            fireEvent.click(
                within(mobileArticles[1]).getByRole('button', {
                    name: 'Open Renamed Arcade project gallery from mobile card',
                }),
            )
            expect
                .soft(
                    within(rendered.getByRole('dialog')).queryByRole('button', {
                        name: 'Play in Arcade ↓',
                    }),
                )
                .not.toBeNull()
        } finally {
            unmount?.()
            mutableProjects.splice(0, mutableProjects.length, ...originalProjects)
        }
    })

    test('resolves every public image through the configured Vite base path', async () => {
        vi.stubEnv('BASE_URL', '/portfolio/')
        vi.resetModules()
        const { PROJECTS: basedProjects, projectImageForTheme } = await import(
            '../src/features/projects/projects.ts'
        )
        const themes = ['dark', 'light'] as const
        const images = basedProjects.flatMap((project) =>
            themes.flatMap((theme) => [
                projectImageForTheme(project.carouselImage, theme),
                ...project.gallery.flatMap((item) => [
                    projectImageForTheme(item.image, theme),
                    projectImageForTheme(item.thumbnailImage, theme),
                ]),
            ]),
        )

        expect(images.every((image) => image.startsWith('/portfolio/project-images/'))).toBe(true)
        expect(
            basedProjects.every((project) =>
                project.gallery.every((item) =>
                    themes.every((theme) =>
                        /-thumbnail\.(png|jpg)$/.test(
                            projectImageForTheme(item.thumbnailImage, theme),
                        ),
                    ),
                ),
            ),
        ).toBe(true)
    })

    test('switches only Arcade media with the manual theme', () => {
        const { container, getByRole } = render(<App />)
        const section = container.querySelector('#projects')
        expect(section).not.toBeNull()
        const projects = within(section as HTMLElement)
        const carouselImages = projects.getAllByRole('img', {
            name: 'Browser Arcade preview with its three C and WebAssembly games',
        })

        expect(carouselImages.length).toBeGreaterThan(0)
        expect(
            carouselImages.every((image) =>
                image.getAttribute('src')?.endsWith('browser-arcade-carousel-dark.png'),
            ),
        ).toBe(true)
        expect(section?.querySelector('img[src*="arcade-"][src*="-light"]')).toBeNull()
        const themeNeutralAlts = [
            'Yoshida cleaner dashboard showing a tentative request awaiting review',
            'Couple HQ dashboard with shared tasks, shopping, money, and plans using fictional demo data',
        ]
        const themeNeutralSources = themeNeutralAlts.map((name) =>
            projects.getAllByRole('img', { name }).map((image) => image.getAttribute('src')),
        )

        const desktop = within(projects.getByTestId('projects-desktop-content'))
        fireEvent.click(desktop.getByRole('button', { name: 'Select project: Arcade, compiled' }))
        fireEvent.click(desktop.getByRole('button', { name: 'Open gallery →' }))
        const gallery = within(getByRole('dialog'))
        const galleryFrames = [
            [
                'Arcade hub',
                'Arcade hub showing Connect Four, Sudoku, and Game of Life',
                '01-hub',
            ],
            [
                'Connect Four',
                'Connect Four game in progress against the browser bot',
                '02-connect-four',
            ],
            [
                'Sudoku',
                'Sudoku game in progress with its number controls',
                '03-sudoku',
            ],
            [
                'Game of Life',
                'Game of Life grid with a recognizable living pattern',
                '04-game-of-life',
            ],
        ] as const
        const expectGalleryTheme = (theme: 'dark' | 'light') => {
            for (const [label, alt, basename] of galleryFrames) {
                fireEvent.click(gallery.getByRole('button', { name: `Show ${label} image` }))
                expect(gallery.getByRole('img', { name: alt }).getAttribute('src')).toMatch(
                    new RegExp(`arcade-gallery-${basename}-${theme}\\.png$`),
                )
            }
        }

        expectGalleryTheme('dark')
        expect(
            gallery
                .getAllByRole('button', { name: /^Show .+ image$/ })
                .map((button) => button.querySelector('img')?.getAttribute('src')),
        ).toEqual([
            expect.stringMatching(/arcade-gallery-01-hub-dark-thumbnail\.png$/),
            expect.stringMatching(/arcade-gallery-02-connect-four-dark-thumbnail\.png$/),
            expect.stringMatching(/arcade-gallery-03-sudoku-dark-thumbnail\.png$/),
            expect.stringMatching(/arcade-gallery-04-game-of-life-dark-thumbnail\.png$/),
        ])

        fireEvent.click(getByRole('button', { name: 'Switch to light theme' }))

        expect(
            carouselImages.every((image) =>
                image.getAttribute('src')?.endsWith('browser-arcade-carousel-light.png'),
            ),
        ).toBe(true)
        expect(section?.querySelector('img[src*="arcade-"][src*="-dark"]')).toBeNull()
        expect(
            themeNeutralAlts.map((name) =>
                projects.getAllByRole('img', { name }).map((image) => image.getAttribute('src')),
            ),
        ).toEqual(themeNeutralSources)
        expectGalleryTheme('light')
        expect(
            gallery
                .getAllByRole('button', { name: /^Show .+ image$/ })
                .map((button) => button.querySelector('img')?.getAttribute('src')),
        ).toEqual([
            expect.stringMatching(/arcade-gallery-01-hub-light-thumbnail\.png$/),
            expect.stringMatching(/arcade-gallery-02-connect-four-light-thumbnail\.png$/),
            expect.stringMatching(/arcade-gallery-03-sudoku-light-thumbnail\.png$/),
            expect.stringMatching(/arcade-gallery-04-game-of-life-light-thumbnail\.png$/),
        ])
    })

    test('leads with the approved Couple HQ project and exact copy', () => {
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
            desktop.getByRole('heading', { level: 2, name: 'Couple HQ' }),
        ).toBeTruthy()
        expect(
            within(desktop.getByRole('button', { name: 'Open Couple HQ gallery' })).getByText(
                'Next.js · Supabase',
            ),
        ).toBeTruthy()
        expect(desktop.getByText('Private household app')).toBeTruthy()
        expect(
            desktop.getByText(
                'Before my partner and I moved in together, I built us a shared headquarters. Couple HQ is our private household app for cleaning, groceries, meals, shared expenses, and plans. Claude connects through MCP for research and bulk updates. A Telegram bot makes cleaning quick to log and sends a gentle daily nudge.',
            ),
        ).toBeTruthy()
    })

    test('wraps with footer buttons and arrows and delegates Arcade navigation', () => {
        const onScrollNext = vi.fn()
        const { container, getByRole, getByText } = render(
            <ProjectsSection onScrollNext={onScrollNext} />,
        )
        const section = container.querySelector('#projects')
        expect(section).not.toBeNull()

        fireEvent.click(getByRole('button', { name: 'Next project' }))
        expect(getByRole('heading', { level: 2, name: 'Yoshida' })).toBeTruthy()
        expect(getByText('02 / 03')).toBeTruthy()

        fireEvent.click(getByRole('button', { name: 'Previous project' }))
        fireEvent.click(getByRole('button', { name: 'Previous project' }))
        expect(getByRole('heading', { level: 2, name: 'Arcade, compiled' })).toBeTruthy()

        fireEvent.keyDown(section as HTMLElement, { key: 'ArrowRight' })
        expect(getByRole('heading', { level: 2, name: 'Couple HQ' })).toBeTruthy()

        fireEvent.click(getByRole('button', { name: 'Previous project' }))
        expect(getByRole('heading', { level: 2, name: 'Arcade, compiled' })).toBeTruthy()
        fireEvent.click(getByRole('button', { name: 'Play in Arcade ↓' }))
        expect(onScrollNext).toHaveBeenCalledOnce()
    })

    test('captures the desktop rail pointer so dragging continues off the original card', () => {
        const { getByRole, getByTestId, queryByRole } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const rail = getByTestId('projects-desktop-rail')
        const preview = getByRole('button', { name: 'Open Couple HQ gallery' })
        const setPointerCapture = vi.fn()
        const hasPointerCapture = vi.fn(() => true)
        const releasePointerCapture = vi.fn()
        Object.defineProperties(rail, {
            scrollLeft: { configurable: true, writable: true, value: 600 },
            setPointerCapture: { configurable: true, value: setPointerCapture },
            hasPointerCapture: { configurable: true, value: hasPointerCapture },
            releasePointerCapture: { configurable: true, value: releasePointerCapture },
        })

        fireEvent.pointerDown(rail, { clientX: 300, pointerId: 7 })
        expect(setPointerCapture).not.toHaveBeenCalled()

        fireEvent.pointerMove(rail, { clientX: 100, pointerId: 7 })
        expect(rail.scrollLeft).toBe(800)
        expect(setPointerCapture).toHaveBeenCalledWith(7)
        fireEvent.pointerUp(rail, { clientX: 100, pointerId: 7 })
        fireEvent.click(preview)

        expect(hasPointerCapture).toHaveBeenCalledWith(7)
        expect(releasePointerCapture).toHaveBeenCalledWith(7)
        expect(queryByRole('dialog')).toBeNull()
    })

    test('renders a native-ratio scroll rail with exactly three cards per viewport and a direct index', () => {
        const { getByRole, getByTestId } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const rail = getByTestId('projects-desktop-rail')
        const section = rail.closest('#projects')
        const frame = section?.querySelector('[data-section-frame="wide"]')

        expect(frame).not.toBeNull()
        expect(frame?.classList.contains('max-w-[1800px]')).toBe(true)
        expect(frame?.classList.contains('wide:h-full')).toBe(true)
        expect(frame?.classList.contains('wide:min-h-0')).toBe(true)
        const desktop = within(getByTestId('projects-desktop-content'))
        const projectIndex = getByRole('navigation', { name: 'Project index' })
        const cards = rail.querySelectorAll('[data-project-card]')
        const selected = getByRole('button', { name: 'Open Couple HQ gallery' })
        const inactive = getByRole('button', { name: 'Center project: Yoshida' })

        expect(rail.classList).toContain('snap-x')
        expect(rail.classList).toContain('snap-mandatory')
        expect(rail.classList).toContain('overflow-x-auto')
        expect(rail.classList).not.toContain('wide:min-h-[260px]')
        expect(cards).toHaveLength(PROJECTS.length * 3)
        for (const card of cards) {
            expect(card.classList).toContain('[flex:0_0_33.333333%]')
            expect(card.classList).toContain('aspect-[1672/941]')
            expect(card.classList).toContain('snap-center')
        }
        expect(selected.classList).toContain('border')
        expect(selected.classList).toContain('border-orange')
        expect(selected.classList).toContain('z-10')
        expect(inactive.querySelector('img')?.classList).toContain('brightness-[0.64]')
        expect(within(inactive).getByText('Yoshida')).toBeTruthy()
        expect(within(inactive).getByText('View project →')).toBeTruthy()
        expect(rail.querySelector('[data-rail-copy="leading"]')?.tagName).toBe('DIV')
        expect(rail.querySelector('[data-rail-copy="middle"]')?.tagName).toBe('BUTTON')
        expect(rail.querySelector('[data-rail-copy="trailing"]')?.tagName).toBe('DIV')

        const scrollTo = vi.fn()
        Object.defineProperties(rail, {
            clientWidth: { configurable: true, value: 900 },
            scrollLeft: { configurable: true, writable: true, value: 600 },
            scrollTo: { configurable: true, value: scrollTo },
        })
        fireEvent.click(within(projectIndex).getByRole('button', { name: 'Select project: Arcade, compiled' }))

        expect(desktop.getByRole('heading', { level: 2, name: 'Couple HQ' })).toBeTruthy()
        expect(scrollTo).toHaveBeenCalledWith({ left: 1200, behavior: 'smooth' })

        rail.scrollLeft = 1200
        fireEvent.scroll(rail)
        expect(desktop.getByRole('heading', { level: 2, name: 'Arcade, compiled' })).toBeTruthy()
        expect(
            within(projectIndex)
                .getByRole('button', { name: 'Select project: Arcade, compiled' })
                .getAttribute('aria-pressed'),
        ).toBe('true')
    })

    test('moves one physical card in the requested direction across both wrap boundaries', () => {
        vi.useFakeTimers()
        const { getByRole, getByTestId } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const rail = getByTestId('projects-desktop-rail')
        const scrollTo = vi.fn()
        Object.defineProperties(rail, {
            clientWidth: { configurable: true, value: 900 },
            scrollLeft: { configurable: true, writable: true, value: 600 },
            scrollTo: { configurable: true, value: scrollTo },
        })

        fireEvent.click(getByRole('button', { name: 'Previous project' }))
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: 'smooth' })

        rail.scrollLeft = 300
        fireEvent.scroll(rail)
        act(() => vi.advanceTimersByTime(160))
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 1200, behavior: 'auto' })

        scrollTo.mockClear()
        fireEvent.click(getByRole('button', { name: 'Next project' }))
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 1500, behavior: 'smooth' })
    })

    test('rebases before moving left from the first centerable physical card', () => {
        vi.useFakeTimers()
        const { getByRole, getByTestId } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const rail = getByTestId('projects-desktop-rail')
        const scrollTo = vi.fn()
        Object.defineProperties(rail, {
            clientWidth: { configurable: true, value: 900 },
            scrollLeft: { configurable: true, writable: true, value: 0 },
            scrollTo: { configurable: true, value: scrollTo },
        })

        fireEvent.scroll(rail)
        expect(getByRole('heading', { level: 2, name: 'Yoshida' })).toBeTruthy()

        fireEvent.click(getByRole('button', { name: 'Previous project' }))

        expect(scrollTo.mock.calls).toEqual([
            [{ left: 900, behavior: 'auto' }],
            [{ left: 600, behavior: 'smooth' }],
        ])
    })

    test('rebases before moving right from the last centerable physical card', () => {
        vi.useFakeTimers()
        const { getByRole, getByTestId } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const rail = getByTestId('projects-desktop-rail')
        const scrollTo = vi.fn()
        Object.defineProperties(rail, {
            clientWidth: { configurable: true, value: 900 },
            scrollLeft: { configurable: true, writable: true, value: 1800 },
            scrollTo: { configurable: true, value: scrollTo },
        })

        fireEvent.scroll(rail)
        expect(getByRole('heading', { level: 2, name: 'Yoshida' })).toBeTruthy()

        fireEvent.click(getByRole('button', { name: 'Next project' }))

        expect(scrollTo.mock.calls).toEqual([
            [{ left: 900, behavior: 'auto' }],
            [{ left: 1200, behavior: 'smooth' }],
        ])
    })

    test('recenters equivalent cards invisibly after scrolling through either repeated end', () => {
        vi.useFakeTimers()
        const { getByRole, getByTestId } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const rail = getByTestId('projects-desktop-rail')
        const scrollTo = vi.fn()
        Object.defineProperties(rail, {
            clientWidth: { configurable: true, value: 900 },
            scrollLeft: { configurable: true, writable: true, value: 300 },
            scrollTo: { configurable: true, value: scrollTo },
        })

        fireEvent.scroll(rail)
        expect(getByRole('heading', { level: 2, name: 'Arcade, compiled' })).toBeTruthy()
        act(() => vi.advanceTimersByTime(160))
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 1200, behavior: 'auto' })

        scrollTo.mockClear()
        rail.scrollLeft = 1500
        fireEvent.scroll(rail)
        expect(getByRole('heading', { level: 2, name: 'Couple HQ' })).toBeTruthy()
        act(() => vi.advanceTimersByTime(160))
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 600, behavior: 'auto' })
    })

    test('does not recenter a repeated rail while a pointer drag is still active', () => {
        vi.useFakeTimers()
        const { getByTestId } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )
        const rail = getByTestId('projects-desktop-rail')
        const scrollTo = vi.fn()
        Object.defineProperties(rail, {
            clientWidth: { configurable: true, value: 900 },
            scrollLeft: { configurable: true, writable: true, value: 300 },
            scrollTo: { configurable: true, value: scrollTo },
            hasPointerCapture: { configurable: true, value: () => false },
        })

        fireEvent.pointerDown(rail, { clientX: 300, pointerId: 8 })
        fireEvent.scroll(rail)
        act(() => vi.advanceTimersByTime(160))
        expect(scrollTo).not.toHaveBeenCalled()

        fireEvent.pointerUp(rail, { clientX: 300, pointerId: 8 })
        act(() => vi.advanceTimersByTime(160))
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 1200, behavior: 'auto' })
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
        expect(getByRole('heading', { level: 2, name: 'Yoshida' })).toBeTruthy()
        expect(scrollTo).not.toHaveBeenCalled()

        fireEvent.click(getByRole('button', { name: 'Show Arcade, compiled' }))
        expect(getByText('03 / 03')).toBeTruthy()
        expect(getByRole('heading', { level: 2, name: 'Arcade, compiled' })).toBeTruthy()
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
        expect(getByRole('button', { name: 'Show Yoshida' }).getAttribute('aria-pressed')).toBe(
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

        expect(carouselImages).toHaveLength(12)
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

        fireEvent.click(getByRole('button', { name: 'Select project: Arcade, compiled' }))
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
        expect(galleryImage.getAttribute('src')).toMatch(/arcade-gallery-01-hub-dark\.png$/)

        const galleryLayout = gallery.getByTestId('project-gallery-layout')
        const galleryMedia = gallery.getByTestId('project-gallery-media')
        const galleryCopy = gallery.getByTestId('project-gallery-copy')
        expect(galleryLayout.classList).toContain('min-w-0')
        expect(galleryLayout.classList).toContain('overflow-y-auto')
        expect(galleryLayout.classList).toContain('wide:overflow-hidden')
        expect(galleryMedia.classList).toContain('min-w-0')
        expect(galleryMedia.classList).toContain('wide:overflow-y-auto')
        expect(galleryCopy.classList).toContain('min-w-0')
        expect(galleryCopy.classList).toContain('wide:overflow-y-auto')
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

        fireEvent.click(getByRole('button', { name: 'Open gallery →' }))
        dialog = getByRole('dialog')
        gallery = within(dialog)
        fireEvent.click(gallery.getByRole('button', { name: 'Play in Arcade ↓' }))
        expect(onScrollNext).toHaveBeenCalledOnce()
        expect(queryByRole('dialog')).toBeNull()
    })

    test('shows the Yoshida explainer on demand and preserves the captured app screens', () => {
        const { getByRole, getByTestId } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )

        fireEvent.click(getByRole('button', { name: 'Select project: Yoshida' }))
        const desktop = within(getByTestId('projects-desktop-content'))
        fireEvent.click(desktop.getByRole('button', { name: 'Open gallery →' }))

        const gallery = within(getByRole('dialog'))
        const video = gallery.getByLabelText('Yoshida silent demo') as HTMLVideoElement
        expect(video.getAttribute('preload')).toBe('none')
        expect(video.autoplay).toBe(false)
        expect(video.getAttribute('poster')).toMatch(/yoshida-demo-poster\.jpg$/)
        expect(video.querySelector('source')?.getAttribute('src')).toMatch(
            /yoshida-silent-demo\.mp4$/,
        )
        expect(video.querySelector('track')?.getAttribute('src')).toMatch(
            /yoshida-silent-demo\.vtt$/,
        )
        expect(gallery.getByText(/illustrative replay/i)).toBeTruthy()

        fireEvent.click(gallery.getByRole('button', { name: 'Show Caller receipt image' }))
        expect(gallery.queryByLabelText('Yoshida silent demo')).toBeNull()
        expect(gallery.getByRole('img', { name: /German browser call simulator.*tentative receipt/i })).toBeTruthy()
        expect(gallery.getByText(/reconstructed from a saved.*call/i)).toBeTruthy()

        fireEvent.click(gallery.getByRole('button', { name: 'Show Confirmed image' }))
        expect(gallery.getByRole('img', { name: /confirmed appointment.*cleaner dashboard/i })).toBeTruthy()
        expect(gallery.getByText(/persisted.*spoken call/i)).toBeTruthy()
    })

    test('opens the private household project with demo media and an optional story', () => {
        const { getByRole, getByTestId } = render(
            <ProjectsSection onScrollNext={() => undefined} />,
        )

        fireEvent.click(getByRole('button', { name: 'Select project: Couple HQ' }))
        const desktop = within(getByTestId('projects-desktop-content'))
        fireEvent.click(desktop.getByRole('button', { name: 'Open gallery →' }))

        const gallery = within(getByRole('dialog'))
        expect(gallery.queryByRole('link', { name: /source|live|visit/i })).toBeNull()
        expect(gallery.getByText(/fictional demo data/i)).toBeTruthy()
        fireEvent.click(gallery.getByText('The story so far'))
        expect(gallery.getByRole('heading', { level: 3, name: 'Before the move' })).toBeTruthy()

        fireEvent.click(gallery.getByRole('button', { name: 'Show Home on mobile image' }))
        expect(gallery.getByRole('img', { name: /mobile.*bottom navigation/i })).toBeTruthy()
        expect(gallery.getByText('02 / 08')).toBeTruthy()
    })

    test('hides gallery navigation when the selected project has one image', () => {
        const { getByRole } = render(
            <ProjectGalleryDialog
                project={{ ...PROJECTS[2], gallery: PROJECTS[2].gallery.slice(0, 1) }}
                onClose={() => undefined}
                onPlayArcade={() => undefined}
            />,
        )
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
        fireEvent.click(desktop.getByRole('button', { name: 'Select project: Arcade, compiled' }))
        fireEvent.click(desktop.getByRole('button', { name: 'Play in Arcade ↓' }))

        expect(scrollTo).toHaveBeenCalledWith({ top: 3140 })
    })
})
