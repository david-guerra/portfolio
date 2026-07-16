import { useEffect, useRef, useState, useCallback } from 'react'
import type { GoLMessage, GoLResponse } from '../workers/gol.worker'

export function useGameOfLife(scriptPath: string = new URL(import.meta.env.BASE_URL + 'wasm/game_of_life.js', window.location.origin).href) {
    const workerRef = useRef<Worker | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [board, setBoard] = useState<number[][]>([])
    const [error, setError] = useState<string | null>(null)
    const [workerGeneration, setWorkerGeneration] = useState(0)

    useEffect(() => {
        let cancelled = false
        let worker: Worker
        try {
            worker = new Worker(new URL('../workers/gol.worker.ts', import.meta.url), {
                type: 'classic',
            })
        } catch (workerError) {
            queueMicrotask(() => {
                if (cancelled) return
                setIsReady(false)
                setError(
                    workerError instanceof Error
                        ? workerError.message
                        : 'The Game of Life engine failed to start.',
                )
            })
            return () => {
                cancelled = true
            }
        }
        workerRef.current = worker

        worker.onmessage = (e: MessageEvent<GoLResponse>) => {
            if (cancelled) return
            const msg = e.data
            switch (msg.type) {
                case 'READY':
                    setIsReady(true)
                    setError(null)
                    break
                case 'BOARD_UPDATE':
                    setBoard(msg.payload)
                    break
                case 'ERROR':
                    setIsReady(false)
                    setError(msg.payload)
                    console.error('GoL Worker Error:', msg.payload)
                    break
            }
        }

        worker.onerror = (event) => {
            if (cancelled) return
            setIsReady(false)
            setError(event.message || 'The Game of Life engine failed to start.')
        }

        worker.postMessage({ type: 'INIT', payload: { wasmUrl: scriptPath } } as GoLMessage)

        return () => {
            cancelled = true
            worker.terminate()
            if (workerRef.current === worker) workerRef.current = null
        }
    }, [scriptPath, workerGeneration])

    const setCell = useCallback((row: number, col: number, val: number) => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'SET_CELL', payload: { row, col, val } } as GoLMessage)
        }
    }, [isReady])

    const step = useCallback(() => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'STEP', payload: null } as GoLMessage)
        }
    }, [isReady])

    const clear = useCallback(() => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'CLEAR', payload: null } as GoLMessage)
        }
    }, [isReady])

    const randomize = useCallback(() => {
        if (workerRef.current && isReady) {
            const seed = globalThis.crypto?.getRandomValues
                ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
                : Date.now()
            workerRef.current.postMessage({
                type: 'RANDOMIZE',
                payload: { seed, density: 0.22 },
            } as GoLMessage)
        }
    }, [isReady])

    const retry = useCallback(() => {
        setIsReady(false)
        setBoard([])
        setError(null)
        setWorkerGeneration((generation) => generation + 1)
    }, [])

    return { isReady, board, setCell, step, clear, randomize, error, retry }
}
