import type { Theme } from '../../lib/theme.ts'

export type ProjectAccent = 'teal' | 'lavender' | 'orange'

export type ProjectImage = string | Readonly<Record<Theme, string>>

export interface GalleryItem {
    label: string
    image: ProjectImage
    thumbnailImage: ProjectImage
    alt: string
    caption?: string
    orientation?: 'portrait'
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
    story?: readonly {
        title: string
        text: string
    }[]
}

const projectImage = (filename: string) => `${import.meta.env.BASE_URL}project-images/${filename}`
const projectVideo = (filename: string) => `${import.meta.env.BASE_URL}project-videos/${filename}`

export function projectImageForTheme(image: ProjectImage, theme: Theme) {
    return typeof image === 'string' ? image : image[theme]
}

export const PROJECTS: readonly Project[] = [
    {
        title: 'Couple HQ',
        tag: 'Next.js · Supabase',
        status: 'Private household app',
        description:
            'Before my partner and I moved in together, I built us a shared headquarters. Couple HQ is our private household app for cleaning, groceries, meals, shared expenses, and plans. Claude connects through MCP for research and bulk updates. A Telegram bot makes cleaning quick to log and sends a gentle daily nudge.',
        accent: 'orange',
        carouselImage: projectImage('couple-hq-carousel.jpg'),
        carouselAlt: 'Couple HQ dashboard with shared tasks, shopping, money, and plans using fictional demo data',
        gallery: [
            {
                label: 'A shared headquarters',
                image: projectImage('couple-hq-home-desktop.jpg'),
                thumbnailImage: projectImage('couple-hq-home-desktop-thumbnail.jpg'),
                alt: 'Couple HQ desktop dashboard with tasks, groceries, a shared balance, and handover progress',
                caption:
                    'The real interface with fictional demo data, captured in a local preview. A shared overview brings today’s work, shopping, money, and plans together.',
            },
            {
                label: 'Home on mobile',
                image: projectImage('couple-hq-home-mobile.jpg'),
                thumbnailImage: projectImage('couple-hq-home-mobile-thumbnail.jpg'),
                alt: 'Couple HQ mobile Home with a Today preview, module cards, and bottom navigation',
                orientation: 'portrait',
                caption:
                    'Fictional demo data. The mobile layout puts Today and household modules within reach, with persistent bottom navigation.',
            },
            {
                label: 'Moving in',
                image: projectImage('couple-hq-handover.jpg'),
                thumbnailImage: projectImage('couple-hq-handover-thumbnail.jpg'),
                alt: 'Apartment handover overview with progress and sections for photos, inventory, damage, meters, and deposit',
                caption:
                    'Fictional demo data. The first priority was the apartment handover: photos, meter readings, inventory, damage records, and the deposit in one place.',
            },
            {
                label: 'Cleaning routines',
                image: projectImage('couple-hq-cleaning.jpg'),
                thumbnailImage: projectImage('couple-hq-cleaning-thumbnail.jpg'),
                alt: 'Room-based cleaning routines with dirtiness meters, responsibility labels, and completion buttons',
                caption:
                    'Fictional demo data. Routines belong to rooms, and their dirtiness meters advance from actual completions. Recording a clean starts the next cycle.',
            },
            {
                label: 'The cleaning playbook',
                image: projectImage('couple-hq-playbook.jpg'),
                thumbnailImage: projectImage('couple-hq-playbook-thumbnail.jpg'),
                alt: 'Cleaning Playbook with routine guides, resources, standards, research sources, and translation coverage',
                caption:
                    'Fictional demo data. Guides, products, standards, and research sources turn a cleaning schedule into household knowledge, with German, English, and Russian translations.',
            },
            {
                label: 'Choosing together',
                image: projectImage('couple-hq-wishlist.jpg'),
                thumbnailImage: projectImage('couple-hq-wishlist-thumbnail.jpg'),
                alt: 'Wishlist sofa comparison with both partners’ priorities and two priced product options',
                caption:
                    'Fictional demo data. A wish can hold several product options, both people’s priorities, and a chosen candidate before a purchase.',
            },
            {
                label: 'Meals to groceries',
                image: projectImage('couple-hq-meals-shopping.jpg'),
                thumbnailImage: projectImage('couple-hq-meals-shopping-thumbnail.jpg'),
                alt: 'Meal ingredients selected for transfer to the shared shopping list with quantities',
                caption:
                    'Fictional demo data. Selected meal ingredients can become groceries without typing the same list again.',
            },
            {
                label: 'Shared expenses',
                image: projectImage('couple-hq-money.jpg'),
                thumbnailImage: projectImage('couple-hq-money-thumbnail.jpg'),
                alt: 'Household money overview with a demo balance, recurring bills, shared expenses, and monthly totals',
                caption:
                    'Fictional demo data. Shared spending and recurring bills feed a running balance, so “who owes whom?” has a clear answer.',
            },
        ],
        story: [
            {
                title: 'Before the move',
                text: 'We were about to move in together, and the admin was already scattered across chats, spreadsheets, and calendars. I wrote a spec with Claude before writing code: handover records, tasks, expenses, notes, calendar sync, and a cooperative game layer. XP, levels, and quests sounded fun, but there would only ever be a shared score. The move-in date set the deadline. Handover came first; gamification was the first thing to cut.',
            },
            {
                title: 'The first real job',
                text: 'Photos of every corner, meter readings, an inventory, a damage log, and the deposit. The handover module was the least glamorous part of the plan, but it gave us a record to turn to if anything was disputed later. I built on Next.js, Supabase hosted in Frankfurt, and Vercel, with multiple languages from the start.',
            },
            {
                title: 'A cleaning plan that could grow',
                text: 'Once we settled in, cleaning became the center of the app. Each room got routines with a rhythm and a slowly filling dirtiness meter. Connecting Claude through MCP meant I could ask how often to clean the fridge and have the researched routines added directly. The plan grew quickly. Start anchors spread routines across the week, and editing or deleting them gained an approval step in the app.',
            },
            {
                title: 'From chores to knowledge',
                text: 'A routine name wasn’t enough. Each routine gained a playbook with guide notes, recommended products, cleaning standards, and research sources. Guidance can be translated into German, English, and Russian, while routine names keep one canonical language so we can always find them.',
            },
            {
                title: 'Room for the rest of life',
                text: 'The HQ grew a wishlist with folders and competing product options, a shopping list, a meal catalog, and shared expenses with a running balance. Date ideas track how often we’ve done them; bucket lists hold bigger plans. Upcoming bills, anniversaries, and milestones sit alongside the everyday work.',
            },
            {
                title: 'The reality check',
                text: 'The app was full of data, but it wasn’t changing behavior. Daily habits crowded out everything else. We cleaned, then logged it later from memory, and my partner barely opened the app. It answered “what’s dirty?” when we needed “what should I do right now?” Some daily routines were paused or moved to weekly. I added a Telegram bot for quick cleaning logs and one gentle daily suggestion, with Done, Tomorrow, and Something else. The /log command came first, because recording the work was the real bottleneck.',
            },
            {
                title: 'Three ways into the same home',
                text: 'The app is for browsing, planning, and approving changes. Claude is for research and bulk updates, like adding routines or filling a kitchen wishlist. Telegram handles quick cleaning logs and daily nudges, using the same core logic. Some things stay outside the HQ: surprise plans belong in private notes, because a shared app means a shared view.',
            },
            {
                title: 'Still being reshaped',
                text: 'It started as a spec for a gamified dashboard and became a practical tool shaped by how two people actually live. Every feature exists because something went wrong without it.',
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
                orientation: 'portrait',
                caption:
                    'The staged example request in the running cleaner dashboard at a 375-pixel mobile width.',
            },
        ],
    },
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
]
