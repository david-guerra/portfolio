#ifndef GAMECONTROL_H
#define GAMECONTROL_H

#include "board.h"
#include <stdbool.h>
#include <stdint.h>

bool hasWon(uint64_t position);
int getWinner(Board *b);

#endif
