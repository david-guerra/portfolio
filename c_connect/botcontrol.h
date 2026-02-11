#ifndef BOTCONTROL_H
#define BOTCONTROL_H

#include "board.h"
#include "bot.h"

void pressAnyKey(Bot *bot);
int callBot(Board *b, Bot *bot);
void initBot(Bot *bot);
int negamaxScore(Board *b, int depth, int alpha, int beta, Bot *bot);
int negamaxMove(Board *b, int depth, Bot *bot);
#endif
