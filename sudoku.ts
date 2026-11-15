class Cell {
  private _value?: number
  private possibilities = new Set<number>()

  constructor(public readonly row: number, public readonly col: number, value?: number) {
    this.value = value
  }

  get value(): number | undefined {
    return this._value
  }

  /** Sets the cell value. `undefined` clears the cell. */
  set value(value: number | undefined) {
    if (value !== undefined && !isValidValue(value)) {
      throw new SudokuError(`Value ${value} is invalid, expected an integer 1-9`)
    }
    this._value = value
  }

  get id() {
    return genIdByCoords(this.row, this.col)
  }

  get isEmpty() {
    return this.value === undefined
  }

  addPossibility(num: number): void {
    if (!isValidValue(num)) return
    this.possibilities.add(num)
  }

  removePossibility(num: number): void {
    if (!isValidValue(num)) return
    this.possibilities.delete(num)
  }

  clearPossibilities(): void {
    this.possibilities.clear()
  }
}

abstract class Component extends Set<Cell> {
  abstract isValid(): boolean
}

class Row extends Component {
  override isValid(): boolean {
    let rowIdx: number | null = null
    const elements: Array<Cell> = new Array(9)

    for (const cell of this.values()) {
      // The row index should be the same for every cell
      if (rowIdx === null) rowIdx = cell.row

      // Found a cell from another row
      if (cell.row !== rowIdx) return false

      // The set contains another cell for the same row and column
      if (elements[cell.col]) return false

      // Assign the current cell for the column
      elements[cell.col] = cell
    }

    return true
  }
}

class Col extends Component {
  override isValid(): boolean {
    let colIdx: number | null = null
    const elements: Array<Cell> = new Array(9)

    for (const cell of this.values()) {
      // The column index should be the same for every cell
      if (colIdx === null) colIdx = cell.col

      // Found a cell from another column
      if (cell.col !== colIdx) return false

      // The set contains another cell for the same column and row
      if (elements[cell.row]) return false

      // Assign the current cell for the row
      elements[cell.row] = cell
    }

    return true
  }
}

class Quad extends Component {
  override isValid(): boolean {
    let quadIdx: number | null = null
    const elements: Array<Cell> = new Array(9)

    for (const cell of this.values()) {
      const cellQuad = quad(cell.row, cell.col)

      // The quadrant index should be the same for every cell
      if (quadIdx === null) quadIdx = cellQuad

      // Found a cell from another quadrant
      if (cellQuad !== quadIdx) return false

      // Position of the cell inside the quadrant (0-8, row by row)
      const position = (cell.row % 3) * 3 + (cell.col % 3)

      // The set contains another cell for the same position
      if (elements[position]) return false

      // Assign the current cell for the position
      elements[position] = cell
    }

    return true
  }
}

export class Sudoku {
  private cells: Set<Cell> = new Set<Cell>()
  private cellById = new Map<ReturnType<GenIdByCoords>, Cell>()
  private rowsIndex = new Map<number, Row>()
  private colsIndex = new Map<number, Col>()
  private quadsIndex = new Map<number, Quad>()

  constructor() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = new Cell(row, col)
        this.cells.add(cell)
        this.cellById.set(cell.id, cell)
        this.rowsIndex.getOrInsertComputed(row, genEmptyRow).add(cell)
        this.colsIndex.getOrInsertComputed(col, genEmptyCol).add(cell)
        this.quadsIndex.getOrInsertComputed(quad(row, col), genEmptyQuad).add(cell)
      }
    }
  }

  setValue(row: number, col: number, value: number) {
    this.getCell(row, col).value = value
  }

  setPossibleValuesetValue(row: number, col: number, possibleVal: number) {
    this.getCell(row, col).addPossibility(possibleVal)
  }

  getValue(row: number, col: number): number | undefined {
    return this.getCell(row, col).value
  }

  /** Returns the values of a row, left to right. Empty cells are `undefined`. */
  getRow(row: number): Row {
    return this.rowsIndex.getOrInsertComputed(row, genEmptyRow)
  }

  /** Returns the values of a column, top to bottom. Empty cells are `undefined`. */
  getCol(col: number): Col {
    return this.colsIndex.getOrInsertComputed(col, genEmptyCol)
  }

  /**
   * Returns the values of a quadrant, row by row. Empty cells are `undefined`.
   * Quadrants are numbered as in {@link quad}.
   */
  getQuad(quad: number): Quad {
    return this.quadsIndex.getOrInsertComputed(quad, genEmptyQuad)
  }

  /**
   * Checks whether the board follows the Sudoku rules: no value repeats in any row, column or quadrant.
   *
   * Empty cells are ignored, so a partially filled board can still be valid.
   */
  isValid(): boolean {
    for (let idx = 0; idx < 9; idx++) {
      if (!validateRow(this.getRow(idx))) return false
      if (!validateCol(this.getCol(idx))) return false
      if (!validateQuad(this.getQuad(idx))) return false
    }

    return true
  }

  private getCell(row: number, col: number): Cell {
    if (!isInBounds(row)) {
      throw new SudokuError(`Row ${row} is out of bounds, expected 0-8`)
    }
    if (!isInBounds(col)) {
      throw new SudokuError(`Column ${col} is out of bounds, expected 0-8`)
    }

    const cell = this.cellById.get(genIdByCoords(row, col))
    if (!cell) {
      throw new SudokuError(`No cell found at row ${row}, column ${col}`)
    }

    return cell
  }
}

export class SudokuError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SudokuError"
  }
}

function genEmptySet<T extends Set<Cell>>(Klass: new () => T) {
  return new Klass()
}

function genEmptyRow() {
  return genEmptySet(Row)
}

function genEmptyCol() {
  return genEmptySet(Col)
}

function genEmptyQuad() {
  return genEmptySet(Quad)
}

/**
 * Returns the index of the 3x3 quadrant that contains the given cell.
 *
 * Quadrants are numbered 0–8 left to right, then top to bottom:
 * ```
 * 0 1 2
 * 3 4 5
 * 6 7 8
 * ```
 *
 * @param row Row index of the cell (0–8).
 * @param col Column index of the cell (0–8).
 * @returns The quadrant index (0–8). Returns 0 if row or col is out of range.
 */
function quad(row: number, col: number): number {
  // deno-fmt-ignore
  const boundries = [
    [[0,3], [0,3]], [[0,3], [3,6]], [[0,3], [6,9]],
    [[3,6], [0,3]], [[3,6], [3,6]], [[3,6], [6,9]],
    [[6,9], [0,3]], [[6,9], [3,6]], [[6,9], [6,9]]
  ]

  let quadrant = 0

  for (let quad = 0; quad < boundries.length; quad++) {
    const [rowLimits, colLimits] = boundries[quad]

    if (row >= rowLimits[0] && row < rowLimits[1]) {
      if (col >= colLimits[0] && col < colLimits[1]) {
        quadrant = quad
        break
      }
    }
  }

  return quadrant
}

/**
 * Checks whether a row or column index is within the board.
 *
 * @param value Row or column index.
 * @returns `true` if `value` is >= 0 and < 9.
 */
function isInBounds(value: number): boolean {
  return value >= 0 && value < 9
}

/**
 * Checks whether a number is a valid Sudoku cell value.
 *
 * @param value Candidate cell value.
 * @returns `true` if `value` is an integer from 1 to 9 (inclusive).
 */
function isValidValue(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 9
}

/**
 * Generates a numeric id for a cell from its coordinates.
 *
 * Computed as `row * 17 + col`, which is unique for every cell
 * as long as `col` is below 17.
 *
 * @param row Row index of the cell (0–8).
 * @param col Column index of the cell (0–8).
 * @returns The cell id.
 */
function genIdByCoords(row: number, col: number): number {
  return (row * 17) + col
}

type GenIdByCoords = typeof genIdByCoords

/**
 * Checks whether a row follows the Sudoku rules: no value appears more than once.
 *
 * Empty cells are ignored, so a partially filled row can still be valid.
 *
 * @param row The row to validate.
 * @returns `true` if the row is well formed and has no repeated values.
 */
function validateRow(row: Row): boolean {
  // The row should only hold cells from a single row, one per column
  if (!row.isValid()) return false

  const seen = new Set<number>()

  for (const cell of row) {
    const value = cell.value

    // Empty cells don't break the rules
    if (value === undefined) continue

    // The same value appears twice in the row
    if (seen.has(value)) return false

    seen.add(value)
  }

  return true
}

/**
 * Checks whether a column follows the Sudoku rules: no value appears more than once.
 *
 * Empty cells are ignored, so a partially filled column can still be valid.
 *
 * @param col The column to validate.
 * @returns `true` if the column is well formed and has no repeated values.
 */
function validateCol(col: Col): boolean {
  // The column should only hold cells from a single column, one per row
  if (!col.isValid()) return false

  const seen = new Set<number>()

  for (const cell of col) {
    const value = cell.value

    // Empty cells don't break the rules
    if (value === undefined) continue

    // The same value appears twice in the column
    if (seen.has(value)) return false

    seen.add(value)
  }

  return true
}

/**
 * Checks whether a quadrant follows the Sudoku rules: no value appears more than once.
 *
 * Empty cells are ignored, so a partially filled quadrant can still be valid.
 *
 * @param quad The quadrant to validate.
 * @returns `true` if the quadrant is well formed and has no repeated values.
 */
function validateQuad(quad: Quad): boolean {
  // The quadrant should only hold cells from a single quadrant, one per position
  if (!quad.isValid()) return false

  const seen = new Set<number>()

  for (const cell of quad) {
    const value = cell.value

    // Empty cells don't break the rules
    if (value === undefined) continue

    // The same value appears twice in the quadrant
    if (seen.has(value)) return false

    seen.add(value)
  }

  return true
}
