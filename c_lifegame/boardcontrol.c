#include "boardcontrol.h"
#include <string.h>

_Static_assert(nROW > 0, "Game of Life requires at least one row");
_Static_assert(nCOL > 0 && nCOL < 32,
               "Game of Life rows must fit in one uint32_t without full-width shifts");

void initGoL(GoL *g) { memset(g, 0, sizeof(*g)); }

void setCell(GoL *g, int row, int col, bool val) {
  if (row < 0 || row >= nROW || col < 0 || col >= nCOL)
    return;
  if (val) {
    g->buf[g->active].rows[row] |= (UINT32_C(1) << col);
  } else {
    g->buf[g->active].rows[row] &= ~(UINT32_C(1) << col);
  }
}

bool getCell(GoL *g, int row, int col) {
  if (row < 0 || row >= nROW || col < 0 || col >= nCOL)
    return false;
  return (g->buf[g->active].rows[row] >> col) & 1;
}

/* Column mask for valid bits */
#define COL_MASK ((UINT32_C(1) << nCOL) - UINT32_C(1))

/* Wrap-around column shifts */
static inline uint32_t shl(uint32_t v) {
  return ((v << 1) | (v >> (nCOL - 1))) & COL_MASK;
}
static inline uint32_t shr(uint32_t v) {
  return ((v >> 1) | (v << (nCOL - 1))) & COL_MASK;
}

void updateGoL(GoL *g) {
  Board *src = &g->buf[g->active];
  int next = 1 - g->active;
  Board *dst = &g->buf[next];

  for (int r = 0; r < nROW; r++) {
    uint32_t above = src->rows[(r - 1 + nROW) % nROW];
    uint32_t curr = src->rows[r];
    uint32_t below = src->rows[(r + 1) % nROW];

    /* Skip empty rows — nothing can change */
    if ((above | curr | below) == 0) {
      dst->rows[r] = 0;
      continue;
    }

    /* 8 neighbor bitmasks */
    uint32_t n = above;
    uint32_t nw = shl(above);
    uint32_t ne = shr(above);
    uint32_t w = shl(curr);
    uint32_t e = shr(curr);
    uint32_t s = below;
    uint32_t sw = shl(below);
    uint32_t se = shr(below);

    /* Carry-save tree: sum 8 masks into 4-bit count per cell */
    uint32_t s0 = nw ^ n ^ ne;
    uint32_t c0 = (nw & n) | ((nw ^ n) & ne);

    uint32_t s1 = w ^ e ^ sw;
    uint32_t c1 = (w & e) | ((w ^ e) & sw);

    uint32_t s2 = s ^ se;
    uint32_t c2 = s & se;

    uint32_t bit0 = s0 ^ s1 ^ s2;
    uint32_t carry01 = (s0 & s1) | ((s0 ^ s1) & s2);

    uint32_t sc = c0 ^ c1 ^ c2;
    uint32_t cc = (c0 & c1) | ((c0 ^ c1) & c2);
    uint32_t bit1 = sc ^ carry01;
    uint32_t carry12 = sc & carry01;

    uint32_t bit2 = cc ^ carry12;
    uint32_t bit3 = cc & carry12;

    /* alive if count==3 OR (count==2 AND currently alive) */
    dst->rows[r] = ~bit3 & ~bit2 & bit1 & (bit0 | curr) & COL_MASK;
  }

  g->active = next;
}
