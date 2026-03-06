#include "boardcontrol.h"
#include "gamecontrol.h"
#include <assert.h>
#include <stdio.h>

void test_horizontal_win() {
  Board b;
  initBoard(&b);

  // Player 1 plays columns 0,1,2,3 (bottom row)
  // Player 2 plays columns 0,1,2 (row above)
  updateBoard(&b, 0); // P1 col 0
  updateBoard(&b, 0); // P2 col 0
  updateBoard(&b, 1); // P1 col 1
  updateBoard(&b, 1); // P2 col 1
  updateBoard(&b, 2); // P1 col 2
  updateBoard(&b, 2); // P2 col 2
  updateBoard(&b, 3); // P1 col 3 -> wins horizontally

  int winner = getWinner(&b);
  assert(winner == 1);
  printf("  Horizontal win: PASSED (winner=%d)\n", winner);
}

void test_vertical_win() {
  Board b;
  initBoard(&b);

  // Player 1 stacks column 0, Player 2 stacks column 1
  updateBoard(&b, 0); // P1
  updateBoard(&b, 1); // P2
  updateBoard(&b, 0); // P1
  updateBoard(&b, 1); // P2
  updateBoard(&b, 0); // P1
  updateBoard(&b, 1); // P2
  updateBoard(&b, 0); // P1 -> 4 in column 0

  int winner = getWinner(&b);
  assert(winner == 1);
  printf("  Vertical win:   PASSED (winner=%d)\n", winner);
}

void test_undo() {
  Board b;
  initBoard(&b);

  updateBoard(&b, 3);
  updateBoard(&b, 4);
  undoUpdateBoard(&b, 4);
  undoUpdateBoard(&b, 3);

  assert(b.mask == 0);
  assert(b.position == 0);
  assert(b.numTurn == 0);
  assert(b.turn == 0);
  printf("  Undo round-trip: PASSED\n");
}

void test_can_play() {
  Board b;
  initBoard(&b);

  // Fill column 0 completely (6 pieces)
  for (int i = 0; i < nROW; i++) {
    assert(canPlay(&b, 0));
    updateBoard(&b, 0);
  }
  assert(!canPlay(&b, 0));
  assert(canPlay(&b, 1)); // other columns still open
  printf("  canPlay:         PASSED\n");
}

void test_get_cell() {
  Board b;
  initBoard(&b);

  updateBoard(&b, 3); // P1 at bottom of col 3
  updateBoard(&b, 4); // P2 at bottom of col 4

  int p1 = getCell(&b, 5, 3); // bottom row, col 3
  int p2 = getCell(&b, 5, 4); // bottom row, col 4
  int empty = getCell(&b, 0, 0);

  assert(p1 == 1);
  assert(p2 == 2);
  assert(empty == 0);
  printf("  getCell:         PASSED (p1=%d, p2=%d, empty=%d)\n", p1, p2, empty);
}

void test_diagonal_win() {
  Board b;
  initBoard(&b);

  // Build a diagonal for P1: (5,0), (4,1), (3,2), (2,3)
  // col 0: P1 (row 5)
  updateBoard(&b, 0); // P1 col 0 row 5
  // col 1: P2 (row 5), then P1 (row 4)
  updateBoard(&b, 1); // P2 col 1 row 5
  updateBoard(&b, 1); // P1 col 1 row 4
  // col 2: P2 (row 5), P2 needs a filler, P2 (row 4), P1 (row 3)
  updateBoard(&b, 2); // P2 col 2 row 5
  updateBoard(&b, 2); // P1 col 2 row 4
  updateBoard(&b, 3); // P2 col 3 row 5
  updateBoard(&b, 2); // P1 col 2 row 3
  // col 3: need P2,P2 fillers then P1
  updateBoard(&b, 3); // P2 col 3 row 4
  updateBoard(&b, 3); // P1 col 3 row 3
  updateBoard(&b, 4); // P2 col 4 (filler)
  updateBoard(&b, 3); // P1 col 3 row 2 -> diagonal win!

  int winner = getWinner(&b);
  assert(winner == 1);
  printf("  Diagonal win:    PASSED (winner=%d)\n", winner);
}

int main() {
  printf("Connect 4 Bitboard Tests:\n");
  test_horizontal_win();
  test_vertical_win();
  test_diagonal_win();
  test_undo();
  test_can_play();
  test_get_cell();
  printf("\nAll tests PASSED!\n");
  return 0;
}
