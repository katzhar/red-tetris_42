import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './game.module.scss';
import {
  actionGame, getMap, joinGame, startGame,
} from '../../middleware/storeStateMiddleWare';
import Pixel from '../../components/pixel/pixel';
import Copy from '../../common/copy.png';

// eslint-disable-next-line react/prop-types
const Game = ({
  // eslint-disable-next-line react/prop-types
  dispatchJoinGame, dispatchGetMap, dispatchStartGame, game, map,
  // eslint-disable-next-line no-unused-vars,react/prop-types
  dispatchAction, otherMap,
}) => {
  /* eslint-disable */
  const [startGame,setStartGame] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if(id)
    dispatchJoinGame(id);
  },[]);

  useEffect(() => {
    console.log(map);
    if(startGame)
      dispatchGetMap();
  },[map, startGame]);

  useEffect(() =>{
    document.addEventListener("keydown",handleKeyPress);
  },[])

  const handleKeyPress = ({code}) => {
    const ACTION = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'rotate',
      ArrowDown: 'down',
      Space: 'drop',
    }
    if(ACTION[code])
     dispatchAction({id: game, action: ACTION[code]})
  }

  const start = () => {
    dispatchStartGame();
    setStartGame(true);
  }

  return (
    <div className={styles.container}>
      {id === game && !startGame && (<div className={styles.started}>
        <p className={styles.link}>{`http://localhost:5000/game/game-${id}`}</p>
        <CopyToClipboard text={`http://localhost:5000/game/game-${id}`}>
          <img className={styles.copy} src={Copy} alt="copy" />
        </CopyToClipboard>
      <button  className={styles.btn} onClick={start}>START</button>
    </div>)}
      {map && map.isAlive &&
        <div className={styles.map}>
        <div className={styles.containerMap}>
        { map.field && map.field.length && map.field.map((str) => (
          <div className={styles.containerStr}>
            {str.map((color) => <Pixel color={color} />)}
          </div>
        ))}
      </div>
      <div className={styles.containerMap}>
        {map && map.nextPiece && map.nextPiece.map((str) => (
          <div className={styles.containerStr}>
            {str.map((color) => <Pixel color={color} />)}
          </div>
        ))}
      </div>
          <div>
            {otherMap && otherMap.map((itemMap) => (<div className={styles.containerMap}>
                { itemMap && itemMap.field && itemMap.field.length && itemMap.field.map((str) => (
                  <div className={styles.containerStr}>
                    {str.map((color) => <Pixel color={color} />)}
                  </div>
                ))}
              </div>))}
          </div>
    </div>}
    </div>
  );
};

 const mapDispatchToProps = {
  dispatchJoinGame: joinGame,
   dispatchStartGame: startGame,
   dispatchGetMap: getMap,
   dispatchAction: actionGame,
};

const mapStateToProps = (state) => ({
  game: state.game.game,
  map: state.game.myMap,
  otherMap: state.game.otherMap,
});

export default connect(mapStateToProps, mapDispatchToProps)(React.memo
(Game));
