import { useEffect, useRef, useState } from 'react'
import type { Project, ProjectAccent } from './projects.ts'

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

interface GalleryArrowProps {
    direction: 'left' | 'right' | 'down'
}

function GalleryArrow({ direction }: GalleryArrowProps) {
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

export interface ProjectGalleryDialogProps {
    project: Project
    onClose: () => void
    onPlayArcade: () => void
}

export default function ProjectGalleryDialog({
    project,
    onClose,
    onPlayArcade,
}: ProjectGalleryDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [imageIndex, setImageIndex] = useState(0)
    const image = project.gallery[imageIndex]

    useEffect(() => {
        const dialog = dialogRef.current
        if (dialog && !dialog.open) dialog.showModal()
    }, [])

    const selectRelative = (delta: -1 | 1) => {
        setImageIndex(
            (current) => (current + delta + project.gallery.length) % project.gallery.length,
        )
    }

    const close = () => dialogRef.current?.close()

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="project-gallery-title"
            onClose={onClose}
            onClick={(event) => {
                if (event.target === event.currentTarget) close()
            }}
            className="m-auto h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none overflow-hidden border border-border bg-surface p-0 text-body backdrop:bg-bg/90 wide:h-auto wide:max-h-[86dvh] wide:w-[min(92vw,1220px)]"
        >
            <div className="flex h-full min-h-0 flex-col p-4 wide:p-8">
                <div className="mb-4 flex shrink-0 justify-end">
                    <button
                        type="button"
                        aria-label="Close gallery"
                        onClick={close}
                        className={`cursor-pointer text-sm text-dim transition-colors hover:text-ink ${FOCUS_RING}`}
                    >
                        Close <span aria-hidden="true">×</span>
                    </button>
                </div>

                <div className="grid min-h-0 flex-1 gap-6 wide:grid-cols-[minmax(0,2fr)_minmax(260px,0.9fr)] wide:gap-8">
                    <div className="flex min-h-0 flex-col wide:border-r wide:border-border wide:pr-8">
                        <div
                            className={`min-h-0 flex-1 overflow-hidden border bg-bg ${ACCENT_BORDER[project.accent]}`}
                        >
                            <img
                                src={image.image}
                                alt={image.alt}
                                className="h-full max-h-[48dvh] w-full object-contain wide:max-h-[50dvh]"
                            />
                        </div>

                        <div className="mt-3 flex shrink-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {project.gallery.map((item, index) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    aria-label={`Show ${item.label} image`}
                                    aria-pressed={index === imageIndex}
                                    onClick={() => setImageIndex(index)}
                                    className={`min-w-[112px] flex-1 cursor-pointer border p-1 text-left ${
                                        index === imageIndex
                                            ? ACCENT_BORDER[project.accent]
                                            : 'border-border'
                                    } ${FOCUS_RING}`}
                                >
                                    <img
                                        src={item.image}
                                        alt=""
                                        className="aspect-video w-full object-cover"
                                    />
                                    <span
                                        className={`mt-1.5 block text-[0.6875rem] ${
                                            index === imageIndex
                                                ? ACCENT_TEXT[project.accent]
                                                : 'text-dim'
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-3 flex shrink-0 items-center justify-between text-sm">
                            <span className="text-ink">
                                {String(imageIndex + 1).padStart(2, '0')} /{' '}
                                {String(project.gallery.length).padStart(2, '0')}
                            </span>
                            <div className="flex gap-5 text-lavender">
                                <button
                                    type="button"
                                    aria-label="Previous gallery image"
                                    onClick={() => selectRelative(-1)}
                                    className={`flex cursor-pointer items-center gap-1.5 ${FOCUS_RING}`}
                                >
                                    <GalleryArrow direction="left" />
                                    <span className="max-sm:sr-only">Previous</span>
                                </button>
                                <button
                                    type="button"
                                    aria-label="Next gallery image"
                                    onClick={() => selectRelative(1)}
                                    className={`flex cursor-pointer items-center gap-1.5 ${FOCUS_RING}`}
                                >
                                    <span className="max-sm:sr-only">Next</span>
                                    <GalleryArrow direction="right" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 overflow-y-auto wide:py-8">
                        <p className={`text-label uppercase ${ACCENT_TEXT[project.accent]}`}>
                            {image.label}
                        </p>
                        <h2 id="project-gallery-title" className="mt-3 text-heading text-ink">
                            {project.title}
                        </h2>
                        <p className="mt-5 text-body-mono text-body">{project.description}</p>
                        <div className="mt-7 flex flex-wrap gap-6">
                            {project.title === 'Arcade, compiled' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        close()
                                        onPlayArcade()
                                    }}
                                    className={`flex cursor-pointer items-center gap-2 border-b border-teal pb-0.5 text-sm text-teal ${FOCUS_RING}`}
                                >
                                    Play in Arcade <GalleryArrow direction="down" />
                                    <span className="sr-only">↓</span>
                                </button>
                            ) : null}
                            {project.sourceUrl ? (
                                <a
                                    href={project.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`text-sm text-teal ${FOCUS_RING}`}
                                >
                                    View source ↗
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </dialog>
    )
}
