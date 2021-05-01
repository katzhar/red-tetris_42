import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleWare from 'redux-thunk';
/* eslint-disable */
import { composeWithDevTools } from 'redux-devtools-extension';
import reduserGame from './redusers/reduserGame';

const rootReducers = combineReducers({
  game: reduserGame,
});
const enhancer = composeWithDevTools(
  applyMiddleware(thunkMiddleWare),
);

export default createStore(rootReducers, enhancer);
