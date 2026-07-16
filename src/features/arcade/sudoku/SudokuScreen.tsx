import { useCallback, useEffect, useRef, useState } from 'react'
import { useSudoku } from '../../../hooks/useSudoku.ts'
import GameFrame from '../GameFrame.tsx'

const SIZE = 9
const INITIAL_SELECTION = { row: 4, column: 4 }

interface SudokuScreenProps {
    onBack: () => void
    keyboardActive?: boolean
}

function isGenericInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false
    if (target.closest('[role="gridcell"]')) return false
    return Boolean(
        target.closest(
            'a[href], area[href], button, input, select, textarea, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"])',
        ),
    )
}

export default function SudokuScreen({
    onBack,
    keyboardActive = true,
}: SudokuScreenProps) {
    const {
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
    } = useSudoku()
    const [selected, setSelected] = useState(INITIAL_SELECTION)
    const gridRef = useRef<HTMLDivElement>(null)
    const normalizedBoard = board.length === SIZE
        ? board
        : Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0))
    const normalizedInitialCells = initialCells.length === SIZE
        ? initialCells
        : Array.from({ length: SIZE }, () => Array<boolean>(SIZE).fill(false))
    const selectedIsGiven = normalizedInitialCells[selected.row]?.[selected.column] ?? false
    const status = error
        ? 'ENGINE ERROR'
        : !isReady
          ? 'LOADING…'
          : isResetting
            ? 'DEALING…'
            : isSolved
              ? 'COMPLETE'
              : 'PLAYING'
    const canEdit = isReady && !isResetting && !isSolved && !error
    const canReset = isReady && !isResetting && !error

    const placeValue = useCallback((value: number) => {
        if (!canEdit || normalizedInitialCells[selected.row]?.[selected.column]) return
        setCell(selected.row, selected.column, value)
    }, [canEdit, normalizedInitialCells, selected, setCell])

    const moveSelection = useCallback((rowDelta: number, columnDelta: number) => {
        const next = {
            row: Math.max(0, Math.min(SIZE - 1, selected.row + rowDelta)),
            column: Math.max(0, Math.min(SIZE - 1, selected.column + columnDelta)),
        }
        setSelected(next)
        gridRef.current
            ?.querySelector<HTMLButtonElement>(
                `[data-sudoku-row="${next.row}"][data-sudoku-column="${next.column}"]`,
            )
            ?.focus()
    }, [selected])

    useEffect(() => {
        if (!keyboardActive) return
        const handleKeyDown = (event: KeyboardEvent) => {
            const gameRoot =
                gridRef.current?.closest('#arcade') ??
                gridRef.current?.closest('[data-section-frame="wide"]')
            if (!(event.target instanceof Node) || !gameRoot?.contains(event.target)) return
            if (event.key === 'Escape') {
                event.preventDefault()
                onBack()
                return
            }
            if (isGenericInteractiveTarget(event.target)) return
            if (!canEdit) return
            if (event.key === 'ArrowUp') {
                event.preventDefault()
                moveSelection(-1, 0)
            } else if (event.key === 'ArrowDown') {
                event.preventDefault()
                moveSelection(1, 0)
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                moveSelection(0, -1)
            } else if (event.key === 'ArrowRight') {
                event.preventDefault()
                moveSelection(0, 1)
            } else if (/^[1-9]$/.test(event.key)) {
                event.preventDefault()
                placeValue(Number(event.key))
            } else if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
                event.preventDefault()
                placeValue(0)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [canEdit, keyboardActive, moveSelection, onBack, placeValue])

    const handleNewPuzzle = () => {
        if (!canReset) return
        setSelected(INITIAL_SELECTION)
        resetGame()
    }

    return (
        <GameFrame
            title="SUDOKU"
            status={status}
            statusClassName={error ? 'text-orange' : isSolved ? 'text-olive' : 'text-teal'}
            onBack={onBack}
            mobileHelp="select a cell, then place a number"
            sidebar={
                <div>
                    <p className="text-sm text-dim">
                        Selected · row {selected.row + 1} / column {selected.column + 1}
                    </p>
                    {error ? (
                        <button
                            type="button"
                            onClick={retry}
                            className="mt-6 min-h-11 border border-orange px-5 text-sm text-orange"
                        >
                            Retry
                        </button>
                    ) : null}
                    <div className="mt-6 grid grid-cols-3 gap-2 wide:grid-cols-1 wide:gap-3">
                        <button
                            type="button"
                            onClick={clearBoard}
                            disabled={!canEdit}
                            className="min-h-11 border border-border px-4 text-sm text-ink disabled:opacity-35"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={solveBoard}
                            disabled={!canEdit}
                            className="min-h-11 border border-border px-4 text-sm text-ink disabled:opacity-35"
                        >
                            Solve
                        </button>
                        <button
                            type="button"
                            onClick={handleNewPuzzle}
                            disabled={!canReset}
                            className="min-h-11 border border-border px-4 text-sm text-ink disabled:opacity-35"
                        >
                            New puzzle
                        </button>
                    </div>
                </div>
            }
            actionZone={
                <div
                    aria-label="Sudoku number pad"
                    className="mx-auto grid w-full max-w-[880px] grid-cols-5 gap-2 wide:grid-cols-10"
                >
                    {Array.from({ length: 9 }, (_, index) => index + 1).map((digit) => (
                        <button
                            key={digit}
                            type="button"
                            aria-label={`Place ${digit}`}
                            disabled={!canEdit || selectedIsGiven}
                            onClick={() => placeValue(digit)}
                            className="min-h-11 border border-border text-teal disabled:opacity-35"
                        >
                            {digit}
                        </button>
                    ))}
                    <button
                        type="button"
                        aria-label="Clear selected cell"
                        disabled={!canEdit || selectedIsGiven}
                        onClick={() => placeValue(0)}
                        className="min-h-11 border border-border text-teal disabled:opacity-35"
                    >
                        ×
                    </button>
                </div>
            }
            footer={
                <>
                    <span><span className="text-teal">[1-9]</span> PLACE</span>
                    <span><span className="text-lavender">[DEL]</span> CLEAR</span>
                    <span><span className="text-lavender">[←↑↓→]</span> NAVIGATE</span>
                    <span><span className="text-olive">[ESC]</span> BACK</span>
                </>
            }
        >
            <div
                ref={gridRef}
                role="grid"
                aria-label="Sudoku board"
                aria-busy={!isReady || isResetting}
                className="grid w-full max-w-[880px] border border-ink/70 wide:w-[min(100cqw,120cqh,880px)]"
            >
                {normalizedBoard.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        role="row"
                        className="grid min-w-0 grid-cols-9"
                    >
                        {row.map((value, columnIndex) => {
                            const isSelected =
                                rowIndex === selected.row && columnIndex === selected.column
                            const isGiven = normalizedInitialCells[rowIndex]?.[columnIndex] ?? false
                            const selectedBoxRow = Math.floor(selected.row / 3)
                            const selectedBoxColumn = Math.floor(selected.column / 3)
                            const isRelated =
                                rowIndex === selected.row ||
                                columnIndex === selected.column ||
                                (Math.floor(rowIndex / 3) === selectedBoxRow &&
                                    Math.floor(columnIndex / 3) === selectedBoxColumn)
                            const strongRight =
                                (columnIndex + 1) % 3 === 0 && columnIndex < SIZE - 1
                            const strongBottom =
                                (rowIndex + 1) % 3 === 0 && rowIndex < SIZE - 1

                            return (
                                <button
                                    key={`${rowIndex}-${columnIndex}`}
                                    type="button"
                                    role="gridcell"
                                    data-sudoku-row={rowIndex}
                                    data-sudoku-column={columnIndex}
                                    aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}${
                                        value ? `, ${value}${isGiven ? ', given' : ''}` : ', empty'
                                    }`}
                                    aria-selected={isSelected}
                                    tabIndex={isSelected ? 0 : -1}
                                    disabled={!canEdit}
                                    onClick={() =>
                                        setSelected({ row: rowIndex, column: columnIndex })
                                    }
                                    className={`flex aspect-[1.2/1] min-w-0 items-center justify-center border-r border-b border-border text-sm wide:text-[clamp(1rem,2vw,2rem)] ${
                                        strongRight ? 'border-r-ink/70' : ''
                                    } ${strongBottom ? 'border-b-ink/70' : ''} ${
                                        isSelected
                                            ? 'bg-orange/10 outline-2 -outline-offset-2 outline-orange'
                                            : isRelated
                                              ? 'bg-ink/[0.035]'
                                              : ''
                                    } ${
                                        value === 0
                                            ? 'text-muted'
                                            : isGiven
                                              ? 'text-ink'
                                              : 'text-lavender'
                                    }`}
                                >
                                    {value || '·'}
                                </button>
                            )
                        })}
                    </div>
                ))}
            </div>
        </GameFrame>
    )
}
