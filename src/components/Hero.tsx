import { useCallback, useEffect, useRef } from 'react'
import {
    KIND_NAME,
    advanceScatter,
    applyFlipTrail,
    applyScatterImpulse,
    buildFabric,
    canvasDpr,
    expireFlips,
    handoffCellAlpha,
    handoffProgress,
    heroTextOpacity,
    isPosterTap,
    layoutFabric,
    pointerVelocity,
    wavefrontFactor,
    type FabricCell,
    type FabricLayout,
    type FlipMotion,
    type ScatterMotion,
} from '../lib/heroFabric.ts'
import type { Theme } from '../lib/theme.ts'

const FLIP_MOVE_THROTTLE_MS = 36
const FRAME_INTERVAL_MS = 15.5
const FADE_PAD_PX = 16

/* The canvas paints with the same tokens the page uses, sampled from CSS so the
   two can never drift. Indexed by cell kind: accents 0–3, fabric grays 4–6, name 7.
   Requires data-theme to be applied before effects run. */
function readPalette(): string[] {
    const style = getComputedStyle(document.documentElement)
    const token = (name: string) => style.getPropertyValue(name).trim()
    return [
        token('--orange'),
        token('--lavender'),
        token('--teal'),
        token('--olive'),
        token('--hero-fabric-0'),
        token('--hero-fabric-1'),
        token('--hero-fabric-2'),
        token('--text'),
    ]
}

interface Scene {
    ctx: CanvasRenderingContext2D
    baseCanvas: HTMLCanvasElement
    baseCtx: CanvasRenderingContext2D
    width: number
    height: number
    dpr: number
    layout: FabricLayout
    cells: FabricCell[]
}

interface PointerSample {
    x: number
    y: number
    time: number
}

interface PosterTapStart {
    pointerId: number
    x: number
    y: number
}

function cellSize(cell: FabricCell, pitch: number): number {
    return Math.max(pitch - 2.4, pitch * 0.7) * cell.sizeMul
}

function drawRestCell(
    ctx: CanvasRenderingContext2D,
    cell: FabricCell,
    pitch: number,
    palette: readonly string[],
): void {
    if (cell.alpha <= 0) return
    const size = cellSize(cell, pitch)
    ctx.globalAlpha = cell.alpha
    ctx.fillStyle = palette[cell.kind]
    ctx.fillRect(
        cell.c * pitch + (pitch - size) / 2,
        cell.r * pitch + (pitch - size) / 2,
        size,
        size,
    )
}

function renderBaseLayer(scene: Scene, palette: readonly string[]): void {
    const { baseCanvas, baseCtx, width, height, dpr, layout, cells } = scene
    baseCanvas.width = Math.max(1, Math.round(width * dpr))
    baseCanvas.height = Math.max(1, Math.round(height * dpr))
    baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    baseCtx.clearRect(0, 0, width, height)
    for (const cell of cells) drawRestCell(baseCtx, cell, layout.pitch, palette)
    baseCtx.globalAlpha = 1
}

function eraseRestCell(ctx: CanvasRenderingContext2D, cell: FabricCell, pitch: number): void {
    const size = cellSize(cell, pitch)
    ctx.clearRect(
        cell.c * pitch + (pitch - size) / 2 - 0.7,
        cell.r * pitch + (pitch - size) / 2 - 0.7,
        size + 1.4,
        size + 1.4,
    )
}

function drawActiveCell(
    ctx: CanvasRenderingContext2D,
    cell: FabricCell,
    pitch: number,
    palette: readonly string[],
    now: number,
    scatter?: ScatterMotion,
    flip?: FlipMotion,
    alphaOverride?: number,
    effectFactor = 1,
): void {
    const size = cellSize(cell, pitch)
    const offsetX = scatter?.ox ?? 0
    const offsetY = scatter?.oy ?? 0
    const x = cell.c * pitch + (pitch - size) / 2 + offsetX
    const y = cell.r * pitch + (pitch - size) / 2 + offsetY
    let alpha = alphaOverride ?? cell.alpha

    if (flip) {
        const remaining = flip.until - now
        const amount = remaining <= 0 ? 0 : Math.min(1, remaining / 240)
        if (flip.kind === -1) {
            alpha *= 1 - 0.92 * amount
        } else {
            if (alpha > 0) {
                ctx.globalAlpha = alpha * (1 - amount)
                ctx.fillStyle = palette[cell.kind]
                ctx.fillRect(x, y, size, size)
            }
            ctx.globalAlpha = flip.alpha * amount * effectFactor
            ctx.fillStyle = palette[flip.kind]
            ctx.fillRect(x, y, size, size)
            return
        }
    }

    if (alpha <= 0) return
    ctx.globalAlpha = alpha
    ctx.fillStyle = palette[cell.kind]
    ctx.fillRect(x, y, size, size)

    if (cell.kind !== KIND_NAME && scatter) {
        const displacement = Math.hypot(scatter.ox, scatter.oy) / pitch
        if (displacement > 0.45) {
            ctx.globalAlpha = Math.min(0.85, (displacement - 0.45) * 0.55) * effectFactor
            ctx.fillStyle = palette[(cell.c + cell.r) % 4]
            ctx.fillRect(x, y, size, size)
        }
    }
}

export interface HeroProps {
    theme: Theme
    seed: number
    onReseed: () => void
    onLayout: (pitch: number) => void
    onScrollNext: () => void
}

export default function Hero({ theme, seed, onReseed, onLayout, onScrollNext }: HeroProps) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const cueRef = useRef<HTMLButtonElement>(null)
    const sceneRef = useRef<Scene | null>(null)
    const paletteRef = useRef<string[] | null>(null)
    const scatterRef = useRef(new Map<number, ScatterMotion>())
    const flipsRef = useRef(new Map<number, FlipMotion>())
    const rafRef = useRef(0)
    const scrollRafRef = useRef(0)
    const reducedRef = useRef(false)
    const handoffProgressRef = useRef(0)
    const lastTickRef = useRef(0)
    const lastPaintRef = useRef(0)
    const lastFlipRef = useRef(0)
    const lastPointerRef = useRef<PointerSample | null>(null)
    const posterTapRef = useRef<PosterTapStart | null>(null)

    const hasMotion = useCallback(
        () => scatterRef.current.size > 0 || flipsRef.current.size > 0,
        [],
    )

    const paint = useCallback((now = performance.now()) => {
        const scene = sceneRef.current
        const palette = paletteRef.current
        if (!scene || !palette) return
        const { ctx, baseCanvas, width, height, layout, cells } = scene
        const { pitch } = layout
        ctx.clearRect(0, 0, width, height)
        const progress = reducedRef.current ? 0 : handoffProgressRef.current
        if (progress > 0.002) {
            for (let idx = 0; idx < cells.length; idx++) {
                const cell = cells[idx]
                const factor = wavefrontFactor(cell, pitch, progress, height)
                const alpha = handoffCellAlpha(cell, pitch, progress, height)
                if (alpha <= 0 && !scatterRef.current.has(idx) && !flipsRef.current.has(idx)) {
                    continue
                }
                drawActiveCell(
                    ctx,
                    cell,
                    pitch,
                    palette,
                    now,
                    scatterRef.current.get(idx),
                    flipsRef.current.get(idx),
                    alpha,
                    factor,
                )
            }
            ctx.globalAlpha = 1
            return
        }

        ctx.drawImage(baseCanvas, 0, 0, width, height)

        const active = new Set([...scatterRef.current.keys(), ...flipsRef.current.keys()])
        for (const idx of active) eraseRestCell(ctx, cells[idx], pitch)
        for (const idx of active) {
            drawActiveCell(
                ctx,
                cells[idx],
                pitch,
                palette,
                now,
                scatterRef.current.get(idx),
                flipsRef.current.get(idx),
            )
        }
        ctx.globalAlpha = 1
    }, [])

    const stopMotion = useCallback(
        (repaint = true) => {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = 0
            scatterRef.current.clear()
            flipsRef.current.clear()
            lastPointerRef.current = null
            posterTapRef.current = null
            if (repaint) paint()
        },
        [paint],
    )

    const startLoop = useCallback(() => {
        if (rafRef.current || reducedRef.current || !hasMotion()) return
        lastTickRef.current = performance.now()

        const frame = (now: number) => {
            if (now - lastPaintRef.current < FRAME_INTERVAL_MS) {
                rafRef.current = hasMotion() ? requestAnimationFrame(frame) : 0
                return
            }

            const dt = Math.min((now - lastTickRef.current) / 1000, 0.05)
            lastTickRef.current = now
            lastPaintRef.current = now
            advanceScatter(scatterRef.current, dt)
            expireFlips(flipsRef.current, now)
            paint(now)
            rafRef.current = hasMotion() ? requestAnimationFrame(frame) : 0
        }

        rafRef.current = requestAnimationFrame(frame)
    }, [hasMotion, paint])

    const setup = useCallback(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        if (!wrap || !canvas) return
        const rect = wrap.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return

        stopMotion(false)
        const dpr = canvasDpr(rect.width, window.devicePixelRatio || 1)
        canvas.width = Math.max(1, Math.round(rect.width * dpr))
        canvas.height = Math.max(1, Math.round(rect.height * dpr))
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const baseCanvas = document.createElement('canvas')
        const baseCtx = baseCanvas.getContext('2d')
        if (!baseCtx) return

        paletteRef.current ??= readPalette()
        const layout = layoutFabric(rect.width, rect.height)
        onLayout(layout.pitch)

        let fadeRect
        const text = textRef.current?.getBoundingClientRect()
        if (text) {
            fadeRect = {
                c0: Math.floor((text.left - rect.left - FADE_PAD_PX) / layout.pitch),
                r0: Math.floor((text.top - rect.top - FADE_PAD_PX) / layout.pitch),
                c1: Math.ceil((text.right - rect.left + FADE_PAD_PX) / layout.pitch),
                r1: layout.rows,
            }
        }

        const scene: Scene = {
            ctx,
            baseCanvas,
            baseCtx,
            width: rect.width,
            height: rect.height,
            dpr,
            layout,
            cells: buildFabric(layout, seed, fadeRect),
        }
        sceneRef.current = scene
        renderBaseLayer(scene, paletteRef.current)
        paint()
    }, [onLayout, paint, seed, stopMotion])

    useEffect(() => {
        const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        const applyMotionPreference = () => {
            reducedRef.current = reducedQuery.matches
            if (reducedQuery.matches) {
                handoffProgressRef.current = 0
                if (textRef.current) textRef.current.style.opacity = '1'
                if (cueRef.current) cueRef.current.style.opacity = '1'
                stopMotion()
            }
        }

        setup()
        applyMotionPreference()
        reducedQuery.addEventListener('change', applyMotionPreference)
        const observer = new ResizeObserver(setup)
        if (wrapRef.current) observer.observe(wrapRef.current)
        return () => {
            cancelAnimationFrame(rafRef.current)
            reducedQuery.removeEventListener('change', applyMotionPreference)
            observer.disconnect()
        }
    }, [setup, stopMotion])

    useEffect(() => {
        const wrap = wrapRef.current
        const heroPane = wrap?.closest<HTMLElement>('#hero')
        const scroller = heroPane?.parentElement
        if (!heroPane || !scroller) return

        const paintHandoff = (now: number) => {
            if (now - lastPaintRef.current < FRAME_INTERVAL_MS) {
                scrollRafRef.current = requestAnimationFrame(paintHandoff)
                return
            }
            lastPaintRef.current = now
            scrollRafRef.current = 0
            paint(now)
        }

        const updateHandoff = () => {
            if (reducedRef.current) {
                handoffProgressRef.current = 0
                if (textRef.current) textRef.current.style.opacity = '1'
                if (cueRef.current) cueRef.current.style.opacity = '1'
                return
            }
            const height = heroPane.clientHeight || scroller.clientHeight
            const progress = handoffProgress(scroller.scrollTop - heroPane.offsetTop, height)
            if (progress === handoffProgressRef.current) return
            handoffProgressRef.current = progress
            const opacity = String(heroTextOpacity(progress))
            if (textRef.current) textRef.current.style.opacity = opacity
            if (cueRef.current) cueRef.current.style.opacity = opacity
            if (scrollRafRef.current) return
            scrollRafRef.current = requestAnimationFrame(paintHandoff)
        }

        updateHandoff()
        scroller.addEventListener('scroll', updateHandoff, { passive: true })
        return () => {
            scroller.removeEventListener('scroll', updateHandoff)
            cancelAnimationFrame(scrollRafRef.current)
            scrollRafRef.current = 0
        }
    }, [paint])

    useEffect(() => {
        paletteRef.current = readPalette()
        const scene = sceneRef.current
        if (scene) renderBaseLayer(scene, paletteRef.current)
        if (!rafRef.current) paint()
        void theme
    }, [theme, paint])

    const pointAt = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
        const rect = e.currentTarget.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (reducedRef.current) return
        const scene = sceneRef.current
        if (!scene) return
        const point = pointAt(e)
        const now = performance.now()
        const previous = lastPointerRef.current
        const elapsed = previous ? now - previous.time : 0
        const velocity = pointerVelocity(
            previous ? point.x - previous.x : 0,
            previous ? point.y - previous.y : 0,
            elapsed,
        )
        lastPointerRef.current = { ...point, time: now }

        applyScatterImpulse(
            scene.layout,
            scatterRef.current,
            point.x,
            point.y,
            velocity.x,
            velocity.y,
            0.55,
        )
        if (now - lastFlipRef.current >= FLIP_MOVE_THROTTLE_MS) {
            lastFlipRef.current = now
            applyFlipTrail(
                scene.cells,
                scene.layout,
                flipsRef.current,
                point.x,
                point.y,
                now,
                2.6,
                0.3,
            )
        }
        startLoop()
    }

    const handleDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (reducedRef.current) {
            posterTapRef.current = { pointerId: e.pointerId, ...pointAt(e) }
            return
        }
        const scene = sceneRef.current
        if (!scene) return
        const point = pointAt(e)
        const now = performance.now()
        applyScatterImpulse(
            scene.layout,
            scatterRef.current,
            point.x,
            point.y,
            0,
            0,
            0.9,
        )
        applyFlipTrail(
            scene.cells,
            scene.layout,
            flipsRef.current,
            point.x,
            point.y,
            now,
            3.4,
            0.5,
        )
        startLoop()
    }

    const handleUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!reducedRef.current) return
        const start = posterTapRef.current
        posterTapRef.current = null
        if (!start || start.pointerId !== e.pointerId || !isPosterTap(start, pointAt(e), false)) {
            return
        }
        onReseed()
    }

    const handleCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (posterTapRef.current?.pointerId === e.pointerId) posterTapRef.current = null
    }

    return (
        <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                onPointerMove={handleMove}
                onPointerDown={handleDown}
                onPointerUp={handleUp}
                onPointerCancel={handleCancel}
                className="absolute inset-0 block touch-pan-y"
            />
            <div
                ref={textRef}
                className="pointer-events-none absolute bottom-20 left-5 wide:bottom-14 wide:left-14"
            >
                <h1 className="text-[34px] font-bold tracking-tight text-ink">David Guerra</h1>
                <p className="mt-2.5 text-base text-body">
                    I build things to understand how they work.
                </p>
                <p className="mt-3.5 flex items-center gap-2.5 text-meta">
                    <span aria-hidden="true" className="size-[7px] rounded-dot bg-olive" />
                    <span className="text-teal">IT-Systems Engineering</span>
                    <span className="text-dim">· HPI</span>
                </p>
            </div>
            <button
                ref={cueRef}
                type="button"
                onClick={onScrollNext}
                className="absolute right-5 bottom-8 cursor-pointer text-meta text-muted transition-colors hover:text-body wide:right-14 wide:bottom-14"
            >
                scroll <span className="text-[15px]">↓</span>
            </button>
        </div>
    )
}
