/// <reference lib="webworker" />

// Classic worker: loads the Emscripten glue via importScripts at runtime.
// The wasm module is the compiled Game of Life engine from c_lifegame/.

export type GoLMessage =
    | { type: 'INIT'; payload: { wasmUrl: string } }
    | { type: 'SET_CELL'; payload: { row: number; col: number; val: number } }
    | { type: 'STEP'; payload: null }
    | { type: 'CLEAR'; payload: null }
    | { type: 'RANDOMIZE'; payload: { seed: number; density: number } }

export type GoLResponse =
    | { type: 'READY' }
    | { type: 'BOARD_UPDATE'; payload: number[][] }
    | { type: 'ERROR'; payload: string }

interface EmscriptenOptions {
    locateFile?: (path: string, prefix: string) => string
}

interface GoLModule {
    _wasm_init(): void
    _wasm_get_rows(): number
    _wasm_get_cols(): number
    _wasm_set_cell(row: number, col: number, val: number): void
    _wasm_get_cell(row: number, col: number): number
    _wasm_step(): void
    _wasm_clear(): void
}

let wasmModule: GoLModule | null = null
let rows = 0
let columns = 0

// Provided globally by the importScripts'd Emscripten glue
declare function createGoLModule(options?: EmscriptenOptions): Promise<GoLModule>

function getBoardState(): number[][] {
    const board: number[][] = []
    if (!wasmModule) return []
    for (let r = 0; r < rows; r++) {
        const row: number[] = []
        for (let c = 0; c < columns; c++) {
            row.push(wasmModule._wasm_get_cell(r, c))
        }
        board.push(row)
    }
    return board
}

function sendBoard() {
    self.postMessage({ type: 'BOARD_UPDATE', payload: getBoardState() } satisfies GoLResponse)
}

function seededRandom(seed: number) {
    let state = seed >>> 0
    return () => {
        state += 0x6d2b79f5
        let value = state
        value = Math.imul(value ^ (value >>> 15), value | 1)
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296
    }
}

self.onmessage = async (e: MessageEvent<GoLMessage>) => {
    const { type } = e.data

    try {
        switch (type) {
            case 'INIT': {
                const { wasmUrl } = e.data.payload
                importScripts(wasmUrl)
                const wasmDir = wasmUrl.substring(0, wasmUrl.lastIndexOf('/') + 1)
                wasmModule = await createGoLModule({
                    locateFile: (path: string, prefix: string) => {
                        if (path.endsWith('.wasm')) return wasmDir + path
                        return prefix + path
                    },
                })
                wasmModule._wasm_init()
                rows = wasmModule._wasm_get_rows()
                columns = wasmModule._wasm_get_cols()
                if (
                    !Number.isInteger(rows) ||
                    !Number.isInteger(columns) ||
                    rows < 1 ||
                    columns < 1
                ) {
                    throw new Error('Wasm returned invalid board dimensions')
                }
                self.postMessage({ type: 'READY' } satisfies GoLResponse)
                sendBoard()
                break
            }

            case 'SET_CELL': {
                if (!wasmModule) throw new Error('Wasm not ready')
                const { row, col, val } = e.data.payload
                wasmModule._wasm_set_cell(row, col, val)
                sendBoard()
                break
            }

            case 'STEP': {
                if (!wasmModule) throw new Error('Wasm not ready')
                wasmModule._wasm_step()
                sendBoard()
                break
            }

            case 'CLEAR': {
                if (!wasmModule) throw new Error('Wasm not ready')
                wasmModule._wasm_clear()
                sendBoard()
                break
            }

            case 'RANDOMIZE': {
                if (!wasmModule) throw new Error('Wasm not ready')
                const random = seededRandom(e.data.payload.seed)
                const density = Math.max(0, Math.min(1, e.data.payload.density))
                wasmModule._wasm_clear()
                for (let row = 0; row < rows; row++) {
                    for (let column = 0; column < columns; column++) {
                        if (random() < density) wasmModule._wasm_set_cell(row, column, 1)
                    }
                }
                sendBoard()
                break
            }

            default:
                console.warn('Unknown message type:', type)
        }
    } catch (err) {
        console.error('GoL Worker Error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        self.postMessage({ type: 'ERROR', payload: message } satisfies GoLResponse)
    }
}
