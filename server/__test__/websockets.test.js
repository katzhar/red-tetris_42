const clientIO = require('socket.io-client');
const Server = require('../server');

let clientSocket;
// let serverSocket;
let server;

jest.setTimeout(60000);

beforeAll((done) => {
  server = new Server().createHttp().createSocketRoutes();
  // serverSocket = server.io;
  server.listen();
  done();
});

afterAll((done) => {
  done();
});

beforeEach((done) => {
  clientSocket = clientIO('ws://127.0.0.1:5000', {
    transports: ['websocket'],
  });
  clientSocket.on('connect', () => {
    done();
  });
});

afterEach((done) => {
  if (clientSocket.connected) {
    clientSocket.disconnect();
  }
  done();
});

describe('On new game', () => {
  it('should return ID of a newly created session if player has NO OTHER SESSIONS', (done) => {
    clientSocket.on('new-game', (message) => {
      expect(message.id).toMatch(/game-(.*?)/);
      expect(message.message).toBe('Game created successfully');
      expect(message.status).toBe(200);
      done();
    });

    clientSocket.emit('new-game');
  });

  it('should PROHIBIT creating new game if previous session not closed', (done) => {
    let count = 0;

    clientSocket.on('new-game', (message) => {
      count += 1;

      if (count === 2) {
        expect(message.id).toBeNull();
        expect(message.message).toBe('Previous session not closed');
        expect(message.status).toBe(400);
        done();
      }
    });
    clientSocket.emit('new-game');
    clientSocket.emit('new-game');
  });
});

describe('On list games', () => {
  it('should return an EMPTY LIST when NO ONE initializes the game', (done) => {
    clientSocket.on('list-games', (message) => {
      expect(message.data.length).toBe(0);
      expect(message.status).toBe(200);
      done();
    });

    clientSocket.emit('list-games');
  });

  it('should return a list with a SINGLE ITEM when ONE PLAYER initializes the game', (done) => {
    clientSocket.on('list-games', (message) => {
      expect(message.data.length).toBe(1);
      expect(message.data[0]).toMatch(/game-(.*?)/);
      expect(message.status).toBe(200);
      done();
    });

    clientSocket.on('new-game', () => {
      clientSocket.emit('list-games');
    });

    clientSocket.emit('new-game');
  });

  it('should return a list with SEVERAL ITEMS when SEVERAL PLAYERS initialize the game', (done) => {
    const otherClients = [];

    for (let i = 0; i < Math.floor(Math.random() * 2 + 1); i += 1) {
      otherClients.push(clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] }));
    }

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherClients.forEach((otherClient) => otherClient.disconnect());
      setTimeout(() => {
        done();
      }, 10);
    }

    clientSocket.on('list-games', (message) => {
      expect(message.data.length).toBe(otherClients.length + 1);
      message.data.forEach((game) => {
        expect(game).toMatch(/game-(.*?)/);
      });
      expect(message.status).toBe(200);

      callbackDisconnect();
    });

    clientSocket.on('new-game', () => {
      clientSocket.emit('list-games');
    });

    otherClients.forEach((otherClient, i) => {
      otherClient.emit('new-game');
      if (i === otherClients.length - 1) {
        setTimeout(() => {
          clientSocket.emit('new-game');
        }, 10);
      }
    });
  });
});

describe('On list players', () => {
  it('should REJECT request when there is no game with specified ID', (done) => {
    clientSocket.on('list-players', (message) => {
      expect(message.id).toBeNull();
      expect(message.message).toBe('No such game');
      expect(message.status).toBe(400);
      done();
    });


    clientSocket.emit('list-players', { id: 'game-mockId' });
  });

  it('should REJECT request when current user NOT in session', (done) => {
    const otherClients = [];

    for (let i = 0; i < Math.floor(Math.random() * 2 + 1); i += 1) {
      otherClients.push(clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] }));
    }

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherClients.forEach((otherClient) => otherClient.disconnect());
      setTimeout(() => {
        done();
      }, 10);
    }

    clientSocket.on('list-players', (message) => {
      expect(message.id).toBeNull();
      expect(message.message).toBe('No permission to access this game session');
      expect(message.status).toBe(400);
      callbackDisconnect();
    });

    otherClients[0].on('new-game', (message) => {
      otherClients.forEach((otherClient, i) => {
        if (i > 0) {
          otherClient.emit('join-game', { id: message.id })
        }
      })
      setTimeout(() => {
        clientSocket.emit('list-players', { id: message.id });
      }, 10)
    });

    otherClients[0].emit('new-game');
  });

  it('should ACCEPT request and return a list of players otherwise', (done) => {
    const otherClients = [];

    for (let i = 0; i < Math.floor(Math.random() * 2 + 1); i += 1) {
      otherClients.push(clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] }));
    }

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherClients.forEach((otherClient) => otherClient.disconnect());
      setTimeout(() => {
        done();
      }, 10);
    }

    clientSocket.on('new-game', (message) => {
      otherClients.forEach((otherClient) => otherClient.emit('join-game', { id: message.id }));
      setTimeout(() => {
        clientSocket.emit('list-players', { id: message.id });
      }, 10);
    });

    clientSocket.on('list-players', (message) => {
      expect(message.id).toMatch(/game-(.*?)/);
      expect(message.data.length).toBe(otherClients.length + 1);
      message.data.forEach((player) => {
        expect(player).toMatch(/player-(.*?)/);
      });
      expect(message.status).toBe(200);
      callbackDisconnect();
    });

    clientSocket.emit('new-game');
  });
});

describe('On join game', () => {
  it('should REJECT request when there is no game with specified ID', (done) => {
    clientSocket.on('join-game', (message) => {
      expect(message.id).toBe('game-mockId');
      expect(message.message).toBe('No such game');
      expect(message.status).toBe(400);
      done();
    });

    clientSocket.emit('join-game', { id: 'game-mockId' });
  });

  it('should REJECT request when already joined', (done) => {
    let gameId;
    let calls = 0;

    function callbackDisconnect() {
      clientSocket.disconnect();
      setTimeout(() => {
        done();
      }, 10);
    }

    clientSocket.on('new-game', (message) => {
      gameId = message.id;
      clientSocket.emit('join-game', { id: gameId });
    });

    clientSocket.on('join-game', (message) => {
      calls += 1;
      if (calls === 2) {
        expect(message.id).toBe(gameId);
        expect(message.message).toBe('Already joined');
        expect(message.status).toBe(400);
        callbackDisconnect();
      } else {
        clientSocket.emit('join-game', { id: gameId });
      }
    });

    clientSocket.emit('new-game');
  });

  it('should REJECT request when already in other game', (done) => {
    const otherClient = clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] });
    let gameId;

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherClient.disconnect();
      setTimeout(() => {
        done();
      }, 10);
    }

    otherClient.on('new-game', (message) => {
      gameId = message.id;
      clientSocket.emit('new-game');
    });

    clientSocket.on('new-game', () => {
      clientSocket.emit('join-game', { id: gameId });
    });

    clientSocket.on('join-game', (message) => {
      expect(message.id).toBe(gameId);
      expect(message.message).toBe('Already joined other session');
      expect(message.status).toBe(400);
      callbackDisconnect();
    });

    otherClient.emit('new-game');
  });

  it('should REJECT request when room is full', (done) => {
    const otherHostClient = clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] });
    const otherClients = [];
    let gameId;

    for (let i = 0; i < 3; i += 1) {
      otherClients.push(clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] }));
    }

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherHostClient.disconnect();
      otherClients.forEach((client) => client.disconnect());
      setTimeout(() => {
        done();
      }, 10);
    }

    otherHostClient.on('new-game', (message) => {
      gameId = message.id;
      otherClients.forEach((client) => client.emit('join-game', { id: gameId }));
      clientSocket.emit('join-game', { id: gameId });
    });

    clientSocket.on('join-game', (message) => {
      expect(message.id).toBe(gameId);
      expect(message.message).toBe('Room full');
      expect(message.status).toBe(400);
      callbackDisconnect();
    });

    otherHostClient.emit('new-game');
  });

  it('should ACCEPT request otherwise', (done) => {
    const otherHostClient = clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] });
    let gameId;

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherHostClient.disconnect();
      setTimeout(() => {
        done();
      }, 10);
    }

    otherHostClient.on('new-game', (message) => {
      gameId = message.id;
      clientSocket.emit('join-game', { id: gameId });
    });

    clientSocket.on('join-game', (message) => {
      expect(message.id).toBe(gameId);
      expect(message.message).toBe('Joined game session successfully');
      expect(message.status).toBe(200);
      callbackDisconnect();
    });

    otherHostClient.emit('new-game');
  });
});

describe('On quit game', () => {
  it('should REJECT request if there is no game with specified ID', (done) => {
    clientSocket.on('quit-game', (message) => {
      expect(message.id).toBe('game-mockId');
      expect(message.message).toBe('You are not in this game');
      expect(message.status).toBe(400);
      done();
    });

    clientSocket.emit('quit-game', { id: 'game-mockId' });
  });

  it('should ACCEPT request if player is in game', (done) => {
    let gameId;

    clientSocket.on('new-game', (message) => {
      gameId = message.id;
      clientSocket.emit('quit-game', { id: gameId });
    });

    clientSocket.on('quit-game', (message) => {
      expect(message.id).toBe(gameId);
      expect(message.message).toBe('You left the game');
      expect(message.status).toBe(200);
      done();
    });

    clientSocket.emit('new-game');
  });

  it('should NOTIFY all players in the room', (done) => {
    const otherClient = clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] });
    let gameId;

    clientSocket.on('new-game', (message) => {
      gameId = message.id;
      clientSocket.emit('join-game', { id: gameId });
      otherClient.emit('join-game', { id: gameId });
    });

    clientSocket.on('join-game', () => {
      clientSocket.emit('start-game', { id: gameId });
    });

    clientSocket.on('start-game', () => {
      otherClient.emit('quit-game', { id: gameId });
    });

    clientSocket.on('quit-game', (message) => {
      const otherPlayerId = `player-${otherClient.id}`;

      expect(message.id).toBe(gameId);
      expect(message.playerId).toBe(otherPlayerId);
      expect(message.message).toBe(`One of the players left: ${otherPlayerId}`);
      expect(message.status).toBe(200);
      expect(server.games[gameId].players[otherPlayerId]).toBeUndefined();
      done();
    });

    clientSocket.emit('new-game');
  });
});

describe('On start game', () => {
  it('should REJECT request if there are no games to start', (done) => {
    clientSocket.on('start-game', (message) => {
      expect(message.id).toBe(`game-${clientSocket.id}`);
      expect(message.message).toBe('No opened sessions to start');
      expect(message.status).toBe(400);
      done();
    });

    clientSocket.emit('start-game');
  });

  it('should REJECT request if the game is active', (done) => {
    let count = 0;

    clientSocket.on('new-game', (message) => {
      clientSocket.emit('join-game', { id: message.id });
    });

    clientSocket.on('join-game', (message) => {
      clientSocket.emit('start-game', { id: message.id });
      clientSocket.emit('start-game', { id: message.id });
    });

    clientSocket.on('start-game', (message) => {
      count += 1;
      if (count === 2) {
        expect(message.id).toBe(`game-${clientSocket.id}`);
        expect(message.message).toBe('Already started');
        expect(message.status).toBe(400);
        done();
      }
    });

    clientSocket.emit('new-game');
  });

  it('should ACCEPT otherwise and receive new game states', (done) => {
    let count = 0;

    clientSocket.on('new-game', (message) => {
      clientSocket.emit('join-game', { id: message.id });
    });

    clientSocket.on('join-game', (message) => {
      clientSocket.emit('start-game', { id: message.id });
    });

    clientSocket.on('start-game', (message) => {
      expect(message.id).toBe(`game-${clientSocket.id}`);
      expect(message.message).toBe('Game session started successfully');
      expect(message.status).toBe(200);
    });

    clientSocket.on('new-state', (message) => {
      count += 1;

      expect(message.id).toBe(`game-${clientSocket.id}`);
      expect(message.states.length).toBe(1);
      expect(message.states[0].id).toBe(`player-${clientSocket.id}`);
      expect(message.states[0].field).not.toBeUndefined();
      expect(message.states[0].nextPiece).not.toBeUndefined();
      expect(message.states[0].isAlive).toBe(true);
      expect(message.status).toBe(200);

      if (count === 5) {
        done();
      }
    });

    clientSocket.emit('new-game');
  });

  it('should terminate game when all players lost', (done) => {
    clientSocket.on('new-game', (message) => {
      clientSocket.emit('join-game', { id: message.id });
    });

    clientSocket.on('join-game', (message) => {
      clientSocket.emit('start-game', { id: message.id });
    });

    clientSocket.on('start-game', (message) => {
      server.games[message.id].players[`player-${clientSocket.id}`].isAlive = false;
    });

    clientSocket.on('new-state', (message) => {
      expect(message.id).toBe(`game-${clientSocket.id}`);
      expect(message.message).toBe('Game session terminated');
      expect(message.status).toBe(0);
      done();
    });

    clientSocket.emit('new-game');
  });

  it('should not delete players on termination', (done) => {
    clientSocket.on('new-game', (message) => {
      clientSocket.emit('join-game', { id: message.id });
    });

    clientSocket.on('join-game', (message) => {
      clientSocket.emit('start-game', { id: message.id });
    });

    clientSocket.on('start-game', (message) => {
      server.games[message.id].players[`player-${clientSocket.id}`].isAlive = false;
    });

    clientSocket.on('new-state', (message) => {
      expect(Object.values(server.games[message.id].players).length).toBe(1);
      done();
    });

    clientSocket.emit('new-game');
  });
});

describe('On restart game', () => {
  it('should REJECT request if there is no game with specified ID', (done) => {
    const otherClient = clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] });

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherClient.disconnect();
      setTimeout(() => {
        done();
      }, 10);
    }

    otherClient.on('new-game', (message) => {
      clientSocket.emit('join-game', { id: message.id });
    });

    clientSocket.on('join-game', (message) => {
      otherClient.emit('start-game', { id: message.id });
    });

    otherClient.on('start-game', (message) => {
      Object.values(server.games[message.id].players).forEach((player) => player.isAlive = false);
    });

    otherClient.on('new-state', (message) => {
      if (message.message === 'Game session terminated') {
        otherClient.emit('restart-game', { id: 'game-mockId' });
      }
    });

    otherClient.on('restart-game', (message) => {
      expect(message.id).toBeNull();
      expect(message.message).toBe('No such game');
      expect(message.status).toBe(400);
      callbackDisconnect();
    });

    otherClient.emit('new-game');
  });

  it('should REJECT request if current player is not host', (done) => {
    const otherClient = clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] });

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherClient.disconnect();
      setTimeout(() => {
        done();
      }, 10);
    }

    otherClient.on('new-game', (message) => {
      clientSocket.emit('join-game', { id: message.id });
    });

    clientSocket.on('join-game', (message) => {
      otherClient.emit('start-game', { id: message.id });
    });

    otherClient.on('start-game', (message) => {
      Object.values(server.games[message.id].players).forEach((player) => player.isAlive = false);
    });

    clientSocket.on('new-state', (message) => {
      if (message.message === 'Game session terminated') {
        clientSocket.emit('restart-game', { id: message.id });
      }
    });

    clientSocket.on('restart-game', (message) => {
      expect(message.id).toBe(`game-${otherClient.id}`);
      expect(message.message).toBe('You are not host');
      expect(message.status).toBe(400);
      callbackDisconnect();
    });

    otherClient.emit('new-game');
  });

  it('should REJECT request if game is not terminated', (done) => {
    const otherClient = clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] });

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherClient.disconnect();
      setTimeout(() => {
        done();
      }, 10);
    }

    otherClient.on('new-game', (message) => {
      clientSocket.emit('join-game', { id: message.id });
    });

    clientSocket.on('join-game', (message) => {
      otherClient.emit('start-game', { id: message.id });
    });

    otherClient.on('start-game', (message) => {
      otherClient.emit('restart-game', { id: message.id });
    });

    otherClient.on('restart-game', (message) => {
      expect(message.id).toBe(`game-${otherClient.id}`);
      expect(message.message).toBe('Game is still active');
      expect(message.status).toBe(400);
      callbackDisconnect();
    });

    otherClient.emit('new-game');
  });

  it('should ACCEPT otherwise and all players must migrate successfully', (done) => {
    const otherClient = clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] });

    let gameId;
    let clientId;
    let otherClientId;

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherClient.disconnect();
      setTimeout(() => {
        done();
      }, 10);
    }

    otherClient.on('new-game', (message) => {
      clientSocket.emit('join-game', { id: message.id });
    });
    
    clientSocket.on('join-game', (message) => {
      gameId = message.id;
      clientId = `player-${clientSocket.id}`
      otherClientId = `player-${otherClient.id}`;
      otherClient.emit('start-game', { id: message.id });
    });

    otherClient.on('start-game', (message) => {
      Object.values(server.games[message.id].players).forEach((player) => player.isAlive = false);
    });

    otherClient.on('new-state', (message) => {
      if (message.message === 'Game session terminated') {
        otherClient.emit('restart-game', { id: message.id });
      }
    })

    otherClient.on('restart-game', (message) => {
      expect(message.id).toBe(`game-${otherClient.id}`);
      expect(message.message).toBe('Game session restarted successfully');
      expect(message.status).toBe(200);

      let newGameId = message.id;
      let newClientId = server.games[newGameId].players[clientId].id;
      let newOtherClientId = server.games[newGameId].players[otherClientId].id;

      expect(newGameId).toBe(gameId);
      expect(newClientId).toBe(clientId);
      expect(newOtherClientId).toBe(otherClientId);

      callbackDisconnect();
    });

    otherClient.emit('new-game');
  });

  it('should send new states', (done) => {
    const otherClient = clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] });
    let count = 0;

    function callbackDisconnect() {
      clientSocket.disconnect();
      otherClient.disconnect();
      setTimeout(() => {
        done();
      }, 10);
    }

    clientSocket.on('new-game', (message) => {
      otherClient.emit('join-game', { id: message.id });
    });
    
    otherClient.on('join-game', (message) => {
      clientSocket.emit('start-game', { id: message.id });
    });

    clientSocket.on('start-game', (message) => {
      Object.values(server.games[message.id].players).forEach((player) => player.isAlive = false);
    });

    clientSocket.on('new-state', (message) => {
      if (message.message === 'Game session terminated') {
        // console.log(message);
        // console.log(server.games[message.id]);
        // console.log('Are all players dead: ', Object.values(server.games[message.id].players).every((player) => !player.isAlive));
        setTimeout(() => {
          clientSocket.emit('restart-game', { id: message.id });
        }, 1000)
        return;
      }
    })

    clientSocket.on('restart-game', (message) => {
      count += 1;
      console.log(message);
      console.log(server.games[message.id]);
      console.log('Are all players dead: ', Object.values(server.games[message.id].players).every((player) => !player.isAlive));
      if (count === 20) callbackDisconnect();
    });

    clientSocket.emit('new-game');
  });
});

// describe('On player actions', () => {
//   jest.setTimeout(8000);
//   test('should return status 200 first new-state after start game', (done) => {
//     let gameId;
//
//     clientSocket.on('new-game', (message) => {
//       gameId = message.id;
//       clientSocket.emit('join-game', { id: message.id });
//     });
//
//     clientSocket.on('join-game', (message) => {
//       clientSocket.emit('start-game', { id: message.id });
//     });
//
//     clientSocket.on('start-game', (message) => {
//       clientSocket.emit('player-action', {
//         id: gameId,
//         action: 'left',
//       });
//     });
//
//     clientSocket.on('new-state', (message) => {
//       expect(message.status).toBe(200);
//       done();
//     });
//
//     clientSocket.emit('new-game');
//   });
//   test('should return status 200 on \'left\' and \'right\' action', (done) => {
//     let gameId;
//
//     clientSocket.on('new-game', (message) => {
//       gameId = message.id;
//       clientSocket.emit('join-game', { id: message.id });
//     });
//
//     clientSocket.on('join-game', (message) => {
//       clientSocket.emit('start-game', { id: message.id });
//     });
//
//     clientSocket.on('start-game', (message) => {
//       clientSocket.emit('player-action', {
//         id: gameId,
//         action: 'left',
//       });
//       clientSocket.emit('player-action', {
//         id: gameId,
//         action: 'left',
//       });
//     });
//     count = 0;
//     clientSocket.on('new-state', (message) => {
//       expect(message.status).toBe(200);
//       count += 1;
//       if (count === 2) {
//         done();
//       }
//     });
//     clientSocket.emit('new-game');
//   });
//   test('should return status 200 after 10 left turns', (done) => {
//     let gameId;
//
//     clientSocket.on('new-game', (message) => {
//       gameId = message.id;
//       clientSocket.emit('join-game', { id: message.id });
//     });
//
//     clientSocket.on('join-game', (message) => {
//       clientSocket.emit('start-game', { id: message.id });
//     });
//
//     clientSocket.on('start-game', (message) => {
//       for (let i = 0; i < 10; i += 1) {
//         clientSocket.emit('player-action', {
//           id: gameId,
//           action: 'left',
//         });
//       }
//     });
//     count = 0;
//     clientSocket.on('new-state', (message) => {
//       expect(message.status).toBe(200);
//       count += 1;
//       if (count === 10) {
//         done();
//       }
//     });
//     clientSocket.emit('new-game');
//   });
//   test('should return status 400 after send action without permission', (done) => {
//     let gameId;
//
//     clientSocket.on('new-game', (message) => {
//       gameId = message.id;
//       clientSocket.emit('join-game', { id: message.id });
//       clientSocket.emit('quit-game', { id: gameId });
//     });
//
//     clientSocket.on('join-game', (message) => {
//       clientSocket.emit('start-game', { id: message.id });
//     });
//
//     clientSocket.on('start-game', (message) => {
//       clientSocket.emit('player-action', {
//         id: gameId,
//         action: 'left',
//       });
//     });
//     clientSocket.on('player-action', (message) => {
//       expect(message.status).toBe(400);
//       done();
//     });
//     clientSocket.emit('new-game');
//   });
//
//   test('should return new state for all GAYmers after action among his', (done) => {
//     clientSocketTwo = clientIO('ws://127.0.0.1:5000', {
//       transports: ['websocket'],
//     });
//     clientSocketTwo.on('connect', () => {
//       done();
//     });
//     clientSocket.on('new-game', ())
//   })
// });

//  Должно быть ниже всех тестов
describe('On disconnecting', () => {
  it('should remove INACTIVE game WITH NO other players if current player IS HOST', (done) => {
    let gameId;

    function callbackDisconnect() {
      clientSocket.disconnect();
      setTimeout(() => {
        expect(server.games[gameId]).toBeUndefined();
        expect(Object.entries(server.games).length).toBe(0);
        done();
      }, 10);
    }

    clientSocket.on('new-game', (message) => {
      gameId = message.id;
      expect(message.id).toMatch(/game-(.*?)/);
      expect(message.message).toBe('Game created successfully');
      expect(message.status).toBe(200);
      callbackDisconnect();
    });

    clientSocket.emit('new-game');
  });

  it('should remove ACTIVE game WITH NO other players if current player IS HOST', (done) => {
    let gameId;

    function callbackDisconnect() {
      clientSocket.disconnect();
      setTimeout(() => {
        expect(server.games[gameId]).toBeUndefined();
        expect(Object.entries(server.games).length).toBe(0);
        done();
      }, 10);
    }

    clientSocket.on('new-game', (message) => {
      gameId = message.id;
      expect(message.id).toMatch(/game-(.*?)/);
      expect(message.message).toBe('Game created successfully');
      expect(message.status).toBe(200);
      clientSocket.emit('start-game', { id: gameId });
    });

    clientSocket.on('start-game', () => {
      callbackDisconnect();
    });

    clientSocket.emit('new-game');
  });

  it('should remove INACTIVE game WITH other players if current player IS HOST', (done) => {
    let gameId;
    const otherClients = [];

    for (let i = 0; i < Math.floor(Math.random() * 2 + 1); i += 1) {
      otherClients.push(clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] }));
    }

    function callbackDisconnect() {
      clientSocket.disconnect();
      setTimeout(() => {
        expect(server.games[gameId]).toBeUndefined();
        expect(Object.entries(server.games).length).toBe(0);
        done();
      }, 10);
    }

    function callbackJoin() {
      otherClients.forEach((otherClient) => otherClient.emit('join-game', { id: gameId }));
      setTimeout(() => {
        callbackDisconnect();
      }, 10);
    }

    clientSocket.on('new-game', (message) => {
      gameId = message.id;
      expect(message.id).toMatch(/game-(.*?)/);
      expect(message.message).toBe('Game created successfully');
      expect(message.status).toBe(200);
      callbackJoin();
    });

    clientSocket.emit('new-game');
  });

  it('should NOT remove ACTIVE game WITH other players if current player IS HOST', (done) => {
    let gameId;
    const otherClients = [];

    for (let i = 0; i < Math.floor(Math.random() * 2 + 1); i += 1) {
      otherClients.push(clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] }));
    }

    function callbackDisconnect() {
      clientSocket.disconnect();
      setTimeout(() => {
        expect(server.games[gameId]).not.toBeUndefined();
        expect(Object.entries(server.games).length).toBe(1);
        otherClients.forEach((otherClient) => otherClient.disconnect());
        done();
      }, 10);
    }

    function callbackJoin() {
      otherClients.forEach((otherClient) => otherClient.emit('join-game', { id: gameId }));
      setTimeout(() => {
        clientSocket.emit('start-game', { id: gameId });
      }, 10);
    }
    
    clientSocket.on('new-game', (message) => {
      gameId = message.id;
      expect(message.id).toMatch(/game-(.*?)/);
      expect(message.message).toBe('Game created successfully');
      expect(message.status).toBe(200);
      callbackJoin();
    });
    
    clientSocket.on('start-game', () => {
      callbackDisconnect();
    });

    clientSocket.emit('new-game');
  });

  // it('should remove game that has all players disconnected', (done) => {
  //   let gameId;
  //   const otherClients = [];

  //   for (let i = 0; i < Math.floor(Math.random() * 2 + 1); i += 1) {
  //     otherClients.push(clientIO('ws://127.0.0.1:5000', { transports: ['websocket'] }));
  //   }

  //   function callbackDisconnect() {
  //     clientSocket.disconnect();
  //     otherClients.forEach((otherClient) => otherClient.disconnect());
  //     setTimeout(() => {
  //       expect(server.games[gameId]).toBeUndefined();
  //       expect(Object.entries(server.games).length).toBe(0);
  //       done();
  //     }, 10);
  //   }

  //   function callbackJoin() {
  //     otherClients.forEach((otherClient) => otherClient.emit('join-game', { id: gameId }));
  //     setTimeout(() => {
  //       clientSocket.emit('start-game', { id: gameId });
  //     }, 10);
  //   }
    
  //   clientSocket.on('new-game', (message) => {
  //     gameId = message.id;
  //     expect(message.id).toMatch(/game-(.*?)/);
  //     expect(message.message).toBe('Game created successfully');
  //     expect(message.status).toBe(200);
  //     callbackJoin();
  //   });
    
  //   clientSocket.on('start-game', () => {
  //     callbackDisconnect();
  //   });

  //   clientSocket.emit('new-game');
  // });
});
