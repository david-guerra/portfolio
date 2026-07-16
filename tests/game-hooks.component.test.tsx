import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useGameOfLife } from '../src/hooks/useGameOfLife.ts'
import { useSudoku } from '../src/hooks/useSudoku.ts'

class WorkerStub {
    static instances: WorkerStub[] = []

    onerror: ((event: ErrorEvent) => void) | null = null
    onmessage: ((event: MessageEvent) => void) | null = null
    postMessage = vi.fn()
    terminate = vi.fn()

    constructor() {
        WorkerStub.instances.push(this)
    }
}

beforeEach(() => {
    WorkerStub.instances = []
    vi.stubGlobal('Worker', WorkerStub as unknown as typeof Worker)
})

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

test('Game of Life surfaces native worker failures and retry boots a replacement', () => {
    const { result } = renderHook(() =>
        useGameOfLife('http://localhost/portfolio/wasm/game_of_life.js'),
    )
    const firstWorker = WorkerStub.instances[0]
    expect(firstWorker).toBeTruthy()

    act(() => {
        firstWorker?.onerror?.(new ErrorEvent('error', { message: 'Worker script failed to load' }))
    })

    expect(result.current.isReady).toBe(false)
    expect(result.current.error).toBe('Worker script failed to load')

    act(() => result.current.retry())

    expect(firstWorker?.terminate).toHaveBeenCalledOnce()
    expect(WorkerStub.instances).toHaveLength(2)
    expect(result.current.error).toBeNull()
})

test('Sudoku keeps the worker-authoritative given mask across a queued reset update', () => {
    const { result } = renderHook(() =>
        useSudoku('http://localhost/portfolio/wasm/sudoku.js'),
    )
    const worker = WorkerStub.instances[0]
    const puzzle = Array.from({ length: 9 }, () => Array<number>(9).fill(0))
    puzzle[0][0] = 5
    const initialCells = puzzle.map((row) => row.map((value) => value !== 0))

    act(() => {
        worker?.onmessage?.(new MessageEvent('message', { data: { type: 'READY' } }))
        worker?.onmessage?.(new MessageEvent('message', {
            data: {
                type: 'BOARD_UPDATE',
                payload: { board: puzzle, initialCells, solved: false },
            },
        }))
    })

    act(() => result.current.resetGame())
    expect(result.current.isResetting).toBe(true)
    const queuedBoard = puzzle.map((row) => [...row])
    queuedBoard[0][1] = 7
    act(() => {
        worker?.onmessage?.(new MessageEvent('message', {
            data: {
                type: 'BOARD_UPDATE',
                payload: {
                    board: queuedBoard,
                    initialCells,
                    solved: false,
                    reason: 'SET_CELL',
                },
            },
        }))
    })

    expect(result.current.isResetting).toBe(true)
    expect(result.current.initialCells[0][0]).toBe(true)
    expect(result.current.initialCells[0][1]).toBe(false)

    act(() => {
        worker?.onmessage?.(new MessageEvent('message', {
            data: {
                type: 'BOARD_UPDATE',
                payload: {
                    board: puzzle,
                    initialCells,
                    solved: false,
                    reason: 'RESET',
                },
            },
        }))
    })
    expect(result.current.isResetting).toBe(false)
})

test('Sudoku surfaces native worker failures and retry boots a replacement', () => {
    const { result } = renderHook(() =>
        useSudoku('http://localhost/portfolio/wasm/sudoku.js'),
    )
    const firstWorker = WorkerStub.instances[0]

    act(() => {
        firstWorker?.onmessage?.(new MessageEvent('message', { data: { type: 'READY' } }))
        firstWorker?.onerror?.(
            new ErrorEvent('error', { message: 'Sudoku worker script failed to load' }),
        )
    })

    expect(result.current.isReady).toBe(false)
    expect(result.current.error).toBe('Sudoku worker script failed to load')

    act(() => result.current.retry())

    expect(firstWorker?.terminate).toHaveBeenCalledOnce()
    expect(WorkerStub.instances).toHaveLength(2)
    expect(result.current.error).toBeNull()
})

test('Sudoku protocol failures also clear worker readiness', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { result } = renderHook(() =>
        useSudoku('http://localhost/portfolio/wasm/sudoku.js'),
    )
    const worker = WorkerStub.instances[0]

    act(() => {
        worker?.onmessage?.(new MessageEvent('message', { data: { type: 'READY' } }))
        worker?.onmessage?.(new MessageEvent('message', {
            data: { type: 'ERROR', payload: 'Wasm initialization failed' },
        }))
    })

    expect(result.current.isReady).toBe(false)
    expect(result.current.error).toBe('Wasm initialization failed')
    consoleError.mockRestore()
})
