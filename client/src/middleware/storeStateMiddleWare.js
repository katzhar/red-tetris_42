import socketIOClient from 'socket.io-client';
import handleErrors from '../utils/handleErrors';
import {
  setGame, setList, setMap, setPlayer,
} from '../store/actions/actionGame';

const socket = socketIOClient();

export const setNewGame = () => (dispatch) => {
  socket.on('new-game', (res) => {
    if (res.status !== 200) handleErrors(res);
    dispatch(setGame(res.id));
    const id = res.id.slice(5);
    const player = `player-${id}`;
    dispatch(setPlayer(player));
    socket.off('new-game');
  });
  socket.emit('new-game');
};

export const setListGame = () => (dispatch) => {
  socket.on('list-games', (res) => {
    dispatch(setList(res.data));
  });
  socket.emit('list-games');
};

// eslint-disable-next-line no-unused-vars
export const joinGame = (id) => (dispatch) => {
  socket.on('join-game', (res) => {
    console.log('join', res);
    if (res.status === 200) { dispatch(setPlayer(res.playerId)); }
    // id: "game-2y3PSr0iqVtmVp4nAAAB"
    // message: "Joined game session successfully"
    // playerId: "player-rHRTqE1MljOEnWglAAAH"
    // status: 200
  });
  socket.emit('join-game', { id });
};

// eslint-disable-next-line no-unused-vars
export const getMap = () => (dispatch) => {
  socket.on('new-state', (message) => {
    if (message.status === 200) {
      // console.log(message);
      dispatch(setMap(message.states));
    } else handleErrors(message);
  });
};
// eslint-disable-next-line no-unused-vars
export const startGame = () => (dispatch) => {
  socket.on('start-game', (res) => {
    console.log('start', res);
  });
  socket.emit('start-game');
};

// eslint-disable-next-line no-unused-vars
export const actionGame = ({ id, action }) => (dispatch) => {
  socket.on('player-action', (res) => {
    console.log(res);
    if (res.status !== 200) { handleErrors(res); }
  });
  socket.emit('player-action', { id, action });
};
