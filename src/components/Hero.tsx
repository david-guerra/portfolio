import { useCallback, useEffect, useRef } from 'react'
import {
    KIND_NAME,
    buildFabric,
    layoutFabric,
    rippleIntensity,
    type FabricCell,
    type FabricLayout,
} from '../lib/heroFabric.ts'
import type { Theme } from '../lib/theme.ts'

const MOVE_THROTTLE_MS = 70
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

interface Ripple {
    c: number
    r: number
    t0: number
}

interface Scene {
    ctx: CanvasRenderingContext2D
    layout: FabricLayout
    cells: FabricCell[]
}

export default function Hero({ theme, onScrollNext }: { theme: Theme; onScrollNext: () => void }) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<Scene | null>(null)
    const paletteRef = useRef<string[] | null>(null)
    const ripplesRef = useRef<Ripple[]>([])
    const seedRef = useRef(0) // seeded lazily in setup(); 0 = not yet woven
    const rafRef = useRef(0)
    const reducedRef = useRef(false)
    const lastMoveRef = useRef(0)

    const paint = useCallback((now?: number) => {
        const scene = sceneRef.current
        const palette = paletteRef.current
        if (!scene || !palette) return
        const { ctx, layout, cells } = scene
        const { pitch } = layout
        ctx.clearRect(0, 0, layout.cols * pitch, layout.rows * pitch)

        const baseSize = pitch - 2.4
        for (const cell of cells) {
            if (cell.alpha <= 0) continue
            const size = baseSize * cell.sizeMul
            ctx.globalAlpha = cell.alpha
            ctx.fillStyle = palette[cell.kind]
            ctx.fillRect(
                cell.c * pitch + (pitch - size) / 2,
                cell.r * pitch + (pitch - size) / 2,
                size,
                size,
            )
        }

        // ripple rings wash over the fabric; the letters stay inert
        if (now !== undefined) {
            for (const ripple of ripplesRef.current) {
                const t = (now - ripple.t0) / 1000
                for (const cell of cells) {
                    if (cell.kind === KIND_NAME) continue
                    const intensity = rippleIntensity(
                        Math.hypot(cell.c - ripple.c, cell.r - ripple.r),
                        t,
                    )
                    if (intensity <= 0) continue
                    ctx.globalAlpha = intensity
                    ctx.fillStyle = palette[(cell.c + cell.r) % 4]
                    ctx.fillRect(cell.c * pitch + 1.2, cell.r * pitch + 1.2, baseSize, baseSize)
                }
            }
        }
        ctx.globalAlpha = 1
    }, [])

    const startLoop = useCallback(() => {
        if (rafRef.current) return
        const step = (now: number) => {
            ripplesRef.current = ripplesRef.current.filter((rp) => now - rp.t0 < 1050)
            paint(now)
            rafRef.current = ripplesRef.current.length ? requestAnimationFrame(step) : 0
        }
        rafRef.current = requestAnimationFrame(step)
    }, [paint])

    const spawnRipple = useCallback(
        (px: number, py: number) => {
            const scene = sceneRef.current
            if (!scene) return
            const { pitch } = scene.layout
            ripplesRef.current.push({ c: px / pitch, r: py / pitch, t0: performance.now() })
            startLoop()
        },
        [startLoop],
    )

    const setup = useCallback(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        if (!wrap || !canvas) return
        const rect = wrap.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const dpr = window.devicePixelRatio || 1
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        paletteRef.current ??= readPalette()
        if (!seedRef.current) seedRef.current = (Math.random() * 1e9) | 0 || 1
        const layout = layoutFabric(rect.width, rect.height)

        // the fabric clears out around the name block so the text sits clean
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

        sceneRef.current = { ctx, layout, cells: buildFabric(layout, seedRef.current, fadeRect) }
        paint()
    }, [paint])

    useEffect(() => {
        const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        const applyMotionPreference = () => {
            reducedRef.current = reducedQuery.matches
            if (reducedQuery.matches) {
                // #6: still poster — drop live ripples, repaint at rest
                cancelAnimationFrame(rafRef.current)
                rafRef.current = 0
                ripplesRef.current = []
                paint()
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
    }, [setup, paint])

    useEffect(() => {
        paletteRef.current = readPalette()
        // same weave, next theme's colors; the running tick repaints on its own
        if (!rafRef.current) paint()
        void theme
    }, [theme, paint])

    const pointAt = (e: React.PointerEvent): { x: number; y: number } | null => {
        const wrap = wrapRef.current
        if (!wrap) return null
        const rect = wrap.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handleMove = (e: React.PointerEvent) => {
        if (reducedRef.current) return
        const now = performance.now()
        if (now - lastMoveRef.current < MOVE_THROTTLE_MS) return
        lastMoveRef.current = now
        const p = pointAt(e)
        if (p) spawnRipple(p.x, p.y)
    }

    const handleDown = (e: React.PointerEvent) => {
        if (reducedRef.current) {
            // still poster: a tap re-seeds the weave as an instant cut
            seedRef.current = (Math.random() * 1e9) | 0
            setup()
            return
        }
        handleMove(e)
    }

    return (
        <div
            ref={wrapRef}
            onPointerMove={handleMove}
            onPointerDown={handleDown}
            className="absolute inset-0 touch-pan-y overflow-hidden"
        >
            <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block" />
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
                type="button"
                onClick={onScrollNext}
                className="absolute right-5 bottom-8 cursor-pointer text-meta text-muted transition-colors hover:text-body wide:right-14 wide:bottom-14"
            >
                scroll <span className="text-[15px]">↓</span>
            </button>
        </div>
    )
}
