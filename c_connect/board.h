#ifndef BOARD_H
#define BOARD_H

#define nROW 6
#define nCOL 7

typedef struct Board {
  int board[nROW][nCOL];
  int turn;
  // int mode;
  int numTurn;
} Board;

#endif
