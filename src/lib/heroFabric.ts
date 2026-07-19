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

export const MOBILE_GLYPHS: Readonly<Record<string, readonly string[]>> = {
    D: [
        '.1111..',
        '111111.',
        '1111111',
        '111.111',
        '111.111',
        '111.111',
        '1111111',
        '111111.',
        '.1111..',
    ],
    A: [
        '..111..',
        '.11111.',
        '111.111',
        '111.111',
        '1111111',
        '1111111',
        '111.111',
        '111.111',
        '111.111',
    ],
    V: [
        '.1...1.',
        '111.111',
        '111.111',
        '111.111',
        '111.111',
        '111.111',
        '.11111.',
        '.11111.',
        '..111..',
    ],
    I: ['11111', '11111', '.111.', '.111.', '.111.', '.111.', '.111.', '11111', '11111'],
    G: [
        '..1111.',
        '.111111',
        '1111111',
        '111....',
        '111.111',
        '111..11',
        '1111111',
        '.111111',
        '..1111.',
    ],
    U: [
        '111.111',
        '111.111',
        '111.111',
        '111.111',
        '111.111',
        '111.111',
        '111.111',
        '1111111',
        '.11111.',
    ],
    E: [
        '.111111',
        '1111111',
        '1111111',
        '111....',
        '111111.',
        '111111.',
        '111....',
        '1111111',
        '.111111',
    ],
    R: [
        '11111..',
        '111111.',
        '111.111',
        '111.111',
        '111111.',
        '11111..',
        '111111.',
        '111.111',
        '111..11',
    ],
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
    clusterSize: number
}

const NAME_BLOCK_ROWS = GLYPH_ROWS * 2 + LINE_GAP // both lines + gap, in glyph rows

export function layoutFabric(width: number, height: number): FabricLayout {
    const clusterSize = width >= 900 ? 3 : width >= 560 ? 2 : 1
    // GUERRA spans ~80% of the width unless the name block would overflow
    // ~48% of the height (the reference's proportion) — then the height binds.
    const pitch = Math.max(
        6,
        Math.min(
            14,
            (0.8 * width) / (WIDE_LINE_COLS * clusterSize),
            (0.48 * height) / (NAME_BLOCK_ROWS * clusterSize),
        ),
    )
    return {
        pitch,
        cols: Math.ceil(width / pitch),
        rows: Math.ceil(height / pitch),
        clusterSize,
    }
}

export function canvasDpr(viewportWidth: number, devicePixelRatio: number): number {
    const dpr = devicePixelRatio || 1
    return viewportWidth < 560 ? Math.min(dpr, 2.5) : dpr
}

/* Cell indices lit by DAVID over GUERRA. Mobile uses the final editor-authored
   masks in the existing dilation envelope; larger layouts dilate the base glyphs. */
export function nameCells(
    cols: number,
    rows: number,
    clusterSize: number,
    weight: 'base' | 'dilated' = 'dilated',
): Set<number> {
    const set = new Set<number>()
    const useMobileMasks = clusterSize === 1 && weight === 'dilated'
    const startRow = Math.max(3, Math.round(rows * 0.2))

    LINES.forEach((line, lineIndex) => {
        const lineCols = line.split('').reduce((n, ch) => n + GLYPHS[ch][0].length + 1, -1)
        let c0 = Math.floor((cols - lineCols * clusterSize) / 2)
        const r0 = startRow + lineIndex * (GLYPH_ROWS + LINE_GAP) * clusterSize

        for (const ch of line) {
            if (useMobileMasks) {
                MOBILE_GLYPHS[ch].forEach((row, maskRow) => {
                    Array.from(row).forEach((bit, maskCol) => {
                        if (bit !== '1') return
                        const r = r0 - 1 + maskRow
                        const c = c0 - 1 + maskCol
                        if (r >= 0 && r < rows && c >= 0 && c < cols) {
                            set.add(r * cols + c)
                        }
                    })
                })
            } else {
                GLYPHS[ch].forEach((row, glyphRow) => {
                    Array.from(row).forEach((bit, glyphCol) => {
                        if (bit !== '1') return
                        for (let dr = 0; dr < clusterSize; dr++) {
                            for (let dc = 0; dc < clusterSize; dc++) {
                                set.add(
                                    (r0 + glyphRow * clusterSize + dr) * cols +
                                        (c0 + glyphCol * clusterSize + dc),
                                )
                            }
                        }
                    })
                })
            }
            c0 += (GLYPHS[ch][0].length + 1) * clusterSize
        }
    })

    if (weight === 'base' || useMobileMasks) return set

    const ring: number[] = []
    for (const idx of set) {
        const r = Math.floor(idx / cols)
        const c = idx % cols
        if (c > 0) ring.push(idx - 1)
        if (c < cols - 1) ring.push(idx + 1)
        if (r > 0) ring.push(idx - cols)
        if (r < rows - 1) ring.push(idx + cols)
    }
    for (const idx of ring) set.add(idx)
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
    /* Full opacity before the lower-left copy void is cut out. The hand-off
       releases that void back into the weave so its hard edge cannot become a seam. */
    baseAlpha?: number
    /* Per-cell crumble jitter. Name cells use the lower range and therefore
       hold longer as the wavefront rises through the top viewport band. */
    handoffThreshold?: number
}

export function buildFabric(layout: FabricLayout, seed: number, fadeRect?: FadeRect): FabricCell[] {
    const { cols, rows, clusterSize } = layout
    const rnd = mulberry32(seed)
    const handoffRnd = mulberry32(seed ^ 0x7f4a7c15)
    const names = nameCells(cols, rows, clusterSize)
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
            const baseAlpha = alpha
            if (fadeRect) alpha *= fadeFactor(c, r, fadeRect, 8)
            const handoffThreshold = names.has(r * cols + c)
                ? 0.05 + handoffRnd() * 0.4
                : 0.25 + handoffRnd() * 0.75
            cells.push({ c, r, kind, alpha, sizeMul, baseAlpha, handoffThreshold })
        }
    }
    return cells
}

function clampUnit(value: number): number {
    return Math.max(0, Math.min(1, value))
}

function smoothstep(start: number, end: number, value: number): number {
    const t = clampUnit((value - start) / (end - start))
    return t * t * (3 - 2 * t)
}

export function handoffProgress(scrollTop: number, heroHeight: number): number {
    if (!Number.isFinite(scrollTop) || !Number.isFinite(heroHeight) || heroHeight <= 0) return 0
    return clampUnit(scrollTop / heroHeight)
}

/* Crumble wavefront approved on ticket #20. Cells dissolve only when they enter
   the top viewport band; low thresholds make the letter cells linger longest. */
export function wavefrontFactor(
    cell: FabricCell,
    pitch: number,
    progress: number,
    viewportHeight: number,
): number {
    const p = clampUnit(progress)
    if (p <= 0 || !Number.isFinite(pitch) || !Number.isFinite(viewportHeight)) return 1
    if (pitch <= 0 || viewportHeight <= 0) return 1
    const threshold =
        cell.handoffThreshold ?? (cell.kind === KIND_NAME ? 0.25 : 0.625)
    const screenY = cell.r * pitch + pitch * 0.5 - p * viewportHeight
    const cutoff =
        (0.08 + 0.22 * threshold) * viewportHeight * Math.min(1, p * 3)
    return clampUnit((screenY - cutoff) / 44)
}

export function heroTextOpacity(progress: number): number {
    return 1 - smoothstep(0.02, 0.18, clampUnit(progress))
}

export function handoffCellAlpha(
    cell: FabricCell,
    pitch: number,
    progress: number,
    viewportHeight: number,
): number {
    const p = clampUnit(progress)
    if (p <= 0) return cell.alpha
    const threshold = cell.handoffThreshold ?? 0.625
    const releaseStart = 0.015 + threshold * 0.035
    const release = smoothstep(releaseStart, releaseStart + 0.12, p)
    const baseAlpha = cell.baseAlpha ?? cell.alpha
    const restoredAlpha = cell.alpha + (baseAlpha - cell.alpha) * release
    return restoredAlpha * wavefrontFactor(cell, pitch, p, viewportHeight)
}

/* Same-seed, same-pitch continuation used behind About. Its top 12% is a full
   weave; the keep ramp reaches zero at 62%, leaving the editorial copy clear. */
export function buildContinuum(layout: FabricLayout, seed: number): FabricCell[] {
    const { cols, rows } = layout
    const rnd = mulberry32(seed ^ 0x51f7)
    const cells: FabricCell[] = []

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const t = rows > 0 ? r / rows : 1
            const keep = t < 0.12 ? 1 : Math.max(0, 1 - (t - 0.12) / 0.5)
            const q = keep * keep
            const x = cols > 0 ? c / cols : 0
            const u = rnd()
            let kind = KIND_GRAY_BASE
            let alpha = 0
            let sizeMul = 1

            if (u < 0.028 * (0.45 + x * 1.4) * keep) {
                kind = KIND_ACCENTS[(rnd() * 4) | 0]
                alpha = (0.3 + rnd() * 0.65) * (0.55 + 0.45 * keep)
                sizeMul = 0.85 + rnd() * 0.9
            } else if (u < 0.09 * q) {
                kind = KIND_GRAY_HI
                alpha = (0.5 + rnd() * 0.5) * (0.6 + 0.4 * keep)
            } else if (u < 0.28 * q) {
                kind = KIND_GRAY_MID
                alpha = 0.6 + 0.4 * keep
            } else if (u < q) {
                kind = KIND_GRAY_BASE
                alpha = (0.55 + rnd() * 0.45) * (0.6 + 0.4 * keep)
            }

            cells.push({ c, r, kind, alpha, sizeMul, baseAlpha: alpha })
        }
    }
    return cells
}

export interface ScatterMotion {
    ox: number
    oy: number
    vx: number
    vy: number
}

export interface FlipMotion {
    kind: -1 | 0 | 1 | 2 | 3
    alpha: number
    until: number
}

export interface FabricPoint {
    x: number
    y: number
}

export function pointerVelocity(
    deltaX: number,
    deltaY: number,
    elapsed: number,
): FabricPoint {
    if (!Number.isFinite(elapsed) || elapsed <= 0 || elapsed >= 120) return { x: 0, y: 0 }
    const x = deltaX / elapsed
    const y = deltaY / elapsed
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : { x: 0, y: 0 }
}

function cappedPointerVelocity(x: number, y: number, maxMagnitude: number): FabricPoint {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 0, y: 0 }
    const magnitude = Math.hypot(x, y)
    if (!Number.isFinite(magnitude)) return { x: 0, y: 0 }
    if (magnitude <= maxMagnitude) return { x, y }
    const scale = maxMagnitude / magnitude
    return { x: x * scale, y: y * scale }
}

function isFiniteMotion(motion: ScatterMotion): boolean {
    return [motion.ox, motion.oy, motion.vx, motion.vy].every(Number.isFinite)
}

export function isPosterTap(
    start: FabricPoint,
    end: FabricPoint,
    cancelled: boolean,
    maxMovement = 8,
): boolean {
    return !cancelled && Math.hypot(end.x - start.x, end.y - start.y) <= maxMovement
}

export function applyScatterImpulse(
    layout: FabricLayout,
    active: Map<number, ScatterMotion>,
    x: number,
    y: number,
    pointerVelocityX: number,
    pointerVelocityY: number,
    multiplier: number,
): number {
    const { pitch, cols, rows } = layout
    if (![pitch, x, y, multiplier].every(Number.isFinite) || pitch <= 0) return active.size
    const radius = pitch * 7
    const r0 = Math.max(0, Math.floor((y - radius) / pitch))
    const r1 = Math.min(rows - 1, Math.ceil((y + radius) / pitch))
    const c0 = Math.max(0, Math.floor((x - radius) / pitch))
    const c1 = Math.min(cols - 1, Math.ceil((x + radius) / pitch))
    const pointerVelocity = cappedPointerVelocity(pointerVelocityX, pointerVelocityY, 3)
    const speed = Math.hypot(pointerVelocity.x, pointerVelocity.y)

    for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
            const idx = r * cols + c
            const existing = active.get(idx)
            if (existing && !isFiniteMotion(existing)) {
                active.delete(idx)
                continue
            }
            const motion = existing ?? { ox: 0, oy: 0, vx: 0, vy: 0 }
            const dx = c * pitch + pitch / 2 + motion.ox - x
            const dy = r * pitch + pitch / 2 + motion.oy - y
            const distance = Math.hypot(dx, dy)
            if (distance > radius) continue

            const falloff = (1 - distance / radius) ** 2
            const inverseDistance = distance > 0.001 ? 1 / distance : 0
            const impulse = (140 + speed * 820) * falloff * multiplier * (pitch / 12)
            const velocityX =
                dx * inverseDistance * impulse +
                pointerVelocity.x * 1000 * 0.32 * falloff * multiplier
            const velocityY =
                dy * inverseDistance * impulse +
                pointerVelocity.y * 1000 * 0.32 * falloff * multiplier

            if (!active.has(idx) && velocityX ** 2 + velocityY ** 2 < 625) continue
            const nextVelocityX = motion.vx + velocityX
            const nextVelocityY = motion.vy + velocityY
            if (!Number.isFinite(nextVelocityX) || !Number.isFinite(nextVelocityY)) continue
            motion.vx = nextVelocityX
            motion.vy = nextVelocityY
            active.set(idx, motion)
        }
    }
    return active.size
}

export function applyFlipTrail(
    cells: readonly FabricCell[],
    layout: FabricLayout,
    active: Map<number, FlipMotion>,
    x: number,
    y: number,
    now: number,
    radiusCells: number,
    probability: number,
    random: () => number = Math.random,
): number {
    const { pitch, cols, rows } = layout
    const pointerC = x / pitch
    const pointerR = y / pitch
    const r0 = Math.max(0, Math.floor(pointerR - radiusCells))
    const r1 = Math.min(rows - 1, Math.ceil(pointerR + radiusCells))
    const c0 = Math.max(0, Math.floor(pointerC - radiusCells))
    const c1 = Math.min(cols - 1, Math.ceil(pointerC + radiusCells))

    for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
            const idx = r * cols + c
            const cell = cells[idx]
            if (cell.kind === KIND_NAME || !Number.isFinite(cell.alpha) || cell.alpha <= 0) continue
            const distance = Math.hypot(c + 0.5 - pointerC, r + 0.5 - pointerR)
            if (distance > radiusCells) continue
            if (random() >= probability * (1 - distance / radiusCells)) continue

            const existing = active.get(idx)
            if (existing) {
                existing.until = now + 320 + random() * 1050
                continue
            }

            const lit = KIND_ACCENTS.includes(cell.kind) || cell.kind === KIND_GRAY_HI
            const kind: FlipMotion['kind'] = lit
                ? -1
                : (((random() * 4) | 0) as 0 | 1 | 2 | 3)
            const alpha = lit ? 0 : (0.72 + random() * 0.28) * cell.alpha
            active.set(idx, { kind, alpha, until: now + 320 + random() * 1050 })
        }
    }
    return active.size
}

export function advanceScatter(active: Map<number, ScatterMotion>, dt: number): number {
    const friction = Math.exp(-6.5 * dt)
    for (const [idx, motion] of active) {
        if (!isFiniteMotion(motion)) {
            active.delete(idx)
            continue
        }
        motion.vx += -motion.ox * 52 * dt
        motion.vy += -motion.oy * 52 * dt
        motion.vx *= friction
        motion.vy *= friction
        motion.ox += motion.vx * dt
        motion.oy += motion.vy * dt

        if (
            motion.ox ** 2 + motion.oy ** 2 < 0.6 &&
            motion.vx ** 2 + motion.vy ** 2 < 64
        ) {
            active.delete(idx)
        }
    }
    return active.size
}

export function expireFlips(active: Map<number, FlipMotion>, now: number): number {
    for (const [idx, flip] of active) {
        if (flip.until <= now) active.delete(idx)
    }
    return active.size
}
