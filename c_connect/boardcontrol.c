#include "boardcontrol.h"
#include "board.h"

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Bottom bit index of each column
static const int BOTTOM[nCOL] = {0, 7, 14, 21, 28, 35, 42};

void initBoard(Board *b) {
  b->position = 0;
  b->mask = 0;
  b->turn = 0;
  b->numTurn = 0;
  for (int i = 0; i < nCOL; i++) {
    b->height[i] = BOTTOM[i];
  }
}

void updateBoard(Board *b, int col) {
  b->position ^= b->mask;              // switch to opponent's perspective
  b->mask |= (1ULL << b->height[col]); // place piece
  b->height[col]++;
  b->turn ^= 1;
  b->numTurn++;
}

void undoUpdateBoard(Board *b, int col) {
  b->height[col]--;
  b->mask &= ~(1ULL << b->height[col]); // remove piece
  b->position ^= b->mask;               // switch back perspective
  b->turn ^= 1;
  b->numTurn--;
}

bool canPlay(Board *b, int col) {
  // Check if top playable row (row 0) in this column is empty
  // Top playable bit for column c = BOTTOM[c] + nROW - 1
  return (b->mask & (1ULL << (BOTTOM[col] + nROW - 1))) == 0;
}

// Returns 0 (empty), 1 (player 1), 2 (player 2)
// row 0 = top, row 5 = bottom
int getCell(Board *b, int row, int col) {
  int bitIndex = BOTTOM[col] + (nROW - 1 - row);
  uint64_t bit = 1ULL << bitIndex;
  if (!(b->mask & bit))
    return 0;

  // Determine which player owns this cell.
  // position stores the CURRENT player's pieces.
  // Current player = turn (0-indexed). Player 1 placed on even turns, Player 2
  // on odd. position = current player's pieces, mask ^ position = other
  // player's pieces.
  uint64_t currentPlayerBits = b->position;
  uint64_t otherPlayerBits = b->mask ^ b->position;

  // Player 1 moved first (turn==0), Player 2 moved second (turn==1).
  // If turn==0, current player is Player 1, so position = P1 pieces.
  // If turn==1, current player is Player 2, so position = P2 pieces.
  if (b->turn == 0) {
    // position = player 1
    if (currentPlayerBits & bit)
      return 1;
    if (otherPlayerBits & bit)
      return 2;
  } else {
    // position = player 2
    if (currentPlayerBits & bit)
      return 2;
    if (otherPlayerBits & bit)
      return 1;
  }
  return 0;
}
