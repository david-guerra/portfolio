#include "gamecontrol.h"
#include "board.h"

#include <stdbool.h>
#include <stdint.h>

// O(1) win check using bitboard shift trick
bool hasWon(uint64_t position) {
  // Horizontal (shift by 7 = one column)
  uint64_t m = position & (position >> 7);
  if (m & (m >> 14))
    return true;
  // Diagonal \ (shift by 6)
  m = position & (position >> 6);
  if (m & (m >> 12))
    return true;
  // Diagonal / (shift by 8)
  m = position & (position >> 8);
  if (m & (m >> 16))
    return true;
  // Vertical (shift by 1)
  m = position & (position >> 1);
  if (m & (m >> 2))
    return true;
  return false;
}

int getWinner(Board *b) {
  // The PREVIOUS player just moved — their pieces are mask ^ position
  uint64_t lastPlayerBits = b->mask ^ b->position;

  if (hasWon(lastPlayerBits)) {
    // Last player to move was (turn ^ 1), who is player (turn^1)+1
    return (b->turn ^ 1) + 1;
  }
  // Check current player too (shouldn't normally win before moving, but safe)
  if (hasWon(b->position)) {
    return b->turn + 1;
  }
  return 0;
}
