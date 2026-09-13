import test from "node:test";
import assert from "node:assert/strict";
import { PUZZLE, SOLUTION } from "./testing/fixtures";
import { Digit, createEmptyBoard, parseBoard, serializeBoard, validateBoard } from "./board";
import { solveBoard } from "./solve";

test("solveBoard finds the unique solution to a real puzzle", () => {
  const result = solveBoard(parseBoard(PUZZLE));
  assert.strictEqual(result.solved, true);
  assert.strictEqual(serializeBoard(result.board), SOLUTION);
});

test("solveBoard does not mutate its input", () => {
  const board = parseBoard(PUZZLE);
  const before = serializeBoard(board);
  solveBoard(board);
  assert.strictEqual(serializeBoard(board), before);
});

test("solveBoard fails on a board that already breaks a constraint", () => {
  const board = createEmptyBoard();
  board[0][0] = 5;
  board[0][1] = 5;
  assert.strictEqual(solveBoard(board).solved, false);
});

test("solveBoard fails on a board with no solution despite no direct duplicate", () => {
  // Row 0 is missing only digit 9, which forces (0,8) to be 9 - but column
  // 8 already has a 9, so that cell has zero candidates even though no
  // single row/column/box contains a duplicate.
  const board = createEmptyBoard();
  for (let c = 0; c < 8; c++) board[0][c] = (c + 1) as Digit;
  board[1][8] = 9;
  assert.strictEqual(validateBoard(board).valid, true);
  assert.strictEqual(solveBoard(board).solved, false);
});
