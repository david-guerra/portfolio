/// <reference lib="webworker" />

// Classic worker: loads the Emscripten glue via importScripts at runtime.
// The wasm module is the compiled Connect Four engine from c_connect/.

export type GameStatus = 'playing' | 'won' | 'draw'

export type BotMessage =
    | { type: 'INIT'; payload: { wasmUrl: string } }
    | { type: 'USER_MOVE'; payload: number } // col index
    | { type: 'COMPUTE_MOVE'; payload: null }
    | { type: 'RESET'; payload: null }
    | { type: 'SET_DIFFICULTY'; payload: number } // search depth

export type BotResponse =
    | { type: 'READY' }
    | { type: 'MOVE_COMPUTED'; payload: number }
    | { type: 'GAME_UPDATE'; payload: { board: number[][]; status: GameStatus; winner: number } }
    | { type: 'ERROR'; payload: string }

interface EmscriptenOptions {
    locateFile?: (path: string, prefix: string) => string
}

interface GameBotModule {
    _wasm_init(): void
    _wasm_set_depth(depth: number): void
    _wasm_make_move(col: number): number
    _wasm_bot_move(): number
    _wasm_get_winner(): number
    _wasm_get_cell(r: number, c: number): number
    _wasm_get_turn(): number
}

let wasmModule: GameBotModule | null = null

// Provided globally by the importScripts'd Emscripten glue
declare function createGameBotModule(options?: EmscriptenOptions): Promise<GameBotModule>

function getBoardState(): number[][] {
    const rows = 6 // nROW
    const cols = 7 // nCOL
    const board: number[][] = []

    if (!wasmModule) return []

    for (let r = 0; r < rows; r++) {
        const row: number[] = []
        for (let c = 0; c < cols; c++) {
            row.push(wasmModule._wasm_get_cell(r, c))
        }
        board.push(row)
    }
    return board
}

self.onmessage = async (e: MessageEvent<BotMessage>) => {
    const { type } = e.data

    try {
        switch (type) {
            case 'INIT': {
                // Load the JS glue code.
                const { wasmUrl } = e.data.payload
                importScripts(wasmUrl)

                // Calculate correct directory
                const wasmDir = wasmUrl.substring(0, wasmUrl.lastIndexOf('/') + 1)

                wasmModule = await createGameBotModule({
                    locateFile: (path: string, prefix: string) => {
                        if (path.endsWith('.wasm')) {
                            return wasmDir + path
                        }
                        return prefix + path
                    },
                })

                // Initialize C game state
                wasmModule._wasm_init()

                self.postMessage({ type: 'READY' })
                // Send initial empty board
                self.postMessage({
                    type: 'GAME_UPDATE',
                    payload: { board: getBoardState(), status: 'playing', winner: 0 },
                })
                break
            }

            case 'USER_MOVE': {
                if (!wasmModule) throw new Error('Wasm not ready')

                const col = e.data.payload
                // Call C: wasm_make_move(col) -> returns winner status (0=continue, -1=invalid, 1/2=win)
                const result = wasmModule._wasm_make_move(col)

                if (result === -1) {
                    console.warn('Invalid move attempted:', col)
                    return
                }

                // Check turn count for draw
                const turnCount = wasmModule._wasm_get_turn()
                let status: GameStatus = 'playing'
                if (result !== 0) status = 'won'
                else if (turnCount >= 42) status = 'draw'

                // Send update
                self.postMessage({
                    type: 'GAME_UPDATE',
                    payload: { board: getBoardState(), status, winner: result },
                })
                break
            }

            case 'COMPUTE_MOVE': {
                if (!wasmModule) throw new Error('Wasm not ready')

                // Call C: wasm_bot_move() -> returns col (and updates board internally)
                const botCol = wasmModule._wasm_bot_move()
                const botWinner = wasmModule._wasm_get_winner()
                const botTurnCount = wasmModule._wasm_get_turn()

                let botStatus: GameStatus = 'playing'
                if (botWinner !== 0) botStatus = 'won'
                else if (botTurnCount >= 42) botStatus = 'draw'

                self.postMessage({ type: 'MOVE_COMPUTED', payload: botCol })
                self.postMessage({
                    type: 'GAME_UPDATE',
                    payload: { board: getBoardState(), status: botStatus, winner: botWinner },
                })
                break
            }

            case 'RESET': {
                if (wasmModule) {
                    wasmModule._wasm_init()
                }
                self.postMessage({
                    type: 'GAME_UPDATE',
                    payload: { board: getBoardState(), status: 'playing', winner: 0 },
                })
                break
            }

            case 'SET_DIFFICULTY': {
                if (wasmModule) {
                    wasmModule._wasm_set_depth(e.data.payload)
                }
                break
            }

            default:
                console.warn('Unknown message type:', type)
        }
    } catch (err) {
        console.error('Worker Error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        self.postMessage({ type: 'ERROR', payload: message })
    }
}
