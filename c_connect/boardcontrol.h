#ifndef BOARDCONTROL_H
#define BOARDCONTROL_H
#include "board.h"
#include "bot.h"

void initBoard(Board *b);
void updateBoard(Board *b, int col);
void undoUpdateBoard(Board *b, int col);

#endif // !BOARDCONTROL_H
