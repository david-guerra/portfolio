# How to Compile Your C Code (Full Logic Integration)

You will be moving your game logic into the C code. This requires compiling multiple files together and using a "Bridge" file to talk to JavaScript.

## 1. Create the Bridge File (`wasm_adapter.c`)
Create a new file named `wasm_adapter.c` in the **`c_code`** directory.
This file will include your existing headers and expose functions to JS.

**Copy this content into `c_code/wasm_adapter.c`:**

```c
#include <emscripten.h>
#include "board.h"
#include "boardcontrol.h"
#include "bot.h"
#include "botcontrol.h"
#include "gamecontrol.h"

// Global state
Board g_board;
Bot g_bot;

EMSCRIPTEN_KEEPALIVE
void wasm_init() {
    initGame(&g_board);
    initBot(&g_bot);
    initBoard(&g_board);
}

EMSCRIPTEN_KEEPALIVE
int wasm_make_move(int col) {
    // 1. Validate column
    if (col < 0 || col >= nCOL) return -1;
    if (g_board.board[0][col] != 0) return -1; // Column full

    // 2. Perform Move
    updateBoard(&g_board, col);

    // 3. Return Winner Status
    return getWinner(&g_board);
}

EMSCRIPTEN_KEEPALIVE
int wasm_bot_move() {
    // 1. Calculate Move
    int col = callBot(&g_board, &g_bot);
    
    // 2. Apply Move
    updateBoard(&g_board, col);
    
    // 3. Return the column chosen
    return col;
}

EMSCRIPTEN_KEEPALIVE
int wasm_get_winner() {
    return getWinner(&g_board);
}

EMSCRIPTEN_KEEPALIVE
int wasm_get_cell(int r, int c) {
    if (r < 0 || r >= nROW || c < 0 || c >= nCOL) return 0;
    return g_board.board[r][c];
}
```

## 2. Compilation Command
Run this command from inside the `c_code` directory:

```bash
emcc \
  wasm_adapter.c \
  boardcontrol.c \
  bot.c \
  botcontrol.c \
  gamecontrol.c \
  -o ../public/wasm/game_bot.js \
  -s WASM=1 \
  -s "EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap']" \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createGameBotModule" \
  -s ENVIRONMENT=worker \
  -O3
```

> [!NOTE]
> We are **excluding** `viergewinnt.c` because it contains the `main()` loop, which we don't want. The `wasm_adapter.c` functions drive the game now.

## 3. Usage
The resulting files will be placed directly in `public/wasm/`.
Values returned by `wasm_get_cell`:
- 0: Empty
- 1: Player 1 (Red)
- 2: Player 2 (Yellow)
