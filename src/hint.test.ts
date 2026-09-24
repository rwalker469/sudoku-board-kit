import test from "node:test";
import assert from "node:assert/strict";
import { PUZZLE, SOLUTION } from "./testing/fixtures";
import { parseBoard } from "./board";
import { diffBoard, nextHint } from "./hint";

test("diffBoard reports no mistakes or blanks for a matching solution", () => {
  const solution = parseBoard(SOLUTION);
  const result = diffBoard(solution, solution);
  assert.strictEqual(result.correct, true);
  assert.deepStrictEqual(result.mistakes, []);
  assert.deepStrictEqual(result.blanks, []);
});

test("diffBoard lists every empty cell as a blank when the board matches so far", () => {
  const board = parseBoard(PUZZLE);
  const solution = parseBoard(SOLUTION);
  const result = diffBoard(board, solution);
  assert.strictEqual(result.correct, false);
  assert.deepStrictEqual(result.mistakes, []);

  const expectedBlankCount = PUZZLE.split("").filter((ch) => ch === ".").length;
  assert.strictEqual(result.blanks.length, expectedBlankCount);
  assert.deepStrictEqual(result.blanks[0], { row: 0, col: 2, actual: null, expected: 4 });
});

test("diffBoard flags a filled cell that disagrees with the solution as a mistake", () => {
  const board = parseBoard(PUZZLE);
  const solution = parseBoard(SOLUTION);
  board[0][0] = 9; // solution has 5 here
  const result = diffBoard(board, solution);
  assert.strictEqual(result.correct, false);
  assert.deepStrictEqual(result.mistakes, [{ row: 0, col: 0, actual: 9, expected: 5 }]);
});

test("diffBoard throws if the solution is not fully filled", () => {
  const board = parseBoard(PUZZLE);
  assert.throws(() => diffBoard(board, board), /fully filled/);
});

test("nextHint returns null once the board matches the solution", () => {
  const solution = parseBoard(SOLUTION);
  assert.strictEqual(nextHint(solution, solution), null);
});

test("nextHint prefers fixing a mistake over filling a blank", () => {
  const board = parseBoard(PUZZLE);
  const solution = parseBoard(SOLUTION);
  board[8][8] = 1; // PUZZLE has 9 here already; overwrite it with a wrong digit
  const hint = nextHint(board, solution);
  assert.deepStrictEqual(hint, { row: 8, col: 8, actual: 1, expected: 9 });
});

test("nextHint falls back to the first blank when there are no mistakes", () => {
  const board = parseBoard(PUZZLE);
  const solution = parseBoard(SOLUTION);
  assert.deepStrictEqual(nextHint(board, solution), { row: 0, col: 2, actual: null, expected: 4 });
});
