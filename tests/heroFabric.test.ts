import assert from 'node:assert/strict'
import test from 'node:test'
import * as heroFabric from '../src/lib/heroFabric.ts'
import {
    KIND_ACCENTS,
    KIND_GRAY_BASE,
    KIND_GRAY_MID,
    KIND_GRAY_HI,
    KIND_NAME,
    advanceScatter,
    applyFlipTrail,
    applyScatterImpulse,
    buildFabric,
    expireFlips,
    fadeFactor,
    layoutFabric,
    mulberry32,
    nameCells,
    type FabricCell,
    type FabricLayout,
    type FlipMotion,
    type ScatterMotion,
} from '../src/lib/heroFabric.ts'

/* ---- seeded PRNG ---- */

test('mulberry32 is deterministic and stays in [0, 1)', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 100; i++) {
        const v = a()
        assert.equal(v, b())
        assert.ok(v >= 0 && v < 1)
    }
    assert.notEqual(mulberry32(7)(), mulberry32(8)())
})

/* ---- fabric layout: one grid, cluster size per breakpoint ---- */

test('a tall desktop viewport sizes GUERRA to ~80% of the width', () => {
    const { pitch, clusterSize } = layoutFabric(1280, 1200)
    assert.equal(clusterSize, 3)
    // GUERRA = 35 glyph cols → 35·clusterSize cells at `pitch` ≈ 0.8 × width
    assert.ok(Math.abs(35 * clusterSize * pitch - 0.8 * 1280) < 1e-9)
})

test('a squat desktop viewport lets the height bind instead', () => {
    const { pitch, clusterSize } = layoutFabric(1280, 800)
    assert.equal(clusterSize, 3)
    // both name lines + gap = 16·clusterSize cells, kept within 48% of the height
    assert.ok(Math.abs(16 * clusterSize * pitch - 0.48 * 800) < 1e-9)
})

test('phone gets single-cell glyphs on the width rule', () => {
    const { pitch, clusterSize } = layoutFabric(375, 812)
    assert.equal(clusterSize, 1)
    assert.ok(Math.abs(35 * pitch - 0.8 * 375) < 1e-9)
})

test('pitch clamps to 6..14', () => {
    assert.equal(layoutFabric(200, 700).pitch, 6)
    assert.equal(layoutFabric(4000, 3000).pitch, 14)
})

test('the grid covers the whole canvas', () => {
    const { pitch, cols, rows } = layoutFabric(1280, 800)
    assert.ok(cols * pitch >= 1280 && (cols - 1) * pitch < 1280)
    assert.ok(rows * pitch >= 800 && (rows - 1) * pitch < 800)
})

test('canvas DPR is generously capped only on mobile', () => {
    const dprForCanvas = (
        heroFabric as unknown as {
            canvasDpr?: (viewportWidth: number, devicePixelRatio: number) => number
        }
    ).canvasDpr

    assert.equal(dprForCanvas?.(375, 3), 2.5)
    assert.equal(dprForCanvas?.(375, 2), 2)
    assert.equal(dprForCanvas?.(559, 4), 2.5)
    assert.equal(dprForCanvas?.(560, 3), 3)
    assert.equal(dprForCanvas?.(1440, 3), 3)
})

/* ---- name cells: DAVID over GUERRA as square clusters ---- */

const EXPECTED_BASE_GLYPHS = {
    D: ['1111.', '1...1', '1...1', '1...1', '1...1', '1...1', '1111.'],
    A: ['.111.', '1...1', '1...1', '11111', '1...1', '1...1', '1...1'],
    V: ['1...1', '1...1', '1...1', '1...1', '1...1', '.1.1.', '..1..'],
    I: ['111', '.1.', '.1.', '.1.', '.1.', '.1.', '111'],
    G: ['.1111', '1....', '1....', '1.111', '1...1', '1...1', '.111.'],
    U: ['1...1', '1...1', '1...1', '1...1', '1...1', '1...1', '.111.'],
    E: ['11111', '1....', '1....', '1111.', '1....', '1....', '11111'],
    R: ['1111.', '1...1', '1...1', '1111.', '1.1..', '1..1.', '1...1'],
} as const

type TestGlyph = keyof typeof EXPECTED_BASE_GLYPHS

const EXPECTED_MOBILE_GLYPHS: Readonly<Record<TestGlyph, readonly string[]>> = {
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

const TEST_NAME_LINES = ['DAVID', 'GUERRA'] as const
const TEST_GLYPH_WIDTHS: Record<TestGlyph, number> = {
    D: 5,
    A: 5,
    V: 5,
    I: 3,
    G: 5,
    U: 5,
    E: 5,
    R: 5,
}

function expectedSingleCellNameCells(
    cols: number,
    rows: number,
    masks: Readonly<Record<TestGlyph, readonly string[]>>,
    maskOffset: number,
): Set<number> {
    const cells = new Set<number>()
    const startRow = Math.max(3, Math.round(rows * 0.2))

    TEST_NAME_LINES.forEach((line, lineIndex) => {
        const lineCols = [...line].reduce(
            (total, rawChar) => total + TEST_GLYPH_WIDTHS[rawChar as TestGlyph] + 1,
            -1,
        )
        let c0 = Math.floor((cols - lineCols) / 2)
        const r0 = startRow + lineIndex * 9

        for (const rawChar of line) {
            const char = rawChar as TestGlyph
            masks[char].forEach((row, maskRow) => {
                Array.from(row).forEach((bit, maskCol) => {
                    if (bit === '1') {
                        cells.add(
                            (r0 + maskOffset + maskRow) * cols +
                                (c0 + maskOffset + maskCol),
                        )
                    }
                })
            })
            c0 += TEST_GLYPH_WIDTHS[char] + 1
        }
    })

    return cells
}

const sortedCells = (cells: Set<number>) => [...cells].sort((a, b) => a - b)

test('the approved name treatment dilates multi-cell glyphs by one 4-neighbor ring', () => {
    const cols = 240
    const rows = 180
    const base = nameCells(cols, rows, 2, 'base')
    const dilated = nameCells(cols, rows, 2)

    assert.ok(dilated.size > base.size)
    for (const idx of base) {
        const r = Math.floor(idx / cols)
        const c = idx % cols
        assert.ok(dilated.has(idx))
        if (c > 0) assert.ok(dilated.has(idx - 1))
        if (c < cols - 1) assert.ok(dilated.has(idx + 1))
        if (r > 0) assert.ok(dilated.has(idx - cols))
        if (r < rows - 1) assert.ok(dilated.has(idx + cols))
    }
})

test('mobile glyph masks match the editor export exactly', () => {
    const mobileGlyphs = (
        heroFabric as unknown as {
            MOBILE_GLYPHS?: Readonly<Record<TestGlyph, readonly string[]>>
        }
    ).MOBILE_GLYPHS

    assert.deepEqual(mobileGlyphs, EXPECTED_MOBILE_GLYPHS)
})

test('single-cell mobile name uses the edited masks without topology changes', () => {
    const actual = nameCells(120, 90, 1)
    const expected = expectedSingleCellNameCells(120, 90, EXPECTED_MOBILE_GLYPHS, -1)

    assert.deepEqual(sortedCells(actual), sortedCells(expected))
})

test('single-cell base weight keeps the original undilated glyphs', () => {
    const actual = nameCells(120, 90, 1, 'base')
    const expected = expectedSingleCellNameCells(120, 90, EXPECTED_BASE_GLYPHS, 0)

    assert.deepEqual(sortedCells(actual), sortedCells(expected))
})

test('name cells stay inside the grid and center each line', () => {
    const cols = 120
    const cells = nameCells(cols, 90, 1)
    let minCol = cols
    let maxCol = 0
    for (const idx of cells) {
        const c = idx % cols
        assert.ok(idx >= 0 && idx < 120 * 90)
        minCol = Math.min(minCol, c)
        maxCol = Math.max(maxCol, c)
    }
    // GUERRA is the wide line: 35 base glyph cols, plus one dilated cell per side.
    assert.equal(minCol, Math.floor((120 - 35) / 2) - 1)
    assert.equal(maxCol, Math.floor((120 - 35) / 2) + 35)
    assert.equal(minCol + maxCol, 2 * Math.floor((cols - 35) / 2) + 34)
})

/* ---- rest composition ---- */

const LAYOUT = { pitch: 10, cols: 128, rows: 80, clusterSize: 3 }

test('the same seed weaves the same fabric', () => {
    const a = buildFabric(LAYOUT, 42)
    const b = buildFabric(LAYOUT, 42)
    assert.deepEqual(a, b)
    assert.notDeepEqual(a, buildFabric(LAYOUT, 43))
})

test('every cell is filled and kinds are valid', () => {
    const cells = buildFabric(LAYOUT, 1)
    assert.equal(cells.length, 128 * 80)
    for (const cell of cells) {
        assert.ok(
            cell.kind === KIND_NAME ||
                cell.kind === KIND_GRAY_BASE ||
                cell.kind === KIND_GRAY_MID ||
                cell.kind === KIND_GRAY_HI ||
                KIND_ACCENTS.includes(cell.kind),
        )
        assert.ok(cell.alpha > 0 && cell.alpha <= 1)
    }
})

test('accent confetti thickens toward the right edge', () => {
    const cells = buildFabric(LAYOUT, 42)
    const third = Math.floor(LAYOUT.cols / 3)
    const accents = (lo: number, hi: number) =>
        cells.filter((cell) => KIND_ACCENTS.includes(cell.kind) && cell.c >= lo && cell.c < hi).length
    assert.ok(accents(2 * third, 3 * third) > 2 * accents(0, third))
})

test('only accents vary in size; some spill past their cell', () => {
    const cells = buildFabric(LAYOUT, 42)
    let spill = 0
    for (const cell of cells) {
        if (KIND_ACCENTS.includes(cell.kind)) {
            assert.ok(cell.sizeMul >= 0.85 && cell.sizeMul < 1.75)
            if (cell.sizeMul > 1) spill++
        } else {
            assert.equal(cell.sizeMul, 1)
        }
    }
    assert.ok(spill > 0)
})

test('name cells are cream-kind with high alpha', () => {
    const cells = buildFabric(LAYOUT, 42)
    const names = nameCells(LAYOUT.cols, LAYOUT.rows, LAYOUT.clusterSize)
    for (const cell of cells) {
        const isName = names.has(cell.r * LAYOUT.cols + cell.c)
        assert.equal(cell.kind === KIND_NAME, isName)
        if (isName) assert.ok(cell.alpha >= 0.85)
    }
})

/* ---- name-block fade ---- */

test('fadeFactor is 0 inside the rect and ramps to 1 over the margin', () => {
    const rect = { c0: 10, r0: 60, c1: 50, r1: 75 }
    assert.equal(fadeFactor(30, 70, rect, 8), 0)
    assert.equal(fadeFactor(30, 52, rect, 8), 1) // 8 rows above the rect
    assert.equal(fadeFactor(30, 56, rect, 8), 0.5) // halfway up the ramp
    assert.equal(fadeFactor(100, 20, rect, 8), 1) // far away
})

test('buildFabric hides cells under the fade rect', () => {
    const fade = { c0: 0, r0: 60, c1: 50, r1: 79 }
    const cells = buildFabric(LAYOUT, 42, fade)
    for (const cell of cells) {
        if (cell.c >= 0 && cell.c < 50 && cell.r >= 60) assert.equal(cell.alpha, 0)
    }
})

/* ---- approved D · Hybrid tear interaction ---- */

test('the fabric engine exposes the Hybrid tear operations at a pure test seam', () => {
    const module = heroFabric as unknown as Record<string, unknown>
    for (const operation of [
        'applyScatterImpulse',
        'applyFlipTrail',
        'advanceScatter',
        'expireFlips',
    ]) {
        assert.equal(typeof module[operation], 'function', `${operation} should be exported`)
    }
})

test('scatter drags name cells, stays inside seven pitches, and prunes weak rim impulses', () => {
    const layout: FabricLayout = { pitch: 12, cols: 15, rows: 15, clusterSize: 1 }
    const cells: FabricCell[] = Array.from({ length: layout.cols * layout.rows }, (_, idx) => ({
        c: idx % layout.cols,
        r: Math.floor(idx / layout.cols),
        kind: KIND_GRAY_BASE,
        alpha: 1,
        sizeMul: 1,
    }))
    const center = 7 * layout.cols + 7
    const rim = 7 * layout.cols + 13
    cells[center].kind = KIND_NAME
    const active = new Map<number, ScatterMotion>()

    const activated = applyScatterImpulse(layout, active, 90, 90, 1, 0, 0.55)

    assert.equal(activated, active.size)
    assert.ok(active.has(center), 'the approved name-reacts setting includes name cells')
    assert.ok(Math.abs(active.get(center)!.vx - 176) < 1e-9)
    assert.equal(active.get(center)!.vy, 0)
    assert.ok(!active.has(rim), 'sub-25px/s rim impulses stay asleep')
    assert.ok(!active.has(0), 'cells beyond the seven-pitch radius stay asleep')
})

test('flip trails recolor gray cells, dim lit cells, skip the name, and expire in range', () => {
    const layout: FabricLayout = { pitch: 10, cols: 5, rows: 5, clusterSize: 1 }
    const cells: FabricCell[] = Array.from({ length: layout.cols * layout.rows }, (_, idx) => ({
        c: idx % layout.cols,
        r: Math.floor(idx / layout.cols),
        kind: KIND_GRAY_BASE,
        alpha: 1,
        sizeMul: 1,
    }))
    const name = 2 * layout.cols + 2
    const lit = 2 * layout.cols + 1
    const gray = 2 * layout.cols + 3
    cells[name].kind = KIND_NAME
    cells[lit].kind = KIND_ACCENTS[0]
    const active = new Map<number, FlipMotion>()

    const flipped = applyFlipTrail(cells, layout, active, 25, 25, 1000, 2.6, 1, () => 0)

    assert.equal(flipped, active.size)
    assert.ok(!active.has(name), 'the name displaces but never recolors')
    assert.equal(active.get(lit)?.kind, -1)
    assert.equal(active.get(gray)?.kind, 0)
    assert.equal(active.get(gray)?.alpha, 0.72)
    for (const flip of active.values()) {
        assert.ok(flip.until >= 1320 && flip.until <= 2370)
    }
})

test('scatter springs advance, retire below the visual threshold, and flips expire on time', () => {
    const scatter = new Map<number, ScatterMotion>([
        [1, { ox: 10, oy: 0, vx: 0, vy: 0 }],
        [2, { ox: 0.5, oy: 0.3, vx: 3, vy: 4 }],
    ])

    assert.equal(advanceScatter(scatter, 0.016), 1)
    assert.ok(scatter.has(1))
    assert.ok(scatter.get(1)!.vx < 0, 'the spring accelerates back toward rest')
    assert.ok(scatter.get(1)!.ox < 10, 'the displaced cell moves home')
    assert.ok(!scatter.has(2), 'sub-pixel settled springs retire')

    const flips = new Map<number, FlipMotion>([
        [1, { kind: 0, alpha: 1, until: 999 }],
        [2, { kind: 1, alpha: 1, until: 1000 }],
        [3, { kind: 2, alpha: 1, until: 1001 }],
    ])
    assert.equal(expireFlips(flips, 1000), 1)
    assert.deepEqual([...flips.keys()], [3])
})

test('the reduced-motion poster reshuffles only after a completed stationary tap', () => {
    const isPosterTap = (
        heroFabric as unknown as {
            isPosterTap?: (
                start: { x: number; y: number },
                end: { x: number; y: number },
                cancelled: boolean,
            ) => boolean
        }
    ).isPosterTap

    assert.equal(isPosterTap?.({ x: 10, y: 10 }, { x: 15, y: 14 }, false), true)
    assert.equal(isPosterTap?.({ x: 10, y: 10 }, { x: 19, y: 10 }, false), false)
    assert.equal(isPosterTap?.({ x: 10, y: 10 }, { x: 10, y: 10 }, true), false)
})
