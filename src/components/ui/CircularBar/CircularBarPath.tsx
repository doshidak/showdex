import * as React from 'react';

export interface CircularBarPathProps {
  className?: string;
  style?: React.CSSProperties;
  arcPercentage: number;
  radius: number;
  strokeWidth: number;
  reverse?: boolean;
}

/**
 * SVG path for the circle.
 *
 * * Based off of `src/Path.tsx` from `kevinsqi/react-circular-progressbar`.
 *
 * @see https://github.com/kevinsqi/react-circular-progressbar/blob/master/src/Path.tsx
 * @since 1.2.0
 */
export const CircularBarPath = ({
  className,
  style,
  arcPercentage,
  radius,
  strokeWidth,
  reverse,
}: CircularBarPathProps): JSX.Element => {
  const circumference = 2 * Math.PI * radius;
  const arcLength = (1 - arcPercentage) * circumference;

  const rotation = reverse ? 1 : 0;

  return (
    <path
      className={className}
      style={{
        ...style,

        // first number = dash length, second number = gap length
        strokeDasharray: `${circumference} ${circumference}`,

        // shift the dash back by the arcLength
        strokeDashoffset: (reverse ? -1 : 1) * arcLength,
      }}
      d={[ // path description
        // move to center of canvas
        'M 50,50',

        // move to top center of canvas, relative to the center
        `m 0,-${radius}`,

        // draw bottom half of arc
        `a ${radius},${radius} ${rotation} 1 1 0,${2 * radius}`,

        // draw top half of arc
        `a ${radius},${radius} ${rotation} 1 1 0,-${2 * radius}`,
      ].join(' ')}
      strokeWidth={strokeWidth}
      fillOpacity={0}
    />
  );
};
