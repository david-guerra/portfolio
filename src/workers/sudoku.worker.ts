/// <reference lib="webworker" />

// Classic worker: loads the Emscripten glue via importScripts at runtime.
// The wasm module is the compiled Sudoku engine from c_sudoku/.

export type SudokuMessage =
    | { type: 'INIT'; payload: { wasmUrl: string } }
    | { type: 'SET_CELL'; payload: { row: number; col: number; val: number } }
    | { type: 'CLEAR_USER' }
    | { type: 'SOLVE' }
    | { type: 'RESET' }

export type SudokuResponse =
    | { type: 'READY' }
    | { type: 'BOARD_UPDATE'; payload: { board: number[][]; solved: boolean } }
    | { type: 'ERROR'; payload: string }

interface EmscriptenOptions {
    locateFile?: (path: string, prefix: string) => string
}

interface SudokuModule {
    _wasm_sudoku_init(): void
    _wasm_sudoku_clear(): void
    _wasm_sudoku_get_cell(r: number, c: number): number
    _wasm_sudoku_set_cell(r: number, c: number, val: number): void
    _wasm_sudoku_is_safe(r: number, c: number, num: number): number
    _wasm_sudoku_is_solved(): number
    _wasm_sudoku_solve(): number
}

let wasmModule: SudokuModule | null = null
let initialBoard: number[][] = []

// Provided globally by the importScripts'd Emscripten glue
declare function createSudokuModule(options?: EmscriptenOptions): Promise<SudokuModule>

function getBoardState(): number[][] {
    const board: number[][] = []
    if (!wasmModule) return []
    for (let r = 0; r < 9; r++) {
        const row: number[] = []
        for (let c = 0; c < 9; c++) {
            row.push(wasmModule._wasm_sudoku_get_cell(r, c))
        }
        board.push(row)
    }
    return board
}

self.onmessage = async (e: MessageEvent<SudokuMessage>) => {
    const { type } = e.data

    try {
        switch (type) {
            case 'INIT': {
                const { wasmUrl } = e.data.payload
                importScripts(wasmUrl)

                const wasmDir = wasmUrl.substring(0, wasmUrl.lastIndexOf('/') + 1)

                wasmModule = await createSudokuModule({
                    locateFile: (path: string, prefix: string) => {
                        if (path.endsWith('.wasm')) {
                            return wasmDir + path
                        }
                        return prefix + path
                    },
                })

                wasmModule._wasm_sudoku_init()

                self.postMessage({ type: 'READY' })
                initialBoard = getBoardState()
                self.postMessage({
                    type: 'BOARD_UPDATE',
                    payload: { board: initialBoard, solved: false },
                })
                break
            }

            case 'SET_CELL': {
                if (!wasmModule) throw new Error('Wasm not ready')
                const { row, col, val } = e.data.payload
                wasmModule._wasm_sudoku_set_cell(row, col, val)
                self.postMessage({
                    type: 'BOARD_UPDATE',
                    payload: { board: getBoardState(), solved: !!wasmModule._wasm_sudoku_is_solved() },
                })
                break
            }

            case 'CLEAR_USER': {
                if (!wasmModule) throw new Error('Wasm not ready')
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (initialBoard[r][c] === 0) {
                            wasmModule._wasm_sudoku_set_cell(r, c, 0)
                        }
                    }
                }
                self.postMessage({
                    type: 'BOARD_UPDATE',
                    payload: { board: getBoardState(), solved: false },
                })
                break
            }

            case 'SOLVE': {
                if (!wasmModule) throw new Error('Wasm not ready')
                // Clear user cells first, then solve from the initial puzzle
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (initialBoard[r][c] === 0) {
                            wasmModule._wasm_sudoku_set_cell(r, c, 0)
                        }
                    }
                }
                wasmModule._wasm_sudoku_solve()
                self.postMessage({
                    type: 'BOARD_UPDATE',
                    payload: { board: getBoardState(), solved: !!wasmModule._wasm_sudoku_is_solved() },
                })
                break
            }

            case 'RESET': {
                if (!wasmModule) throw new Error('Wasm not ready')
                wasmModule._wasm_sudoku_clear()
                wasmModule._wasm_sudoku_init()
                initialBoard = getBoardState()
                self.postMessage({
                    type: 'BOARD_UPDATE',
                    payload: { board: initialBoard, solved: false },
                })
                break
            }

            default:
                console.warn('Unknown message type:', type)
        }
    } catch (err) {
        console.error('Sudoku Worker Error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        self.postMessage({ type: 'ERROR', payload: message })
    }
}
