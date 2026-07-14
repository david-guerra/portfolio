export type ProjectAccent = 'teal' | 'lavender' | 'orange'

export interface GalleryItem {
    label: string
    image: string
    alt: string
}

export interface Project {
    title: string
    tag: string
    status: string
    description: string
    accent: ProjectAccent
    carouselImage: string
    carouselAlt: string
    gallery: readonly GalleryItem[]
    sourceUrl?: string
}

export const PROJECTS: readonly Project[] = [
    {
        title: 'Arcade, compiled',
        tag: 'C · WebAssembly',
        status: 'Shipped',
        description:
            'I wanted to see how much I could get the browser to handle on its own. Sudoku, Connect Four, and Game of Life are written in C and compiled to WebAssembly, with all of the game logic running on your machine.',
        accent: 'teal',
        carouselImage: '/project-images/browser-arcade-carousel.png',
        carouselAlt: 'Browser Arcade preview with its three C and WebAssembly games',
        gallery: [
            {
                label: 'Arcade hub',
                image: '/project-images/arcade-gallery-01-hub.png',
                alt: 'Arcade hub showing Connect Four, Sudoku, and Game of Life',
            },
            {
                label: 'Connect Four',
                image: '/project-images/arcade-gallery-02-connect-four.png',
                alt: 'Connect Four game in progress against the browser bot',
            },
            {
                label: 'Sudoku',
                image: '/project-images/arcade-gallery-03-sudoku.png',
                alt: 'Sudoku game in progress with its number controls',
            },
            {
                label: 'Game of Life',
                image: '/project-images/arcade-gallery-04-game-of-life.png',
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
        carouselImage: '/project-images/applied-ai-carousel.png',
        carouselAlt: 'CleanVoice call-to-booking workflow design reference',
        gallery: [
            {
                label: 'Overview',
                image: '/project-images/applied-ai-carousel.png',
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
        carouselImage: '/project-images/compiler-carousel.png',
        carouselAlt: 'Fest source text beside its lexer output and language design notes',
        gallery: [
            {
                label: 'Lexer & specification',
                image: '/project-images/compiler-carousel.png',
                alt: 'Fest source text beside its lexer output and selected specification rules',
            },
        ],
    },
]
