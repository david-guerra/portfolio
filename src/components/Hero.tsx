import { useCallback, useEffect, useRef } from 'react'
import {
    ParticleField,
    buildHeroMask,
    exciteTarget,
    layoutBackground,
    layoutLetters,
} from '../lib/heroField.ts'
import type { Theme } from '../lib/theme.ts'

const HERO_MASK = buildHeroMask()
const LETTER_RATE = 0.16
const BG_RATE = 0.14

interface HeroPalette {
    ink: string
    grid: string
    accents: string[]
}

/* The canvas paints with the same tokens the page uses, sampled from CSS so the
   two can never drift. Requires data-theme to be applied before effects run. */
function readPalette(): HeroPalette {
    const style = getComputedStyle(document.documentElement)
    const token = (name: string) => style.getPropertyValue(name).trim()
    return {
        ink: token('--text'),
        grid: token('--hero-grid'),
        accents: [token('--orange'), token('--lavender'), token('--teal'), token('--olive')],
    }
}

interface Scene {
    ctx: CanvasRenderingContext2D
    width: number
    height: number
    letters: { field: ParticleField; pitch: number; originX: number; originY: number }
    bg: { field: ParticleField; pitch: number; cols: number; rows: number }
}

export default function Hero({ theme, onScrollNext }: { theme: Theme; onScrollNext: () => void }) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<Scene | null>(null)
    const paletteRef = useRef<HeroPalette | null>(null)
    const mouseRef = useRef({ x: -9999, y: -9999, active: false })
    const rafRef = useRef(0)
    const reducedRef = useRef(false)

    const draw = useCallback(() => {
        const scene = sceneRef.current
        const palette = paletteRef.current
        if (!scene || !palette) return
        const { ctx, width, height, letters, bg } = scene
        const mouse = mouseRef.current
        ctx.clearRect(0, 0, width, height)

        // background particle field — dimmed uniform squares at rest
        const bgRestSize = bg.pitch * 0.22
        const bgRadius = Math.max(120, bg.pitch * 9)
        for (let r = 0; r < bg.rows; r++) {
            for (let c = 0; c < bg.cols; c++) {
                const idx = r * bg.cols + c
                const cx = c * bg.pitch + bg.pitch / 2
                const cy = r * bg.pitch + bg.pitch / 2
                const dist = Math.hypot(cx - mouse.x, cy - mouse.y)
                const e = bg.field.step(idx, exciteTarget(dist, bgRadius, mouse.active), BG_RATE)
                const size = bgRestSize + (bg.field.sizeMul[idx] * bg.pitch - bgRestSize) * e
                const px = cx + bg.field.offX[idx] * e
                const py = cy + bg.field.offY[idx] * e
                ctx.globalAlpha = 0.55 + 0.45 * e
                ctx.fillStyle = e < 0.15 ? palette.grid : bg.field.colors[idx]
                ctx.fillRect(px - size / 2, py - size / 2, size, size)
            }
        }
        ctx.globalAlpha = 1

        // letters — always bright, react by shifting color/size/position
        const { matrix, cols, rows } = HERO_MASK
        const restSize = letters.pitch * 0.56
        const radius = Math.max(120, letters.pitch * 6.5)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!matrix[r][c]) continue
                const idx = r * cols + c
                const cx = letters.originX + c * letters.pitch + letters.pitch / 2
                const cy = letters.originY + r * letters.pitch + letters.pitch / 2
                const dist = Math.hypot(cx - mouse.x, cy - mouse.y)
                const e = letters.field.step(idx, exciteTarget(dist, radius, mouse.active), LETTER_RATE)
                const size = restSize + (letters.field.sizeMul[idx] * letters.pitch - restSize) * e
                if (size <= 0.5) continue
                const px = cx + letters.field.offX[idx] * e
                const py = cy + letters.field.offY[idx] * e
                ctx.fillStyle = e < 0.15 ? palette.ink : letters.field.colors[idx]
                ctx.fillRect(px - size / 2, py - size / 2, size, size)
            }
        }

        if (mouse.active) {
            ctx.strokeStyle = palette.ink + '33'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(mouse.x, mouse.y, 34, 0, Math.PI * 2)
            ctx.stroke()
        }
    }, [])

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

        const palette = paletteRef.current ?? readPalette()
        paletteRef.current = palette
        const textHeight = textRef.current?.getBoundingClientRect().height ?? 100
        const letterLayout = layoutLetters({
            width: rect.width,
            height: rect.height,
            textHeight,
            cols: HERO_MASK.cols,
            rows: HERO_MASK.rows,
        })
        const bgLayout = layoutBackground(rect.width, rect.height)

        const prev = sceneRef.current
        const letterField =
            prev && prev.letters.pitch === letterLayout.pitch
                ? prev.letters.field
                : new ParticleField(HERO_MASK.cols * HERO_MASK.rows, letterLayout.pitch, palette.accents)
        const bgCount = bgLayout.cols * bgLayout.rows
        const bgField =
            prev && prev.bg.pitch === bgLayout.pitch && prev.bg.field.excite.length === bgCount
                ? prev.bg.field
                : new ParticleField(bgCount, bgLayout.pitch, palette.accents)

        sceneRef.current = {
            ctx,
            width: rect.width,
            height: rect.height,
            letters: { field: letterField, ...letterLayout },
            bg: { field: bgField, ...bgLayout },
        }
        if (reducedRef.current) draw()
    }, [draw])

    useEffect(() => {
        const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

        const loop = () => {
            draw()
            rafRef.current = requestAnimationFrame(loop)
        }
        const applyMotionPreference = () => {
            reducedRef.current = reducedQuery.matches
            cancelAnimationFrame(rafRef.current)
            if (reducedQuery.matches) {
                // #6: render once and stay still — no loop, no pointer ripples
                mouseRef.current.active = false
                draw()
            } else {
                rafRef.current = requestAnimationFrame(loop)
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
    }, [setup, draw])

    useEffect(() => {
        paletteRef.current = readPalette()
        // fields keep their traits; new accents apply as cells reroll. Repaint
        // the static frame ourselves when no loop is running.
        if (reducedRef.current) draw()
        void theme
    }, [theme, draw])

    const trackPointer = (e: React.PointerEvent) => {
        const wrap = wrapRef.current
        if (!wrap || reducedRef.current) return
        const rect = wrap.getBoundingClientRect()
        mouseRef.current.x = e.clientX - rect.left
        mouseRef.current.y = e.clientY - rect.top
        mouseRef.current.active = true
    }
    const releasePointer = () => {
        mouseRef.current.active = false
    }

    return (
        <div
            ref={wrapRef}
            onPointerMove={trackPointer}
            onPointerDown={trackPointer}
            onPointerLeave={releasePointer}
            onPointerUp={(e) => {
                // touch has no hover: the ripple ends when the finger lifts
                if (e.pointerType !== 'mouse') releasePointer()
            }}
            onPointerCancel={releasePointer}
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
