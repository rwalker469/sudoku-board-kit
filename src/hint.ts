import { Board, BOARD_SIZE, Cell, Digit, isComplete } from "./board";

export interface Hint {
  row: number;
  col: number;
  actual: Cell;
  expected: Digit;
}

export interface DiffResult {
  correct: boolean;
  mistakes: Hint[];
  blanks: Hint[];
}

function requireCompleteSolution(solution: Board): void {
  if (!isComplete(solution)) {
    throw new Error("solution must be a fully filled board");
  }
}

// Compares a board in progress against its solution cell by cell. A filled
// cell that disagrees with the solution is a mistake; an empty cell is a
// blank, not yet wrong. Both lists are in row-major order.
export function diffBoard(board: Board, solution: Board): DiffResult {
  requireCompleteSolution(solution);

  const mistakes: Hint[] = [];
  const blanks: Hint[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const actual = board[r][c];
      const expected = solution[r][c] as Digit;
      if (actual === null) {
        blanks.push({ row: r, col: c, actual, expected });
      } else if (actual !== expected) {
        mistakes.push({ row: r, col: c, actual, expected });
      }
    }
  }

  return { correct: mistakes.length === 0 && blanks.length === 0, mistakes, blanks };
}

// Picks the single most useful next move. A wrong digit sitting in a cell
// blocks that row, column, and box from ever getting the right one, so
// clearing a mistake takes priority over filling in a blank.
export function nextHint(board: Board, solution: Board): Hint | null {
  const { mistakes, blanks } = diffBoard(board, solution);
  return mistakes[0] ?? blanks[0] ?? null;
}
