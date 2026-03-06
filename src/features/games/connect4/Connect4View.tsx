import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useGameBot } from '../../../hooks/useGameBot';
import { BackButton } from '../../../components/ui/BackButton';

const ROWS = 6;
const COLS = 7;

export function Connect4View({ initialDepth, onBack }: { initialDepth: number; onBack: () => void }) {

    const [localTurn, setLocalTurn] = useState<1 | 2>(1);
    const [selectedCol, setSelectedCol] = useState(3);

    const { isReady, board, gameStatus, winner, makeMove, computeBotMove, resetGame, setDifficulty } = useGameBot();

    // Set difficulty on mount
    useEffect(() => {
        setDifficulty(initialDepth);
        resetGame();
    }, [initialDepth, setDifficulty, resetGame]);

    useEffect(() => {
        if (gameStatus === 'playing') {
            if (localTurn === 2) {
                const timer = setTimeout(() => {
                    computeBotMove();
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [localTurn, gameStatus, computeBotMove]);

    useEffect(() => {
        if (board.length === 0) return;

        let p1 = 0, p2 = 0;
        board.flat().forEach(c => {
            if (c === 1) p1++;
            if (c === 2) p2++;
        });

        const nextTurn = p1 > p2 ? 2 : 1;
        setLocalTurn(nextTurn);

    }, [board]);


    const handleColumnClick = (colIndex: number) => {
        setSelectedCol(colIndex);
        if (!isReady || gameStatus !== 'playing' || localTurn !== 1) return;
        makeMove(colIndex);
    };

    const handleDrop = () => {
        if (!isReady || gameStatus !== 'playing' || localTurn !== 1) return;
        makeMove(selectedCol);
    }

    const moveSelection = (direction: -1 | 1) => {
        setSelectedCol(prev => {
            const next = prev + direction;
            if (next < 0) return COLS - 1;
            if (next >= COLS) return 0;
            return next;
        });
    }

    const handleReset = () => {
        resetGame();
        setLocalTurn(1);
        setSelectedCol(3);
    }

    return (
        <div className="flex flex-col h-full items-center justify-center p-2 relative w-full gap-2">
            <div className="flex w-full max-w-md justify-between items-center">
                <BackButton onClick={onBack} />
                <button
                    onClick={handleReset}
                    className="text-sm px-3 py-1 bg-gruv-bg-soft border border-bento rounded-lg text-gruv-fg/70 hover:text-gruv-yellow hover:border-gruv-yellow transition-colors"
                >
                    New Game
                </button>
            </div>

            <div className="mb-2 text-gruv-fg font-mono">
                {gameStatus === 'playing' ? (
                    <span>TURN: <span className={localTurn === 1 ? "text-red-500" : "text-yellow-500"}>{localTurn === 1 ? "YOU (RED)" : "BOT (YELLOW)"}</span></span>
                ) : gameStatus === 'won' ? (
                    <span className="text-xl font-bold text-gruv-yellow">{winner === 1 ? "YOU WON!" : "BOT WINS!"}</span>
                ) : (
                    <span>DRAW!</span>
                )}
                {!isReady && <span className="ml-4 text-xs text-gruv-fg/50">(Loading Bot...)</span>}
            </div>

            {/* Board */}
            <div className="bg-gruv-bg-hard p-1 md:p-2 rounded-lg border-2 border-gruv-fg shadow-lg w-full max-w-md aspect-[7/6]">
                <div className="grid grid-cols-7 gap-1 h-full items-stretch">
                    {Array.from({ length: COLS }).map((_, colIndex) => (
                        <div
                            key={colIndex}
                            className={cn(
                                "flex flex-col gap-1 cursor-pointer rounded transition-all h-full justify-evenly px-0.5 py-1 md:hover:bg-white/5",
                                selectedCol === colIndex && localTurn === 1
                                    ? "bg-white/10 ring-1 ring-gruv-fg/50 md:bg-transparent md:ring-0"
                                    : ""
                            )}
                            onClick={() => handleColumnClick(colIndex)}
                        >
                            {board.length > 0 ? board.map((row, rowIndex) => (
                                <div key={`${rowIndex}-${colIndex}`} className="w-full aspect-square rounded-full bg-gruv-bg border border-gruv-fg/20 flex items-center justify-center relative overflow-hidden">
                                    {row[colIndex] !== 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className={cn(
                                                "w-full h-full rounded-full",
                                                row[colIndex] === 1 ? "bg-red-500" : "bg-yellow-500"
                                            )}
                                        />
                                    )}
                                </div>
                            )) : (
                                Array(ROWS).fill(0).map((_, i) => (
                                    <div key={i} className="w-full aspect-square rounded-full bg-gruv-bg/50 border border-gruv-fg/10" />
                                ))
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Controls - Hidden on Desktop */}
            <div className="flex gap-4 items-center justify-center w-full max-w-md md:hidden">
                <button
                    onClick={() => moveSelection(-1)}
                    className="p-4 bg-gruv-bg-soft rounded-full border border-gruv-fg hover:bg-gruv-fg hover:text-gruv-bg transition-colors active:scale-95"
                >
                    ←
                </button>

                <button
                    onClick={handleDrop}
                    disabled={gameStatus !== 'playing' || localTurn !== 1}
                    className="flex-1 py-4 bg-gruv-green text-gruv-bg font-bold rounded-lg hover:bg-gruv-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-xl"
                >
                    DROP
                </button>

                <button
                    onClick={() => moveSelection(1)}
                    className="p-4 bg-gruv-bg-soft rounded-full border border-gruv-fg hover:bg-gruv-fg hover:text-gruv-bg transition-colors active:scale-95"
                >
                    →
                </button>
            </div>
        </div>
    );
}
