/// <reference lib="webworker" />

// Define the shape of messages exchanged
export type BotMessage =
    | { type: 'INIT'; payload: { wasmUrl: string } }
    | { type: 'USER_MOVE'; payload: number } // col index
    | { type: 'COMPUTE_MOVE'; payload: any }
    | { type: 'RESET'; payload: any }

export type BotResponse =
    | { type: 'READY' }
    | { type: 'MOVE_COMPUTED'; payload: number }
    | { type: 'GAME_UPDATE'; payload: { board: number[][], status: string, winner: number } }
    | { type: 'ERROR'; payload: string }

let wasmModule: any = null;

// Declare the factory function
declare function createGameBotModule(options?: any): Promise<any>;

// Helpers to read board from Wasm
function getBoardState(): number[][] {
    const rows = 6; // nROW
    const cols = 7; // nCOL
    const board: number[][] = [];

    if (!wasmModule) return [];

    for (let r = 0; r < rows; r++) {
        const row: number[] = [];
        for (let c = 0; c < cols; c++) {
            row.push(wasmModule._wasm_get_cell(r, c));
        }
        board.push(row);
    }
    return board;
}

self.onmessage = async (e: MessageEvent<BotMessage>) => {
    const { type, payload } = e.data;

    try {
        switch (type) {
            case 'INIT':
                // Load the JS glue code.
                importScripts(payload.wasmUrl);

                // Calculate correct directory
                const wasmDir = payload.wasmUrl.substring(0, payload.wasmUrl.lastIndexOf('/') + 1);

                wasmModule = await createGameBotModule({
                    locateFile: (path: string, prefix: string) => {
                        if (path.endsWith('.wasm')) {
                            return wasmDir + path;
                        }
                        return prefix + path;
                    }
                });

                // Initialize C game state
                wasmModule._wasm_init();

                self.postMessage({ type: 'READY' });
                // Send initial empty board
                self.postMessage({
                    type: 'GAME_UPDATE',
                    payload: { board: getBoardState(), status: 'playing', winner: 0 }
                });
                break;

            case 'USER_MOVE':
                if (!wasmModule) throw new Error("Wasm not ready");

                const col = payload;
                // Call C: wasm_make_move(col) -> returns winner status (0=continue, -1=invalid, 1/2=win)
                const result = wasmModule._wasm_make_move(col);

                if (result === -1) {
                    console.warn("Invalid move attempted:", col);
                    return;
                }

                // Check turn count for draw
                const turnCount = wasmModule._wasm_get_turn();
                let status = 'playing';
                if (result !== 0) status = 'won';
                else if (turnCount >= 42) status = 'draw';

                // Send update
                self.postMessage({
                    type: 'GAME_UPDATE',
                    payload: { board: getBoardState(), status, winner: result }
                });
                break;

            case 'COMPUTE_MOVE':
                if (!wasmModule) throw new Error("Wasm not ready");

                // Call C: wasm_bot_move() -> returns col (and updates board internally)
                const botCol = wasmModule._wasm_bot_move();
                const botWinner = wasmModule._wasm_get_winner();
                const botTurnCount = wasmModule._wasm_get_turn();

                let botStatus = 'playing';
                if (botWinner !== 0) botStatus = 'won';
                else if (botTurnCount >= 42) botStatus = 'draw';

                self.postMessage({ type: 'MOVE_COMPUTED', payload: botCol });
                self.postMessage({
                    type: 'GAME_UPDATE',
                    payload: { board: getBoardState(), status: botStatus, winner: botWinner }
                });
                break;

            case 'RESET':
                if (wasmModule) {
                    wasmModule._wasm_init();
                }
                self.postMessage({
                    type: 'GAME_UPDATE',
                    payload: { board: getBoardState(), status: 'playing', winner: 0 }
                });
                break;

            default:
                console.warn('Unknown message type:', type);
        }
    } catch (err: any) {
        console.error("Worker Error:", err);
        self.postMessage({ type: 'ERROR', payload: err.message || "Unknown error" });
    }
};
