import test from "node:test";
import assert from "node:assert/strict";
import { PUZZLE, SOLUTION } from "./testing/fixtures";
import { createEmptyBoard, parseBoard, validateBoard } from "./board";
import { formatBoard, formatValidation } from "./format";

test("formatBoard renders a human-readable grid with box borders", () => {
  const lines = formatBoard(parseBoard(PUZZLE)).split("\n");
  assert.strictEqual(lines.length, 13); // 4 horizontal rules + 9 rows
  assert.strictEqual(lines[0], "+-------+-------+-------+");
  assert.strictEqual(lines[1], "| 5 3 . | . 7 . | . . . |");
});

test("formatBoard json option round-trips through JSON", () => {
  const board = parseBoard(PUZZLE);
  assert.deepStrictEqual(JSON.parse(formatBoard(board, { json: true })), board);
});

test("formatValidation reports a valid board in plain text", () => {
  const result = validateBoard(parseBoard(SOLUTION));
  assert.strictEqual(formatValidation(result), "board is valid");
});

test("formatValidation lists each conflict in plain text", () => {
  const board = createEmptyBoard();
  board[0][0] = 5;
  board[0][3] = 5;
  const message = formatValidation(validateBoard(board));
  assert.strictEqual(message, "board has 1 conflict(s):\n  row 0: digit 5 repeats at (0,0), (0,3)");
});

test("formatValidation json option round-trips through JSON", () => {
  const result = validateBoard(parseBoard(SOLUTION));
  assert.deepStrictEqual(JSON.parse(formatValidation(result, { json: true })), result);
});
