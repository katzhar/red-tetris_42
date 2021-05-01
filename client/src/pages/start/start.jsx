import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './start.module.scss';

const Start = () =>
  /* eslint-disable */
   (
    <div className={styles.container}>
      <NavLink className={styles.link} to='/joingame'>Join game</NavLink>
      <NavLink className={styles.link} to='/newgame'>New game</NavLink>
    </div>
  )
;

export default Start;
