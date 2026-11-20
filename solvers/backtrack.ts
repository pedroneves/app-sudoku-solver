import { Solver } from "../solver.ts"
import { Cell, Sudoku, SudokuError } from "../sudoku.ts"


export class BacktrackSolver implements Solver {
  private queue: Cell[] = []

  solve(game: Sudoku): Sudoku | SudokuError {
    try {
      const _g = game.clone()
      const emptyCells = [..._g.getEmptyCells()]

      let cell: Cell | undefined

      while (emptyCells.length > 0) {
        if (!cell) {
          cell = emptyCells.shift()
          if (!cell) return new SudokuError(`Expected an empty cell, got undefined`)
        }

        let initialValue: number = 0
        // Cell is already empty, start from the beginning
        if (cell.value === undefined) initialValue = 1
        // Cell is at the limit. Nothing to do. No iteration and clear the cell
        else if (cell.value === 9) {
          cell.clearValue()
          initialValue = 0
        } // Cell is between [1,8]. We start iterating from the next value
        else initialValue = cell.value + 1

        if (initialValue) { // Since we only iterate if cell.value is in [1,8]
          for (let val: number = initialValue; val <= 9; val++) {
            cell.value = val

            // Found a valid value, stop iterating
            if (_g.isValid()) {
              break
            }

            cell.clearValue()
          }
        }

        if (cell.isEmpty) {
          /*
          No possible value was found and we need to backtrack.
          Re-adds the current cell to the list of empty and resume iterating
          on the previous one
          */
          emptyCells.unshift(cell)
          cell = this.queue.pop()
          if (!cell) return new SudokuError(`Backtracked until the beginning. No previous actions to backtrack.`)
        } else {
          /*
          A valid value was added and we can proceed.
          Adds the current cell to the list and clears the `cell` var so we pick the next empty cell
          */
          this.queue.push(cell)
          cell = undefined
        }
      }

      this.queue = []
      return _g
    } catch (error) {
      if (error instanceof SudokuError) return error
      return new SudokuError(`Unknown error`, { cause: error })
    }
  }
}