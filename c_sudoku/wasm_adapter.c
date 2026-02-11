#include "board.h"
#include "boardcontrol.h"
#include <emscripten.h>

// Global state
Board g_board;

EMSCRIPTEN_KEEPALIVE
void wasm_sudoku_clear() {
  initBoard(&g_board);
  for (int i = 0; i < nROW; i++) {
    for (int j = 0; j < nCOL; j++) {
      if (g_board.board[i][j] != 0) {
        updateBoard(&g_board, i, j, 0);
      }
    }
  }
}

EMSCRIPTEN_KEEPALIVE
void wasm_sudoku_init() { initBoard(&g_board); }

EMSCRIPTEN_KEEPALIVE
int wasm_sudoku_get_cell(int r, int c) {
  if (r < 0 || r >= nROW || c < 0 || c >= nCOL)
    return 0;
  return g_board.board[r][c];
}

EMSCRIPTEN_KEEPALIVE
int wasm_sudoku_set_cell(int r, int c, int val) {
  if (r < 0 || r >= nROW || c < 0 || c >= nCOL)
    return 0;
  if (val < 0 || val > 9)
    return 0;
  updateBoard(&g_board, r, c, val);
  return 1;
}

EMSCRIPTEN_KEEPALIVE
int wasm_sudoku_is_safe(int r, int c, int num) {
  if (r < 0 || r >= nROW || c < 0 || c >= nCOL)
    return 0;
  // Temporarily clear the cell to check if num is valid there
  int old = g_board.board[r][c];
  if (old != 0) {
    updateBoard(&g_board, r, c, 0);
  }
  int result = isSafe(&g_board, r, c, num) ? 1 : 0;
  if (old != 0) {
    updateBoard(&g_board, r, c, old);
  }
  return result;
}

EMSCRIPTEN_KEEPALIVE
int wasm_sudoku_is_solved() {
  // Validate directly from board values — no dependency on bitmask state
  int complete = (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) |
                 (1 << 6) | (1 << 7) | (1 << 8) | (1 << 9); // 1022

  int rows[9] = {0}, cols[9] = {0}, boxes[9] = {0};

  for (int r = 0; r < nROW; r++) {
    for (int c = 0; c < nCOL; c++) {
      int val = g_board.board[r][c];
      if (val < 1 || val > 9)
        return 0; // empty or invalid
      int bit = 1 << val;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[(r / 3) * 3 + (c / 3)] |= bit;
    }
  }

  for (int i = 0; i < 9; i++) {
    if (rows[i] != complete || cols[i] != complete || boxes[i] != complete)
      return 0;
  }
  return 1;
}

EMSCRIPTEN_KEEPALIVE
int wasm_sudoku_solve() { return solveSudoku(&g_board) ? 1 : 0; }
