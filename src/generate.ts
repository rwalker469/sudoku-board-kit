import { Board, BOARD_SIZE, BOX_SIZE, Digit, cloneBoard, createEmptyBoard } from "./board";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

const ALL_DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Loose clue-count targets pulled from typical newspaper-puzzle difficulty
// bands. The generator stops removing clues once it hits the target, or
// once every remaining clue turns out to be load-bearing, so a "hard"
// board can end up with a few more givens than the target if that's as
// far as digging holes will go without breaking uniqueness.
const CLUE_TARGETS: Record<Difficulty, number> = {
  easy: 38,
  medium: 32,
  hard: 27,
  expert: 22,
};

export interface GenerateOptions {
  difficulty?: Difficulty;
  // Injectable so callers can seed generation for reproducible puzzles/tests.
  random?: () => number;
}

interface UsedSets {
  rows: Set<Digit>[];
  cols: Set<Digit>[];
  boxes: Set<Digit>[];
}

function boxIndex(row: number, col: number): number {
  return Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildUsedSets(board: Board): UsedSets {
  const rows = Array.from({ length: BOARD_SIZE }, () => new Set<Digit>());
  const cols = Array.from({ length: BOARD_SIZE }, () => new Set<Digit>());
  const boxes = Array.from({ length: BOARD_SIZE }, () => new Set<Digit>());
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const value = board[r][c];
      if (value === null) continue;
      rows[r].add(value);
      cols[c].add(value);
      boxes[boxIndex(r, c)].add(value);
    }
  }
  return { rows, cols, boxes };
}

function place(used: UsedSets, row: number, col: number, digit: Digit): void {
  used.rows[row].add(digit);
  used.cols[col].add(digit);
  used.boxes[boxIndex(row, col)].add(digit);
}

function unplace(used: UsedSets, row: number, col: number, digit: Digit): void {
  used.rows[row].delete(digit);
  used.cols[col].delete(digit);
  used.boxes[boxIndex(row, col)].delete(digit);
}

function findEmptyCell(board: Board): [number, number] | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) return [r, c];
    }
  }
  return null;
}

// Fills an empty board with a random valid solution by backtracking with
// shuffled candidate order at each cell, so repeated calls produce
// different boards instead of always the same lexicographically-first one.
function fillRandomSolution(board: Board, used: UsedSets, random: () => number): boolean {
  const empty = findEmptyCell(board);
  if (empty === null) return true;
  const [row, col] = empty;
  const b = boxIndex(row, col);
  const candidates = shuffled(
    ALL_DIGITS.filter((d) => !used.rows[row].has(d) && !used.cols[col].has(d) && !used.boxes[b].has(d)),
    random
  );
  for (const digit of candidates) {
    board[row][col] = digit;
    place(used, row, col, digit);
    if (fillRandomSolution(board, used, random)) return true;
    unplace(used, row, col, digit);
    board[row][col] = null;
  }
  return false;
}

// Counts solutions up to `limit`, stopping as soon as it's reached. The
// generator only ever needs to distinguish "one" from "more than one", so
// it never has to enumerate every solution of a sparsely filled board.
function countSolutionsUpTo(board: Board, used: UsedSets, limit: number): number {
  const empty = findEmptyCell(board);
  if (empty === null) return 1;
  const [row, col] = empty;
  const b = boxIndex(row, col);
  let count = 0;
  for (const digit of ALL_DIGITS) {
    if (used.rows[row].has(digit) || used.cols[col].has(digit) || used.boxes[b].has(digit)) continue;
    board[row][col] = digit;
    place(used, row, col, digit);
    count += countSolutionsUpTo(board, used, limit - count);
    unplace(used, row, col, digit);
    board[row][col] = null;
    if (count >= limit) break;
  }
  return count;
}

function hasUniqueSolution(board: Board): boolean {
  const working = cloneBoard(board);
  return countSolutionsUpTo(working, buildUsedSets(working), 2) === 1;
}

// Generates a puzzle by filling a random full board, then "digging holes":
// removing clues one at a time in random order as long as the puzzle stays
// uniquely solvable, until the difficulty's target clue count is reached.
export function generateBoard(options: GenerateOptions = {}): Board {
  const random = options.random ?? Math.random;
  const target = CLUE_TARGETS[options.difficulty ?? "medium"];

  const solved = createEmptyBoard();
  fillRandomSolution(solved, buildUsedSets(solved), random);

  const puzzle = cloneBoard(solved);
  let clueCount = BOARD_SIZE * BOARD_SIZE;
  const positions = shuffled(
    Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i): [number, number] => [
      Math.floor(i / BOARD_SIZE),
      i % BOARD_SIZE,
    ]),
    random
  );

  for (const [row, col] of positions) {
    if (clueCount <= target) break;
    const removed = puzzle[row][col];
    puzzle[row][col] = null;
    if (hasUniqueSolution(puzzle)) {
      clueCount--;
    } else {
      puzzle[row][col] = removed;
    }
  }

  return puzzle;
}
