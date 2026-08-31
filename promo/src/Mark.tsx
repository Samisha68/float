import React from 'react';

/**
 * Float — The Ascending Arcade.
 * Same geometry as docs/brand/float-mark.svg. No base, by design.
 */
export const Mark: React.FC<{width: number; color?: string}> = ({
  width,
  color = '#FFFFFF',
}) => {
  const height = (width * 74) / 130;
  return (
    <svg width={width} height={height} viewBox="2 18 130 74">
      <g fill={color}>
        <path
          fillRule="evenodd"
          d="M8,88 V56 H54 V42 H90 V28 H126 V88 Z
             M18,88 V77 A13,13 0 0 1 44,77 V88 Z
             M54,88 V63 A13,13 0 0 1 80,63 V88 Z
             M90,88 V49 A13,13 0 0 1 116,49 V88 Z"
        />
        <rect x="4" y="50" width="54" height="7" />
        <rect x="50" y="36" width="44" height="7" />
        <rect x="86" y="22" width="44" height="7" />
      </g>
    </svg>
  );
};
