import { useEffect, useRef, useState, useCallback } from 'react';
import type { BotMessage, BotResponse } from '../workers/bot.worker';

export function useGameBot(scriptPath: string = '/wasm/game_bot.js') {
    const workerRef = useRef<Worker | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [board, setBoard] = useState<number[][]>([]);
    const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'draw'>('playing');
    const [winner, setWinner] = useState<number>(0);
    const [lastBotMove, setLastBotMove] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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
                    setError(msg.payload);
                    console.error('Bot Worker Error:', msg.payload);
                    break;
            }
        };

        worker.postMessage({ type: 'INIT', payload: { wasmUrl: scriptPath } } as BotMessage);

        return () => {
            worker.terminate();
        };
    }, [scriptPath]);

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

    return { isReady, board, gameStatus, winner, makeMove, computeBotMove, lastBotMove, resetGame, error };
}
