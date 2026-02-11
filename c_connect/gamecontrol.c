#include "gamecontrol.h"
#include "board.h"

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool checkWinState(int x, int y, Board *b) {
  bool state = false;
  if (y + 3 < nCOL) {
    state |= (b->board[x][y] == b->board[x][y + 1] &&
              b->board[x][y] == b->board[x][y + 2] &&
              b->board[x][y] == b->board[x][y + 3]);
  }
  if (x + 3 < nROW) {
    state |= (b->board[x][y] == b->board[x + 1][y] &&
              b->board[x][y] == b->board[x + 2][y] &&
              b->board[x][y] == b->board[x + 3][y]);
  }
  if (x + 3 < nROW && y + 3 < nCOL) {
    state |= (b->board[x][y] == b->board[x + 1][y + 1] &&
              b->board[x][y] == b->board[x + 2][y + 2] &&
              b->board[x][y] == b->board[x + 3][y + 3]);
  }
  if (x + 3 < nROW && y - 3 >= 0) {
    state |= (b->board[x][y] == b->board[x + 1][y - 1] &&
              b->board[x][y] == b->board[x + 2][y - 2] &&
              b->board[x][y] == b->board[x + 3][y - 3]);
  }
  return state;
}

int getWinner(Board *newBoard) {
  for (int i = 0; i < nROW; i++) {
    for (int j = 0; j < nCOL; j++) {
      if (!newBoard->board[i][j])
        continue;
      if (checkWinState(i, j, newBoard))
        return newBoard->board[i][j];
    }
  }
  return 0;
}
