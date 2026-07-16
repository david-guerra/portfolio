import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '../src/App.tsx'
import ArcadeSection from '../src/features/arcade/ArcadeSection.tsx'

vi.mock('../src/components/Hero.tsx', () => ({
    default: () => <div data-testid="hero-stub" />,
}))

const bot = vi.hoisted(() => ({
    makeMove: vi.fn(),
    computeBotMove: vi.fn(),
    resetGame: vi.fn(),
    setDifficulty: vi.fn(),
    retry: vi.fn(),
}))

const sudoku = vi.hoisted(() => {
    const board = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ]
    return {
        board,
        initialCells: board.map((row) => row.map(Boolean)),
        setCell: vi.fn(),
        resetGame: vi.fn(),
        clearBoard: vi.fn(),
        solveBoard: vi.fn(),
    }
})

const life = vi.hoisted(() => ({
    isReady: true,
    error: null as string | null,
    board: Array.from({ length: 25 }, () => Array<number>(30).fill(0)),
    setCell: vi.fn(),
    step: vi.fn(),
    clear: vi.fn(),
    randomize: vi.fn(),
    retry: vi.fn(),
}))

vi.mock('../src/hooks/useGameBot.ts', () => ({
    useGameBot: () => ({
        isReady: true,
        board: Array.from({ length: 6 }, () => Array<number>(7).fill(0)),
        gameStatus: 'playing' as const,
        winner: 0,
        lastBotMove: null,
        error: null,
        ...bot,
    }),
}))

vi.mock('../src/hooks/useSudoku.ts', () => ({
    useSudoku: () => ({
        isReady: true,
        isSolved: false,
        error: null,
        ...sudoku,
    }),
}))

vi.mock('../src/hooks/useGameOfLife.ts', () => ({
    useGameOfLife: () => life,
}))

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

beforeEach(() => {
    vi.clearAllMocks()
    life.isReady = true
    life.error = null
    life.board = Array.from({ length: 25 }, () => Array<number>(30).fill(0))
})

test('renders the approved three-game Arcade hub in the final pane', () => {
    const { container } = render(<App />)
    const section = container.querySelector('#arcade')
    expect(section).not.toBeNull()

    const arcade = within(section as HTMLElement)
    expect(arcade.getByText('01 / 03')).toBeTruthy()
    expect(arcade.getByText('choose a game')).toBeTruthy()
    expect(arcade.getByRole('heading', { level: 2, name: 'Connect Four' })).toBeTruthy()
    expect(arcade.getByRole('img', { name: 'Sudoku preview' })).toBeTruthy()
    expect(arcade.getByRole('img', { name: 'Connect Four preview' })).toBeTruthy()
    expect(arcade.getByRole('img', { name: 'Game of Life preview' })).toBeTruthy()
    expect(arcade.getByText('Generate. Solve. Repeat.')).toBeTruthy()
    expect(arcade.getByText('Challenge the bot')).toBeTruthy()
    expect(arcade.getByText('Paint a living grid.')).toBeTruthy()
    expect(arcade.getByRole('button', { name: 'Play Connect Four' })).toBeTruthy()
    expect(arcade.getByRole('button', { name: 'Previous game' })).toBeTruthy()
    expect(arcade.getByRole('button', { name: 'Next game' })).toBeTruthy()
    expect(arcade.queryByText('Under construction.')).toBeNull()
})

test('uses a stable edge-peek swipe deck and live pager below the wide breakpoint', () => {
    const { getByRole, getByTestId, getByText } = render(
        <ArcadeSection onReturn={() => undefined} />,
    )
    const deck = getByTestId('arcade-mobile-deck')
    const cards = deck.querySelectorAll('[data-arcade-card]')

    expect(deck.classList).toContain('snap-x')
    expect(deck.classList).toContain('snap-mandatory')
    expect(deck.classList).toContain('overflow-x-auto')
    expect(deck.classList).toContain('wide:grid')
    expect(cards).toHaveLength(3)
    for (const card of cards) {
        expect(card.classList).toContain('basis-[calc(100%-2.75rem)]')
        expect(card.classList).toContain('snap-center')
    }
    const pager = getByRole('navigation', { name: 'Arcade pages' })
    expect(pager.children).toHaveLength(3)
    for (const button of pager.children) {
        expect(button.classList).toContain('h-11')
        expect(button.classList).toContain('w-11')
    }
    for (const name of ['Play Connect Four', 'Previous game', 'Next game']) {
        expect(getByRole('button', { name }).classList).toContain('min-h-11')
    }

    Object.defineProperties(deck, {
        clientWidth: { configurable: true, value: 393 },
        scrollLeft: { configurable: true, writable: true, value: 361 },
    })
    fireEvent.scroll(deck)
    expect(getByText('02 / 03')).toBeTruthy()
    expect(getByRole('button', { name: 'Play Game of Life' })).toBeTruthy()
})

test('restores the selected mobile card when returning from a game', () => {
    const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')
    const scrollTo = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
        configurable: true,
        value: scrollTo,
    })

    try {
        const { getByRole, getByText } = render(
            <ArcadeSection onReturn={() => undefined} />,
        )

        fireEvent.click(getByRole('button', { name: 'Next game' }))
        fireEvent.click(getByRole('button', { name: 'Play Game of Life' }))
        scrollTo.mockClear()
        fireEvent.click(getByRole('button', { name: 'Back to Arcade' }))

        expect(getByText('02 / 03')).toBeTruthy()
        expect(scrollTo).toHaveBeenCalledWith(
            expect.objectContaining({ behavior: 'auto', left: expect.any(Number) }),
        )
    } finally {
        if (originalScrollTo) {
            Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
        } else {
            Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
        }
    }
})

test('browses the hub in both directions with controls and arrow keys', () => {
    const { container, getByRole, getByText } = render(
        <ArcadeSection onReturn={() => undefined} />,
    )
    const section = container.querySelector('#arcade') as HTMLElement

    fireEvent.click(getByRole('button', { name: 'Next game' }))
    expect(getByText('02 / 03')).toBeTruthy()
    expect(getByRole('button', { name: 'Play Game of Life' })).toBeTruthy()

    fireEvent.keyDown(section, { key: 'ArrowRight' })
    expect(getByText('03 / 03')).toBeTruthy()
    expect(getByRole('button', { name: 'Play Sudoku' })).toBeTruthy()

    fireEvent.click(getByRole('button', { name: 'Next game' }))
    expect(getByText('01 / 03')).toBeTruthy()

    fireEvent.click(getByRole('button', { name: 'Previous game' }))
    expect(getByText('03 / 03')).toBeTruthy()

    fireEvent.keyDown(section, { key: 'ArrowLeft' })
    expect(getByText('02 / 03')).toBeTruthy()
})

test('opens Connect Four directly from the hub and returns without a difficulty gate', () => {
    const { getByLabelText, getByRole, getByText, queryByText } = render(
        <ArcadeSection onReturn={() => undefined} />,
    )

    fireEvent.click(getByRole('button', { name: 'Play Connect Four' }))

    expect(queryByText('choose a game')).toBeNull()
    expect(getByRole('heading', { level: 2, name: 'CONNECT FOUR' })).toBeTruthy()
    expect(getByText('You vs Bot')).toBeTruthy()
    expect(getByLabelText('Difficulty')).toHaveProperty('value', '12')
    expect(getByRole('grid', { name: 'Connect Four board' })).toBeTruthy()
    expect(getByRole('button', { name: 'New game' })).toBeTruthy()

    fireEvent.click(getByRole('button', { name: 'Back to Arcade' }))
    expect(getByText('choose a game')).toBeTruthy()
})

test('uses Enter to play and Escape to move back through the Arcade flow', () => {
    const onReturn = vi.fn()
    const { container, getByRole, getByText } = render(<ArcadeSection onReturn={onReturn} />)
    let section = container.querySelector('#arcade') as HTMLElement

    fireEvent.keyDown(section, { key: 'Enter' })
    expect(getByRole('heading', { level: 2, name: 'CONNECT FOUR' })).toBeTruthy()

    section = container.querySelector('#arcade') as HTMLElement
    expect(document.activeElement).toBe(section)
    fireEvent.keyDown(section, { key: 'Escape' })
    expect(getByText('choose a game')).toBeTruthy()
    expect(onReturn).not.toHaveBeenCalled()

    section = container.querySelector('#arcade') as HTMLElement
    fireEvent.keyDown(section, { key: 'Escape' })
    expect(onReturn).toHaveBeenCalledOnce()
})

test('focuses the Arcade keyboard surface after navigation and game return', () => {
    const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
        configurable: true,
        value: vi.fn(),
    })

    try {
        const { container, getByRole, getByText } = render(<App />)
        let section = container.querySelector('#arcade') as HTMLElement

        fireEvent.click(getByRole('button', { name: 'Arcade' }))
        expect(document.activeElement).toBe(section)

        fireEvent.keyDown(section, { key: 'ArrowRight' })
        expect(getByText('02 / 03')).toBeTruthy()
        fireEvent.keyDown(section, { key: 'Enter' })
        expect(getByRole('heading', { level: 2, name: 'GAME OF LIFE' })).toBeTruthy()

        fireEvent.click(getByRole('button', { name: 'Back to Arcade' }))
        section = container.querySelector('#arcade') as HTMLElement
        expect(document.activeElement).toBe(section)
    } finally {
        if (originalScrollTo) {
            Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
        } else {
            Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
        }
    }
})

test('scopes game shortcuts to the active Arcade pane and its focused root', () => {
    const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
        configurable: true,
        value: vi.fn(),
    })

    try {
        const { container, getByRole } = render(<App />)

        fireEvent.click(getByRole('button', { name: 'Arcade' }))
        fireEvent.click(getByRole('button', { name: 'Play Connect Four' }))
        const gameSection = container.querySelector('#arcade') as HTMLElement
        expect(document.activeElement).toBe(gameSection)

        bot.makeMove.mockClear()
        const github = getByRole('link', { name: 'GitHub' })
        github.focus()
        fireEvent.keyDown(github, { key: 'Enter' })
        expect(bot.makeMove).not.toHaveBeenCalled()

        fireEvent.click(getByRole('button', { name: 'About' }))
        fireEvent.keyDown(gameSection, { key: 'Enter' })
        expect(bot.makeMove).not.toHaveBeenCalled()

        fireEvent.click(getByRole('button', { name: 'Arcade' }))
        fireEvent.keyDown(gameSection, { key: 'Enter' })
        expect(bot.makeMove).toHaveBeenCalledOnce()
    } finally {
        if (originalScrollTo) {
            Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
        } else {
            Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
        }
    }
})

test('keeps hub browse shortcuts active when a child control owns focus', () => {
    const { container, getByRole, getByText } = render(
        <ArcadeSection onReturn={() => undefined} />,
    )
    const section = container.querySelector('#arcade') as HTMLElement
    const play = getByRole('button', { name: 'Play Connect Four' })
    play.focus()

    fireEvent.keyDown(play, { key: 'ArrowRight' })

    expect(getByText('02 / 03')).toBeTruthy()
    expect(document.activeElement).toBe(section)
    fireEvent.keyDown(section, { key: 'Enter' })
    expect(getByRole('heading', { level: 2, name: 'GAME OF LIFE' })).toBeTruthy()
})

test('announces the selected game when keyboard browsing the hub', () => {
    const { container, getByRole } = render(
        <ArcadeSection onReturn={() => undefined} />,
    )
    const section = container.querySelector('#arcade') as HTMLElement

    fireEvent.keyDown(section, { key: 'ArrowRight' })

    expect(getByRole('status').textContent).toBe('02 / 03 · Game of Life selected')
})

test('keeps keyboard selection stable while the mobile deck follows programmatically', () => {
    const { container, getByRole, getByTestId } = render(
        <ArcadeSection onReturn={() => undefined} />,
    )
    const section = container.querySelector('#arcade') as HTMLElement
    const deck = getByTestId('arcade-mobile-deck')
    Object.defineProperties(deck, {
        clientWidth: { configurable: true, value: 393 },
        scrollLeft: { configurable: true, writable: true, value: 0 },
        scrollTo: {
            configurable: true,
            value: ({ behavior, left }: ScrollToOptions) => {
                deck.scrollLeft = behavior === 'smooth' ? 10 : Number(left)
                fireEvent.scroll(deck)
            },
        },
    })

    fireEvent.keyDown(section, { key: 'ArrowRight' })
    fireEvent.keyDown(section, { key: 'Enter' })

    expect(getByRole('heading', { level: 2, name: 'GAME OF LIFE' })).toBeTruthy()
})

test('wires Connect Four difficulty, legal drops, keyboard selection, and reset', () => {
    const { getAllByRole, getByLabelText, getByRole } = render(
        <ArcadeSection onReturn={() => undefined} />,
    )
    fireEvent.click(getByRole('button', { name: 'Play Connect Four' }))

    expect(bot.setDifficulty).toHaveBeenCalledWith(12)
    fireEvent.change(getByLabelText('Difficulty'), { target: { value: '6' } })
    expect(bot.setDifficulty).toHaveBeenLastCalledWith(6)
    expect(bot.resetGame).not.toHaveBeenCalled()

    fireEvent.click(getAllByRole('gridcell', { name: /Drop in column 4/ })[0] as HTMLElement)
    fireEvent.click(getAllByRole('gridcell', { name: /Drop in column 4/ })[1] as HTMLElement)
    expect(bot.makeMove).toHaveBeenCalledTimes(1)
    expect(bot.makeMove).toHaveBeenLastCalledWith(3)

    fireEvent.click(getByRole('button', { name: 'New game' }))
    expect(bot.resetGame).toHaveBeenCalledOnce()
    const focusedCell = getAllByRole('gridcell', { name: /Drop in column 4/ })[0] as HTMLElement
    focusedCell.focus()
    fireEvent.keyDown(focusedCell, { key: 'ArrowRight' })
    const nextCell = getAllByRole('gridcell', { name: /Drop in column 5/ })[0] as HTMLElement
    expect(document.activeElement).toBe(nextCell)
    expect(fireEvent.keyDown(nextCell, { key: 'Enter' })).toBe(false)
    expect(bot.makeMove).toHaveBeenCalledTimes(2)
    expect(bot.makeMove).toHaveBeenLastCalledWith(4)
})

test('opens Sudoku in the shared game frame with its board, pad, and utilities', () => {
    const { getAllByRole, getByLabelText, getByRole, getByText, queryByText } = render(
        <ArcadeSection onReturn={() => undefined} />,
    )

    fireEvent.click(getByRole('button', { name: 'Previous game' }))
    fireEvent.click(getByRole('button', { name: 'Play Sudoku' }))

    expect(queryByText('choose a game')).toBeNull()
    expect(getByRole('heading', { level: 2, name: 'SUDOKU' })).toBeTruthy()
    expect(getByText('PLAYING')).toBeTruthy()
    expect(getByText(/Selected · row \d \/ column \d/)).toBeTruthy()
    expect(getByRole('grid', { name: 'Sudoku board' })).toBeTruthy()
    expect(getAllByRole('gridcell')).toHaveLength(81)
    expect(getByRole('button', { name: 'Clear' })).toBeTruthy()
    expect(getByRole('button', { name: 'Solve' })).toBeTruthy()
    expect(getByRole('button', { name: 'New puzzle' })).toBeTruthy()
    expect(getByRole('button', { name: 'Clear selected cell' })).toBeTruthy()
    expect(getByLabelText('Sudoku number pad').parentElement?.classList).toContain(
        'pb-[calc(1rem+env(safe-area-inset-bottom))]',
    )
    for (let digit = 1; digit <= 9; digit += 1) {
        expect(getByRole('button', { name: `Place ${digit}` })).toBeTruthy()
    }
})

test('keeps Sudoku givens immutable and wires touch, keyboard, and utility actions', () => {
    const { getByRole, getByText } = render(<ArcadeSection onReturn={() => undefined} />)
    fireEvent.click(getByRole('button', { name: 'Previous game' }))
    fireEvent.click(getByRole('button', { name: 'Play Sudoku' }))

    fireEvent.click(getByRole('button', { name: 'Place 7' }))
    expect(sudoku.setCell).toHaveBeenLastCalledWith(4, 4, 7)

    fireEvent.click(getByRole('gridcell', { name: 'Row 1, column 1, 5, given' }))
    expect(getByRole('button', { name: 'Place 7' }).hasAttribute('disabled')).toBe(true)

    const editableCell = getByRole('gridcell', { name: 'Row 1, column 3, empty' })
    fireEvent.click(editableCell)
    editableCell.focus()
    fireEvent.keyDown(editableCell, { key: '4' })
    expect(sudoku.setCell).toHaveBeenLastCalledWith(0, 2, 4)
    fireEvent.keyDown(editableCell, { key: 'ArrowRight' })
    expect(getByText('Selected · row 1 / column 4')).toBeTruthy()
    const nextCell = getByRole('gridcell', { name: 'Row 1, column 4, empty' })
    expect(document.activeElement).toBe(nextCell)
    fireEvent.keyDown(nextCell, { key: 'Delete' })
    expect(sudoku.setCell).toHaveBeenLastCalledWith(0, 3, 0)

    fireEvent.click(getByRole('button', { name: 'Clear' }))
    fireEvent.click(getByRole('button', { name: 'Solve' }))
    fireEvent.click(getByRole('button', { name: 'New puzzle' }))
    expect(sudoku.clearBoard).toHaveBeenCalledOnce()
    expect(sudoku.solveBoard).toHaveBeenCalledOnce()
    expect(sudoku.resetGame).toHaveBeenCalledOnce()

    fireEvent.keyDown(nextCell, { key: 'Escape' })
    expect(getByText('choose a game')).toBeTruthy()
})

test('opens Game of Life with the canonical wide grid and simulation controls', () => {
    const { getByLabelText, getByRole, getByText, queryByText } = render(
        <ArcadeSection onReturn={() => undefined} />,
    )

    fireEvent.click(getByRole('button', { name: 'Next game' }))
    fireEvent.click(getByRole('button', { name: 'Play Game of Life' }))

    expect(queryByText('choose a game')).toBeNull()
    expect(getByRole('heading', { level: 2, name: 'GAME OF LIFE' })).toBeTruthy()
    expect(getByText('PAUSED')).toBeTruthy()
    expect(getByText('paint cells to begin')).toBeTruthy()
    expect(getByRole('application', { name: 'Game of Life grid' })).toBeTruthy()
    expect(getByText('PAUSED').classList).toContain('text-olive')
    expect(getByRole('button', { name: 'Play' })).toBeTruthy()
    expect(getByRole('button', { name: 'Step' })).toBeTruthy()
    expect(getByRole('button', { name: 'Clear' })).toBeTruthy()
    expect(getByRole('button', { name: 'Random' })).toBeTruthy()
    expect(getByLabelText('Simulation speed')).toBeTruthy()
    expect(getByText('Slow')).toBeTruthy()
    expect(getByText('Fast')).toBeTruthy()
})

test('offers a retry when the Game of Life worker fails before READY', () => {
    life.isReady = false
    life.error = 'The Game of Life engine failed to start.'
    const { getByRole, getByText } = render(<ArcadeSection onReturn={() => undefined} />)

    fireEvent.click(getByRole('button', { name: 'Next game' }))
    fireEvent.click(getByRole('button', { name: 'Play Game of Life' }))

    expect(getByText('ENGINE ERROR')).toBeTruthy()
    fireEvent.click(getByRole('button', { name: 'Retry' }))
    expect(life.retry).toHaveBeenCalledOnce()
})

test('lets keyboard users navigate and toggle announced Game of Life cells', () => {
    const { getByRole, getByText } = render(<ArcadeSection onReturn={() => undefined} />)
    fireEvent.click(getByRole('button', { name: 'Next game' }))
    fireEvent.click(getByRole('button', { name: 'Play Game of Life' }))
    const canvas = getByRole('application', { name: 'Game of Life grid' })
    canvas.focus()
    fireEvent.focus(canvas)

    fireEvent.keyDown(canvas, { key: 'ArrowRight' })
    expect(getByText('Row 1, column 2, dead')).toBeTruthy()
    fireEvent.keyDown(canvas, { key: ' ' })

    expect(life.setCell).toHaveBeenCalledWith(0, 1, 1)
    expect(life.step).not.toHaveBeenCalled()
})

test('runs, steps, randomizes, and drag-paints Game of Life with pause-resume semantics', () => {
    vi.useFakeTimers()
    const { getByRole, getByText } = render(<ArcadeSection onReturn={() => undefined} />)
    fireEvent.click(getByRole('button', { name: 'Next game' }))
    fireEvent.click(getByRole('button', { name: 'Play Game of Life' }))

    fireEvent.click(getByRole('button', { name: 'Play' }))
    expect(getByText('RUNNING')).toBeTruthy()
    vi.advanceTimersByTime(500)
    expect(life.step).toHaveBeenCalled()

    const canvas = getByRole('application', { name: 'Game of Life grid' }) as HTMLCanvasElement
    const gameSection = canvas.closest('#arcade') as HTMLElement
    Object.defineProperty(canvas, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ left: 0, top: 0, width: 300, height: 250, right: 300, bottom: 250 }),
    })
    const setPointerCapture = vi.fn()
    Object.defineProperty(canvas, 'setPointerCapture', { configurable: true, value: setPointerCapture })

    fireEvent.pointerDown(canvas, { clientX: 295, clientY: 245, pointerId: 7 })
    expect(getByText('PAINTING')).toBeTruthy()
    expect(life.setCell).toHaveBeenLastCalledWith(24, 29, 1)
    const stepsBeforePaint = life.step.mock.calls.length
    fireEvent.keyDown(gameSection, { key: ' ' })
    vi.advanceTimersByTime(500)
    expect(life.step).toHaveBeenCalledTimes(stepsBeforePaint)
    fireEvent.pointerMove(canvas, { clientX: 285, clientY: 245, pointerId: 7 })
    expect(life.setCell).toHaveBeenLastCalledWith(24, 28, 1)
    fireEvent.pointerUp(canvas, { pointerId: 7 })
    expect(getByText('RUNNING')).toBeTruthy()
    expect(setPointerCapture).toHaveBeenCalledWith(7)

    fireEvent.click(getByRole('button', { name: 'Pause' }))
    fireEvent.click(getByRole('button', { name: 'Step' }))
    fireEvent.click(getByRole('button', { name: 'Clear' }))
    fireEvent.click(getByRole('button', { name: 'Random' }))
    expect(life.step).toHaveBeenCalled()
    expect(life.clear).toHaveBeenCalledOnce()
    expect(life.randomize).toHaveBeenCalledOnce()

    fireEvent.keyDown(gameSection, { key: 'Escape' })
    expect(getByText('choose a game')).toBeTruthy()
})

test('does not reallocate the Game of Life canvas backing store on board-only updates', () => {
    const context = {
        fillRect: vi.fn(),
        setTransform: vi.fn(),
        fillStyle: '',
    }
    const resizeObserver = globalThis.ResizeObserver
    const rectSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
        bottom: 250,
        height: 250,
        left: 0,
        right: 300,
        top: 0,
        width: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    })
    const contextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
        context as unknown as CanvasRenderingContext2D,
    )
    class ImmediateResizeObserver {
        readonly callback: ResizeObserverCallback
        constructor(callback: ResizeObserverCallback) {
            this.callback = callback
        }
        observe() {
            this.callback([], this as unknown as ResizeObserver)
        }
        disconnect() {}
        unobserve() {}
    }
    globalThis.ResizeObserver = ImmediateResizeObserver as unknown as typeof ResizeObserver

    try {
        const { getByRole, rerender } = render(
            <ArcadeSection onReturn={() => undefined} />,
        )
        fireEvent.click(getByRole('button', { name: 'Next game' }))
        fireEvent.click(getByRole('button', { name: 'Play Game of Life' }))

        const canvas = getByRole('application', { name: 'Game of Life grid' }) as HTMLCanvasElement
        let backingWidth = canvas.width
        let widthWrites = 0
        Object.defineProperty(canvas, 'width', {
            configurable: true,
            get: () => backingWidth,
            set: (value: number) => {
                backingWidth = value
                widthWrites += 1
            },
        })

        life.board = life.board.map((row, rowIndex) =>
            row.map((cell, columnIndex) => rowIndex === 2 && columnIndex === 3 ? 1 : cell),
        )
        rerender(<ArcadeSection onReturn={() => undefined} />)

        expect(widthWrites).toBe(0)
    } finally {
        rectSpy.mockRestore()
        contextSpy.mockRestore()
        globalThis.ResizeObserver = resizeObserver
    }
})
