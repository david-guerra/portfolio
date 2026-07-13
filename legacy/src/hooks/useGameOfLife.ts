import { useEffect, useRef, useState, useCallback } from 'react'
import type { GoLMessage, GoLResponse } from '../workers/gol.worker'

export function useGameOfLife(scriptPath: string = new URL(import.meta.env.BASE_URL + 'wasm/game_of_life.js', window.location.origin).href) {
    const workerRef = useRef<Worker | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [board, setBoard] = useState<number[][]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const worker = new Worker(new URL('../workers/gol.worker.ts', import.meta.url), {
            type: 'classic'
        })
        workerRef.current = worker

        worker.onmessage = (e: MessageEvent<GoLResponse>) => {
            const msg = e.data
            switch (msg.type) {
                case 'READY':
                    setIsReady(true)
                    break
                case 'BOARD_UPDATE':
                    setBoard(msg.payload)
                    break
                case 'ERROR':
                    setError(msg.payload)
                    console.error('GoL Worker Error:', msg.payload)
                    break
            }
        }

        worker.postMessage({ type: 'INIT', payload: { wasmUrl: scriptPath } } as GoLMessage)

        return () => {
            worker.terminate()
        }
    }, [scriptPath])

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

    return { isReady, board, setCell, step, clear, error }
}
