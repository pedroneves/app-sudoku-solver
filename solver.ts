import { Cell, Sudoku, SudokuError } from "./sudoku.ts"

const VALUES = [1,2,3,4,5,6,7,8,9]

export interface Solver {
  solve(game: Sudoku): Sudoku | SudokuError
}

export class BacktrackSolver implements Solver {
  private queue: Cell[] = []

  solve(game: Sudoku): Sudoku | SudokuError {
    try {
      let _g = game.clone()
      const emptyCells = [..._g.getEmptyCells()]

      let cell: Cell | undefined;

      while (emptyCells.length > 0) {
        if (!cell) {
          cell = emptyCells.shift()
          if (!cell) return new SudokuError(`Expected an empty cell, got undefined`)
        }

        // If cell is defined, means we're resuming iterating the values from an
        // specified one
        for (let val = cell?.value ?? 1; val <= 9; val++) {
          cell.value = val
          if (_g.isValid()) {
            this.queue.push(cell)
            break; // Found a valid value, stop iterating
          } else {
            cell.clearValue()
          }
        }

        if (cell.isEmpty) {
          /* No possible value was found and we need to backtrack.
          Re-adds the current cell to the list of empty and resume iterating
          on the previous one */

          emptyCells.unshift(cell)
          cell = this.queue.pop()
          if (!cell) return new SudokuError(`Backtracked until the beginning. No previous actions to backtrack.`)
        } else {
          /* A valid value was added and we can proceed.
          Adds the current cell to the list and clears the `cell` var */

          this.queue.push(cell)
          cell = undefined
        }
      }

      return _g
    } catch (error) {
      if (error instanceof SudokuError) return error
      return new SudokuError(`Unknown error`, { cause: error })
    }
  }
}
