import React from 'react';
import PropTypes from 'prop-types';
import styles from './pixel.module.scss';

const Pixel = ({ color }) => (
  <div className={color === 0 ? styles.wrapperPixel : styles.wrapperPixelBlack}>
    <div className={color === 0 ? styles.pixel : styles.pixelBlack} />
  </div>
);

export default Pixel;

Pixel.propTypes = {
  color: PropTypes.number,
};

Pixel.defaultProps = {
  color: 0,
};
