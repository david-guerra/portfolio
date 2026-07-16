import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import SudokuScreen from '../src/features/arcade/sudoku/SudokuScreen.tsx'

const sudoku = vi.hoisted(() => {
    const board = Array.from({ length: 9 }, () => Array<number>(9).fill(0))
    board[0][0] = 5
    return {
        board,
        initialCells: board.map((row) => row.map((value) => value !== 0)),
        isReady: true,
        isResetting: false,
        isSolved: false,
        error: null as string | null,
        setCell: vi.fn(),
        resetGame: vi.fn(),
        clearBoard: vi.fn(),
        solveBoard: vi.fn(),
        retry: vi.fn(),
    }
})

vi.mock('../src/hooks/useSudoku.ts', () => ({
    useSudoku: () => sudoku,
}))

beforeEach(() => {
    vi.clearAllMocks()
    sudoku.isReady = true
    sudoku.isResetting = false
    sudoku.isSolved = false
    sudoku.error = null
})

afterEach(cleanup)

test('Sudoku exposes nine owned rows of nine gridcells', () => {
    const { getByRole } = render(<SudokuScreen onBack={() => undefined} />)
    const grid = getByRole('grid', { name: 'Sudoku board' })
    const rows = within(grid).getAllByRole('row')

    expect(rows).toHaveLength(9)
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(81)
    for (const row of rows) {
        const cells = within(row).getAllByRole('gridcell')
        expect(cells).toHaveLength(9)
        expect(cells.every((cell) => cell.parentElement === row)).toBe(true)
    }
})

test('Sudoku constrains its desktop board by both play-area width and height', () => {
    const { getByRole } = render(<SudokuScreen onBack={() => undefined} />)
    const grid = getByRole('grid', { name: 'Sudoku board' })

    expect(grid.classList).toContain('wide:w-[min(100cqw,120cqh,880px)]')
})

test('Sudoku arrow navigation moves actual gridcell focus', () => {
    const { getByRole, getByText } = render(<SudokuScreen onBack={() => undefined} />)
    const start = getByRole('gridcell', { name: 'Row 1, column 2, empty' })
    start.focus()
    fireEvent.click(start)

    fireEvent.keyDown(start, { key: 'ArrowRight' })

    const next = getByRole('gridcell', { name: 'Row 1, column 3, empty' })
    expect(document.activeElement).toBe(next)
    expect(getByText('Selected · row 1 / column 3')).toBeTruthy()
})

test('Sudoku reserves game-level Escape while other shortcuts ignore controls and outside links', () => {
    const onBack = vi.fn()
    const { getByRole, getByText } = render(
        <>
            <a href="#outside">Outside link</a>
            <SudokuScreen onBack={onBack} />
        </>,
    )
    const clear = getByRole('button', { name: 'Clear' })
    clear.focus()
    fireEvent.keyDown(clear, { key: '4' })
    fireEvent.keyDown(clear, { key: 'Escape' })
    expect(onBack).toHaveBeenCalledOnce()

    const link = getByRole('link', { name: 'Outside link' })
    link.focus()
    fireEvent.keyDown(link, { key: 'ArrowRight' })
    fireEvent.keyDown(link, { key: '5' })
    fireEvent.keyDown(link, { key: 'Escape' })

    expect(getByText('Selected · row 5 / column 5')).toBeTruthy()
    expect(sudoku.setCell).not.toHaveBeenCalled()
    expect(onBack).toHaveBeenCalledOnce()
})

test('Sudoku can opt out of global keyboard shortcuts', () => {
    const onBack = vi.fn()
    const { getByText } = render(
        <SudokuScreen keyboardActive={false} onBack={onBack} />,
    )

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: '7' })
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(getByText('Selected · row 5 / column 5')).toBeTruthy()
    expect(sudoku.setCell).not.toHaveBeenCalled()
    expect(onBack).not.toHaveBeenCalled()
})

test('Sudoku disables game controls while its worker is unavailable', () => {
    sudoku.isReady = false
    sudoku.error = 'Sudoku worker failed to load'
    const { getAllByRole, getByRole } = render(<SudokuScreen onBack={() => undefined} />)

    expect(getByRole('button', { name: 'Retry' }).hasAttribute('disabled')).toBe(false)
    expect(getByRole('button', { name: 'Clear' }).hasAttribute('disabled')).toBe(true)
    expect(getByRole('button', { name: 'Solve' }).hasAttribute('disabled')).toBe(true)
    expect(getByRole('button', { name: 'New puzzle' }).hasAttribute('disabled')).toBe(true)
    expect(getByRole('button', { name: 'Place 1' }).hasAttribute('disabled')).toBe(true)
    expect(getAllByRole('gridcell').every((cell) => cell.hasAttribute('disabled'))).toBe(true)
})

test('Sudoku locks a completed board while keeping New puzzle available', () => {
    sudoku.isSolved = true
    const { getAllByRole, getByRole } = render(<SudokuScreen onBack={() => undefined} />)

    expect(getByRole('button', { name: 'Clear' }).hasAttribute('disabled')).toBe(true)
    expect(getByRole('button', { name: 'Solve' }).hasAttribute('disabled')).toBe(true)
    expect(getByRole('button', { name: 'New puzzle' }).hasAttribute('disabled')).toBe(false)
    expect(getByRole('button', { name: 'Place 1' }).hasAttribute('disabled')).toBe(true)
    expect(getAllByRole('gridcell').every((cell) => cell.hasAttribute('disabled'))).toBe(true)
})

test('Sudoku locks every game action while a new puzzle is being dealt', () => {
    sudoku.isResetting = true
    const { getAllByRole, getByRole, getByText } = render(
        <SudokuScreen onBack={() => undefined} />,
    )

    expect(getByText('DEALING…')).toBeTruthy()
    expect(getByRole('button', { name: 'Clear' }).hasAttribute('disabled')).toBe(true)
    expect(getByRole('button', { name: 'Solve' }).hasAttribute('disabled')).toBe(true)
    expect(getByRole('button', { name: 'New puzzle' }).hasAttribute('disabled')).toBe(true)
    expect(getByRole('button', { name: 'Place 1' }).hasAttribute('disabled')).toBe(true)
    expect(getAllByRole('gridcell').every((cell) => cell.hasAttribute('disabled'))).toBe(true)
})
