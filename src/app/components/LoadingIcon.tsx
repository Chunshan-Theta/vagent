import React, { useMemo } from 'react';
import './LoadingIcon.scss'; // Assuming the CSS is in the same directory

type LoadingIconProps = {
  color?: string;
  size?: number | string; // Size in pixels
}

const LoadingIcon: React.FC = (props: LoadingIconProps = {}) => {
  const color = props.color || '#236a78';
  const size = props.size || 40; // Default size

  const sizeText = useMemo(() => {
    return typeof size === 'number' ? `${size}px` : size;
  }, [size]);

  const style = {
    borderColor: color,
    width: sizeText,
    height: sizeText,
  }

  return (
    <div className="vsc-loading-icon" aria-label="Loading" style={style}></div>
  );
};

export default LoadingIcon;