import React, { useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import styles from './newGame.module.scss';
import { setNewGame } from '../../middleware/storeStateMiddleWare';

// eslint-disable-next-line react/prop-types
const NewGame = ({ dispatchNewGame, game }) => {
  useEffect(() => {
    dispatchNewGame();
  }, []);

  return (
    <div className={styles.container}>
      {game !== '' && <Redirect to={`game/${game}`} />}
    </div>
  );
};
const mapDispatchToProps = {
  dispatchNewGame: setNewGame,
};

const mapStateToProps = (state) => ({
  game: state.game.game,
});

export default connect(mapStateToProps, mapDispatchToProps)(NewGame);
