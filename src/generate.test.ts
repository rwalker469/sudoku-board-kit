import test from "node:test";
import assert from "node:assert/strict";
import { Board } from "./board";
import { solveBoard } from "./solve";
import { generateBoard } from "./generate";

// A small seedable PRNG so generation is reproducible in a test without
// touching Math.random.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function countClues(board: Board): number {
  return board.flat().filter((cell) => cell !== null).length;
}

test("generateBoard with a seeded random is reproducible", () => {
  const first = generateBoard({ difficulty: "easy", random: mulberry32(7) });
  const second = generateBoard({ difficulty: "easy", random: mulberry32(7) });
  assert.deepStrictEqual(first, second);
});

test("generateBoard produces a puzzle that is actually solvable", () => {
  const puzzle = generateBoard({ difficulty: "medium", random: mulberry32(1) });
  assert.strictEqual(solveBoard(puzzle).solved, true);
});

test("generateBoard respects the requested difficulty's clue budget", () => {
  const puzzle = generateBoard({ difficulty: "expert", random: mulberry32(5) });
  const clues = countClues(puzzle);
  assert.ok(clues >= 17, "clue count should never go below the theoretical sudoku minimum");
  assert.ok(clues <= 30, "expert puzzles should be noticeably sparser than the 38-clue easy target");
});
