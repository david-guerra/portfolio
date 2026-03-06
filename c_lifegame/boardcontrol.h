#ifndef BOARDCONTROL_H
#define BOARDCONTROL_H

#include "board.h"
#include <stdbool.h>

void initGoL(GoL *g);
void updateGoL(GoL *g);
void setCell(GoL *g, int row, int col, bool val);
bool getCell(GoL *g, int row, int col);

#endif
