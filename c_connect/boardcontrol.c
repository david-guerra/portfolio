#include "boardcontrol.h"
#include "board.h"

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

void initBoard(Board *newBoard) {
  newBoard->numTurn = 0;
  for (int i = 0; i < nROW; i++) {
    for (int j = 0; j < nCOL; j++) {
      newBoard->board[i][j] = 0;
    }
  }
  newBoard->turn = 0;
}

void updateBoard(Board *newBoard, int col) {
  for (int i = nROW - 1; i >= 0; i--) {
    if (!newBoard->board[i][col]) {
      newBoard->board[i][col] = newBoard->turn + 1;
      break;
    }
  }
  newBoard->turn ^= 1;
  newBoard->numTurn++;
}

void undoUpdateBoard(Board *newBoard, int col) {
  newBoard->turn ^= 1;
  newBoard->numTurn--;

  for (int i = 0; i < nROW; i++) {
    if (newBoard->board[i][col]) {
      newBoard->board[i][col] = 0;
      break;
    }
  }
}
