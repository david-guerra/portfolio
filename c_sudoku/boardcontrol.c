#include "boardcontrol.h"
#include "board.h"

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// Bitmask constraint tracking — O(1) lookups
static int rowMask[9];
static int colMask[9];
static int boxMask[9];
static bool randomSeeded = false;

static int boxIndex(int row, int col) { return (row / 3) * 3 + (col / 3); }

static void place(Board *b, int row, int col, int num) {
  int bit = 1 << num;
  b->board[row][col] = num;
  rowMask[row] |= bit;
  colMask[col] |= bit;
  boxMask[boxIndex(row, col)] |= bit;
}

static void unplace(Board *b, int row, int col, int num) {
  int bit = 1 << num;
  b->board[row][col] = 0;

  // Only clear the bit from the mask if this number doesn't exist elsewhere in
  // the row
  bool inRow = false;
  for (int c = 0; c < nCOL; c++) {
    if (b->board[row][c] == num) {
      inRow = true;
      break;
    }
  }
  if (!inRow)
    rowMask[row] &= ~bit;

  // Only clear the bit from the mask if this number doesn't exist elsewhere in
  // the col
  bool inCol = false;
  for (int r = 0; r < nROW; r++) {
    if (b->board[r][col] == num) {
      inCol = true;
      break;
    }
  }
  if (!inCol)
    colMask[col] &= ~bit;

  // Only clear the bit from the mask if this number doesn't exist elsewhere in
  // the box
  bool inBox = false;
  int startRow = (row / 3) * 3;
  int startCol = (col / 3) * 3;
  for (int r = 0; r < 3; r++) {
    for (int c = 0; c < 3; c++) {
      if (b->board[startRow + r][startCol + c] == num) {
        inBox = true;
        break;
      }
    }
  }
  if (!inBox)
    boxMask[boxIndex(row, col)] &= ~bit;
}

bool isSafe(Board *b, int row, int col, int num) {
  (void)b; // constraints tracked via masks
  int bit = 1 << num;
  return !(rowMask[row] & bit || colMask[col] & bit ||
           boxMask[boxIndex(row, col)] & bit);
}

void shuffleArray(int *array, int n) {
  for (int i = n - 1; i > 0; i--) {
    int j = rand() % (i + 1);
    int temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

bool fillBox(Board *b, int row, int col) {
  int nums[] = {1, 2, 3, 4, 5, 6, 7, 8, 9};
  shuffleArray(nums, 9);
  int idx = 0;
  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
      place(b, row + i, col + j, nums[idx++]);
    }
  }
  return true;
}

bool fillDiagonal(Board *b) {
  for (int i = 0; i < nROW; i = i + 3) {
    fillBox(b, i, i);
  }
  return true;
}

bool solveSudoku(Board *b) {
  for (int row = 0; row < nROW; row++) {
    for (int col = 0; col < nCOL; col++) {
      if (b->board[row][col] == 0) {
        int nums[] = {1, 2, 3, 4, 5, 6, 7, 8, 9};
        shuffleArray(nums, 9);
        for (int i = 0; i < 9; i++) {
          if (isSafe(b, row, col, nums[i])) {
            place(b, row, col, nums[i]);
            if (solveSudoku(b))
              return true;
            unplace(b, row, col, nums[i]);
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Count solutions, but stop early once we find more than 1
static int countSolutionsHelper(Board *b, int limit) {
  for (int row = 0; row < nROW; row++) {
    for (int col = 0; col < nCOL; col++) {
      if (b->board[row][col] == 0) {
        int count = 0;
        for (int num = 1; num <= 9; num++) {
          if (isSafe(b, row, col, num)) {
            place(b, row, col, num);
            count += countSolutionsHelper(b, limit - count);
            unplace(b, row, col, num);
            if (count >= limit)
              return count;
          }
        }
        return count;
      }
    }
  }
  return 1; // all cells filled = one solution found
}

void removeDigits(Board *b, int count) {
  // Build list of filled positions and shuffle for randomness
  int positions[81];
  int nFilled = 0;
  for (int r = 0; r < nROW; r++) {
    for (int c = 0; c < nCOL; c++) {
      if (b->board[r][c] != 0) {
        positions[nFilled++] = r * nCOL + c;
      }
    }
  }
  shuffleArray(positions, nFilled);

  int removed = 0;
  for (int i = 0; i < nFilled && removed < count; i++) {
    int row = positions[i] / nCOL;
    int col = positions[i] % nCOL;
    int saved = b->board[row][col];

    unplace(b, row, col, saved);

    // Check if puzzle still has exactly 1 solution
    if (countSolutionsHelper(b, 2) != 1) {
      // More than 1 solution — put it back
      place(b, row, col, saved);
    } else {
      removed++;
    }
  }
}

void generateBoard(Board *newBoard) {
  fillDiagonal(newBoard);
  solveSudoku(newBoard);
  removeDigits(newBoard, 40);
}

void seedRandom(unsigned seed) {
  srand(seed);
  randomSeeded = true;
}

void initBoard(Board *newBoard) {
  if (!randomSeeded) {
    srand((unsigned)time(NULL));
    randomSeeded = true;
  }

  // Reset masks
  for (int i = 0; i < 9; i++) {
    rowMask[i] = 0;
    colMask[i] = 0;
    boxMask[i] = 0;
  }

  for (int i = 0; i < nROW; i++) {
    for (int j = 0; j < nCOL; j++) {
      newBoard->board[i][j] = 0;
    }
  }
  generateBoard(newBoard);
}

void updateBoard(Board *newBoard, int x, int y, int val) {
  if (newBoard->board[x][y] != 0) {
    unplace(newBoard, x, y, newBoard->board[x][y]);
  }
  if (val != 0) {
    place(newBoard, x, y, val);
  }
}

bool isBoardSolved() {
  int complete = (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) |
                 (1 << 6) | (1 << 7) | (1 << 8) | (1 << 9);
  for (int i = 0; i < 9; i++) {
    if (rowMask[i] != complete)
      return false;
    if (colMask[i] != complete)
      return false;
    if (boxMask[i] != complete)
      return false;
  }
  return true;
}
