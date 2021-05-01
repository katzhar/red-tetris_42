const Piece = require('./piece');
const PieceGenerator = require('./piece-generator');

class Player {
  constructor(id) {
    this.id = id;
    this.actions = {
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
      down: { x: 0, y: 1 },
    };
    this.field = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    this.tempField = undefined;
    this.piece = new Piece(
      undefined,
      new PieceGenerator().generatePiece(),
    );
    this.reducer = (accumulator, value) => accumulator + value;
    this.isAlive = true;
  }

  fixedFigure() {
    let count = 0;
    for (let y = this.tempField.length - 1; y >= 0; y -= 1) {
      for (let x = this.tempField[y].length; x >= 0; x -= 1) {
        if (this.tempField[y][x] === 1) {
          this.tempField[y][x] = 3;
          count += 1;
          if (count === 4) { break; }
        }
      }
    }
    this.piece.shape = undefined;
    return this;
  }

  clearFullLine() {
    let count = 0;
    let clearY = 0;
    for (let y = this.field.length - 1; y >= 0; y -= 1) {
      if (this.field[y].reduce(this.reducer) === 30) {
        for (let x = 0; x < this.field[y].length; x += 1) {
          for (clearY = y; clearY > 0; clearY -= 1) {
            this.field[clearY][x] = this.field[clearY - 1][x];
          }
          this.field[clearY][x] = 0;
        }
        count += 1;
        y += 1;
      }
    }
    return count;
  }

  addPenaltyLine(lines) {
    if ((lines - 1) === 0) {
      return this;
    }
    for (let i = 0; i < lines - 1; i += 1) {
      this.field.shift();
      this.field.push(
        [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      );
    }
    return this;
  }

  spawnFigure() {
    this.piece.updateState();
    const X = this.piece.x;
    const Y = this.piece.y;
    for (let y = 0; y < this.piece.currentFigure().length; y += 1) {
      for (let x = 0; x < this.piece.currentFigure().length; x += 1) {
        if (x >= 0 && x < this.piece.currentFigure().length
          && y >= 0 && y < this.field.length) {
          this.field[Y + y][X + x] += this.piece.currentFigure()[y][x];
          if (this.field[Y + y][X + x] !== 0 && this.field[Y + y][X + x] % 2 === 0) {
            return undefined;
          }
        }
      }
    }
    return this;
  }

  clearField() {
    const X = this.piece.x;
    const Y = this.piece.y;
    const field = this.tempField;
    for (let y = 0; y < this.piece.currentFigure().length; y += 1) {
      for (let x = 0; x < this.piece.currentFigure()[y].length; x += 1) {
        if ((x + X) >= 0 && (x + X) < field[0].length
        && (y + Y) >= 0 && (y + Y) < field.length) {
          field[Y + y][X + x] = field[Y + y][X + x] === 1 ? 0 : field[Y + y][X + x];
        }
      }
    }
    return this;
  }

  changeCoordinates(coords) {
    let X = this.piece.x;
    let Y = this.piece.y;
    const { x, y } = coords;
    X += x;
    Y += y;
    if (X < this.tempField[0].length
    && Y < this.tempField.length) {
      this.piece.oldX = this.piece.x;
      this.piece.oldY = this.piece.y;
      this.piece.x = X;
      this.piece.y = Y;
      return this;
    }
    return undefined;
  }

  putFigure() {
    const X = this.piece.x;
    const Y = this.piece.y;
    for (let y = 0; y < this.piece.currentFigure().length; y += 1) {
      for (let x = 0; x < this.piece.currentFigure()[y].length; x += 1) {
        const checkX = (X + x) >= 0 && (X + x) < this.tempField[0].length;
        const checkY = (Y + y) >= 0 && (Y + y) < this.tempField.length;
        if (checkX && checkY) {
          this.tempField[Y + y][X + x] += this.piece.currentFigure()[y][x];
          if (this.tempField[Y + y][X + x] !== 0 && this.tempField[Y + y][X + x] % 2 === 0) {
            this.piece.x = this.piece.oldX;
            this.piece.y = this.piece.oldY;
            this.tempField = this.field;
            return undefined;
          }
        } else {
          if (this.piece.currentFigure()[y][x] === 0) {
            // eslint-disable-next-line no-continue
            continue;
          }
          this.piece.x = this.piece.oldX;
          this.piece.y = this.piece.oldY;
          this.tempField = this.field;
          return undefined;
        }
      }
    }
    return this;
  }

  rotateFigure() {
    this.piece.rotateFigure();
    return this;
  }

  action(action) {
    if (!this.piece.shape) {
      this.piece.updateState();
    }
    this.tempField = this.field.map((row) => row.slice());
    let result;

    if (action === 'down') {
      result = this
        .clearField()
        .changeCoordinates(this.actions.down)
        ?.putFigure();
      if (result === undefined) {
        result = this.fixedFigure();
      }
    } else if (this.actions[action]) {
      result = this
        .clearField()
        .changeCoordinates(this.actions[action])
        ?.putFigure();
    } else if (action === 'rotate') {
      result = this
        .clearField()
        .rotateFigure()
        ?.putFigure();
    } else if (action === 'drop') {
      do {
        result = this
          .clearField()
          .changeCoordinates(this.actions.down)
          ?.putFigure();
        if (result !== undefined) {
          this.field = this.tempField.map((row) => row.slice());
        }
      } while (result !== undefined);
      result = this.fixedFigure();
    }
    if (result !== undefined) {
      this.field = this.tempField;
    }
    return this.clearFullLine();
  }

  updateState() {
    if (!this.isAlive) {
      return undefined;
    }
    if (this.piece.shape !== undefined) {
      this.action('down');
    } else if (!this.spawnFigure()) {
      this.isAlive = false;
    }
    return this.clearFullLine();
  }

  getState() {
    return {
      id: this.id,
      field: this.field,
      isAlive: this.isAlive,
      nextPiece: this.piece.nextShape.display,
    };
  }
}

module.exports = Player;
