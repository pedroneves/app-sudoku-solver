import { Sudoku, SudokuError } from "./sudoku.ts"

export interface Solver {
  solve(game: Sudoku): Sudoku | SudokuError
}
