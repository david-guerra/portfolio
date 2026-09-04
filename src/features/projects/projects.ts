import type { Theme } from '../../lib/theme.ts'

export type ProjectAccent = 'teal' | 'lavender' | 'orange'

export type ProjectImage = string | Readonly<Record<Theme, string>>

export interface GalleryItem {
    label: string
    image: ProjectImage
    thumbnailImage: ProjectImage
    alt: string
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
        title: 'CleanVoice',
        tag: 'Voice AI · LiveKit',
        status: 'Hackathon prototype',
        description:
            'The hackathon brief was to build an AI voice app with LiveKit. Our team turned it into CleanVoice, a business partner for independent cleaners facing a language barrier with German-speaking clients. The working demo turned a German-language call into a tentative booking shaped by cleaner preferences, then surfaced it in a realtime dashboard with multilingual summaries. I worked primarily on the agent and its data layer.',
        accent: 'lavender',
        carouselImage: projectImage('applied-ai-carousel.png'),
        carouselAlt: 'CleanVoice call-to-booking workflow design reference',
        gallery: [
            {
                label: 'Overview',
                image: projectImage('applied-ai-carousel.png'),
                thumbnailImage: projectImage('applied-ai-carousel-thumbnail.png'),
                alt: 'CleanVoice call-to-booking workflow design reference',
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
