import {
  SET_LIST_GAME, SET_NEW_GAME, SET_MAP_GAME, SET_PLAYER_ID,
} from '../actions/actionGame';

const initialState = {
  game: '',
  list: [],
  myMap: {},
  otherMap: [],
  playerId: '',
};

const reduserGame = (state = initialState, action) => {
  switch (action.type) {
    case SET_NEW_GAME:
      return { ...state, game: action.data };
    case SET_PLAYER_ID:
      return { ...state, playerId: action.data };
    case SET_MAP_GAME:
      // eslint-disable-next-line no-case-declarations
      const other = action.data.filter((item) => item.id !== state.playerId);
      // eslint-disable-next-line no-case-declarations
      const my = action.data.filter((item) => item.id === state.playerId);
      return { ...state, myMap: my[0], otherMap: other };
      // eslint-disable-next-line no-case-declarations
    case SET_LIST_GAME:
      return { ...state, list: action.data };
    default:
      return state;
  }
};

export default reduserGame;
