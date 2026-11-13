export class Cell {
  constructor(
    public readonly row: number,
    public readonly col: number,
    public value?: number,
  ){}

  get isEmpty() {
    return this.value === undefined
  }
}

export class Sudoku {
  private cells: Set<Cell> = new Set<Cell>()
  private rowsIndex = new Map<number, Set<Cell>>()
  private colsIndex = new Map<number, Set<Cell>>()


  constructor() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        // inits the colsIndex
        if (!this.colsIndex.has(row)) {
          this.colsIndex.set(row, new Set<Cell>())
        }
        
        const cell = new Cell(row, col)
        this.cells.add(cell)
        this.rowsIndex.getOrInsert(row, new Set<Cell>()).add(cell)
        this.colsIndex.getOrInsert(col, new Set<Cell>()).add(cell)
      }
    }
  }

  setValue(row: number, col:number, value: number) {
    const cellInter = this.rowsIndex.getOrInsertComputed(row, genCellSet)
      .intersection(
        this.colsIndex.getOrInsertComputed(col, genCellSet)
      )

  }
}

function genCellSet() {
  return new Set<Cell>()
}

function quad(row: number, col: number): number {

}

function genCellId(row: number, col: number): number {
  return (row * 17) + col
}