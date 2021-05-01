import React, { useEffect } from 'react';

import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import styles from './joinGame.module.scss';
import { setListGame } from '../../middleware/storeStateMiddleWare';

// eslint-disable-next-line react/prop-types,no-unused-vars
const JoinGame = ({ list, dispatchList }) => {
  useEffect(() => {
    // eslint-disable-next-line react/prop-types
    dispatchList();
  }, []);

  return (
    <div className={styles.container}>
      <ul>
        {/* eslint-disable-next-line react/prop-types */}
        {list && list.length && list.map((item) => (<li><NavLink to={`game/${item}`}>{item}</NavLink></li>))}
      </ul>
    </div>
  );
};

const mapDispatchToProps = {
  dispatchList: setListGame,
};

const mapStateToProps = (state) => ({
  list: state.game.list,
});

export default connect(mapStateToProps, mapDispatchToProps)(JoinGame);
