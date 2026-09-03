import { Board, BOARD_SIZE, BOX_SIZE, ValidationResult } from "./board";

// json:true is the machine-readable path (piped to another tool, logged,
// diffed in a test); the default is the human path, meant to be read
// in a terminal.
export interface FormatOptions {
  json?: boolean;
}

export function formatBoard(board: Board, options: FormatOptions = {}): string {
  if (options.json) {
    return JSON.stringify(board);
  }
  return renderGrid(board);
}

export function formatValidation(result: ValidationResult, options: FormatOptions = {}): string {
  if (options.json) {
    return JSON.stringify(result);
  }
  if (result.valid) {
    return "board is valid";
  }
  const lines = [`board has ${result.conflicts.length} conflict(s):`];
  for (const conflict of result.conflicts) {
    const cellList = conflict.cells.map(([r, c]) => `(${r},${c})`).join(", ");
    lines.push(`  ${conflict.unit} ${conflict.index}: digit ${conflict.digit} repeats at ${cellList}`);
  }
  return lines.join("\n");
}

function renderGrid(board: Board): string {
  const horizontalRule = "+-------+-------+-------+";
  const lines: string[] = [horizontalRule];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const parts: string[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (c % BOX_SIZE === 0) parts.push("|");
      const cell = board[r][c];
      parts.push(cell === null ? "." : String(cell));
    }
    parts.push("|");
    lines.push(parts.join(" "));
    if ((r + 1) % BOX_SIZE === 0) lines.push(horizontalRule);
  }
  return lines.join("\n");
}
