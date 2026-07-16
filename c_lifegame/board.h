#ifndef BOARD_H
#define BOARD_H

#define nROW 25
#define nCOL 30

#include <stdint.h>

typedef struct Board {
  uint32_t rows[nROW];
} Board;

/* Double-buffered state: two boards + pointer to active one */
typedef struct GoL {
  Board buf[2];
  int active; /* 0 or 1 */
} GoL;

#endif
