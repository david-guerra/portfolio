#include "board.h"
#include "boardcontrol.h"
#include "bot.h"
#include "botcontrol.h"
#include "gamecontrol.h"
#include <emscripten.h>

// Global state
Board g_board;
Bot g_bot;
int g_depth = 12;

EMSCRIPTEN_KEEPALIVE
void wasm_init() {
  initBot(&g_bot);
  initBoard(&g_board);
}

EMSCRIPTEN_KEEPALIVE
void wasm_set_depth(int depth) {
  if (depth >= 1 && depth <= 20)
    g_depth = depth;
}

EMSCRIPTEN_KEEPALIVE
int wasm_make_move(int col) {
  if (col < 0 || col >= nCOL)
    return -1;
  if (!canPlay(&g_board, col))
    return -1;

  updateBoard(&g_board, col);

  return getWinner(&g_board);
}

EMSCRIPTEN_KEEPALIVE
int wasm_bot_move() {
  int col = callBot(&g_board, g_depth, &g_bot);

  updateBoard(&g_board, col);

  return col;
}

EMSCRIPTEN_KEEPALIVE
int wasm_get_winner() { return getWinner(&g_board); }

EMSCRIPTEN_KEEPALIVE
int wasm_get_cell(int r, int c) {
  if (r < 0 || r >= nROW || c < 0 || c >= nCOL)
    return 0;
  return getCell(&g_board, r, c);
}

EMSCRIPTEN_KEEPALIVE
int wasm_get_turn() { return g_board.numTurn; }