import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import GameOfLifeScreen from '../src/features/arcade/game-of-life/GameOfLifeScreen.tsx'

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

vi.mock('../src/hooks/useGameOfLife.ts', () => ({
    useGameOfLife: () => life,
}))

beforeEach(() => {
    vi.clearAllMocks()
    life.isReady = true
    life.error = null
    life.board = Array.from({ length: 25 }, () => Array<number>(30).fill(0))
})

afterEach(cleanup)

function prepareCanvas(canvas: HTMLElement) {
    const capturedPointers = new Set<number>()
    const setPointerCapture = vi.fn((pointerId: number) => capturedPointers.add(pointerId))
    const releasePointerCapture = vi.fn((pointerId: number) => capturedPointers.delete(pointerId))
    Object.defineProperties(canvas, {
        getBoundingClientRect: {
            configurable: true,
            value: () => ({
                bottom: 250,
                height: 250,
                left: 0,
                right: 300,
                top: 0,
                width: 300,
                x: 0,
                y: 0,
                toJSON: () => ({}),
            }),
        },
        setPointerCapture: { configurable: true, value: setPointerCapture },
        hasPointerCapture: {
            configurable: true,
            value: (pointerId: number) => capturedPointers.has(pointerId),
        },
        releasePointerCapture: { configurable: true, value: releasePointerCapture },
    })
    return { releasePointerCapture, setPointerCapture }
}

test('Escape returns to the Arcade hub while the grid owns focus', () => {
    const onBack = vi.fn()
    const { getByRole, getByText, queryByText } = render(
        <GameOfLifeScreen onBack={onBack} />,
    )
    const canvas = getByRole('application', { name: 'Game of Life grid' })

    expect(getByText('[SPACE]')).toBeTruthy()
    canvas.focus()
    fireEvent.focus(canvas)
    expect(getByText('[ARROWS]')).toBeTruthy()
    expect(queryByText('[SPACE]')).toBeNull()
    fireEvent.keyDown(canvas, { key: 'Escape' })

    expect(onBack).toHaveBeenCalledOnce()
})

test('cell announcements only change for focused keyboard interactions', () => {
    const view = render(<GameOfLifeScreen onBack={() => undefined} />)
    const canvas = view.getByRole('application', { name: 'Game of Life grid' })
    const cellStatus = view.container.querySelector('#gol-cell-status')
    const announcedCell = () => cellStatus?.textContent?.replace(/\s+/g, ' ').trim()

    expect(announcedCell()).toBe('')
    life.board[0][0] = 1
    view.rerender(<GameOfLifeScreen onBack={() => undefined} />)
    expect(announcedCell()).toBe('')

    fireEvent.focus(canvas)
    expect(announcedCell()).toBe('Row 1, column 1, alive')
    life.board[0][0] = 0
    view.rerender(<GameOfLifeScreen onBack={() => undefined} />)
    expect(announcedCell()).toBe('Row 1, column 1, alive')

    fireEvent.keyDown(canvas, { key: 'ArrowRight' })
    expect(announcedCell()).toBe('Row 1, column 2, dead')
    fireEvent.keyDown(canvas, { key: ' ' })
    expect(announcedCell()).toBe('Row 1, column 2, alive')
    expect(life.setCell).toHaveBeenLastCalledWith(0, 1, 1)

    fireEvent.blur(canvas)
    expect(announcedCell()).toBe('')
})

test('a second touch cannot replace or end the active paint gesture', () => {
    const { getByRole } = render(<GameOfLifeScreen onBack={() => undefined} />)
    const canvas = getByRole('application', { name: 'Game of Life grid' })
    const { releasePointerCapture, setPointerCapture } = prepareCanvas(canvas)

    fireEvent.pointerDown(canvas, { clientX: 5, clientY: 5, pointerId: 11, pointerType: 'touch' })
    fireEvent.pointerDown(canvas, { clientX: 25, clientY: 5, pointerId: 22, pointerType: 'touch' })
    fireEvent.pointerUp(canvas, { clientX: 25, clientY: 5, pointerId: 22, pointerType: 'touch' })
    fireEvent.pointerMove(canvas, { clientX: 15, clientY: 5, pointerId: 11, pointerType: 'touch' })
    fireEvent.pointerUp(canvas, { clientX: 15, clientY: 5, pointerId: 11, pointerType: 'touch' })

    expect(life.setCell.mock.calls).toEqual([
        [0, 0, 1],
        [0, 1, 1],
    ])
    expect(setPointerCapture.mock.calls).toEqual([[11]])
    expect(releasePointerCapture.mock.calls).toEqual([[11]])
})

test('a fast paint gesture fills every crossed cell exactly once', () => {
    const { getByRole } = render(<GameOfLifeScreen onBack={() => undefined} />)
    const canvas = getByRole('application', { name: 'Game of Life grid' })
    prepareCanvas(canvas)

    fireEvent.pointerDown(canvas, {
        clientX: 5,
        clientY: 5,
        pointerId: 3,
        pointerType: 'touch',
    })
    fireEvent.pointerMove(canvas, {
        clientX: 55,
        clientY: 45,
        pointerId: 3,
        pointerType: 'touch',
    })
    fireEvent.pointerMove(canvas, {
        clientX: 55,
        clientY: 45,
        pointerId: 3,
        pointerType: 'touch',
    })

    expect(life.setCell.mock.calls).toEqual([
        [0, 0, 1],
        [1, 1, 1],
        [2, 2, 1],
        [2, 3, 1],
        [3, 4, 1],
        [4, 5, 1],
    ])
})

test('Clear and Random stay unavailable for the entire paint gesture', () => {
    const { getByRole } = render(<GameOfLifeScreen onBack={() => undefined} />)
    const canvas = getByRole('application', { name: 'Game of Life grid' })
    const { releasePointerCapture } = prepareCanvas(canvas)

    fireEvent.click(getByRole('button', { name: 'Play' }))
    fireEvent.pointerDown(canvas, { clientX: 5, clientY: 5, pointerId: 7, pointerType: 'touch' })

    const clearButton = getByRole('button', { name: 'Clear' }) as HTMLButtonElement
    const randomButton = getByRole('button', { name: 'Random' }) as HTMLButtonElement
    expect(clearButton.disabled).toBe(true)
    expect(randomButton.disabled).toBe(true)
    fireEvent.click(clearButton)
    fireEvent.click(randomButton)
    expect(life.clear).not.toHaveBeenCalled()
    expect(life.randomize).not.toHaveBeenCalled()

    fireEvent.pointerCancel(canvas, {
        clientX: 5,
        clientY: 5,
        pointerId: 7,
        pointerType: 'touch',
    })
    expect(getByRole('button', { name: 'Pause' })).toBeTruthy()
    expect((getByRole('button', { name: 'Clear' }) as HTMLButtonElement).disabled).toBe(false)
    expect(releasePointerCapture).toHaveBeenCalledWith(7)
})

test('a ready grid reserves touch for painting while unavailable grids allow page panning', () => {
    const { getByRole, unmount } = render(<GameOfLifeScreen onBack={() => undefined} />)
    const canvas = getByRole('application', { name: 'Game of Life grid' })
    const { releasePointerCapture, setPointerCapture } = prepareCanvas(canvas)

    expect(canvas.classList).toContain('touch-none')
    expect(canvas.classList).not.toContain('touch-pan-y')
    expect(
        fireEvent.pointerDown(canvas, {
            clientX: 5,
            clientY: 5,
            pointerId: 4,
            pointerType: 'touch',
        }),
    ).toBe(false)
    expect(setPointerCapture).toHaveBeenCalledWith(4)

    fireEvent.pointerUp(canvas, {
        clientX: 5,
        clientY: 5,
        pointerId: 4,
        pointerType: 'touch',
    })
    expect(canvas.classList).toContain('touch-none')
    expect(releasePointerCapture).toHaveBeenCalledWith(4)

    unmount()
    life.isReady = false
    const loading = render(<GameOfLifeScreen onBack={() => undefined} />)
    const loadingCanvas = loading.getByRole('application', { name: 'Game of Life grid' })
    const loadingCapture = prepareCanvas(loadingCanvas)
    expect(
        fireEvent.pointerDown(loadingCanvas, {
            clientX: 5,
            clientY: 5,
            pointerId: 8,
            pointerType: 'touch',
        }),
    ).toBe(true)
    expect(loadingCanvas.classList).toContain('touch-pan-y')
    expect(loadingCapture.setPointerCapture).not.toHaveBeenCalled()
})

test('keyboardActive can suspend every window-level game shortcut', () => {
    const onBack = vi.fn()
    const { getByRole } = render(
        <GameOfLifeScreen keyboardActive={false} onBack={onBack} />,
    )
    const canvas = getByRole('application', { name: 'Game of Life grid' })

    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: ' ' })
    canvas.focus()
    fireEvent.keyDown(canvas, { key: 'Escape' })

    expect(onBack).not.toHaveBeenCalled()
    expect(life.step).not.toHaveBeenCalled()
    expect(getByRole('button', { name: 'Play' })).toBeTruthy()
})

test('game-level Escape works on controls while other shortcuts do not leak', () => {
    const onBack = vi.fn()
    const { getByRole, getByText } = render(
        <>
            <a href="#notes">Notes</a>
            <div role="button" tabIndex={0}>Custom action</div>
            <textarea aria-label="Scratch pad" />
            <GameOfLifeScreen onBack={onBack} />
        </>,
    )

    fireEvent.keyDown(getByRole('button', { name: 'Play' }), { key: 'Escape' })
    expect(onBack).toHaveBeenCalledOnce()
    fireEvent.keyDown(getByText('Notes'), { key: 'Escape' })
    fireEvent.keyDown(getByRole('button', { name: 'Custom action' }), { key: 'ArrowRight' })
    fireEvent.keyDown(getByRole('textbox', { name: 'Scratch pad' }), { key: ' ' })

    expect(onBack).toHaveBeenCalledOnce()
    expect(life.step).not.toHaveBeenCalled()
    expect(getByRole('button', { name: 'Play' })).toBeTruthy()
})

test('the speed range provides a 44px minimum touch target', () => {
    const { getByRole } = render(<GameOfLifeScreen onBack={() => undefined} />)

    expect(getByRole('slider', { name: 'Simulation speed' }).classList).toContain('min-h-11')
})

test('the canvas aspect ratio follows the compiled board dimensions', () => {
    life.board = Array.from({ length: 21 }, () => Array<number>(28).fill(0))
    const { getByRole } = render(<GameOfLifeScreen onBack={() => undefined} />)
    const canvas = getByRole('application', {
        name: 'Game of Life grid',
    }) as HTMLCanvasElement

    expect(canvas.style.aspectRatio).toBe('28 / 21')
    expect(canvas.style.getPropertyValue('--game-board-height-limit')).toBe(
        `${(28 / 21) * 100}cqh`,
    )
    expect(canvas.classList).toContain(
        'wide:w-[min(100cqw,var(--game-board-height-limit),930px)]',
    )
})
