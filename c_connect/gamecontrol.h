#ifndef GAMECONTROL_H
#define GAMECONTROL_H

#include "board.h"
#include <stdbool.h>
bool checkWinState(int x, int y, Board *b);
int getWinner(Board *b);
#endif
