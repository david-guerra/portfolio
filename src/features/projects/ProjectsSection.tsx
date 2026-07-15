import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import ProjectGalleryDialog from './ProjectGalleryDialog.tsx'
import { PROJECTS, type Project, type ProjectAccent } from './projects.ts'

const FOCUS_RING =
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange'

const ACCENT_TEXT: Record<ProjectAccent, string> = {
    teal: 'text-teal',
    lavender: 'text-lavender',
    orange: 'text-orange',
}

const ACCENT_TEXT_ON_DARK: Record<ProjectAccent, string> = {
    teal: 'text-[#5cc9c4]',
    lavender: 'text-[#a48ef0]',
    orange: 'text-[#e8734a]',
}

const ACCENT_BORDER: Record<ProjectAccent, string> = {
    teal: 'border-teal',
    lavender: 'border-lavender',
    orange: 'border-orange',
}

const DESKTOP_RAIL_COPIES = [
    { key: 'leading', index: 0, isAccessible: false },
    { key: 'middle', index: 1, isAccessible: true },
    { key: 'trailing', index: 2, isAccessible: false },
] as const
const DESKTOP_CARDS_PER_VIEW = 3
const DESKTOP_RECENTER_DELAY = 120
const DESKTOP_MIDDLE_COPY_INDEX = 1
const DESKTOP_TRAILING_COPY_INDEX = 2

function desktopCardWidth(rail: HTMLDivElement) {
    return rail.clientWidth / DESKTOP_CARDS_PER_VIEW
}

function centeredCardScrollLeft(renderedIndex: number, cardWidth: number) {
    return (renderedIndex - 1) * cardWidth
}

interface ArrowIconProps {
    direction: 'left' | 'right' | 'down'
}

function ArrowIcon({ direction }: ArrowIconProps) {
    const rotation = direction === 'left' ? 'rotate-180' : direction === 'down' ? 'rotate-90' : ''

    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 20 12"
            className={`h-3 w-5 ${rotation}`}
            fill="none"
        >
            <path d="M1 6h17M13 1l5 5-5 5" stroke="currentColor" strokeWidth="1.25" />
        </svg>
    )
}

export interface ProjectsSectionProps {
    onScrollNext: () => void
}

export default function ProjectsSection({ onScrollNext }: ProjectsSectionProps) {
    const [projectIndex, setProjectIndex] = useState(0)
    const [galleryProject, setGalleryProject] = useState<Project | null>(null)
    const projectIndexRef = useRef(0)
    const dragStart = useRef<{ clientX: number; scrollLeft: number } | null>(null)
    const dragged = useRef(false)
    const mobileDeckRef = useRef<HTMLDivElement>(null)
    const desktopRailRef = useRef<HTMLDivElement>(null)
    const desktopScrollEndTimer = useRef<number | null>(null)
    const desktopRenderedIndexRef = useRef(PROJECTS.length * DESKTOP_MIDDLE_COPY_INDEX)
    const project = PROJECTS[projectIndex]

    const selectProject = (index: number) => {
        projectIndexRef.current = index
        setProjectIndex(index)
    }

    const prefersReducedMotion = () =>
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    const scrollToRenderedCard = (
        renderedIndex: number,
        behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth',
    ) => {
        const rail = desktopRailRef.current
        if (!rail) return false
        const cardWidth = desktopCardWidth(rail)
        if (!cardWidth) return false
        desktopRenderedIndexRef.current = renderedIndex
        rail.scrollTo?.({
            left: centeredCardScrollLeft(renderedIndex, cardWidth),
            behavior,
        })
        return true
    }

    const scrollToProject = (
        index: number,
        behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth',
    ) => {
        const didScroll = scrollToRenderedCard(
            PROJECTS.length * DESKTOP_MIDDLE_COPY_INDEX + index,
            behavior,
        )
        if (!didScroll) selectProject(index)
    }

    useLayoutEffect(() => {
        const syncDesktopRail = () => {
            const rail = desktopRailRef.current
            if (!rail) return
            const cardWidth = rail.clientWidth / DESKTOP_CARDS_PER_VIEW
            if (!cardWidth) return
            const renderedIndex =
                PROJECTS.length * DESKTOP_MIDDLE_COPY_INDEX + projectIndexRef.current
            desktopRenderedIndexRef.current = renderedIndex
            rail.scrollTo?.({
                left: centeredCardScrollLeft(renderedIndex, cardWidth),
                behavior: 'auto',
            })
        }

        const syncRails = () => {
            const deck = mobileDeckRef.current
            if (deck) {
                const step = Math.max(1, deck.clientWidth - 32)
                deck.scrollTo?.({ left: step * projectIndexRef.current })
            }
            syncDesktopRail()
        }

        syncDesktopRail()
        window.addEventListener('resize', syncRails)
        return () => {
            window.removeEventListener('resize', syncRails)
            if (desktopScrollEndTimer.current !== null) {
                window.clearTimeout(desktopScrollEndTimer.current)
            }
        }
    }, [])

    const selectRelative = (delta: -1 | 1, syncMobileDeck = false) => {
        const renderedProjectIndex =
            ((desktopRenderedIndexRef.current % PROJECTS.length) + PROJECTS.length) %
            PROJECTS.length
        const currentRenderedIndex =
            renderedProjectIndex === projectIndexRef.current
                ? desktopRenderedIndexRef.current
                : PROJECTS.length * DESKTOP_MIDDLE_COPY_INDEX + projectIndexRef.current
        const targetRenderedIndex = currentRenderedIndex + delta
        const targetIndex =
            ((targetRenderedIndex % PROJECTS.length) + PROJECTS.length) % PROJECTS.length
        if (!scrollToRenderedCard(targetRenderedIndex)) selectProject(targetIndex)
        if (syncMobileDeck) {
            const deck = mobileDeckRef.current
            const step = Math.max(1, (deck?.clientWidth ?? 0) - 32)
            deck?.scrollTo?.({ left: step * targetIndex })
        }
    }

    const recenterDesktopRail = (rail: HTMLDivElement) => {
        const cardWidth = desktopCardWidth(rail)
        if (!cardWidth) return
        const renderedIndex = Math.round(rail.scrollLeft / cardWidth) + 1
        let middleRenderedIndex = renderedIndex

        if (renderedIndex < PROJECTS.length * DESKTOP_MIDDLE_COPY_INDEX) {
            middleRenderedIndex += PROJECTS.length
        } else if (renderedIndex >= PROJECTS.length * DESKTOP_TRAILING_COPY_INDEX) {
            middleRenderedIndex -= PROJECTS.length
        } else {
            return
        }

        rail.scrollTo?.({
            left: centeredCardScrollLeft(middleRenderedIndex, cardWidth),
            behavior: 'auto',
        })
        desktopRenderedIndexRef.current = middleRenderedIndex
    }

    const scheduleDesktopRecenter = (rail: HTMLDivElement) => {
        if (desktopScrollEndTimer.current !== null) {
            window.clearTimeout(desktopScrollEndTimer.current)
            desktopScrollEndTimer.current = null
        }
        if (dragStart.current) return

        desktopScrollEndTimer.current = window.setTimeout(() => {
            if (!dragStart.current) recenterDesktopRail(rail)
            desktopScrollEndTimer.current = null
        }, DESKTOP_RECENTER_DELAY)
    }

    const handleDesktopScroll = (rail: HTMLDivElement) => {
        const cardWidth = desktopCardWidth(rail)
        if (!cardWidth) return
        const renderedIndex = Math.max(
            0,
            Math.min(
                PROJECTS.length * DESKTOP_RAIL_COPIES.length - 1,
                Math.round(rail.scrollLeft / cardWidth) + 1,
            ),
        )
        desktopRenderedIndexRef.current = renderedIndex
        selectProject(renderedIndex % PROJECTS.length)
        scheduleDesktopRecenter(rail)
    }

    const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        dragStart.current = null
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture?.(event.pointerId)
        }
        scheduleDesktopRecenter(event.currentTarget)
    }

    return (
        <section
            id="projects"
            aria-labelledby="projects-heading"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === 'ArrowLeft') selectRelative(-1, true)
                if (event.key === 'ArrowRight') selectRelative(1, true)
            }}
            className="min-h-full px-5 py-8 outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-[-2px] focus-visible:outline-orange wide:h-full wide:snap-start wide:snap-always wide:overflow-y-auto wide:px-14 wide:py-10"
        >
            <div className="mx-auto flex min-h-full w-full max-w-[1800px] flex-col wide:h-full wide:min-h-0">
                <div className="flex flex-col justify-between gap-4 wide:flex-row wide:items-start">
                    <div>
                        <p className="text-label text-muted uppercase">PROJECTS</p>
                        <p className="mt-1 text-base text-ink">
                            {String(projectIndex + 1).padStart(2, '0')} /{' '}
                            {String(PROJECTS.length).padStart(2, '0')}
                        </p>
                        <p className="mt-1 text-meta text-muted">
                            <span className="wide:hidden">swipe to browse</span>
                            <span className="hidden wide:inline">scroll, drag, or use arrows</span>
                        </p>
                    </div>
                    <p className="max-w-[520px] text-body-mono text-dim wide:text-right">
                        Most experiments stay experiments. These are the ones I kept coming back to.
                    </p>
                </div>

                <div
                    ref={mobileDeckRef}
                    data-testid="projects-mobile-deck"
                    onScroll={(event) => {
                        const step = Math.max(1, event.currentTarget.clientWidth - 32)
                        const index = Math.max(
                            0,
                            Math.min(PROJECTS.length - 1, Math.round(event.currentTarget.scrollLeft / step)),
                        )
                        selectProject(index)
                    }}
                    className="-mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] wide:hidden [&::-webkit-scrollbar]:hidden"
                >
                    {PROJECTS.map((item, index) => (
                        <article
                            key={item.title}
                            aria-labelledby={`mobile-project-${index}`}
                            className="flex-none basis-[calc(100%-2.75rem)] snap-center overflow-hidden rounded-card border border-border bg-surface p-3"
                        >
                            <button
                                type="button"
                                aria-label={`Preview ${item.title}`}
                                onClick={() => setGalleryProject(item)}
                                className={`relative block w-full cursor-pointer overflow-hidden border ${ACCENT_BORDER[item.accent]} ${FOCUS_RING}`}
                            >
                                <img
                                    src={item.carouselImage}
                                    alt={item.carouselAlt}
                                    loading="lazy"
                                    decoding="async"
                                    className="aspect-[16/10] w-full object-cover"
                                />
                            </button>
                            <h3 id={`mobile-project-${index}`} className="mt-3 text-title text-ink">
                                {item.title}
                            </h3>
                            <p className="mt-1 text-xs">
                                <span className={ACCENT_TEXT[item.accent]}>{item.tag}</span>
                                <span className="text-muted"> · </span>
                                <span className="text-dim">{item.status}</span>
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-body">{item.description}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-4">
                                <button
                                    type="button"
                                    aria-label={`Open ${item.title} gallery from mobile card`}
                                    onClick={() => setGalleryProject(item)}
                                    className={`cursor-pointer border-b pb-0.5 text-xs ${ACCENT_TEXT[item.accent]} ${ACCENT_BORDER[item.accent]} ${FOCUS_RING}`}
                                >
                                    Open gallery →
                                </button>
                                {index === 0 ? (
                                    <button
                                        type="button"
                                        onClick={onScrollNext}
                                        className={`flex cursor-pointer items-center gap-1.5 text-xs text-teal ${FOCUS_RING}`}
                                    >
                                        Play in Arcade <ArrowIcon direction="down" />
                                    </button>
                                ) : null}
                            </div>
                        </article>
                    ))}
                </div>

                <div
                    aria-label="Project pagination"
                    className="mt-2 flex justify-center gap-2 wide:hidden"
                >
                    {PROJECTS.map((item, index) => (
                        <button
                            key={item.title}
                            type="button"
                            aria-label={`Show ${item.title}`}
                            aria-pressed={index === projectIndex}
                            onClick={() => {
                                selectProject(index)
                                const deck = mobileDeckRef.current
                                const step = Math.max(1, (deck?.clientWidth ?? 0) - 32)
                                deck?.scrollTo?.({ left: step * index })
                            }}
                            className={`h-1.5 cursor-pointer transition-[width,background-color] motion-reduce:transition-none ${
                                index === projectIndex ? 'w-4 bg-orange' : 'w-1.5 bg-border'
                            } ${FOCUS_RING}`}
                        />
                    ))}
                </div>

                <div
                    data-testid="projects-desktop-content"
                    className="hidden min-h-0 flex-1 flex-col wide:flex"
                >
                    <div
                        ref={desktopRailRef}
                        data-testid="projects-desktop-rail"
                        onScroll={(event) => handleDesktopScroll(event.currentTarget)}
                        onPointerDown={(event) => {
                            if (event.button !== 0) return
                            if (desktopScrollEndTimer.current !== null) {
                                window.clearTimeout(desktopScrollEndTimer.current)
                                desktopScrollEndTimer.current = null
                            }
                            dragged.current = false
                            dragStart.current = {
                                clientX: event.clientX,
                                scrollLeft: event.currentTarget.scrollLeft,
                            }
                        }}
                        onPointerMove={(event) => {
                            const start = dragStart.current
                            if (!start) return
                            const distance = start.clientX - event.clientX
                            if (Math.abs(distance) > 6 && !dragged.current) {
                                dragged.current = true
                                event.currentTarget.setPointerCapture?.(event.pointerId)
                            }
                            event.currentTarget.scrollLeft = start.scrollLeft + distance
                        }}
                        onPointerUp={finishDrag}
                        onPointerCancel={(event) => {
                            finishDrag(event)
                            dragged.current = false
                        }}
                        onLostPointerCapture={(event) => {
                            dragStart.current = null
                            scheduleDesktopRecenter(event.currentTarget)
                        }}
                        className="mt-7 flex min-h-0 shrink-0 snap-x snap-mandatory overflow-x-auto rounded-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
                    >
                        {DESKTOP_RAIL_COPIES.flatMap((copy) =>
                            PROJECTS.map((item, itemIndex) => {
                                const renderedIndex = copy.index * PROJECTS.length + itemIndex
                                const isSelected = itemIndex === projectIndex
                                const isAccessibleCopy = copy.isAccessible
                                const cardClassName = `group relative aspect-[1672/941] min-h-0 [flex:0_0_33.333333%] snap-center cursor-pointer overflow-hidden border bg-surface ${
                                    isSelected
                                        ? `z-10 shadow-[0_0_0_3px_rgba(13,13,15,0.72)] ${ACCENT_BORDER[item.accent]}`
                                        : 'border-border'
                                } ${FOCUS_RING}`
                                const handleCardClick = () => {
                                    if (dragged.current) {
                                        dragged.current = false
                                        return
                                    }
                                    if (
                                        renderedIndex === desktopRenderedIndexRef.current &&
                                        itemIndex === projectIndexRef.current
                                    ) {
                                        setGalleryProject(item)
                                        return
                                    }
                                    if (!scrollToRenderedCard(renderedIndex)) {
                                        selectProject(itemIndex)
                                    }
                                }
                                const cardContent = (
                                    <>
                                        <img
                                            src={item.carouselImage}
                                            alt={isAccessibleCopy ? item.carouselAlt : ''}
                                            draggable="false"
                                            loading="lazy"
                                            decoding="async"
                                            className={`h-full w-full object-cover transition-[filter] motion-reduce:transition-none ${
                                                isSelected
                                                    ? 'brightness-100 saturate-100'
                                                    : 'brightness-[0.64] saturate-[0.82] blur-[0.45px] group-hover:brightness-[0.82] group-hover:saturate-[0.95] group-hover:blur-none group-focus-visible:brightness-[0.82] group-focus-visible:saturate-[0.95] group-focus-visible:blur-none'
                                            }`}
                                        />
                                        {isSelected ? (
                                            <span
                                                className={`absolute top-4 left-5 rounded-chip bg-bg/80 px-2.5 py-1 text-xs tracking-[0.12em] uppercase ${ACCENT_TEXT[item.accent]}`}
                                            >
                                                {item.tag}
                                            </span>
                                        ) : null}
                                        <span
                                            className={`absolute right-3 bottom-3 left-3 flex items-center justify-between gap-2 border-b bg-[#0d0d0f] px-2.5 py-2 text-[0.6875rem] ${ACCENT_BORDER[item.accent]}`}
                                        >
                                            <span className="text-[#f3e9d2]">{item.title}</span>
                                            <span className={ACCENT_TEXT_ON_DARK[item.accent]}>
                                                {isSelected ? 'Selected' : 'View project →'}
                                            </span>
                                        </span>
                                    </>
                                )

                                if (!isAccessibleCopy) {
                                    return (
                                        <div
                                            key={`${copy.key}-${item.title}`}
                                            data-project-card=""
                                            data-project-index={itemIndex}
                                            data-rail-copy={copy.key}
                                            aria-hidden="true"
                                            onClick={handleCardClick}
                                            className={cardClassName}
                                        >
                                            {cardContent}
                                        </div>
                                    )
                                }

                                return (
                                    <button
                                        key={`${copy.key}-${item.title}`}
                                        type="button"
                                        data-project-card=""
                                        data-project-index={itemIndex}
                                        data-rail-copy={copy.key}
                                        aria-label={
                                            isSelected
                                                ? `Open ${item.title} gallery`
                                                : `Center project: ${item.title}`
                                        }
                                        aria-current={isSelected ? 'true' : undefined}
                                        onClick={handleCardClick}
                                        className={cardClassName}
                                    >
                                        {cardContent}
                                    </button>
                                )
                            }),
                        )}
                    </div>

                    <nav
                        aria-label="Project index"
                        className="flex shrink-0 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {PROJECTS.map((item, index) => (
                            <button
                                key={item.title}
                                type="button"
                                aria-label={`Select project: ${item.title}`}
                                aria-pressed={index === projectIndex}
                                onClick={() => scrollToProject(index)}
                                className={`min-w-[180px] flex-1 cursor-pointer border-r border-border px-4 py-3 text-left text-xs last:border-r-0 ${
                                    index === projectIndex
                                        ? `bg-surface ${ACCENT_TEXT[item.accent]}`
                                        : 'text-dim hover:text-ink'
                                } ${FOCUS_RING}`}
                            >
                                <span className="mr-2 text-[0.625rem] text-muted">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                {item.title}
                            </button>
                        ))}
                    </nav>

                    <div className="shrink-0 py-5 wide:max-w-[760px]">
                    <h2 id="projects-heading" className="text-heading text-ink">
                        {project.title}
                    </h2>
                    <p className="mt-2 text-sm">
                        <span className={ACCENT_TEXT[project.accent]}>{project.tag}</span>
                        <span className="text-muted"> · </span>
                        <span className="text-dim">{project.status}</span>
                    </p>
                    <p className="mt-3 text-body-mono text-body">{project.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-3">
                        <button
                            type="button"
                            onClick={() => setGalleryProject(project)}
                            className={`cursor-pointer border-b pb-0.5 text-sm ${ACCENT_TEXT[project.accent]} ${ACCENT_BORDER[project.accent]} ${FOCUS_RING}`}
                        >
                            Open gallery →
                        </button>
                        {projectIndex === 0 ? (
                            <button
                                type="button"
                                onClick={onScrollNext}
                                className={`flex cursor-pointer items-center gap-2 text-sm text-teal ${FOCUS_RING}`}
                            >
                                Play in Arcade <ArrowIcon direction="down" />
                                <span className="sr-only">↓</span>
                            </button>
                        ) : null}
                    </div>
                    </div>

                    <div className="mt-auto flex shrink-0 items-center justify-between border-t border-border py-3 text-sm text-lavender">
                    <button
                        type="button"
                        onClick={() => selectRelative(-1)}
                        className={`flex cursor-pointer items-center gap-2 ${FOCUS_RING}`}
                    >
                        <ArrowIcon direction="left" /> Previous project
                    </button>
                    <button
                        type="button"
                        onClick={() => selectRelative(1)}
                        className={`flex cursor-pointer items-center gap-2 ${FOCUS_RING}`}
                    >
                        Next project <ArrowIcon direction="right" />
                    </button>
                    </div>
                </div>
            </div>
            {galleryProject ? (
                <ProjectGalleryDialog
                    key={galleryProject.title}
                    project={galleryProject}
                    onClose={() => setGalleryProject(null)}
                    onPlayArcade={() => {
                        setGalleryProject(null)
                        onScrollNext()
                    }}
                />
            ) : null}
        </section>
    )
}
