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

Generating a puzzle fills a random full board and then removes clues one at
a time, checking after each removal that the puzzle still has exactly one
solution, until it reaches a clue count for the requested difficulty:

```ts
import { generateBoard } from "sudoku-board-kit";

const puzzle = generateBoard({ difficulty: "hard" });
console.log(formatBoard(puzzle));
```

`difficulty` is one of `"easy"`, `"medium"` (the default), `"hard"`, or
`"expert"`, mapped to a target clue count. The target is a floor, not a
guarantee — if removing more clues would make the puzzle ambiguous, the
generator stops early and returns a board with a few more givens than the
target. Pass `random` (a `() => number` in `[0, 1)`, matching `Math.random`)
to get a reproducible sequence of puzzles, e.g. in a test.

When a board breaks a constraint, `validateBoard` reports every conflict it
finds rather than stopping at the first one:

```ts
const broken = parseBoard("11" + ".".repeat(79));
formatValidation(validateBoard(broken));
// board has 1 conflict(s):
//   row 0: digit 1 repeats at (0,0), (0,1)
```

Once you have a solution in hand (from `solveBoard`, or your own answer key),
`diffBoard` compares a puzzle in progress against it, cell by cell. A filled
cell that disagrees with the solution is a mistake; an empty cell is just a
blank:

```ts
import { diffBoard, nextHint } from "sudoku-board-kit";

const { solved, board: solution } = solveBoard(puzzle);
const { correct, mistakes, blanks } = diffBoard(puzzle, solution);
```

`nextHint` picks a single cell to point at next: it returns the first
mistake if there are any (a wrong digit blocks its row, column, and box from
ever getting the right one), otherwise the first blank, otherwise `null`
once the board matches the solution.

```ts
const hint = nextHint(puzzle, solution);
if (hint) console.log(`try ${hint.expected} at row ${hint.row}, col ${hint.col}`);
```

## API

- `parseBoard(input: string): Board` — parses an 81-character grid (`.` or
  `0` for blanks, whitespace ignored). Also accepts `formatBoard`'s
  human-readable grid, including its `|`/`+`/`-` box-drawing characters, so
  output copied from a terminal parses back in.
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
- `generateBoard(options?: GenerateOptions): Board` — builds a uniquely
  solvable puzzle; `options.difficulty` picks a target clue count and
  `options.random` seeds the shuffle.
- `diffBoard(board: Board, solution: Board): DiffResult` — compares a board
  against a fully filled solution, returning `mistakes` (filled cells that
  disagree) and `blanks` (empty cells), both in row-major order.
- `nextHint(board: Board, solution: Board): Hint | null` — the next cell
  worth fixing: a mistake if one exists, otherwise the first blank,
  otherwise `null`.

## Status

Early. Parsing, validation, formatting, solving, generation, and diffing
against a solution work, and each has unit tests (`npm test`, which builds
and runs them with Node's built-in test runner — no test framework
dependency). See the roadmap in the commit history for what's next.

## License

MIT, see [LICENSE](LICENSE).
