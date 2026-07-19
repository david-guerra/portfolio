import { useCallback, useEffect, useRef } from 'react'
import { buildContinuum, canvasDpr, type FabricLayout } from '../lib/heroFabric.ts'
import type { Theme } from '../lib/theme.ts'

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

export interface HeroFabricContinuumProps {
    theme: Theme
    seed: number
    pitch: number | null
}

export default function HeroFabricContinuum({
    theme,
    seed,
    pitch,
}: HeroFabricContinuumProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const paint = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas || !pitch || pitch <= 0) return
        const rect = canvas.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = canvasDpr(rect.width, window.devicePixelRatio || 1)
        canvas.width = Math.max(1, Math.round(rect.width * dpr))
        canvas.height = Math.max(1, Math.round(rect.height * dpr))
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, rect.width, rect.height)

        const layout: FabricLayout = {
            pitch,
            cols: Math.ceil(rect.width / pitch),
            rows: Math.ceil(rect.height / pitch),
            clusterSize: 1,
        }
        const palette = readPalette()
        const baseSize = Math.max(pitch - 2.4, pitch * 0.7)
        for (const cell of buildContinuum(layout, seed)) {
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
        ctx.globalAlpha = 1
        void theme
    }, [pitch, seed, theme])

    useEffect(() => {
        paint()
        if (typeof ResizeObserver === 'undefined' || !canvasRef.current) return
        const observer = new ResizeObserver(paint)
        observer.observe(canvasRef.current)
        return () => observer.disconnect()
    }, [paint])

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            data-testid="about-fabric-continuum"
            className="pointer-events-none absolute inset-0 block size-full"
        />
    )
}
