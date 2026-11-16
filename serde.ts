import { Sudoku, SudokuError } from "./sudoku.ts"

/** JSON shape of a {@link Sudoku} board. */
export interface SudokuJSON {
  /** 9 rows of 9 cells, top to bottom and left to right. */
  cells: CellJSON[][]
}

/** JSON shape of a single cell. */
export interface CellJSON {
  /** The cell value (1-9), or `null` when the cell is empty. */
  value: number | null
  readonly: boolean
  /** Candidate values in ascending order. Empty when the cell has a value. */
  possibilities: number[]
}

const SIZE = 9

/** Converts a {@link Sudoku} board to a JSON string. */
export class SudokuJSONSerializer {
  serialize(sudoku: Sudoku): string {
    const cells: CellJSON[][] = []

    for (let row = 0; row < SIZE; row++) {
      const cellsRow: CellJSON[] = []

      for (let col = 0; col < SIZE; col++) {
        cellsRow.push({
          value: sudoku.getValue(row, col) ?? null,
          readonly: sudoku.isReadonly(row, col),
          possibilities: sudoku.getPossibilities(row, col),
        })
      }

      cells.push(cellsRow)
    }

    const data: SudokuJSON = { cells }
    return JSON.stringify(data)
  }
}

/** Builds a {@link Sudoku} board from a JSON string made by {@link SudokuJSONSerializer}. */
export class SudokuJSONDeserializer {
  /** @throws {SudokuError} If the string isn't valid JSON or doesn't describe a board. */
  deserialize(json: string): Sudoku {
    let data: unknown
    try {
      data = JSON.parse(json)
    } catch (error) {
      throw new SudokuError(`Invalid JSON: ${(error as Error).message}`)
    }

    const cells = parseCells(data)
    const sudoku = new Sudoku()

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cell = cells[row][col]

        for (const num of cell.possibilities) sudoku.setPossibleValuesetValue(row, col, num)
        if (cell.value !== null) sudoku.setValue(row, col, cell.value)
        // Marked last, so a readonly cell can still receive its value
        if (cell.readonly) sudoku.markReadonly(row, col)
      }
    }

    return sudoku
  }
}

function parseCells(data: unknown): CellJSON[][] {
  if (!isObject(data) || !Array.isArray(data.cells) || data.cells.length !== SIZE) {
    throw new SudokuError(`Expected an object with "cells": an array of ${SIZE} rows`)
  }

  return data.cells.map((row, rowIdx) => {
    if (!Array.isArray(row) || row.length !== SIZE) {
      throw new SudokuError(`Row ${rowIdx} should be an array of ${SIZE} cells`)
    }

    return row.map((cell, colIdx) => parseCell(cell, rowIdx, colIdx))
  })
}

function parseCell(cell: unknown, row: number, col: number): CellJSON {
  const where = `Cell at row ${row}, column ${col}`

  if (!isObject(cell)) {
    throw new SudokuError(`${where} should be an object`)
  }

  const { value, readonly, possibilities } = cell

  if (value !== null && typeof value !== "number") {
    throw new SudokuError(`${where}: "value" should be a number or null`)
  }
  if (typeof readonly !== "boolean") {
    throw new SudokuError(`${where}: "readonly" should be a boolean`)
  }
  if (!Array.isArray(possibilities) || !possibilities.every((num) => typeof num === "number")) {
    throw new SudokuError(`${where}: "possibilities" should be an array of numbers`)
  }

  return { value, readonly, possibilities }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
