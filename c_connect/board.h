#ifndef BOARD_H
#define BOARD_H

#include <stdint.h>

#define nROW 6
#define nCOL 7

typedef struct Board {
  uint64_t position; // current player's pieces
  uint64_t mask;     // all pieces (both players)
  int height[nCOL];  // next available bit index per column
  int turn;
  int numTurn;
} Board;

#endif
