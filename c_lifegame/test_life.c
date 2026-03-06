#include "boardcontrol.h"
#include <stdio.h>

int main() {
  Board b;
  initBoard(&b);

  // Blinker pattern (horizontal)
  // . . .
  // # # #
  // . . .
  setCell(&b, 4, 3, true);
  setCell(&b, 4, 4, true);
  setCell(&b, 4, 5, true);

  printf("Generation 0:\n");
  printBoard(&b);

  updateBoard(&b);

  printf("\nGeneration 1:\n");
  printBoard(&b);

  // Check if it rotated to vertical
  // . # .
  // . # .
  // . # .
  if (!getCell(&b, 4, 3) && !getCell(&b, 4, 5) && getCell(&b, 3, 4) &&
      getCell(&b, 4, 4) && getCell(&b, 5, 4)) {
    printf("\nTest PASSED: Blinker rotated successfully.\n");
  } else {
    printf("\nTest FAILED: Blinker did not rotate correctly.\n");
  }

  return 0;
}
