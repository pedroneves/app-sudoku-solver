class Cell {
  private _value?: number

  constructor(
    public readonly row: number,
    public readonly col: number,
    value?: number,
  ){
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
}

export class Sudoku {
  private cells: Set<Cell> = new Set<Cell>()
  private cellById = new Map<ReturnType<typeof genIdByCoords>, Cell>()
  private rowsIndex = new Map<number, Set<Cell>>()
  private colsIndex = new Map<number, Set<Cell>>()
  private quadsIndex = new Map<number, Set<Cell>>()


  constructor() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        // inits the colsIndex
        if (!this.colsIndex.has(row)) {
          this.colsIndex.set(row, new Set<Cell>())
        }
        
        const cell = new Cell(row, col)
        this.cells.add(cell)
        this.cellById.set(cell.id, cell)
        this.rowsIndex.getOrInsertComputed(row, genCellSet).add(cell)
        this.colsIndex.getOrInsertComputed(col, genCellSet).add(cell)
        this.quadsIndex.getOrInsertComputed(quad(row, col), genCellSet).add(cell)
      }
    }
  }

  setValue(row: number, col:number, value: number) {
    this.getCell(row, col).value = value
  }

  getValue(row: number, col: number): number | undefined {
    return this.getCell(row, col).value
  }

  /** Returns the values of a row, left to right. Empty cells are `undefined`. */
  getRow(row: number): Array<number | undefined> {
    return this.getValues(this.rowsIndex, row, 'Row')
  }

  /** Returns the values of a column, top to bottom. Empty cells are `undefined`. */
  getCol(col: number): Array<number | undefined> {
    return this.getValues(this.colsIndex, col, 'Column')
  }

  /**
   * Returns the values of a quadrant, row by row. Empty cells are `undefined`.
   * Quadrants are numbered as in {@link quad}.
   */
  getQuad(quadrant: number): Array<number | undefined> {
    return this.getValues(this.quadsIndex, quadrant, 'Quadrant')
  }

  private getValues(
    index: Map<number, Set<Cell>>,
    key: number,
    label: string,
  ): Array<number | undefined> {
    if (!isInBounds(key)) {
      throw new SudokuError(`${label} ${key} is out of bounds, expected 0-8`)
    }

    const cells = index.get(key)
    if (!cells) {
      throw new SudokuError(`${label} ${key} not found`)
    }

    return Array.from(cells, (cell) => cell.value)
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
    this.name = 'SudokuError'
  }
}

/**
 * Creates an empty set of cells.
 *
 * Used as the factory for `Map.getOrInsertComputed` when building the indexes.
 *
 * @returns A new, empty `Set<Cell>`.
 */
function genCellSet() {
  return new Set<Cell>()
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
    const [rowLimits, colLimits] = boundries[quad];
    
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