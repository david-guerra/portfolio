import { useState, useEffect, useCallback } from 'react'
import { useSudoku } from '../../../hooks/useSudoku'
import { cn } from '../../../lib/utils'
import { BackButton } from '../../../components/ui/BackButton'


const ROWS = 9;
const COLS = 9;

export function SudokuView({ onBack }: { onBack: () => void }) {
    const { isReady, board, initialCells, isSolved, setCell, resetGame, clearBoard, solveBoard, error } = useSudoku();
    const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (isSolved || !selectedCell) return;
        const { r, c } = selectedCell;

        // Navigation always works
        if (e.key === 'ArrowUp' && r > 0) {
            setSelectedCell({ r: r - 1, c });
        } else if (e.key === 'ArrowDown' && r < ROWS - 1) {
            setSelectedCell({ r: r + 1, c });
        } else if (e.key === 'ArrowLeft' && c > 0) {
            setSelectedCell({ r, c: c - 1 });
        } else if (e.key === 'ArrowRight' && c < COLS - 1) {
            setSelectedCell({ r, c: c + 1 });
        } else if (e.key === 'Escape') {
            setSelectedCell(null);
            // Editing only on non-initial cells
        } else if (!initialCells[r]?.[c]) {
            if (e.key >= '1' && e.key <= '9') {
                setCell(r, c, parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                setCell(r, c, 0);
            }
        }
    }, [selectedCell, initialCells, setCell, isSolved]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleNewGame = () => {
        resetGame();
        setSelectedCell(null);
    };

    if (error) {
        return (
            <div className="flex flex-col h-full">
                <BackButton onClick={onBack} />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gruv-red text-sm">Error: {error}</p>
                </div>
            </div>
        );
    }

    if (!isReady || board.length === 0) {
        return (
            <div className="flex flex-col h-full">
                <BackButton onClick={onBack} />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gruv-fg/50 animate-pulse">Loading Sudoku...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full items-center justify-center gap-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row w-full md:justify-between items-start md:items-center gap-1" style={{ maxWidth: '360px' }}>
                <BackButton onClick={onBack} />
                <div className="flex items-center gap-1 self-center md:self-auto">
                    <button
                        onClick={() => { clearBoard(); setSelectedCell(null); }}
                        className="text-sm px-3 py-1 bg-gruv-bg-soft border border-bento rounded-lg text-gruv-fg/70 hover:text-gruv-red hover:border-gruv-red transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => { solveBoard(); setSelectedCell(null); }}
                        className="text-sm px-3 py-1 bg-gruv-bg-soft border border-bento rounded-lg text-gruv-fg/70 hover:text-gruv-aqua hover:border-gruv-aqua transition-colors"
                    >
                        Solve
                    </button>
                    <button
                        onClick={handleNewGame}
                        className="text-sm px-3 py-1 bg-gruv-bg-soft border border-bento rounded-lg text-gruv-fg/70 hover:text-gruv-yellow hover:border-gruv-yellow transition-colors"
                    >
                        New Game
                    </button>
                </div>
            </div>

            {/* Board */}
            <div className="flex flex-col items-center justify-center w-full">
                <div
                    className={cn(
                        "grid border-2 rounded-sm transition-colors duration-700 max-w-full",
                        isSolved ? "border-gruv-green/60" : "border-gruv-fg/60"
                    )}
                    style={{
                        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                        width: '360px',
                        aspectRatio: '1',
                    }}
                >
                    {board.map((row, r) =>
                        row.map((val, c) => {
                            const isSelected = !isSolved && selectedCell?.r === r && selectedCell?.c === c;
                            const isInitial = initialCells[r]?.[c];
                            const sameRow = !isSolved && selectedCell?.r === r;
                            const sameCol = !isSolved && selectedCell?.c === c;
                            const sameBox =
                                !isSolved &&
                                selectedCell &&
                                Math.floor(selectedCell.r / 3) === Math.floor(r / 3) &&
                                Math.floor(selectedCell.c / 3) === Math.floor(c / 3);
                            const isHighlighted = !isSelected && (sameRow || sameCol || sameBox);

                            // 3×3 box borders
                            const borderRight = (c + 1) % 3 === 0 && c < COLS - 1;
                            const borderBottom = (r + 1) % 3 === 0 && r < ROWS - 1;

                            return (
                                <button
                                    key={`${r}-${c}`}
                                    onClick={() => !isSolved && setSelectedCell({ r, c })}
                                    className={cn(
                                        "flex items-center justify-center text-sm md:text-base font-bold transition-colors duration-700 aspect-square",
                                        "border border-gruv-fg/10",
                                        borderRight && "border-r-2 border-r-gruv-fg/40",
                                        borderBottom && "border-b-2 border-b-gruv-fg/40",
                                        isSolved
                                            ? "bg-gruv-green/10 text-gruv-green"
                                            : isSelected
                                                ? "bg-gruv-yellow/20 text-gruv-yellow"
                                                : isHighlighted
                                                    ? "bg-gruv-fg/5"
                                                    : "bg-transparent",
                                        !isSolved && isInitial && "text-gruv-fg",
                                        !isSolved && !isInitial && val !== 0 && "text-gruv-blue",
                                        !isSolved && val === 0 && "text-transparent",
                                        !isSolved && !isInitial && "cursor-pointer hover:bg-gruv-fg/10",
                                        isSolved && "cursor-default"
                                    )}
                                >
                                    {val !== 0 ? val : '·'}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Win message */}
                {isSolved && (
                    <div className="mt-3 text-center space-y-3 animate-fade-in">
                        <p className="text-gruv-green font-bold text-lg">Sudoku Complete!</p>
                        <button
                            onClick={handleNewGame}
                            className="text-sm px-4 py-2 bg-gruv-green/20 border border-gruv-green/40 rounded-lg text-gruv-green hover:bg-gruv-green/30 transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            {!isSolved && (
                <div className="mt-2 text-center text-gruv-fg/30 text-xs">
                    [1-9] PLACE   [DEL] CLEAR   [←↑↓→] NAVIGATE
                </div>
            )}
        </div>
    );
}
