const Player = require('./player');

class Game {
  constructor(id) {
    this.id = id;
    this.players = {};
    this.playerLimit = 3;
    this.isActive = false;
  }

  startGame() {
    this.isActive = true;
    this.updateState();
  }

  pauseGame() {
    this.isActive = false;
  }

  createPlayer(id) {
    const playerId = id.slice(0, 7) === 'player-'
      ? id
      : `player-${id}`;
    const player = new Player(playerId);

    this.players[player.id] = player;
  }

  removePlayer(id) {
    const playerId = `player-${id}`;

    if (this.players[playerId]) {
      delete this.players[playerId];
      // this.players[playerId].isAlive = false;
    }
  }

  updateState() {
    const states = [];

    if (Object.values(this.players).every((player) => !player.isAlive)) {
      return undefined;
    }

    Object.values(this.players).forEach((player) => {
      const removedLines = player.updateState();

      if (removedLines) {
        Object.values(this.players).forEach((p) => {
          if (player.id !== p.id) {
            p.addPenaltyLine(removedLines);
          }
        });
      }

      states.push(player.getState());
    });

    return {
      id: this.id,
      states,
      status: 200,
    };
  }

  playerAction(action, id) {
    const states = [];
    const player = this.players[id];
    const removedLines = player.action(action);

    Object.values(this.players).forEach((p) => {
      if (removedLines && player !== p.id) {
        p.addPenaltyLine(removedLines);
      }

      states.push({
        id: p.id,
        field: p.field,
        isAlive: p.isAlive,
        nextPiece: p.piece.nextShape.display,
      });
    });

    return {
      id: this.id,
      states,
      status: 200,
    };
  }
}

module.exports = Game;
