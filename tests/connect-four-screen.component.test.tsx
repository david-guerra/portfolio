import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import ConnectFourScreen from '../src/features/arcade/connect-four/ConnectFourScreen.tsx'

const bot = vi.hoisted(() => ({
    isReady: true,
    board: Array.from({ length: 6 }, () => Array<number>(7).fill(0)),
    gameStatus: 'playing' as 'playing' | 'won' | 'draw',
    winner: 0,
    makeMove: vi.fn(),
    computeBotMove: vi.fn(),
    resetGame: vi.fn(),
    setDifficulty: vi.fn(),
    error: null as string | null,
    retry: vi.fn(),
}))

vi.mock('../src/hooks/useGameBot.ts', () => ({
    useGameBot: () => bot,
}))

beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    bot.board = Array.from({ length: 6 }, () => Array<number>(7).fill(0))
    bot.board[5][3] = 1
    bot.gameStatus = 'playing'
    bot.error = null
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

test('Connect Four exposes six owned rows of seven gridcells', () => {
    const { getByRole } = render(<ConnectFourScreen onBack={() => undefined} />)
    const grid = getByRole('grid', { name: 'Connect Four board' })
    const rows = within(grid).getAllByRole('row')

    expect(rows).toHaveLength(6)
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(42)
    for (const row of rows) {
        const cells = within(row).getAllByRole('gridcell')
        expect(cells).toHaveLength(7)
        expect(cells.every((cell) => cell.parentElement === row)).toBe(true)
    }
})

test('New game cancels a pending bot decision before resetting the worker', () => {
    const { getByRole } = render(<ConnectFourScreen onBack={() => undefined} />)

    fireEvent.click(getByRole('button', { name: 'New game' }))
    vi.advanceTimersByTime(500)

    expect(bot.resetGame).toHaveBeenCalledOnce()
    expect(bot.computeBotMove).not.toHaveBeenCalled()
})
