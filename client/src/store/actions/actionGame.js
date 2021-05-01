export const SET_NEW_GAME = 'SET_NEW_GAME';
export const SET_LIST_GAME = 'SET_LIST_GAME';
export const SET_MAP_GAME = 'SET_MAP_GAME';
export const SET_PLAYER_ID = 'SET_PLAYER_ID';

export const setList = (data) => ({ type: SET_LIST_GAME, data });
export const setGame = (data) => ({ type: SET_NEW_GAME, data });
export const setMap = (data) => ({ type: SET_MAP_GAME, data });
export const setPlayer = (data) => ({ type: SET_PLAYER_ID, data });
