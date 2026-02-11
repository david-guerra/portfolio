import { useEffect, useRef, useState, useCallback } from 'react';
import type { SudokuMessage, SudokuResponse } from '../workers/sudoku.worker';

export function useSudoku(scriptPath: string = new URL('/my_portfolio/wasm/sudoku.js', window.location.origin).href) {
    const workerRef = useRef<Worker | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [board, setBoard] = useState<number[][]>([]);
    const [initialCells, setInitialCells] = useState<boolean[][]>([]);
    const [isSolved, setIsSolved] = useState(false);
    const needsSnapshotRef = useRef(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const worker = new Worker(new URL('../workers/sudoku.worker.ts', import.meta.url), {
            type: 'classic'
        });
        workerRef.current = worker;

        worker.onmessage = (e: MessageEvent<SudokuResponse>) => {
            const msg = e.data;
            switch (msg.type) {
                case 'READY':
                    setIsReady(true);
                    break;
                case 'BOARD_UPDATE':
                    setBoard(msg.payload.board);
                    setIsSolved(msg.payload.solved);
                    if (needsSnapshotRef.current) {
                        setInitialCells(msg.payload.board.map(row => row.map(val => val !== 0)));
                        needsSnapshotRef.current = false;
                    }
                    break;
                case 'ERROR':
                    setError(msg.payload);
                    console.error('Sudoku Worker Error:', msg.payload);
                    break;
            }
        };

        worker.postMessage({ type: 'INIT', payload: { wasmUrl: scriptPath } } as SudokuMessage);

        return () => {
            worker.terminate();
        };
    }, [scriptPath]);

    const setCell = useCallback((row: number, col: number, val: number) => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'SET_CELL', payload: { row, col, val } } as SudokuMessage);
        }
    }, [isReady]);

    const resetGame = useCallback(() => {
        if (workerRef.current && isReady) {
            needsSnapshotRef.current = true;
            workerRef.current.postMessage({ type: 'RESET' } as SudokuMessage);
        }
    }, [isReady]);

    const clearBoard = useCallback(() => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'CLEAR_USER' } as SudokuMessage);
        }
    }, [isReady]);

    const solveBoard = useCallback(() => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'SOLVE' } as SudokuMessage);
        }
    }, [isReady]);

    return { isReady, board, initialCells, isSolved, setCell, resetGame, clearBoard, solveBoard, error };
}
