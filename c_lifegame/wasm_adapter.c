#include "board.h"
#include "boardcontrol.h"
#include <emscripten.h>

/* Global double-buffered state */
GoL g_gol;

EMSCRIPTEN_KEEPALIVE
void wasm_init() { initGoL(&g_gol); }

EMSCRIPTEN_KEEPALIVE
int wasm_get_rows() { return nROW; }

EMSCRIPTEN_KEEPALIVE
int wasm_get_cols() { return nCOL; }

EMSCRIPTEN_KEEPALIVE
void wasm_set_cell(int row, int col, int val) {
  setCell(&g_gol, row, col, val ? true : false);
}

EMSCRIPTEN_KEEPALIVE
int wasm_get_cell(int row, int col) {
  return getCell(&g_gol, row, col) ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE
void wasm_step() { updateGoL(&g_gol); }

EMSCRIPTEN_KEEPALIVE
void wasm_clear() { initGoL(&g_gol); }
