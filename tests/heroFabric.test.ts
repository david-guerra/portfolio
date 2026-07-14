import assert from 'node:assert/strict'
import test from 'node:test'
import {
    KIND_ACCENTS,
    KIND_GRAY_BASE,
    KIND_GRAY_MID,
    KIND_GRAY_HI,
    KIND_NAME,
    buildFabric,
    fadeFactor,
    layoutFabric,
    mulberry32,
    nameCells,
    rippleIntensity,
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
    const { pitch, k } = layoutFabric(1280, 1200)
    assert.equal(k, 3)
    // GUERRA = 35 glyph cols → 35·k cells at `pitch` ≈ 0.8 × width
    assert.ok(Math.abs(35 * k * pitch - 0.8 * 1280) < 1e-9)
})

test('a squat desktop viewport lets the height bind instead', () => {
    const { pitch, k } = layoutFabric(1280, 800)
    assert.equal(k, 3)
    // both name lines + gap = 16·k cells, kept within 48% of the height
    assert.ok(Math.abs(16 * k * pitch - 0.48 * 800) < 1e-9)
})

test('phone gets single-cell glyphs on the width rule', () => {
    const { pitch, k } = layoutFabric(375, 812)
    assert.equal(k, 1)
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

/* ---- name cells: DAVID over GUERRA as k×k clusters ---- */

test('k=2 lights exactly 4× the cells of k=1', () => {
    const one = nameCells(120, 90, 1)
    const two = nameCells(240, 180, 2)
    assert.equal(two.size, one.size * 4)
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
    // GUERRA is the wide line: 35 glyph cols centered in 120
    assert.equal(minCol, Math.floor((120 - 35) / 2))
    assert.equal(maxCol, Math.floor((120 - 35) / 2) + 34)
})

/* ---- rest composition ---- */

const LAYOUT = { pitch: 10, cols: 128, rows: 80, k: 3 }

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
    const names = nameCells(LAYOUT.cols, LAYOUT.rows, LAYOUT.k)
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

/* ---- ripple rings ---- */

test('a ripple ring peaks where the expanding radius meets the cell', () => {
    // at t=0.5 the ring radius is 8 cells; a cell at distance 8 sits dead-center
    const peak = rippleIntensity(8, 0.5)
    assert.ok(Math.abs(peak - (1 - 0.5 / 1.05) * 0.9) < 1e-9)
    assert.ok(rippleIntensity(8, 0.5) > rippleIntensity(9.5, 0.5))
})

test('cells outside the band and expired ripples contribute nothing', () => {
    assert.equal(rippleIntensity(20, 0.5), 0) // ring at 8, band 2.6
    assert.equal(rippleIntensity(18, 1.1), 0) // past the 1.05s lifetime
})
