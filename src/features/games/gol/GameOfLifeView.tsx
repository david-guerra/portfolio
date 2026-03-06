import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '../../../lib/utils'
import { BackButton } from '../../../components/ui/BackButton'

import { useGameOfLife } from '../../../hooks/useGameOfLife'

const ROWS = 18
const COLS = 18

/* Colors matching Gruvbox theme */
const COLOR_BG = '#282828'    /* gruv-bg */
const COLOR_ALIVE = '#b8bb26'    /* gruv-green */
const COLOR_GRID = 'rgba(235,219,178,0.06)' /* gruv-fg at low opacity */
const CELL_GAP = 1  /* px between cells */

export function GameOfLifeView({ onBack }: { onBack: () => void }) {
    const { isReady, board, setCell, step, clear, error } = useGameOfLife()

    const [running, setRunning] = useState(false)
    const [speed, setSpeed] = useState(300)
    const runningRef = useRef(running)
    runningRef.current = running
    const paintingRef = useRef(false)
    const paintValueRef = useRef(1)
    const wasRunningRef = useRef(false)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    /* Resolve pointer position to cell coordinates */
    const getCellFromPoint = useCallback((clientX: number, clientY: number): [number, number] | null => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top
        const col = Math.floor((x / rect.width) * COLS)
        const row = Math.floor((y / rect.height) * ROWS)
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null
        return [row, col]
    }, [])

    /* Draw the board onto the canvas */
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || board.length === 0) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const w = canvas.width
        const h = canvas.height
        const cellW = (w - (COLS + 1) * CELL_GAP) / COLS
        const cellH = (h - (ROWS + 1) * CELL_GAP) / ROWS

        /* Clear to background */
        ctx.fillStyle = COLOR_BG
        ctx.fillRect(0, 0, w, h)

        /* Draw grid lines (subtle) */
        ctx.fillStyle = COLOR_GRID
        for (let r = 0; r <= ROWS; r++) {
            const y = r * (cellH + CELL_GAP)
            ctx.fillRect(0, y, w, CELL_GAP)
        }
        for (let c = 0; c <= COLS; c++) {
            const x = c * (cellW + CELL_GAP)
            ctx.fillRect(x, 0, CELL_GAP, h)
        }

        /* Draw alive cells */
        ctx.fillStyle = COLOR_ALIVE
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === 1) {
                    const x = CELL_GAP + c * (cellW + CELL_GAP)
                    const y = CELL_GAP + r * (cellH + CELL_GAP)
                    ctx.fillRect(x, y, cellW, cellH)
                }
            }
        }
    }, [board])

    /* Resize canvas to match container (for crisp rendering) */
    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const observer = new ResizeObserver(() => {
            const rect = container.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            canvas.style.width = `${rect.width}px`
            canvas.style.height = `${rect.height}px`
            const ctx = canvas.getContext('2d')
            if (ctx) ctx.scale(dpr, dpr)
        })
        observer.observe(container)
        return () => observer.disconnect()
    }, [])

    const doStep = useCallback(() => {
        step()
    }, [step])

    useEffect(() => {
        if (!running) return
        const id = setInterval(() => {
            if (runningRef.current) doStep()
        }, speed)
        return () => clearInterval(id)
    }, [running, speed, doStep])

    const startPaint = (r: number, c: number) => {
        if (board.length === 0) return
        paintingRef.current = true
        paintValueRef.current = board[r][c] ? 0 : 1
        if (running) {
            wasRunningRef.current = true
            setRunning(false)
        }
        setCell(r, c, paintValueRef.current)
    }

    const continuePaint = (r: number, c: number) => {
        if (!paintingRef.current || board.length === 0) return
        setCell(r, c, paintValueRef.current)
    }

    const stopPaint = () => {
        paintingRef.current = false
        if (wasRunningRef.current) {
            wasRunningRef.current = false
            setRunning(true)
        }
    }

    const handleClear = () => {
        setRunning(false)
        wasRunningRef.current = false
        clear()
    }

    const handleRandom = () => {
        setRunning(false)
        clear()
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (Math.random() > 0.6) setCell(r, c, 1)
            }
        }
    }

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault()
                setRunning(prev => !prev)
            } else if (e.key === 'ArrowRight' && !runningRef.current) {
                doStep()
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [doStep])

    if (error) {
        return (
            <div className="flex flex-col h-full">
                <BackButton onClick={onBack} />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gruv-red text-sm">Error: {error}</p>
                </div>
            </div>
        )
    }

    if (!isReady) {
        return (
            <div className="flex flex-col h-full">
                <BackButton onClick={onBack} />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gruv-fg/50 animate-pulse">Loading Game of Life...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full items-center justify-center p-2 relative w-full gap-2">
            {/* Header */}
            <div className="flex w-full justify-between items-center" style={{ maxWidth: '360px' }}>
                <BackButton onClick={onBack} />
                <div className="flex gap-1">
                    <button
                        onClick={handleClear}
                        className="text-sm px-3 py-1 bg-gruv-bg-soft border border-bento rounded-lg text-gruv-fg/70 hover:text-gruv-red hover:border-gruv-red transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleRandom}
                        className="text-sm px-3 py-1 bg-gruv-bg-soft border border-bento rounded-lg text-gruv-fg/70 hover:text-gruv-yellow hover:border-gruv-yellow transition-colors"
                    >
                        Random
                    </button>
                </div>
            </div>

            {/* Canvas Grid */}
            <div
                ref={containerRef}
                className="bg-gruv-bg-hard rounded-lg border-2 border-gruv-fg shadow-lg aspect-square select-none"
                style={{ width: 'min(100%, 360px)' }}
                onMouseLeave={stopPaint}
                onMouseUp={stopPaint}
            >
                <canvas
                    ref={canvasRef}
                    className="w-full h-full rounded-md cursor-pointer"
                    onMouseDown={(e) => {
                        e.preventDefault()
                        const cell = getCellFromPoint(e.clientX, e.clientY)
                        if (cell) startPaint(cell[0], cell[1])
                    }}
                    onMouseMove={(e) => {
                        const cell = getCellFromPoint(e.clientX, e.clientY)
                        if (cell) continuePaint(cell[0], cell[1])
                    }}
                    onTouchStart={(e) => {
                        e.preventDefault()
                        const touch = e.touches[0]
                        const cell = getCellFromPoint(touch.clientX, touch.clientY)
                        if (cell) startPaint(cell[0], cell[1])
                    }}
                    onTouchMove={(e) => {
                        const touch = e.touches[0]
                        const cell = getCellFromPoint(touch.clientX, touch.clientY)
                        if (cell) continuePaint(cell[0], cell[1])
                    }}
                    onTouchEnd={stopPaint}
                />
            </div>

            {/* Controls */}
            <div className="flex gap-2 items-center">
                <button
                    onClick={() => setRunning(prev => !prev)}
                    className={cn(
                        "text-sm px-4 py-2 border rounded-lg transition-colors font-bold",
                        running
                            ? "bg-gruv-red/20 border-gruv-red text-gruv-red hover:bg-gruv-red/30"
                            : "bg-gruv-green/20 border-gruv-green text-gruv-green hover:bg-gruv-green/30"
                    )}
                >
                    {running ? "Pause" : "Play"}
                </button>
                <button
                    onClick={doStep}
                    disabled={running}
                    className="text-sm px-4 py-2 bg-gruv-bg-soft border border-bento rounded-lg text-gruv-fg/70 hover:text-gruv-yellow hover:border-gruv-yellow transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Step
                </button>
                <div className="flex items-center gap-2 text-gruv-fg/50 text-xs ml-2 bg-gruv-bg-soft border border-bento rounded-lg px-3 py-2">
                    <span className="text-gruv-fg/40 font-mono text-sm">»</span>
                    <input
                        type="range"
                        min={50}
                        max={800}
                        step={50}
                        value={850 - speed}
                        onChange={e => setSpeed(850 - Number(e.target.value))}
                        className="w-20 h-1 appearance-none bg-gruv-fg/20 rounded-full outline-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gruv-yellow [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(215,153,33,0.5)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-125
                            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gruv-yellow [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(215,153,33,0.5)]
                            [&::-moz-range-track]:bg-gruv-fg/20 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:h-1"
                    />
                </div>
            </div>

            {/* Footer hint */}
            <div className="text-center text-gruv-fg/30 text-xs">
                {running ? "[SPACE] PAUSE" : "[SPACE] PLAY   [→] STEP   [CLICK] TOGGLE"}
            </div>
        </div>
    )
}
