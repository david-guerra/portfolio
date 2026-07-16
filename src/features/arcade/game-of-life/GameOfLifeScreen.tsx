import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
} from 'react'
import { useGameOfLife } from '../../../hooks/useGameOfLife.ts'
import type { Theme } from '../../../lib/theme.ts'
import GameFrame from '../GameFrame.tsx'

interface GameOfLifeScreenProps {
    keyboardActive?: boolean
    onBack: () => void
    theme?: Theme
}

type GridCell = readonly [row: number, column: number]

function cellsOnLine(from: GridCell, to: GridCell): GridCell[] {
    let [row, column] = from
    const [targetRow, targetColumn] = to
    const columnDistance = Math.abs(targetColumn - column)
    const columnStep = column < targetColumn ? 1 : -1
    const rowDistance = -Math.abs(targetRow - row)
    const rowStep = row < targetRow ? 1 : -1
    let error = columnDistance + rowDistance
    const cells: GridCell[] = []

    while (true) {
        cells.push([row, column])
        if (row === targetRow && column === targetColumn) return cells

        const doubledError = error * 2
        if (doubledError >= rowDistance) {
            error += rowDistance
            column += columnStep
        }
        if (doubledError <= columnDistance) {
            error += columnDistance
            row += rowStep
        }
    }
}

function describeCell(row: number, column: number, alive: boolean) {
    return `Row ${row + 1}, column ${column + 1}, ${alive ? 'alive' : 'dead'}`
}

export default function GameOfLifeScreen({
    keyboardActive = true,
    onBack,
    theme = 'dark',
}: GameOfLifeScreenProps) {
    const { isReady, board, setCell, step, clear, randomize, error, retry } = useGameOfLife()
    const [running, setRunning] = useState(false)
    const [painting, setPainting] = useState(false)
    const [speedValue, setSpeedValue] = useState(400)
    const [hoveredCell, setHoveredCell] = useState<readonly [number, number] | null>(null)
    const [requestedKeyboardCell, setKeyboardCell] = useState<readonly [number, number]>([0, 0])
    const [canvasFocused, setCanvasFocused] = useState(false)
    const [cellAnnouncement, setCellAnnouncement] = useState('')
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const activePointerIdRef = useRef<number | null>(null)
    const paintingRef = useRef(false)
    const paintValueRef = useRef(1)
    const lastPaintedCellRef = useRef<GridCell | null>(null)
    const paintedCellsRef = useRef(new Set<string>())
    const resumeAfterPaintRef = useRef(false)
    const hasLivingCells = board.some((row) => row.some(Boolean))
    const status = error
        ? 'ENGINE ERROR'
        : !isReady
          ? 'LOADING…'
          : painting
            ? 'PAINTING'
            : running
              ? 'RUNNING'
              : 'PAUSED'
    const intervalMs = 850 - speedValue
    const rows = board.length
    const columns = board[0]?.length ?? 0
    const keyboardCell = [
        Math.min(requestedKeyboardCell[0], Math.max(0, rows - 1)),
        Math.min(requestedKeyboardCell[1], Math.max(0, columns - 1)),
    ] as const
    const activeCell = hoveredCell ?? (canvasFocused ? keyboardCell : null)

    useEffect(() => {
        if (!running || painting || !isReady || error) return
        const timer = window.setInterval(step, intervalMs)
        return () => window.clearInterval(timer)
    }, [error, intervalMs, isReady, painting, running, step])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || typeof ResizeObserver === 'undefined') return
        const updateSize = () => {
            const rect = canvas.getBoundingClientRect()
            setCanvasSize((current) =>
                current.width === rect.width && current.height === rect.height
                    ? current
                    : { width: rect.width, height: rect.height },
            )
        }
        const observer = new ResizeObserver(updateSize)
        observer.observe(canvas)
        updateSize()
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !rows || !columns || !canvasSize.width || !canvasSize.height) return
        const context = canvas.getContext('2d')
        if (!context) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
        const backingWidth = Math.round(canvasSize.width * dpr)
        const backingHeight = Math.round(canvasSize.height * dpr)
        if (canvas.width !== backingWidth) canvas.width = backingWidth
        if (canvas.height !== backingHeight) canvas.height = backingHeight
        context.setTransform(dpr, 0, 0, dpr, 0, 0)

        const styles = getComputedStyle(document.documentElement)
        const background = styles.getPropertyValue('--bg').trim() || '#0d0d0f'
        const grid = styles.getPropertyValue('--border').trim() || '#2a2a2e'
        const alive = styles.getPropertyValue('--olive').trim() || '#c3d94a'
        const hover = styles.getPropertyValue('--orange').trim() || '#e8734a'
        const cellWidth = canvasSize.width / columns
        const cellHeight = canvasSize.height / rows

        context.fillStyle = background
        context.fillRect(0, 0, canvasSize.width, canvasSize.height)
        context.fillStyle = grid
        for (let row = 0; row <= rows; row += 1) {
            context.fillRect(0, row * cellHeight, canvasSize.width, 1)
        }
        for (let column = 0; column <= columns; column += 1) {
            context.fillRect(column * cellWidth, 0, 1, canvasSize.height)
        }
        context.fillStyle = alive
        for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
                if (!board[row]?.[column]) continue
                context.fillRect(
                    column * cellWidth + 1,
                    row * cellHeight + 1,
                    Math.max(1, cellWidth - 2),
                    Math.max(1, cellHeight - 2),
                )
            }
        }
        if (activeCell) {
            const [row, column] = activeCell
            context.fillStyle = hover
            context.fillRect(
                column * cellWidth + 1,
                row * cellHeight + 1,
                Math.max(1, cellWidth - 2),
                Math.max(1, cellHeight - 2),
            )
        }
    }, [activeCell, board, canvasSize, columns, rows, theme])

    const cellFromPointer = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas || !rows || !columns) return null
        const rect = canvas.getBoundingClientRect()
        if (!rect.width || !rect.height) return null
        const column = Math.floor(((event.clientX - rect.left) / rect.width) * columns)
        const row = Math.floor(((event.clientY - rect.top) / rect.height) * rows)
        if (row < 0 || row >= rows || column < 0 || column >= columns) return null
        return [row, column] as const
    }, [columns, rows])

    const paintToCell = useCallback((row: number, column: number) => {
        const target = [row, column] as const
        const start = lastPaintedCellRef.current ?? target
        for (const [paintRow, paintColumn] of cellsOnLine(start, target)) {
            const key = `${paintRow}:${paintColumn}`
            if (paintedCellsRef.current.has(key)) continue
            paintedCellsRef.current.add(key)
            setCell(paintRow, paintColumn, paintValueRef.current)
        }
        lastPaintedCellRef.current = target
    }, [setCell])

    const startPaint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (activePointerIdRef.current !== null) return
        const cell = cellFromPointer(event)
        if (!cell || !isReady || error) return
        event.preventDefault()
        event.currentTarget.setPointerCapture?.(event.pointerId)
        const [row, column] = cell
        activePointerIdRef.current = event.pointerId
        paintingRef.current = true
        setPainting(true)
        resumeAfterPaintRef.current = running
        if (running) setRunning(false)
        paintValueRef.current = board[row]?.[column] ? 0 : 1
        lastPaintedCellRef.current = null
        paintedCellsRef.current.clear()
        setHoveredCell(cell)
        paintToCell(row, column)
    }

    const continuePaint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (
            paintingRef.current &&
            event.pointerId !== activePointerIdRef.current
        ) {
            return
        }
        if (paintingRef.current) event.preventDefault()
        const cell = cellFromPointer(event)
        if (!cell) return
        setHoveredCell(cell)
        if (paintingRef.current) paintToCell(cell[0], cell[1])
    }

    const stopPaint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (
            !paintingRef.current ||
            event.pointerId !== activePointerIdRef.current
        ) {
            return
        }
        event.preventDefault()
        paintingRef.current = false
        activePointerIdRef.current = null
        setPainting(false)
        lastPaintedCellRef.current = null
        paintedCellsRef.current.clear()
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture?.(event.pointerId)
        }
        if (resumeAfterPaintRef.current) setRunning(true)
        resumeAfterPaintRef.current = false
    }

    const handleClear = () => {
        if (paintingRef.current) return
        resumeAfterPaintRef.current = false
        setRunning(false)
        clear()
    }

    const handleRandom = () => {
        if (paintingRef.current) return
        resumeAfterPaintRef.current = false
        setRunning(false)
        randomize()
    }

    const handleCanvasKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
        if (!keyboardActive) return
        event.stopPropagation()
        if (event.key === 'Escape') {
            onBack()
            return
        }
        const [row, column] = keyboardCell
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault()
            const delta = event.key === 'ArrowUp' ? -1 : 1
            const nextRow = Math.max(0, Math.min(rows - 1, row + delta))
            setKeyboardCell([nextRow, column])
            if (canvasFocused) {
                setCellAnnouncement(
                    describeCell(nextRow, column, Boolean(board[nextRow]?.[column])),
                )
            }
            return
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault()
            const delta = event.key === 'ArrowLeft' ? -1 : 1
            const nextColumn = Math.max(0, Math.min(columns - 1, column + delta))
            setKeyboardCell([row, nextColumn])
            if (canvasFocused) {
                setCellAnnouncement(
                    describeCell(row, nextColumn, Boolean(board[row]?.[nextColumn])),
                )
            }
            return
        }
        if (
            (event.key === 'Enter' || event.key === ' ') &&
            isReady &&
            !error &&
            !painting &&
            rows > 0 &&
            columns > 0
        ) {
            event.preventDefault()
            const nextValue = board[row]?.[column] ? 0 : 1
            setCell(row, column, nextValue)
            if (canvasFocused) {
                setCellAnnouncement(describeCell(row, column, Boolean(nextValue)))
            }
        }
    }

    useEffect(() => {
        if (!keyboardActive) return
        const handleKeyDown = (event: KeyboardEvent) => {
            const gameRoot =
                canvasRef.current?.closest('#arcade') ??
                canvasRef.current?.closest('[data-section-frame="wide"]')
            if (!(event.target instanceof Node) || !gameRoot?.contains(event.target)) return
            if (event.target === canvasRef.current) return
            if (event.key === 'Escape') {
                event.preventDefault()
                onBack()
                return
            }
            if (
                event.target instanceof Element &&
                event.target.closest(
                    'button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="checkbox"], [role="combobox"], [role="menuitem"], [role="option"], [role="radio"], [role="slider"], [role="spinbutton"], [role="switch"], [role="tab"], [role="textbox"]',
                )
            ) {
                return
            }
            if (event.key === ' ' && isReady && !error && !painting) {
                event.preventDefault()
                setRunning((current) => !current)
            } else if (
                event.key === 'ArrowRight' &&
                isReady &&
                !error &&
                !running &&
                !painting
            ) {
                event.preventDefault()
                step()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [error, isReady, keyboardActive, onBack, painting, running, step])

    return (
        <GameFrame
            title="GAME OF LIFE"
            status={status}
            statusClassName={
                error || painting ? 'text-orange' : running ? 'text-teal' : 'text-olive'
            }
            onBack={onBack}
            mobileHelp={
                canvasFocused
                    ? 'arrow keys move · Enter or Space toggles a cell'
                    : 'touch + drag to paint · painting pauses then resumes'
            }
            sidebar={
                <div>
                    <p className="text-sm text-dim">
                        {hasLivingCells ? 'paint to reshape the pattern' : 'paint cells to begin'}
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
                    <div className="mt-8 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setRunning((current) => !current)}
                            disabled={!isReady || Boolean(error) || painting}
                            className="min-h-14 border border-orange px-4 text-sm text-ink disabled:opacity-35"
                        >
                            {running ? 'Pause' : 'Play'}
                        </button>
                        <button
                            type="button"
                            onClick={step}
                            disabled={!isReady || Boolean(error) || running || painting}
                            className="min-h-14 border border-orange px-4 text-sm text-ink disabled:opacity-35"
                        >
                            Step
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={!isReady || Boolean(error) || painting}
                            className="min-h-14 border border-border px-4 text-sm text-ink disabled:opacity-35"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={handleRandom}
                            disabled={!isReady || Boolean(error) || painting}
                            className="min-h-14 border border-border px-4 text-sm text-ink disabled:opacity-35"
                        >
                            Random
                        </button>
                    </div>
                    <label className="mt-8 block text-xs text-teal">
                        SPEED
                        <input
                            type="range"
                            aria-label="Simulation speed"
                            min="50"
                            max="800"
                            step="50"
                            value={speedValue}
                            disabled={!isReady || Boolean(error)}
                            onChange={(event) => setSpeedValue(Number(event.target.value))}
                            className="mt-3 block min-h-11 w-full accent-teal"
                        />
                        <span className="mt-2 flex justify-between text-xs text-dim">
                            <span>Slow</span>
                            <span>Fast</span>
                        </span>
                    </label>
                </div>
            }
            footer={
                canvasFocused ? (
                    <>
                        <span><span className="text-teal">[ARROWS]</span> MOVE CELL</span>
                        <span><span className="text-lavender">[ENTER / SPACE]</span> TOGGLE</span>
                        <span><span className="text-olive">[ESC]</span> BACK</span>
                    </>
                ) : (
                    <>
                        <span><span className="text-teal">[SPACE]</span> PLAY</span>
                        <span><span className="text-lavender">[→]</span> STEP</span>
                        <span><span className="text-orange">[CLICK + DRAG]</span> PAINT</span>
                        <span><span className="text-olive">[ESC]</span> BACK</span>
                    </>
                )
            }
        >
            <p id="gol-keyboard-help" className="sr-only">
                Use arrow keys to choose a cell. Press Space or Enter to toggle it.
            </p>
            <p id="gol-cell-status" aria-live="polite" className="sr-only">
                {cellAnnouncement}
            </p>
            <canvas
                ref={canvasRef}
                role="application"
                aria-label="Game of Life grid"
                aria-roledescription="interactive Game of Life grid"
                aria-describedby="gol-keyboard-help gol-cell-status"
                aria-busy={!isReady}
                aria-disabled={!isReady || Boolean(error)}
                aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter Space"
                style={{
                    '--game-board-height-limit': `${(
                        rows > 0 && columns > 0 ? columns / rows : 1
                    ) * 100}cqh`,
                    ...(rows > 0 && columns > 0
                        ? { aspectRatio: `${columns} / ${rows}` }
                        : {}),
                } as CSSProperties}
                className={`aspect-square w-full max-w-[930px] border border-border wide:w-[min(100cqw,var(--game-board-height-limit),930px)] ${
                    isReady && !error ? 'touch-none' : 'touch-pan-y'
                }`}
                tabIndex={0}
                onFocus={() => {
                    setCanvasFocused(true)
                    if (rows > 0 && columns > 0) {
                        setCellAnnouncement(
                            describeCell(
                                keyboardCell[0],
                                keyboardCell[1],
                                Boolean(board[keyboardCell[0]]?.[keyboardCell[1]]),
                            ),
                        )
                    }
                }}
                onBlur={() => {
                    setCanvasFocused(false)
                    setCellAnnouncement('')
                }}
                onKeyDown={handleCanvasKeyDown}
                onPointerDown={startPaint}
                onPointerMove={continuePaint}
                onPointerUp={stopPaint}
                onPointerCancel={stopPaint}
                onPointerLeave={() => {
                    if (!paintingRef.current) setHoveredCell(null)
                }}
            />
        </GameFrame>
    )
}
