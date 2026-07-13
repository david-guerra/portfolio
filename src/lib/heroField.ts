/* Pure math for the hero's pixel-letter canvas, ported from the prototype
   (docs/design/portfolio-prototype.dc.html). Rendering lives in Hero.tsx. */

const LETTER_PATTERNS: Record<string, string[]> = {
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    G: ['01111', '10000', '10000', '10011', '10001', '10001', '01110'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
}

const LINE_ROWS = 7
const LINE_GAP = 2

export interface HeroMask {
    matrix: number[][]
    cols: number
    rows: number
}

function buildWordRows(word: string): string[] {
    const rows = Array<string>(LINE_ROWS).fill('')
    word.split('').forEach((ch, i) => {
        const pattern = LETTER_PATTERNS[ch]
        for (let r = 0; r < LINE_ROWS; r++) {
            rows[r] += pattern[r] + (i < word.length - 1 ? '0' : '')
        }
    })
    return rows
}

export function buildHeroMask(): HeroMask {
    const line1 = buildWordRows('DAVID')
    const line2 = buildWordRows('GUERRA')
    const w1 = line1[0].length
    const w2 = line2[0].length
    const cols = Math.max(w1, w2)
    const rows = LINE_ROWS + LINE_GAP + LINE_ROWS
    const matrix: number[][] = []
    for (let r = 0; r < rows; r++) matrix.push(new Array<number>(cols).fill(0))
    const off1 = Math.floor((cols - w1) / 2)
    const off2 = Math.floor((cols - w2) / 2)
    for (let r = 0; r < LINE_ROWS; r++) {
        for (let c = 0; c < w1; c++) matrix[r][off1 + c] = line1[r][c] === '1' ? 1 : 0
        for (let c = 0; c < w2; c++) matrix[LINE_ROWS + LINE_GAP + r][off2 + c] = line2[r][c] === '1' ? 1 : 0
    }
    return { matrix, cols, rows }
}

export interface LetterLayout {
    pitch: number
    originX: number
    originY: number
}

/* The word block takes at most 82% of the width, sits below a top margin,
   and reserves room above the name block (its height + 56px offset + 24px air). */
export function layoutLetters(opts: {
    width: number
    height: number
    textHeight: number
    cols: number
    rows: number
}): LetterLayout {
    const topMargin = Math.max(40, opts.height * 0.08)
    const bottomReserve = opts.textHeight + 56 + 24
    const availH = Math.max(60, opts.height - topMargin - bottomReserve)
    const pitchByWidth = (opts.width * 0.82) / opts.cols
    const pitchByHeight = availH / opts.rows
    const pitch = Math.max(8, Math.min(pitchByWidth, pitchByHeight, 30))
    return {
        pitch,
        originX: (opts.width - opts.cols * pitch) / 2,
        originY: topMargin,
    }
}

export interface GridLayout {
    pitch: number
    cols: number
    rows: number
}

export function layoutBackground(width: number, height: number): GridLayout {
    const pitch = Math.max(13, Math.min(20, width / 100))
    return {
        pitch,
        cols: Math.ceil(width / pitch),
        rows: Math.ceil(height / pitch),
    }
}

export function exciteTarget(dist: number, radius: number, active: boolean): number {
    return active && dist < radius ? 1 - dist / radius : 0
}

/* One animated square grid: excitement eases toward the pointer's influence,
   and a cell rerolls its accent/size/offset once per excitement burst. */
export class ParticleField {
    readonly excite: Float32Array
    readonly resting: Uint8Array
    readonly sizeMul: Float32Array
    readonly offX: Float32Array
    readonly offY: Float32Array
    readonly colors: string[]

    private readonly pitch: number
    private readonly palette: readonly string[]
    private readonly rng: () => number

    constructor(count: number, pitch: number, palette: readonly string[], rng: () => number = Math.random) {
        this.pitch = pitch
        this.palette = palette
        this.rng = rng
        this.excite = new Float32Array(count)
        this.resting = new Uint8Array(count).fill(1)
        this.sizeMul = new Float32Array(count)
        this.offX = new Float32Array(count)
        this.offY = new Float32Array(count)
        this.colors = new Array<string>(count)
        for (let i = 0; i < count; i++) this.reroll(i)
    }

    private reroll(idx: number) {
        this.colors[idx] = this.palette[Math.floor(this.rng() * this.palette.length)]
        this.sizeMul[idx] = 0.45 + this.rng() * 1.3
        const angle = this.rng() * Math.PI * 2
        const mag = this.pitch * (0.15 + this.rng() * 0.45)
        this.offX[idx] = Math.cos(angle) * mag
        this.offY[idx] = Math.sin(angle) * mag
    }

    step(idx: number, target: number, rate: number): number {
        this.excite[idx] += (target - this.excite[idx]) * rate
        const e = this.excite[idx]
        if (e > 0.04 && this.resting[idx]) {
            this.reroll(idx)
            this.resting[idx] = 0
        } else if (e < 0.03) {
            this.resting[idx] = 1
        }
        return e
    }
}
