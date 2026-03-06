
#include "botcontrol.h"
#include "board.h"
#include "boardcontrol.h"
#include "bot.h"
#include "gamecontrol.h"
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// Search center columns first for better alpha-beta pruning
static const int COLUMN_ORDER[nCOL] = {3, 2, 4, 1, 5, 0, 6};

int callBot(Board *newBoard, int depth, Bot *bot) {
  clock_t start = clock();
  int move = negamaxMove(newBoard, depth, bot);
  clock_t end = clock();
  bot->waitTime = ((double)(end - start)) / CLOCKS_PER_SEC;
  printf("Der Bot hat für die Entscheidung %.4f Sekunden gebraucht\n",
         bot->waitTime);
  return move;
}

void initBot(Bot *bot) { bot->score = SCORE_TABLE; }

int checkEnd(Board *newBoard, int depth) {
  // Check if the LAST player to move won
  uint64_t lastPlayerBits = newBoard->mask ^ newBoard->position;
  if (hasWon(lastPlayerBits)) {

    return -(100000 + depth);
  }

  if (newBoard->numTurn >= nROW * nCOL)
    return 0;
  return INT_MIN;
}

int evaluateScore(Board *newBoard, Bot *bot) {
  int score = 0;

  for (int i = 0; i < nROW; i++) {
    for (int j = 0; j < nCOL; j++) {
      int cell = getCell(newBoard, i, j);
      if (cell == 1)
        score += bot->score[i][j];
      if (cell == 2)
        score -= bot->score[i][j];
    }
  }
  return score;
}

int negamaxScore(Board *newBoard, int depth, int alpha, int beta, Bot *bot) {
  int score = checkEnd(newBoard, depth);
  if (score != INT_MIN) {
    return score;
  }
  if (depth <= 0) {
    int playerSign = (newBoard->turn == 0) ? 1 : -1;
    return evaluateScore(newBoard, bot) * playerSign;
  }
  score = -INT_MAX;
  for (int idx = 0; idx < nCOL; idx++) {
    int i = COLUMN_ORDER[idx];
    if (!canPlay(newBoard, i))
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
  // Only use tactical shortcuts at higher difficulty (depth >= 6)
  if (depth >= 6) {
    // Immediate win: if we can win in 1, play it
    for (int i = 0; i < nCOL; i++) {
      if (!canPlay(newBoard, i))
        continue;
      updateBoard(newBoard, i);
      uint64_t lastBits = newBoard->mask ^ newBoard->position;
      if (hasWon(lastBits)) {
        undoUpdateBoard(newBoard, i);
        return i;
      }
      undoUpdateBoard(newBoard, i);
    }

    // Immediate block: if opponent can win in 1, block it
    for (int i = 0; i < nCOL; i++) {
      if (!canPlay(newBoard, i))
        continue;
      uint64_t opponentBits = newBoard->mask ^ newBoard->position;
      uint64_t newBit = 1ULL << newBoard->height[i];
      if (hasWon(opponentBits | newBit)) {
        return i; // block!
      }
    }
  }

  int bestMove = -1;
  int score = -INT_MAX;
  int alpha = -INT_MAX;
  int beta = INT_MAX;
  for (int idx = 0; idx < nCOL; idx++) {
    int i = COLUMN_ORDER[idx];
    if (!canPlay(newBoard, i))
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
