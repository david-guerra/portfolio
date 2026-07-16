import { useLayoutEffect, useRef, useState } from 'react'
import SectionFrame from '../../components/SectionFrame.tsx'
import type { Theme } from '../../lib/theme.ts'
import {
    ConnectFourPreview,
    GameOfLifePreview,
    SudokuPreview,
} from './ArcadePreviews.tsx'
import ConnectFourScreen from './connect-four/ConnectFourScreen.tsx'
import GameOfLifeScreen from './game-of-life/GameOfLifeScreen.tsx'
import SudokuScreen from './sudoku/SudokuScreen.tsx'

const FOCUS_RING =
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange'

interface GameCard {
    id: 'connect-four' | 'game-of-life' | 'sudoku'
    title: string
    tagline: string
    accent: 'orange' | 'olive' | 'teal'
    Preview: typeof ConnectFourPreview
}

const GAMES: readonly GameCard[] = [
    {
        id: 'connect-four',
        title: 'Connect Four',
        tagline: 'Challenge the bot',
        accent: 'orange',
        Preview: ConnectFourPreview,
    },
    {
        id: 'game-of-life',
        title: 'Game of Life',
        tagline: 'Paint a living grid.',
        accent: 'olive',
        Preview: GameOfLifePreview,
    },
    {
        id: 'sudoku',
        title: 'Sudoku',
        tagline: 'Generate. Solve. Repeat.',
        accent: 'teal',
        Preview: SudokuPreview,
    },
]

const ACCENT_TEXT: Record<GameCard['accent'], string> = {
    orange: 'text-orange',
    olive: 'text-olive',
    teal: 'text-teal',
}

const ACCENT_BORDER: Record<GameCard['accent'], string> = {
    orange: 'border-orange',
    olive: 'border-olive',
    teal: 'border-teal',
}

function scrollDeckTo(deck: HTMLDivElement | null, index: number, behavior?: ScrollBehavior) {
    const step = Math.max(1, (deck?.clientWidth ?? 0) - 32)
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    deck?.scrollTo?.({
        left: step * index,
        behavior: behavior ?? (reducedMotion ? 'auto' : 'smooth'),
    })
}

export interface ArcadeSectionProps {
    onReturn: () => void
    theme?: Theme
    keyboardActive?: boolean
}

export default function ArcadeSection({
    onReturn,
    theme = 'dark',
    keyboardActive = true,
}: ArcadeSectionProps) {
    const [gameIndex, setGameIndex] = useState(0)
    const [screen, setScreen] = useState<'hub' | GameCard['id']>('hub')
    const mobileDeckRef = useRef<HTMLDivElement>(null)
    const hubRef = useRef<HTMLElement>(null)
    const gameSectionRef = useRef<HTMLElement>(null)
    const previousScreenRef = useRef(screen)

    const scrollMobileDeck = (index: number) => {
        scrollDeckTo(mobileDeckRef.current, index, 'auto')
    }

    useLayoutEffect(() => {
        const returnedToHub = screen === 'hub' && previousScreenRef.current !== 'hub'
        previousScreenRef.current = screen
        if (returnedToHub) {
            scrollDeckTo(mobileDeckRef.current, gameIndex, 'auto')
            hubRef.current?.focus({ preventScroll: true })
        } else if (screen !== 'hub') {
            gameSectionRef.current?.focus({ preventScroll: true })
        }
    }, [gameIndex, screen])

    const selectRelative = (delta: -1 | 1) => {
        const nextIndex = (gameIndex + delta + GAMES.length) % GAMES.length
        setGameIndex(nextIndex)
        scrollMobileDeck(nextIndex)
    }
    const current = GAMES[gameIndex] as GameCard

    if (screen === 'connect-four') {
        return (
            <section
                ref={gameSectionRef}
                id="arcade"
                aria-label="Arcade · Connect Four"
                tabIndex={-1}
                className="min-h-full px-5 py-5 outline-none wide:h-full wide:snap-start wide:snap-always wide:overflow-y-auto wide:px-14 wide:py-8"
            >
                <ConnectFourScreen
                    keyboardActive={keyboardActive}
                    onBack={() => setScreen('hub')}
                />
            </section>
        )
    }

    if (screen === 'sudoku') {
        return (
            <section
                ref={gameSectionRef}
                id="arcade"
                aria-label="Arcade · Sudoku"
                tabIndex={-1}
                className="min-h-full px-5 py-5 outline-none wide:h-full wide:snap-start wide:snap-always wide:overflow-y-auto wide:px-14 wide:py-8"
            >
                <SudokuScreen
                    keyboardActive={keyboardActive}
                    onBack={() => setScreen('hub')}
                />
            </section>
        )
    }

    if (screen === 'game-of-life') {
        return (
            <section
                ref={gameSectionRef}
                id="arcade"
                aria-label="Arcade · Game of Life"
                tabIndex={-1}
                className="min-h-full px-5 py-5 outline-none wide:h-full wide:snap-start wide:snap-always wide:overflow-y-auto wide:px-14 wide:py-8"
            >
                <GameOfLifeScreen
                    theme={theme}
                    keyboardActive={keyboardActive}
                    onBack={() => setScreen('hub')}
                />
            </section>
        )
    }

    return (
        <section
            ref={hubRef}
            id="arcade"
            aria-labelledby="arcade-heading"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.preventDefault()
                    onReturn()
                    return
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault()
                    selectRelative(event.key === 'ArrowLeft' ? -1 : 1)
                    event.currentTarget.focus({ preventScroll: true })
                    return
                }
                if (event.key === 'Enter' && event.target === event.currentTarget) {
                    event.preventDefault()
                    setScreen(current.id)
                }
            }}
            className="min-h-full px-5 py-8 outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange wide:h-full wide:snap-start wide:snap-always wide:overflow-y-auto wide:px-14 wide:py-10"
        >
            <SectionFrame variant="wide" className="flex min-h-full flex-col wide:h-full">
                <div>
                    <p id="arcade-heading" className="text-label text-muted uppercase">
                        ARCADE
                    </p>
                    <p className="mt-1 text-base text-ink">
                        {String(gameIndex + 1).padStart(2, '0')} /{' '}
                        {String(GAMES.length).padStart(2, '0')}
                    </p>
                    <p className="mt-1 text-meta text-muted">
                        <span className="wide:hidden">swipe to choose a game</span>
                        <span className="hidden wide:inline">choose a game</span>
                    </p>
                    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                        {String(gameIndex + 1).padStart(2, '0')} /{' '}
                        {String(GAMES.length).padStart(2, '0')} · {current.title} selected
                    </p>
                </div>

                <div className="mt-5 flex flex-1 items-center wide:mt-0">
                    <div
                        ref={mobileDeckRef}
                        data-testid="arcade-mobile-deck"
                        onScroll={(event) => {
                            const step = Math.max(1, event.currentTarget.clientWidth - 32)
                            const index = Math.max(
                                0,
                                Math.min(GAMES.length - 1, Math.round(event.currentTarget.scrollLeft / step)),
                            )
                            setGameIndex(index)
                        }}
                        className="-mx-5 flex w-[calc(100%+2.5rem)] snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] wide:mx-0 wide:grid wide:w-full wide:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1fr)] wide:items-center wide:gap-7 wide:overflow-visible wide:px-0 wide:pb-0 [&::-webkit-scrollbar]:hidden"
                    >
                        {GAMES.map((game, index) => {
                            const selected = game.id === current.id
                            const Preview = game.Preview
                            const relativePosition = (index - gameIndex + GAMES.length) % GAMES.length
                            const desktopOrder = relativePosition === 0
                                ? 'wide:order-2'
                                : relativePosition === 1
                                  ? 'wide:order-3'
                                  : 'wide:order-1'
                            return (
                                <article
                                    key={game.id}
                                    data-arcade-card={game.id}
                                    className={`flex-none basis-[calc(100%-2.75rem)] snap-center ${desktopOrder} wide:basis-auto ${
                                        selected ? 'relative z-10' : 'opacity-70'
                                    }`}
                                >
                                    <div
                                        className={`overflow-hidden border bg-bg ${
                                            selected
                                                ? `${ACCENT_BORDER[game.accent]} p-4`
                                                : 'border-border'
                                        }`}
                                    >
                                        <Preview
                                            className={`block aspect-[16/10] w-full ${
                                                selected ? 'wide:aspect-[7/6]' : 'wide:aspect-[4/3]'
                                            }`}
                                        />
                                    </div>
                                    <h2
                                        className={`mt-4 text-title ${
                                            selected ? 'text-ink' : ACCENT_TEXT[game.accent]
                                        }`}
                                    >
                                        {game.title}
                                    </h2>
                                    <p className="mt-1 text-body-mono text-dim">{game.tagline}</p>
                                    {selected ? (
                                        <button
                                            type="button"
                                            aria-label={`Play ${game.title}`}
                                            onClick={() => setScreen(game.id)}
                                            className={`mt-3 inline-flex min-h-11 cursor-pointer items-center border-b ${ACCENT_TEXT[game.accent]} ${ACCENT_BORDER[game.accent]} ${FOCUS_RING}`}
                                        >
                                            Play →
                                        </button>
                                    ) : null}
                                </article>
                            )
                        })}
                    </div>
                </div>

                <nav aria-label="Arcade pages" className="mt-1 flex justify-center gap-2 wide:hidden">
                    {GAMES.map((game, index) => (
                        <button
                            key={game.id}
                            type="button"
                            aria-label={`Select ${game.title}`}
                            aria-current={index === gameIndex ? 'true' : undefined}
                            onClick={() => {
                                setGameIndex(index)
                                scrollMobileDeck(index)
                            }}
                            className={`flex h-11 w-11 cursor-pointer items-center justify-center ${FOCUS_RING}`}
                        >
                            <span
                                aria-hidden="true"
                                className={`h-1.5 transition-[width,background-color] ${
                                    index === gameIndex ? 'w-4 bg-orange' : 'w-1.5 bg-border'
                                }`}
                            />
                        </button>
                    ))}
                </nav>

                <div className="mt-5 flex items-center justify-between">
                    <button
                        type="button"
                        aria-label="Previous game"
                        onClick={() => selectRelative(-1)}
                        className={`min-h-11 cursor-pointer text-lavender ${FOCUS_RING}`}
                    >
                        ← Previous
                    </button>
                    <button
                        type="button"
                        aria-label="Next game"
                        onClick={() => selectRelative(1)}
                        className={`min-h-11 cursor-pointer text-teal ${FOCUS_RING}`}
                    >
                        Next →
                    </button>
                </div>

                <div className="mt-8 hidden border-t border-border pt-5 text-sm text-body wide:flex wide:gap-8">
                    <span><span className="text-lavender">[←→]</span> BROWSE</span>
                    <span><span className="text-teal">[ENTER]</span> PLAY</span>
                    <span><span className="text-olive">[ESC]</span> RETURN</span>
                </div>
            </SectionFrame>
        </section>
    )
}
