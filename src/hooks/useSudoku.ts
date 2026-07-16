import { useCallback, useEffect, useRef, useState } from 'react'
import type { SudokuMessage, SudokuResponse } from '../workers/sudoku.worker'

export function useSudoku(
    scriptPath: string = new URL(
        import.meta.env.BASE_URL + 'wasm/sudoku.js',
        window.location.origin,
    ).href,
) {
    const workerRef = useRef<Worker | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [board, setBoard] = useState<number[][]>([])
    const [initialCells, setInitialCells] = useState<boolean[][]>([])
    const [isSolved, setIsSolved] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [workerGeneration, setWorkerGeneration] = useState(0)

    useEffect(() => {
        let cancelled = false
        let worker: Worker
        try {
            worker = new Worker(new URL('../workers/sudoku.worker.ts', import.meta.url), {
                type: 'classic',
            })
        } catch (workerError) {
            queueMicrotask(() => {
                if (cancelled) return
                setIsReady(false)
                setError(
                    workerError instanceof Error
                        ? workerError.message
                        : 'The Sudoku engine failed to start.',
                )
            })
            return () => {
                cancelled = true
            }
        }
        workerRef.current = worker

        worker.onmessage = (event: MessageEvent<SudokuResponse>) => {
            if (cancelled) return
            const message = event.data
            switch (message.type) {
                case 'READY':
                    setIsReady(true)
                    setError(null)
                    break
                case 'BOARD_UPDATE':
                    setBoard(message.payload.board)
                    setInitialCells(message.payload.initialCells)
                    setIsSolved(message.payload.solved)
                    if (message.payload.reason === 'RESET') setIsResetting(false)
                    break
                case 'ERROR':
                    setIsReady(false)
                    setIsResetting(false)
                    setError(message.payload)
                    console.error('Sudoku Worker Error:', message.payload)
                    break
            }
        }

        worker.onerror = (event) => {
            if (cancelled) return
            setIsReady(false)
            setIsResetting(false)
            setError(event.message || 'The Sudoku engine failed to start.')
        }

        worker.postMessage({
            type: 'INIT',
            payload: { wasmUrl: scriptPath },
        } as SudokuMessage)

        return () => {
            cancelled = true
            worker.terminate()
            if (workerRef.current === worker) workerRef.current = null
        }
    }, [scriptPath, workerGeneration])

    const setCell = useCallback((row: number, col: number, val: number) => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({
                type: 'SET_CELL',
                payload: { row, col, val },
            } as SudokuMessage)
        }
    }, [isReady])

    const resetGame = useCallback(() => {
        if (workerRef.current && isReady) {
            setIsResetting(true)
            workerRef.current.postMessage({ type: 'RESET' } as SudokuMessage)
        }
    }, [isReady])

    const clearBoard = useCallback(() => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'CLEAR_USER' } as SudokuMessage)
        }
    }, [isReady])

    const solveBoard = useCallback(() => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'SOLVE' } as SudokuMessage)
        }
    }, [isReady])

    const retry = useCallback(() => {
        setIsReady(false)
        setBoard([])
        setInitialCells([])
        setIsSolved(false)
        setIsResetting(false)
        setError(null)
        setWorkerGeneration((generation) => generation + 1)
    }, [])

    return {
        isReady,
        board,
        initialCells,
        isSolved,
        isResetting,
        setCell,
        resetGame,
        clearBoard,
        solveBoard,
        error,
        retry,
    }
}
