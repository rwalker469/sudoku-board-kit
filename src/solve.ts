import { Board, BOARD_SIZE, BOX_SIZE, Digit, cloneBoard, validateBoard } from "./board";

export interface SolveResult {
  solved: boolean;
  board: Board;
}

const ALL_DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function boxIndex(row: number, col: number): number {
  return Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
}

// Precomputes which digits are already taken in each row, column, and box
// so the search can check a candidate in O(1) instead of rescanning units.
function buildUsedSets(board: Board): { rows: Set<Digit>[]; cols: Set<Digit>[]; boxes: Set<Digit>[] } {
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

// Finds the empty cell with the fewest remaining candidates (rather than the
// first empty cell) so the search fails fast on the most constrained spot.
function findMostConstrainedCell(
  board: Board,
  used: { rows: Set<Digit>[]; cols: Set<Digit>[]; boxes: Set<Digit>[] }
): { row: number; col: number; candidates: Digit[] } | null {
  let best: { row: number; col: number; candidates: Digit[] } | null = null;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) continue;
      const b = boxIndex(r, c);
      const candidates = ALL_DIGITS.filter(
        (d) => !used.rows[r].has(d) && !used.cols[c].has(d) && !used.boxes[b].has(d)
      );
      if (best === null || candidates.length < best.candidates.length) {
        best = { row: r, col: c, candidates };
      }
      if (candidates.length === 0) return best;
    }
  }
  return best;
}

function place(
  used: { rows: Set<Digit>[]; cols: Set<Digit>[]; boxes: Set<Digit>[] },
  row: number,
  col: number,
  digit: Digit
): void {
  used.rows[row].add(digit);
  used.cols[col].add(digit);
  used.boxes[boxIndex(row, col)].add(digit);
}

function unplace(
  used: { rows: Set<Digit>[]; cols: Set<Digit>[]; boxes: Set<Digit>[] },
  row: number,
  col: number,
  digit: Digit
): void {
  used.rows[row].delete(digit);
  used.cols[col].delete(digit);
  used.boxes[boxIndex(row, col)].delete(digit);
}

function search(
  board: Board,
  used: { rows: Set<Digit>[]; cols: Set<Digit>[]; boxes: Set<Digit>[] }
): boolean {
  const target = findMostConstrainedCell(board, used);
  if (target === null) return true;
  const { row, col, candidates } = target;
  if (candidates.length === 0) return false;

  for (const digit of candidates) {
    board[row][col] = digit;
    place(used, row, col, digit);
    if (search(board, used)) return true;
    unplace(used, row, col, digit);
    board[row][col] = null;
  }
  return false;
}

// Solves via backtracking with most-constrained-cell ordering. Returns the
// original board untouched and a solved copy on success; on failure (either
// the board is already broken, or it has no solution) returns the board as
// far as the search got, which callers should discard rather than display.
export function solveBoard(board: Board): SolveResult {
  if (!validateBoard(board).valid) {
    return { solved: false, board: cloneBoard(board) };
  }
  const working = cloneBoard(board);
  const used = buildUsedSets(working);
  const solved = search(working, used);
  return { solved, board: working };
}
