import type { Theme } from '../../lib/theme.ts'

export type ProjectAccent = 'teal' | 'lavender' | 'orange'

export type ProjectImage = string | Readonly<Record<Theme, string>>

export interface GalleryItem {
    label: string
    image: ProjectImage
    thumbnailImage: ProjectImage
    alt: string
    caption?: string
    video?: {
        src: string
        captions: string
    }
}

export interface Project {
    title: string
    tag: string
    status: string
    description: string
    action?: 'play-arcade'
    accent: ProjectAccent
    carouselImage: ProjectImage
    carouselAlt: string
    gallery: readonly GalleryItem[]
    sourceUrl?: string
}

const projectImage = (filename: string) => `${import.meta.env.BASE_URL}project-images/${filename}`
const projectVideo = (filename: string) => `${import.meta.env.BASE_URL}project-videos/${filename}`

export function projectImageForTheme(image: ProjectImage, theme: Theme) {
    return typeof image === 'string' ? image : image[theme]
}

export const PROJECTS: readonly Project[] = [
    {
        title: 'Arcade, compiled',
        tag: 'C · WebAssembly',
        status: 'Shipped',
        description:
            'I wanted to see how much I could get the browser to handle on its own. Sudoku, Connect Four, and Game of Life are written in C and compiled to WebAssembly, with all of the game logic running on your machine.',
        action: 'play-arcade',
        accent: 'teal',
        carouselImage: {
            dark: projectImage('browser-arcade-carousel-dark.png'),
            light: projectImage('browser-arcade-carousel-light.png'),
        },
        carouselAlt: 'Browser Arcade preview with its three C and WebAssembly games',
        gallery: [
            {
                label: 'Arcade hub',
                image: {
                    dark: projectImage('arcade-gallery-01-hub-dark.png'),
                    light: projectImage('arcade-gallery-01-hub-light.png'),
                },
                thumbnailImage: {
                    dark: projectImage('arcade-gallery-01-hub-dark-thumbnail.png'),
                    light: projectImage('arcade-gallery-01-hub-light-thumbnail.png'),
                },
                alt: 'Arcade hub showing Connect Four, Sudoku, and Game of Life',
            },
            {
                label: 'Connect Four',
                image: {
                    dark: projectImage('arcade-gallery-02-connect-four-dark.png'),
                    light: projectImage('arcade-gallery-02-connect-four-light.png'),
                },
                thumbnailImage: {
                    dark: projectImage('arcade-gallery-02-connect-four-dark-thumbnail.png'),
                    light: projectImage('arcade-gallery-02-connect-four-light-thumbnail.png'),
                },
                alt: 'Connect Four game in progress against the browser bot',
            },
            {
                label: 'Sudoku',
                image: {
                    dark: projectImage('arcade-gallery-03-sudoku-dark.png'),
                    light: projectImage('arcade-gallery-03-sudoku-light.png'),
                },
                thumbnailImage: {
                    dark: projectImage('arcade-gallery-03-sudoku-dark-thumbnail.png'),
                    light: projectImage('arcade-gallery-03-sudoku-light-thumbnail.png'),
                },
                alt: 'Sudoku game in progress with its number controls',
            },
            {
                label: 'Game of Life',
                image: {
                    dark: projectImage('arcade-gallery-04-game-of-life-dark.png'),
                    light: projectImage('arcade-gallery-04-game-of-life-light.png'),
                },
                thumbnailImage: {
                    dark: projectImage('arcade-gallery-04-game-of-life-dark-thumbnail.png'),
                    light: projectImage('arcade-gallery-04-game-of-life-light-thumbnail.png'),
                },
                alt: 'Game of Life grid with a recognizable living pattern',
            },
        ],
    },
    {
        title: 'Yoshida',
        sourceUrl: 'https://github.com/david-guerra/Yoshida',
        tag: 'Voice AI · LiveKit',
        status: 'Hackathon prototype',
        description:
            'Our team built Yoshida at a LiveKit hackathon to help independent cleaners communicate with German-speaking clients. The prototype turns a German-language call into a tentative booking and shows it in a realtime dashboard with multilingual summaries. I built the voice agent and later helped integrate and refine the frontend and backend.',
        accent: 'lavender',
        carouselImage: projectImage('yoshida-cleaner-requests.jpg'),
        carouselAlt: 'Yoshida cleaner dashboard showing a tentative request awaiting review',
        gallery: [
            {
                label: 'Demo video',
                image: projectImage('yoshida-demo-poster.jpg'),
                thumbnailImage: projectImage('yoshida-demo-poster-thumbnail.jpg'),
                alt: 'Illustrated Yoshida cleaner dashboard with a tentative request',
                caption:
                    'A 58-second silent illustrative replay follows a fictional booking through cleaner review and confirmation. The final shot is an actual app capture; the replay is not footage of a live call.',
                video: {
                    src: projectVideo('yoshida-silent-demo.mp4'),
                    captions: projectVideo('yoshida-silent-demo.vtt'),
                },
            },
            {
                label: 'Caller receipt',
                image: projectImage('yoshida-caller-receipt.jpg'),
                thumbnailImage: projectImage('yoshida-caller-receipt-thumbnail.jpg'),
                alt: 'German browser call simulator showing a saved tentative receipt after hang-up',
                caption:
                    'Reconstructed from a saved verified call in a disposable local copy. The request remains tentative until the cleaner confirms it.',
            },
            {
                label: 'Needs review',
                image: projectImage('yoshida-cleaner-requests.jpg'),
                thumbnailImage: projectImage('yoshida-cleaner-requests-thumbnail.jpg'),
                alt: 'Yoshida cleaner dashboard showing a fictional booking in Needs review',
                caption:
                    'This persisted example request was staged through the manual form, rather than created by a voice call.',
            },
            {
                label: 'Request details',
                image: projectImage('yoshida-cleaner-review.jpg'),
                thumbnailImage: projectImage('yoshida-cleaner-review-thumbnail.jpg'),
                alt: 'Cleaner review drawer with appointment details, address, service, and unknown price',
                caption:
                    'The cleaner can review the appointment and unknown price before deciding. This is the staged example request.',
            },
            {
                label: 'Decision controls',
                image: projectImage('yoshida-cleaner-decision-controls.jpg'),
                thumbnailImage: projectImage('yoshida-cleaner-decision-controls-thumbnail.jpg'),
                alt: 'Lower part of the cleaner review drawer showing Decline and Confirm controls',
                caption:
                    'The same staged request, scrolled to its decision controls. No decision was taken on this record.',
            },
            {
                label: 'Confirmed',
                image: projectImage('yoshida-cleaner-confirmed.jpg'),
                thumbnailImage: projectImage('yoshida-cleaner-confirmed-thumbnail.jpg'),
                alt: 'Confirmed appointment from a spoken call in the cleaner dashboard Upcoming tab',
                caption:
                    'A persisted confirmed appointment from a verified fictional German spoken call.',
            },
            {
                label: 'Declined',
                image: projectImage('yoshida-cleaner-declined.jpg'),
                thumbnailImage: projectImage('yoshida-cleaner-declined-thumbnail.jpg'),
                alt: 'Declined request with a budget warning in the cleaner dashboard History tab',
                caption:
                    'A persisted declined request from another verified fictional German spoken call. Its below-minimum budget was a warning, not an automatic rejection.',
            },
            {
                label: 'Mobile view',
                image: projectImage('yoshida-cleaner-mobile.jpg'),
                thumbnailImage: projectImage('yoshida-cleaner-mobile-thumbnail.jpg'),
                alt: 'Yoshida cleaner Requests inbox in a 375-pixel-wide mobile viewport',
                caption:
                    'The staged example request in the running cleaner dashboard at a 375-pixel mobile width.',
            },
        ],
    },
    {
        title: 'Fest',
        tag: 'Language design · C++',
        status: 'Lexer complete',
        description:
            'Rust and I didn’t quite click, so I did the sensible thing and started designing a language in C++. Fest currently has a full specification and a working lexer; the goal is a statically typed language targeting WebAssembly.',
        accent: 'orange',
        carouselImage: projectImage('compiler-carousel.png'),
        carouselAlt: 'Fest source text beside its lexer output and language design notes',
        gallery: [
            {
                label: 'Lexer & specification',
                image: projectImage('compiler-carousel.png'),
                thumbnailImage: projectImage('compiler-carousel-thumbnail.png'),
                alt: 'Fest source text beside its lexer output and selected specification rules',
            },
        ],
    },
]
