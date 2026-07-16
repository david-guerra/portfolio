import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGameBot } from '../../../hooks/useGameBot.ts'
import GameFrame from '../GameFrame.tsx'

const ROWS = 6
const COLUMNS = 7

const DIFFICULTIES = [
    { depth: 4, label: 'EASY · DEPTH 4' },
    { depth: 6, label: 'MEDIUM · DEPTH 6' },
    { depth: 12, label: 'HARD · DEPTH 12' },
] as const

interface ConnectFourScreenProps {
    onBack: () => void
    keyboardActive?: boolean
}

export default function ConnectFourScreen({
    onBack,
    keyboardActive = true,
}: ConnectFourScreenProps) {
    const {
        isReady,
        board,
        gameStatus,
        winner,
        makeMove,
        computeBotMove,
        resetGame,
        setDifficulty,
        error,
        retry,
    } = useGameBot()
    const [selectedColumn, setSelectedColumn] = useState(3)
    const [depth, setDepth] = useState(12)
    const [pendingBoardSignature, setPendingBoardSignature] = useState<string | null>(null)
    const gridRef = useRef<HTMLDivElement>(null)
    const botTimerRef = useRef<number | null>(null)
    const boardSignature = board.flat().join(',')

    const { playerPieces, botPieces } = useMemo(() => {
        let playerPieces = 0
        let botPieces = 0
        for (const cell of board.flat()) {
            if (cell === 1) playerPieces += 1
            if (cell === 2) botPieces += 1
        }
        return { playerPieces, botPieces }
    }, [board])
    const botTurn = gameStatus === 'playing' && playerPieces > botPieces
    const movePending = pendingBoardSignature === boardSignature
    const canMove = isReady && !error && gameStatus === 'playing' && !botTurn && !movePending

    useEffect(() => {
        if (isReady) setDifficulty(depth)
    }, [depth, isReady, setDifficulty])

    useEffect(() => {
        if (!botTurn) return
        const timer = window.setTimeout(() => {
            if (botTimerRef.current === timer) botTimerRef.current = null
            computeBotMove()
        }, 450)
        botTimerRef.current = timer
        return () => {
            window.clearTimeout(timer)
            if (botTimerRef.current === timer) botTimerRef.current = null
        }
    }, [botTurn, computeBotMove])

    const moveSelection = useCallback((delta: -1 | 1) => {
        const nextColumn = (selectedColumn + delta + COLUMNS) % COLUMNS
        setSelectedColumn(nextColumn)
        gridRef.current
            ?.querySelector<HTMLButtonElement>(
                `[data-connect-row="0"][data-connect-column="${nextColumn}"]`,
            )
            ?.focus()
    }, [selectedColumn])

    const dropInColumn = useCallback((column: number) => {
        setSelectedColumn(column)
        if (!canMove || board[0]?.[column]) return
        setPendingBoardSignature(boardSignature)
        makeMove(column)
    }, [board, boardSignature, canMove, makeMove])

    useEffect(() => {
        if (!keyboardActive) return
        const handleKeyDown = (event: KeyboardEvent) => {
            const gameRoot =
                gridRef.current?.closest('#arcade') ??
                gridRef.current?.closest('[data-section-frame="wide"]')
            if (!(event.target instanceof Node) || !gameRoot?.contains(event.target)) return
            if (event.key === 'Escape') {
                onBack()
                return
            }
            const targetIsGridCell =
                event.target instanceof HTMLElement && event.target.getAttribute('role') === 'gridcell'
            const targetIsInteractive =
                event.target instanceof Element &&
                Boolean(
                    event.target.closest(
                        'button, input, select, textarea, a, [contenteditable="true"]',
                    ),
                )
            if (
                !targetIsGridCell &&
                targetIsInteractive
            ) {
                return
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault()
                moveSelection(-1)
            } else if (event.key === 'ArrowRight') {
                event.preventDefault()
                moveSelection(1)
            } else if (event.key === 'Enter') {
                if (targetIsGridCell) event.preventDefault()
                dropInColumn(selectedColumn)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [dropInColumn, keyboardActive, moveSelection, onBack, selectedColumn])

    const handleReset = () => {
        if (botTimerRef.current !== null) {
            window.clearTimeout(botTimerRef.current)
            botTimerRef.current = null
        }
        setPendingBoardSignature(null)
        setSelectedColumn(3)
        resetGame()
    }

    const status = error
        ? 'BOT INIT FAILED'
        : !isReady
          ? 'LOADING BOT…'
          : gameStatus === 'won'
            ? winner === 1
                ? 'YOU WON'
                : 'BOT WINS'
            : gameStatus === 'draw'
              ? 'DRAW'
              : botTurn || movePending
                ? 'BOT THINKING…'
                : 'YOUR TURN'

    const normalizedBoard = board.length === ROWS
        ? board
        : Array.from({ length: ROWS }, () => Array<number>(COLUMNS).fill(0))

    return (
        <GameFrame
            title="CONNECT FOUR"
            subtitle="You vs Bot"
            status={status}
            onBack={onBack}
            mobileHelp="tap a column to drop"
            sidebar={
                <div className="flex flex-wrap items-end gap-4 wide:block">
                    <label className="block text-xs text-dim">
                        <span className="sr-only">Difficulty</span>
                        <select
                            aria-label="Difficulty"
                            value={depth}
                            onChange={(event) => setDepth(Number(event.target.value))}
                            className="min-h-11 cursor-pointer rounded-none border border-border bg-bg px-4 text-sm text-ink outline-none focus-visible:border-orange"
                        >
                            {DIFFICULTIES.map((difficulty) => (
                                <option key={difficulty.depth} value={difficulty.depth}>
                                    {difficulty.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="flex gap-5 text-sm wide:mt-8 wide:flex-col wide:gap-3">
                        <span className="flex items-center gap-3 text-body">
                            <i aria-hidden="true" className="h-4 w-4 bg-orange" /> YOU
                        </span>
                        <span className="flex items-center gap-3 text-body">
                            <i aria-hidden="true" className="h-4 w-4 bg-olive" /> BOT
                        </span>
                    </div>

                    {error ? (
                        <button
                            type="button"
                            onClick={retry}
                            className="min-h-11 border border-orange px-5 text-sm text-orange wide:mt-8"
                        >
                            Retry
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={handleReset}
                        className="min-h-11 border border-orange px-5 text-sm text-ink wide:mt-8"
                    >
                        New game
                    </button>
                </div>
            }
            footer={
                <>
                    <span><span className="text-lavender">[↔]</span> SELECT COLUMN</span>
                    <span><span className="text-teal">[ENTER]</span> DROP</span>
                    <span><span className="text-olive">[ESC]</span> BACK</span>
                </>
            }
        >
            <div
                ref={gridRef}
                role="grid"
                aria-label="Connect Four board"
                aria-busy={!isReady}
                className="grid w-full max-w-[780px] border border-border"
            >
                {normalizedBoard.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        role="row"
                        className="grid min-w-0 grid-cols-7"
                    >
                        {row.map((piece, columnIndex) => {
                            const selected = selectedColumn === columnIndex
                            return (
                                <button
                                    key={`${rowIndex}-${columnIndex}`}
                                    type="button"
                                    role="gridcell"
                                    data-connect-row={rowIndex}
                                    data-connect-column={columnIndex}
                                    tabIndex={selected && rowIndex === 0 ? 0 : -1}
                                    aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}, ${
                                        piece === 1
                                            ? 'your piece'
                                            : piece === 2
                                              ? 'bot piece'
                                              : 'empty'
                                    }. Drop in column ${columnIndex + 1}`}
                                    aria-selected={selected}
                                    aria-disabled={!canMove || Boolean(normalizedBoard[0]?.[columnIndex])}
                                    onMouseEnter={() => setSelectedColumn(columnIndex)}
                                    onFocus={() => setSelectedColumn(columnIndex)}
                                    onClick={() => dropInColumn(columnIndex)}
                                    className={`relative aspect-square cursor-pointer border border-border p-[12%] aria-disabled:cursor-default ${
                                        selected ? 'border-x-orange' : ''
                                    }`}
                                >
                                    {selected && rowIndex === 0 ? (
                                        <span
                                            aria-hidden="true"
                                            className="absolute -top-3 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[8px] border-t-[10px] border-x-transparent border-t-orange"
                                        />
                                    ) : null}
                                    <span
                                        aria-hidden="true"
                                        className={`block h-full w-full rounded-full border ${
                                            piece === 1
                                                ? 'border-orange bg-orange'
                                                : piece === 2
                                                  ? 'border-olive bg-olive'
                                                  : 'border-dim/55'
                                        }`}
                                    />
                                </button>
                            )
                        })}
                    </div>
                ))}
            </div>
        </GameFrame>
    )
}
