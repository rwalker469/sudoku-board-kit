export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Cell = Digit | null;
export type Board = Cell[][];

export const BOARD_SIZE = 9;
export const BOX_SIZE = 3;

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<Cell>(BOARD_SIZE).fill(null));
}

// Accepts the common one-line notation: 81 characters, row major,
// '.' or '0' for blanks, whitespace ignored so pasted grids still parse.
export function parseBoard(input: string): Board {
  const chars = input.replace(/\s+/g, "");
  if (chars.length !== BOARD_SIZE * BOARD_SIZE) {
    throw new Error(`expected ${BOARD_SIZE * BOARD_SIZE} cells, got ${chars.length}`);
  }

  const board = createEmptyBoard();
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const row = Math.floor(i / BOARD_SIZE);
    const col = i % BOARD_SIZE;
    if (ch === "." || ch === "0") {
      board[row][col] = null;
    } else if (ch >= "1" && ch <= "9") {
      board[row][col] = Number(ch) as Digit;
    } else {
      throw new Error(`invalid character '${ch}' at position ${i}`);
    }
  }
  return board;
}

export function serializeBoard(board: Board): string {
  return board.flat().map((cell) => (cell === null ? "." : String(cell))).join("");
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export function isComplete(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell !== null));
}

export interface Conflict {
  unit: "row" | "column" | "box";
  index: number;
  digit: Digit;
  cells: Array<[number, number]>;
}

export interface ValidationResult {
  valid: boolean;
  conflicts: Conflict[];
}

interface Placement {
  pos: [number, number];
  value: Cell;
}

function findDuplicates(cells: Placement[]): Map<Digit, Array<[number, number]>> {
  const seen = new Map<Digit, Array<[number, number]>>();
  for (const { pos, value } of cells) {
    if (value === null) continue;
    const positions = seen.get(value) ?? [];
    positions.push(pos);
    seen.set(value, positions);
  }
  return seen;
}

// Checks the three sudoku constraints (row, column, 3x3 box) independently
// and reports every duplicate found rather than stopping at the first one,
// so a caller can point out all conflicts in one pass.
export function validateBoard(board: Board): ValidationResult {
  const conflicts: Conflict[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    const cells: Placement[] = board[r].map((value, c) => ({ pos: [r, c], value }));
    for (const [digit, positions] of findDuplicates(cells)) {
      if (positions.length > 1) conflicts.push({ unit: "row", index: r, digit, cells: positions });
    }
  }

  for (let c = 0; c < BOARD_SIZE; c++) {
    const cells: Placement[] = board.map((row, r) => ({ pos: [r, c], value: row[c] }));
    for (const [digit, positions] of findDuplicates(cells)) {
      if (positions.length > 1) conflicts.push({ unit: "column", index: c, digit, cells: positions });
    }
  }

  for (let b = 0; b < BOARD_SIZE; b++) {
    const boxRow = Math.floor(b / BOX_SIZE) * BOX_SIZE;
    const boxCol = (b % BOX_SIZE) * BOX_SIZE;
    const cells: Placement[] = [];
    for (let dr = 0; dr < BOX_SIZE; dr++) {
      for (let dc = 0; dc < BOX_SIZE; dc++) {
        const r = boxRow + dr;
        const c = boxCol + dc;
        cells.push({ pos: [r, c], value: board[r][c] });
      }
    }
    for (const [digit, positions] of findDuplicates(cells)) {
      if (positions.length > 1) conflicts.push({ unit: "box", index: b, digit, cells: positions });
    }
  }

  return { valid: conflicts.length === 0, conflicts };
}
