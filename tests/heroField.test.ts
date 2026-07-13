import assert from 'node:assert/strict'
import test from 'node:test'
import {
    ParticleField,
    buildHeroMask,
    exciteTarget,
    layoutBackground,
    layoutLetters,
} from '../src/lib/heroField.ts'

const PALETTE = ['#e8734a', '#a48ef0', '#5cc9c4', '#c3d94a']

/* ---- pixel-letter mask: DAVID over GUERRA ---- */

test('mask spans GUERRA width and both 7-row lines plus the 2-row gap', () => {
    const { matrix, cols, rows } = buildHeroMask()
    // DAVID: 5 letters ×5 + 4 gaps = 29 · GUERRA: 6 letters ×5 + 5 gaps = 35
    assert.equal(cols, 35)
    assert.equal(rows, 16)
    assert.equal(matrix.length, 16)
    assert.ok(matrix.every((row) => row.length === 35))
})

test('the gap rows between the words are empty', () => {
    const { matrix } = buildHeroMask()
    assert.ok(matrix[7].every((v) => v === 0))
    assert.ok(matrix[8].every((v) => v === 0))
})

test('DAVID is centered: D top row lands at column offset 3', () => {
    const { matrix } = buildHeroMask()
    assert.deepEqual(matrix[0].slice(0, 3), [0, 0, 0])
    assert.deepEqual(matrix[0].slice(3, 8), [1, 1, 1, 1, 0]) // D = '11110'
})

test('GUERRA starts flush left: G top row at column 0', () => {
    const { matrix } = buildHeroMask()
    assert.deepEqual(matrix[9].slice(0, 5), [0, 1, 1, 1, 1]) // G = '01111'
})

test('letters are separated by one empty column', () => {
    const { matrix } = buildHeroMask()
    // D occupies cols 3–7, so col 8 is the D→A gap for all 7 rows of line one
    for (let r = 0; r < 7; r++) assert.equal(matrix[r][8], 0)
})

/* ---- letter layout ---- */

const MASK = { cols: 35, rows: 16 }

test('desktop layout caps the pitch at 30 and centers the word block', () => {
    const { pitch, originX, originY } = layoutLetters({
        width: 1440,
        height: 900,
        textHeight: 100,
        ...MASK,
    })
    assert.equal(pitch, 30)
    assert.equal(originX, (1440 - 35 * 30) / 2)
    assert.equal(originY, 72) // topMargin = max(40, 900 × 0.08)
})

test('narrow viewport sizes the pitch from 82% of the width', () => {
    const { pitch, originX, originY } = layoutLetters({
        width: 360,
        height: 640,
        textHeight: 120,
        ...MASK,
    })
    const expected = (360 * 0.82) / 35
    assert.ok(Math.abs(pitch - expected) < 1e-9)
    assert.ok(Math.abs(originX - (360 - 35 * expected) / 2) < 1e-9)
    assert.equal(originY, 51.2)
})

test('pitch never drops below 8 even when width demands less', () => {
    const { pitch } = layoutLetters({ width: 240, height: 640, textHeight: 120, ...MASK })
    assert.equal(pitch, 8)
})

test('cramped height floors available height at 60 and pitch at 8', () => {
    const { pitch, originY } = layoutLetters({
        width: 1440,
        height: 300,
        textHeight: 200,
        ...MASK,
    })
    assert.equal(pitch, 8)
    assert.equal(originY, 40) // topMargin floor
})

/* ---- background grid layout ---- */

test('background pitch is width/100 clamped to 13..20', () => {
    assert.equal(layoutBackground(1440, 900).pitch, 14.4)
    assert.equal(layoutBackground(2600, 900).pitch, 20)
    assert.equal(layoutBackground(800, 900).pitch, 13)
})

test('background grid covers the whole canvas', () => {
    const { pitch, cols, rows } = layoutBackground(1440, 900)
    assert.ok(cols * pitch >= 1440)
    assert.ok(rows * pitch >= 900)
    assert.ok((cols - 1) * pitch < 1440)
    assert.ok((rows - 1) * pitch < 900)
})

/* ---- excitement target ---- */

test('excitement falls off linearly with distance inside the radius', () => {
    assert.equal(exciteTarget(0, 120, true), 1)
    assert.equal(exciteTarget(60, 120, true), 0.5)
    assert.equal(exciteTarget(120, 120, true), 0)
    assert.equal(exciteTarget(240, 120, true), 0)
})

test('an inactive pointer excites nothing', () => {
    assert.equal(exciteTarget(0, 120, false), 0)
})

/* ---- particle field ---- */

test('a fresh field is fully at rest with rerolled cell traits in range', () => {
    const field = new ParticleField(50, 20, PALETTE)
    for (let i = 0; i < 50; i++) {
        assert.equal(field.excite[i], 0)
        assert.equal(field.resting[i], 1)
        // traits live in Float32Arrays, so bounds allow float32 rounding
        assert.ok(field.sizeMul[i] >= 0.45 - 1e-5 && field.sizeMul[i] < 1.75)
        const mag = Math.hypot(field.offX[i], field.offY[i])
        assert.ok(mag >= 20 * 0.15 - 1e-4 && mag < 20 * 0.6)
        assert.ok(PALETTE.includes(field.colors[i]))
    }
})

test('a zero rng picks the first accent and a rightward minimal offset', () => {
    const field = new ParticleField(1, 20, PALETTE, () => 0)
    assert.equal(field.colors[0], PALETTE[0])
    assert.ok(Math.abs(field.sizeMul[0] - 0.45) < 1e-5)
    assert.ok(Math.abs(field.offX[0] - 20 * 0.15) < 1e-4)
    assert.equal(field.offY[0], 0)
})

test('step eases excitement toward the target at the given rate', () => {
    const field = new ParticleField(1, 20, PALETTE)
    const e1 = field.step(0, 1, 0.16)
    assert.ok(Math.abs(e1 - 0.16) < 1e-6)
    const e2 = field.step(0, 1, 0.16)
    assert.ok(e2 > e1 && e2 < 1)
    assert.equal(field.excite[0], e2)
})

test('a resting cell rerolls once on excitement and re-arms only after decay', () => {
    let calls = 0
    const rng = () => {
        calls++
        return 0.5
    }
    const field = new ParticleField(1, 20, PALETTE, rng)
    const initCalls = calls
    assert.equal(initCalls, 4) // color, size, angle, magnitude

    field.step(0, 1, 0.16) // 0.16 > 0.04: leaves rest, rerolls
    assert.equal(calls, initCalls + 4)
    assert.equal(field.resting[0], 0)

    field.step(0, 1, 0.16) // still excited: no second reroll
    assert.equal(calls, initCalls + 4)

    while (field.excite[0] >= 0.03) field.step(0, 0, 0.16)
    assert.equal(field.resting[0], 1) // decayed: re-armed

    field.step(0, 1, 0.16) // excites again: fresh reroll
    assert.equal(calls, initCalls + 8)
})
