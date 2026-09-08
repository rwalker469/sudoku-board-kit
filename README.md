# sudoku-board-kit

A small TypeScript library for working with sudoku boards: parse the usual
81-character notation, check a board against the three sudoku constraints,
and print the result either for a human or as JSON for another tool to
consume. No CLI, no runtime dependencies — just import it.

## Why

Every sudoku side project ends up reinventing "parse a grid, check it, show
it" before it can do anything interesting like solving or generating. This
library is that boring foundation, done once, so the interesting part can be
built on top of it later.

## Install

There's no published package yet. Clone the repo and build it:

```
npm install
npm run build
```

## Usage

```ts
import { parseBoard, validateBoard, formatBoard, formatValidation } from "sudoku-board-kit";

const board = parseBoard(
  "53..7...." +
  "6..195..." +
  ".98....6." +
  "8...6...3" +
  "4..8.3..1" +
  "7...2...6" +
  ".6....28." +
  "...419..5" +
  "....8..79"
);

console.log(formatBoard(board));
// +-------+-------+-------+
// | 5 3 . | . 7 . | . . . |
// | 6 . . | 1 9 5 | . . . |
// | . 9 8 | . . . | . 6 . |
// +-------+-------+-------+
// | 8 . . | . 6 . | . . 3 |
// | 4 . . | 8 . 3 | . . 1 |
// | 7 . . | . 2 . | . . 6 |
// +-------+-------+-------+
// | . 6 . | . . . | 2 8 . |
// | . . . | 4 1 9 | . . 5 |
// | . . . | . 8 . | . 7 9 |
// +-------+-------+-------+

const result = validateBoard(board);
console.log(formatValidation(result));
// board is valid
```

Every formatter takes the same `{ json: boolean }` option, so the same data
can be shown to a person or handed to another program:

```ts
console.log(formatBoard(board, { json: true }));
// [[5,3,null,null,7,null,...], ...]

console.log(formatValidation(result, { json: true }));
// {"valid":true,"conflicts":[]}
```

Solving works via backtracking with most-constrained-cell ordering, so it
stays fast even on near-empty boards:

```ts
import { solveBoard } from "sudoku-board-kit";

const { solved, board: solution } = solveBoard(board);
if (solved) console.log(formatBoard(solution));
```

`solveBoard` never mutates its input. If the board already breaks a
constraint, or has no solution, `solved` is `false` and the returned board
should be discarded rather than displayed.

When a board breaks a constraint, `validateBoard` reports every conflict it
finds rather than stopping at the first one:

```ts
const broken = parseBoard("11" + ".".repeat(79));
formatValidation(validateBoard(broken));
// board has 1 conflict(s):
//   row 0: digit 1 repeats at (0,0), (0,1)
```

## API

- `parseBoard(input: string): Board` — parses an 81-character grid (`.` or
  `0` for blanks, whitespace ignored).
- `serializeBoard(board: Board): string` — the inverse of `parseBoard`.
- `createEmptyBoard(): Board` — a 9x9 grid of blanks.
- `cloneBoard(board: Board): Board` — a shallow-safe copy.
- `isComplete(board: Board): boolean` — true if every cell is filled.
- `validateBoard(board: Board): ValidationResult` — checks rows, columns,
  and 3x3 boxes for repeated digits.
- `formatBoard(board, options?): string` / `formatValidation(result,
  options?): string` — pass `{ json: true }` for machine-readable output.
- `solveBoard(board: Board): SolveResult` — backtracking solver; returns
  `{ solved, board }` and never mutates the input.

## Status

Early. Parsing, validation, formatting, and solving work; there's no
generator yet. See the roadmap in the commit history for what's next.

## License

MIT, see [LICENSE](LICENSE).
