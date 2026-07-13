/// <reference lib="webworker" />

export type GoLMessage =
    | { type: 'INIT'; payload: { wasmUrl: string } }
    | { type: 'SET_CELL'; payload: { row: number; col: number; val: number } }
    | { type: 'STEP'; payload: null }
    | { type: 'CLEAR'; payload: null }

export type GoLResponse =
    | { type: 'READY' }
    | { type: 'BOARD_UPDATE'; payload: number[][] }
    | { type: 'ERROR'; payload: string }

const ROWS = 18
const COLS = 18

let wasmModule: any = null

declare function createGoLModule(options?: any): Promise<any>

function getBoardState(): number[][] {
    const board: number[][] = []
    if (!wasmModule) return []
    for (let r = 0; r < ROWS; r++) {
        const row: number[] = []
        for (let c = 0; c < COLS; c++) {
            row.push(wasmModule._wasm_get_cell(r, c))
        }
        board.push(row)
    }
    return board
}

function sendBoard() {
    self.postMessage({ type: 'BOARD_UPDATE', payload: getBoardState() } as GoLResponse)
}

self.onmessage = async (e: MessageEvent<GoLMessage>) => {
    const { type, payload } = e.data

    try {
        switch (type) {
            case 'INIT': {
                importScripts(payload.wasmUrl)
                const wasmDir = payload.wasmUrl.substring(0, payload.wasmUrl.lastIndexOf('/') + 1)
                wasmModule = await createGoLModule({
                    locateFile: (path: string, prefix: string) => {
                        if (path.endsWith('.wasm')) return wasmDir + path
                        return prefix + path
                    }
                })
                wasmModule._wasm_init()
                self.postMessage({ type: 'READY' } as GoLResponse)
                sendBoard()
                break
            }

            case 'SET_CELL': {
                if (!wasmModule) throw new Error('Wasm not ready')
                const { row, col, val } = payload
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

            default:
                console.warn('Unknown message type:', type)
        }
    } catch (err: any) {
        console.error('GoL Worker Error:', err)
        self.postMessage({ type: 'ERROR', payload: err.message || 'Unknown error' } as GoLResponse)
    }
}
