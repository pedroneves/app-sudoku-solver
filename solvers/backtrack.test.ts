import { assert, assertEquals, assertInstanceOf } from "@std/assert"
import { type SudokuJSON, SudokuJSONDeserializer } from "../serde.ts"
import { BacktrackSolver } from "./backtrack.ts"
import { Sudoku } from "../sudoku.ts"

/** Classic puzzle that needs backtracking with a naive row-major search. "." is an empty cell. */
const PUZZLE = [
  "53..7....",
  "6..195...",
  ".98....6.",
  "8...6...3",
  "4..8.3..1",
  "7...2...6",
  ".6....28.",
  "...419..5",
  "....8..79",
]

/**
 * Builds a board from 9 rows of 9 characters through the JSON deserializer.
 * Digits become readonly givens, "." stays empty.
 */
function parseBoard(rows: string[]): Sudoku {
  const data: SudokuJSON = {
    cells: rows.map((line) =>
      [...line].map((char) => ({
        value: char === "." ? null : Number(char),
        readonly: char !== ".",
        possibilities: [],
      }))
    ),
  }

  return new SudokuJSONDeserializer().deserialize(JSON.stringify(data))
}

Deno.test("BacktrackSolver solves a puzzle that needs backtracking", () => {
  const result = new BacktrackSolver().solve(parseBoard(PUZZLE))

  assertInstanceOf(result, Sudoku)
  assert(result.isValid(), "The solved board breaks the Sudoku rules")
  assertEquals(result.getEmptyCells().size, 0)
})
