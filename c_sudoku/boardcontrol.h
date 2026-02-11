#ifndef BOARDCONTROL_H
#define BOARDCONTROL_H

#include "board.h"
#include <stdbool.h>

void initBoard(Board *b);
void updateBoard(Board *b, int x, int y, int val);
void generateBoard(Board *b);

bool isSafe(Board *b, int row, int col, int num);
void shuffleArray(int *array, int n);
bool fillBox(Board *b, int row, int col);
bool fillDiagonal(Board *b);
bool solveSudoku(Board *b);
void removeDigits(Board *b, int count);
bool isBoardSolved();

#endif // !BOARDCONTROL_H
