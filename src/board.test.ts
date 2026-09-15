import test from "node:test";
import assert from "node:assert/strict";
import { PUZZLE, SOLUTION } from "./testing/fixtures";
import { createEmptyBoard, parseBoard, serializeBoard, cloneBoard, isComplete, validateBoard } from "./board";
import { formatBoard } from "./format";

test("parseBoard reads row-major digits and blanks", () => {
  const board = parseBoard(PUZZLE);
  assert.strictEqual(board[0][0], 5);
  assert.strictEqual(board[0][2], null);
  assert.strictEqual(board[8][8], 9);
});

test("parseBoard ignores whitespace and accepts '0' for blanks", () => {
  const spaced = PUZZLE.replace(/\./g, "0").split("").join(" ");
  const board = parseBoard(spaced);
  assert.strictEqual(board[0][0], 5);
  assert.strictEqual(board[0][2], null);
});

test("parseBoard accepts a newline-delimited grid", () => {
  const rows = PUZZLE.match(/.{9}/g) ?? [];
  const board = parseBoard(rows.join("\n"));
  assert.strictEqual(board[0][0], 5);
  assert.strictEqual(board[0][2], null);
});

test("parseBoard round-trips formatBoard's human-readable grid", () => {
  const board = parseBoard(PUZZLE);
  const reparsed = parseBoard(formatBoard(board));
  assert.deepStrictEqual(reparsed, board);
});

test("parseBoard rejects the wrong number of cells", () => {
  assert.throws(() => parseBoard("123"));
});

test("parseBoard rejects characters outside 0-9 and '.'", () => {
  assert.throws(() => parseBoard("x".repeat(81)));
});

test("serializeBoard is the inverse of parseBoard", () => {
  assert.strictEqual(serializeBoard(parseBoard(PUZZLE)), PUZZLE);
});

test("cloneBoard produces an independent copy", () => {
  const board = parseBoard(PUZZLE);
  const clone = cloneBoard(board);
  clone[0][0] = 9;
  assert.strictEqual(board[0][0], 5);
});

test("isComplete is false with blanks and true once filled", () => {
  assert.strictEqual(isComplete(parseBoard(PUZZLE)), false);
  assert.strictEqual(isComplete(parseBoard(SOLUTION)), true);
});

test("validateBoard reports no conflicts for a solved board", () => {
  const result = validateBoard(parseBoard(SOLUTION));
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.conflicts, []);
});

test("validateBoard finds a repeated digit in a row", () => {
  const board = createEmptyBoard();
  board[0][0] = 5;
  board[0][3] = 5;
  const result = validateBoard(board);
  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.conflicts, [
    { unit: "row", index: 0, digit: 5, cells: [[0, 0], [0, 3]] },
  ]);
});

test("validateBoard finds a repeated digit in a column", () => {
  const board = createEmptyBoard();
  board[0][0] = 5;
  board[4][0] = 5;
  const result = validateBoard(board);
  assert.deepStrictEqual(result.conflicts, [
    { unit: "column", index: 0, digit: 5, cells: [[0, 0], [4, 0]] },
  ]);
});

test("validateBoard finds a repeated digit in a box with no row or column overlap", () => {
  const board = createEmptyBoard();
  board[0][0] = 5;
  board[1][1] = 5;
  const result = validateBoard(board);
  assert.deepStrictEqual(result.conflicts, [
    { unit: "box", index: 0, digit: 5, cells: [[0, 0], [1, 1]] },
  ]);
});
