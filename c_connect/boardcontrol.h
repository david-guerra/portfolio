#ifndef BOARDCONTROL_H
#define BOARDCONTROL_H
#include "board.h"
#include "bot.h"
#include <stdbool.h>

void initBoard(Board *b);
void updateBoard(Board *b, int col);
void undoUpdateBoard(Board *b, int col);
bool canPlay(Board *b, int col);
int getCell(Board *b, int row, int col);

#endif // !BOARDCONTROL_H
