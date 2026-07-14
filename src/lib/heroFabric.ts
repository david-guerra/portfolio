/* Pure math for the hero's woven pixel fabric. Look authority: myReference/hero*.png
   + the mobile-strategy prototype's pixelCanvas (spec on wayfinder ticket #10).
   Rendering lives in Hero.tsx. */

const GLYPHS: Record<string, string[]> = {
    D: ['1111.', '1...1', '1...1', '1...1', '1...1', '1...1', '1111.'],
    A: ['.111.', '1...1', '1...1', '11111', '1...1', '1...1', '1...1'],
    V: ['1...1', '1...1', '1...1', '1...1', '1...1', '.1.1.', '..1..'],
    I: ['111', '.1.', '.1.', '.1.', '.1.', '.1.', '111'],
    G: ['.1111', '1....', '1....', '1.111', '1...1', '1...1', '.111.'],
    U: ['1...1', '1...1', '1...1', '1...1', '1...1', '1...1', '.111.'],
    E: ['11111', '1....', '1....', '1111.', '1....', '1....', '11111'],
    R: ['1111.', '1...1', '1...1', '1111.', '1.1..', '1..1.', '1...1'],
}

const LINES = ['DAVID', 'GUERRA']
const GLYPH_ROWS = 7
const LINE_GAP = 2 // glyph rows between the two lines
/* GUERRA in glyph columns (letters + single gaps) — the widest line, and the
   basis for sizing the whole grid so the name spans ~80% of the width. */
const WIDE_LINE_COLS = LINES[1]
    .split('')
    .reduce((n, ch) => n + GLYPHS[ch][0].length + 1, -1)

/* Cell kinds: accents index the theme's accent palette; grays are the three
   fabric levels (base ≈ bg, mid, hi); name cells render in ink. */
export const KIND_ACCENTS: readonly number[] = [0, 1, 2, 3]
export const KIND_GRAY_BASE = 4
export const KIND_GRAY_MID = 5
export const KIND_GRAY_HI = 6
export const KIND_NAME = 7

export function mulberry32(seed: number): () => number {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export interface FabricLayout {
    pitch: number
    cols: number
    rows: number
    k: number
}

const NAME_BLOCK_ROWS = GLYPH_ROWS * 2 + LINE_GAP // both lines + gap, in glyph rows

export function layoutFabric(width: number, height: number): FabricLayout {
    const k = width >= 900 ? 3 : width >= 560 ? 2 : 1
    // GUERRA spans ~80% of the width unless the name block would overflow
    // ~48% of the height (the reference's proportion) — then the height binds.
    const pitch = Math.max(
        6,
        Math.min(
            14,
            (0.8 * width) / (WIDE_LINE_COLS * k),
            (0.48 * height) / (NAME_BLOCK_ROWS * k),
        ),
    )
    return {
        pitch,
        cols: Math.ceil(width / pitch),
        rows: Math.ceil(height / pitch),
        k,
    }
}

/* Cell indices lit by DAVID over GUERRA, each glyph pixel a k×k cell cluster,
   each line centered; the block starts a fifth of the way down the grid. */
export function nameCells(cols: number, rows: number, k: number): Set<number> {
    const set = new Set<number>()
    const startRow = Math.max(3, Math.round(rows * 0.2))
    LINES.forEach((line, li) => {
        const lineCols = line.split('').reduce((n, ch) => n + GLYPHS[ch][0].length + 1, -1)
        let c0 = Math.floor((cols - lineCols * k) / 2)
        const r0 = startRow + li * (GLYPH_ROWS + LINE_GAP) * k
        for (const ch of line) {
            const glyph = GLYPHS[ch]
            glyph.forEach((rowStr, gr) => {
                rowStr.split('').forEach((bit, gc) => {
                    if (bit !== '1') return
                    for (let dr = 0; dr < k; dr++) {
                        for (let dc = 0; dc < k; dc++) {
                            set.add((r0 + gr * k + dr) * cols + (c0 + gc * k + dc))
                        }
                    }
                })
            })
            c0 += (glyph[0].length + 1) * k
        }
    })
    return set
}

/* Rect in cell coordinates that the fabric clears out (the name block). */
export interface FadeRect {
    c0: number
    r0: number
    c1: number
    r1: number
}

/* 0 inside the rect, ramping linearly to 1 at `margin` cells away. */
export function fadeFactor(c: number, r: number, rect: FadeRect, margin: number): number {
    const dx = Math.max(rect.c0 - c, 0, c - rect.c1)
    const dy = Math.max(rect.r0 - r, 0, r - rect.r1)
    return Math.min(1, Math.hypot(dx, dy) / margin)
}

export interface FabricCell {
    c: number
    r: number
    kind: number
    alpha: number
    sizeMul: number
}

export function buildFabric(layout: FabricLayout, seed: number, fadeRect?: FadeRect): FabricCell[] {
    const { cols, rows, k } = layout
    const rnd = mulberry32(seed)
    const names = nameCells(cols, rows, k)
    const cells: FabricCell[] = []
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = c / cols
            const u = rnd()
            let kind: number
            let alpha: number
            let sizeMul = 1
            if (names.has(r * cols + c)) {
                kind = KIND_NAME
                alpha = 0.85 + rnd() * 0.15
            } else if (u < 0.028 * (0.45 + x * 1.4)) {
                // confetti: denser toward the right edge, varied size + alpha
                kind = KIND_ACCENTS[(rnd() * 4) | 0]
                alpha = 0.3 + rnd() * 0.65
                sizeMul = 0.85 + rnd() * 0.9
            } else if (u < 0.09) {
                kind = KIND_GRAY_HI
                alpha = 0.5 + rnd() * 0.5
            } else if (u < 0.28) {
                kind = KIND_GRAY_MID
                alpha = 1
            } else {
                kind = KIND_GRAY_BASE
                alpha = 0.55 + rnd() * 0.45
            }
            if (fadeRect) alpha *= fadeFactor(c, r, fadeRect, 8)
            cells.push({ c, r, kind, alpha, sizeMul })
        }
    }
    return cells
}

const RIPPLE_SPEED = 16 // cells per second
const RIPPLE_BAND = 2.6 // cells
const RIPPLE_LIFE = 1.05 // seconds

/* Intensity of a ripple ring at a cell `dist` cells from its center,
   `elapsedSec` after it was spawned. */
export function rippleIntensity(dist: number, elapsedSec: number): number {
    const fade = 1 - elapsedSec / RIPPLE_LIFE
    if (fade <= 0) return 0
    const delta = Math.abs(dist - elapsedSec * RIPPLE_SPEED)
    if (delta >= RIPPLE_BAND) return 0
    return fade * (1 - delta / RIPPLE_BAND) * 0.9
}
