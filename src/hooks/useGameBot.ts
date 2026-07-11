import { useEffect, useRef, useState, useCallback } from 'react';
import type { BotMessage, BotResponse } from '../workers/bot.worker';

export function useGameBot(scriptPath: string = new URL(import.meta.env.BASE_URL + 'wasm/game_bot.js', window.location.origin).href) {
    const workerRef = useRef<Worker | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [board, setBoard] = useState<number[][]>([]);
    const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'draw'>('playing');
    const [winner, setWinner] = useState<number>(0);
    const [lastBotMove, setLastBotMove] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [workerGeneration, setWorkerGeneration] = useState(0);

    useEffect(() => {
        setIsReady(false);
        setError(null);

        // Instantiate the worker as 'classic'
        const worker = new Worker(new URL('../workers/bot.worker.ts', import.meta.url), {
            type: 'classic'
        });
        workerRef.current = worker;

        worker.onmessage = (e: MessageEvent<BotResponse>) => {
            const msg = e.data;
            switch (msg.type) {
                case 'READY':
                    setIsReady(true);
                    break;
                case 'GAME_UPDATE':
                    setBoard(msg.payload.board);
                    setGameStatus(msg.payload.status as any);
                    setWinner(msg.payload.winner);
                    break;
                case 'MOVE_COMPUTED':
                    setLastBotMove(msg.payload);
                    break;
                case 'ERROR':
                    setIsReady(false);
                    setError(msg.payload);
                    console.error('Bot Worker Error:', msg.payload);
                    break;
            }
        };

        worker.onerror = (event) => {
            setIsReady(false);
            setError(event.message || 'The Connect 4 engine failed to start.');
        };

        worker.postMessage({ type: 'INIT', payload: { wasmUrl: scriptPath } } as BotMessage);

        return () => {
            worker.terminate();
        };
    }, [scriptPath, workerGeneration]);

    const makeMove = useCallback((col: number) => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'USER_MOVE', payload: col } as BotMessage);
        }
    }, [isReady]);

    const computeBotMove = useCallback(() => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'COMPUTE_MOVE', payload: null } as BotMessage);
        }
    }, [isReady]);

    const resetGame = useCallback(() => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'RESET', payload: null } as BotMessage);
            setLastBotMove(null);
        }
    }, [isReady]);

    const setDifficulty = useCallback((depth: number) => {
        if (workerRef.current && isReady) {
            workerRef.current.postMessage({ type: 'SET_DIFFICULTY', payload: depth } as BotMessage);
        }
    }, [isReady]);

    const retry = useCallback(() => {
        setError(null);
        setWorkerGeneration((generation) => generation + 1);
    }, []);

    return { isReady, board, gameStatus, winner, makeMove, computeBotMove, lastBotMove, resetGame, setDifficulty, error, retry };
}
