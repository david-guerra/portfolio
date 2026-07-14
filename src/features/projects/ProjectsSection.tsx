import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import ProjectGalleryDialog from './ProjectGalleryDialog.tsx'
import { PROJECTS, type Project, type ProjectAccent } from './projects.ts'

const FOCUS_RING =
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange'

const ACCENT_TEXT: Record<ProjectAccent, string> = {
    teal: 'text-teal',
    lavender: 'text-lavender',
    orange: 'text-orange',
}

const ACCENT_BORDER: Record<ProjectAccent, string> = {
    teal: 'border-teal',
    lavender: 'border-lavender',
    orange: 'border-orange',
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
    const dragStartX = useRef<number | null>(null)
    const dragged = useRef(false)
    const mobileDeckRef = useRef<HTMLDivElement>(null)
    const project = PROJECTS[projectIndex]
    const previous = PROJECTS[(projectIndex - 1 + PROJECTS.length) % PROJECTS.length]
    const next = PROJECTS[(projectIndex + 1) % PROJECTS.length]

    const selectRelative = (delta: -1 | 1) => {
        setProjectIndex((current) => (current + delta + PROJECTS.length) % PROJECTS.length)
    }

    const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
        const start = dragStartX.current
        dragStartX.current = null
        if (start === null) return

        const distance = start - event.clientX
        if (Math.abs(distance) < 48) return
        dragged.current = true
        selectRelative(distance > 0 ? 1 : -1)
    }

    return (
        <section
            id="projects"
            aria-labelledby="projects-heading"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === 'ArrowLeft') selectRelative(-1)
                if (event.key === 'ArrowRight') selectRelative(1)
            }}
            className="min-h-full px-5 py-8 outline-none wide:h-full wide:snap-start wide:snap-always wide:overflow-y-auto wide:px-14 wide:py-10"
        >
            <div className="mx-auto flex min-h-full w-full max-w-[1474px] flex-col">
                <div className="flex flex-col justify-between gap-4 wide:flex-row wide:items-start">
                    <div>
                        <p className="text-label text-muted uppercase">PROJECTS</p>
                        <p className="mt-1 text-base text-ink">
                            {String(projectIndex + 1).padStart(2, '0')} / 03
                        </p>
                        <p className="mt-1 text-meta text-muted">
                            <span className="wide:hidden">swipe to browse</span>
                            <span className="hidden wide:inline">drag or use arrows</span>
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
                        setProjectIndex(index)
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
                                setProjectIndex(index)
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
                    <div className="mt-7 flex min-h-[260px] flex-1 gap-0.5">
                    <button
                        type="button"
                        aria-label={`Show previous project: ${previous.title}`}
                        onClick={() => selectRelative(-1)}
                        className={`group relative hidden w-[140px] shrink-0 cursor-pointer overflow-hidden rounded-l-card wide:block ${FOCUS_RING}`}
                    >
                        <img
                            src={previous.carouselImage}
                            alt=""
                            className="h-full w-full object-cover object-right brightness-[0.45] saturate-[0.7] transition-[filter] group-hover:brightness-[0.6]"
                        />
                        <span className="absolute inset-0 bg-linear-to-l from-bg/10 to-bg/90" />
                    </button>

                    <button
                        type="button"
                        aria-label={`Open ${project.title} gallery`}
                        onPointerDown={(event) => {
                            dragged.current = false
                            dragStartX.current = event.clientX
                        }}
                        onPointerUp={finishDrag}
                        onPointerCancel={() => {
                            dragStartX.current = null
                        }}
                        onClick={() => {
                            if (!dragged.current) setGalleryProject(project)
                            dragged.current = false
                        }}
                        className={`group relative min-w-0 flex-1 cursor-grab overflow-hidden border-y bg-surface active:cursor-grabbing ${ACCENT_BORDER[project.accent]} ${FOCUS_RING}`}
                    >
                        <img
                            src={project.carouselImage}
                            alt={project.carouselAlt}
                            draggable="false"
                            className="h-full w-full object-cover"
                        />
                        <span
                            className={`absolute top-4 left-5 rounded-chip bg-bg/80 px-2.5 py-1 text-xs tracking-[0.12em] uppercase ${ACCENT_TEXT[project.accent]}`}
                        >
                            {project.tag}
                        </span>
                        <span className="absolute right-5 bottom-4 rounded-chip bg-bg/80 px-2.5 py-1 text-xs text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                            click to preview
                        </span>
                    </button>

                    <button
                        type="button"
                        aria-label={`Show next project: ${next.title}`}
                        onClick={() => selectRelative(1)}
                        className={`group relative hidden w-[140px] shrink-0 cursor-pointer overflow-hidden rounded-r-card wide:block ${FOCUS_RING}`}
                    >
                        <img
                            src={next.carouselImage}
                            alt=""
                            className="h-full w-full object-cover object-left brightness-[0.45] saturate-[0.7] transition-[filter] group-hover:brightness-[0.6]"
                        />
                        <span className="absolute inset-0 bg-linear-to-r from-bg/10 to-bg/90" />
                    </button>
                    </div>

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

                    <div className="flex shrink-0 items-center justify-between border-t border-border py-3 text-sm text-lavender">
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
