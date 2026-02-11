
#include "botcontrol.h"
#include "board.h"
#include "boardcontrol.h"
#include "bot.h"
#include "gamecontrol.h"
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int callBot(Board *newBoard, Bot *bot) {
  clock_t start = clock();
  int currentPlayer = newBoard->turn;
  int move = negamaxMove(newBoard, 10, bot);
  clock_t end = clock();
  bot->waitTime = ((double)(end - start)) / CLOCKS_PER_SEC;
  printf("Der Bot hat für die Entscheidung %.4f Sekunden gebraucht\n",
         bot->waitTime);
  return move;
}
void initBot(Bot *bot) { bot->score = SCORE_TABLE; }

int checkEnd(Board *newBoard, int depth) {
  int winner = getWinner(newBoard);
  if (winner == 1)
    return 100000 + depth;
  if (winner == 2)
    return -100000 - depth;

  if (newBoard->numTurn >= nROW * nCOL)
    return 0;
  return -1;
}

int evaluateScore(Board *newBoard, Bot *bot) {
  int score = 0;

  for (int i = 0; i < nROW; i++) {
    for (int j = 0; j < nCOL; j++) {
      int placedPlayer = newBoard->board[i][j];
      if (placedPlayer == 1)
        score += bot->score[i][j];
      if (placedPlayer == 2)
        score -= bot->score[i][j];
    }
  }
  return score;
}

int negamaxScore(Board *newBoard, int depth, int alpha, int beta, Bot *bot) {
  int score = checkEnd(newBoard, depth);
  int playerSign = (newBoard->turn == 0) ? 1 : -1;
  if (score != -1) {
    return score * playerSign;
  }
  if (depth <= 0) {
    return evaluateScore(newBoard, bot) * playerSign;
  }
  score = -INT_MAX;
  for (int i = 0; i < nCOL; i++) {
    if (newBoard->board[0][i])
      continue;
    updateBoard(newBoard, i);
    int tempScore = -negamaxScore(newBoard, depth - 1, -beta, -alpha, bot);
    undoUpdateBoard(newBoard, i);
    if (tempScore > score) {
      score = tempScore;
    }
    if (score > alpha) {
      alpha = score;
    }
    if (alpha >= beta) {
      break;
    }
  }
  return score;
}

int negamaxMove(Board *newBoard, int depth, Bot *bot) {
  int bestMove = -1;
  int score = -INT_MAX;
  int alpha = -INT_MAX;
  int beta = INT_MAX;
  for (int i = 0; i < nCOL; i++) {
    if (newBoard->board[0][i])
      continue;
    updateBoard(newBoard, i);
    int tempScore = -negamaxScore(newBoard, depth - 1, -beta, -alpha, bot);
    undoUpdateBoard(newBoard, i);
    if (tempScore > score) {
      score = tempScore;
      bestMove = i;
    }
    if (score > alpha) {
      alpha = score;
    }
  }
  return bestMove;
}
