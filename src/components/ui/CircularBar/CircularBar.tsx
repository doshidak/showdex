import * as React from 'react';
import cx from 'classnames';
import { clamp } from '@showdex/utils/core';
import { CircularBarPath } from './CircularBarPath';
import styles from './CircularBar.module.scss';

export interface CircularBarProps {
  className?: string;
  style?: React.CSSProperties;
  pathArcClassName?: string;
  valueArcClassName?: string;
  description?: string;
  value?: number;
  min?: number;
  max?: number;
  strokeWidth?: number;
  pathStrokeWidth?: number;
  valueStrokeWidth?: number;
  reverse?: boolean;
}

/**
 * Circular progress bar, based off of `kevinsqi/react-circular-progressbar`.
 *
 * * Rewritten as a React functional component.
 * * Some minor tweaks like additional props.
 * * Unlike `CircularProgressbarWithChildren`, this does not accept any `children`.
 *   - Don't fret!
 *   - Just slap this baby in a `flex` container with some absolutely positioned text and enjoy.
 *   - (Obviously don't forget to also set that flex container's `position` as `'relative'`!)
 * * Even though the viewbox is 100x100, through the magic of SVG, this scales to its container!
 * * Fun fact: this was imported from our oldge & dedge Tize.io v2 project (rip).
 *   - Least it's going to good use c:
 *
 * @see https://github.com/kevinsqi/react-circular-progressbar
 * @since 1.2.0
 */
export const CircularBar = React.forwardRef<SVGSVGElement, CircularBarProps>(({
  className,
  style,
  pathArcClassName,
  valueArcClassName,
  description,
  value,
  min = 0,
  max = 1,
  strokeWidth = 8,
  pathStrokeWidth,
  valueStrokeWidth,
  reverse,
}: CircularBarProps, forwardedRef): JSX.Element => {
  const boundedValue = clamp(min, value, max);
  const valuePercentage = (boundedValue - min) / (max - min);

  const radius = (width: number) => 50 - (width / 2);

  return (
    <svg
      ref={forwardedRef}
      className={cx(styles.container, className)}
      style={style}
      viewBox="0 0 100 100"
    >
      {
        !!description &&
        <desc>{description}</desc>
      }

      <CircularBarPath
        className={cx(styles.pathArc, pathArcClassName)}
        arcPercentage={1}
        radius={radius(pathStrokeWidth || strokeWidth)}
        strokeWidth={pathStrokeWidth || strokeWidth}
        reverse={reverse}
      />

      <CircularBarPath
        className={cx(styles.valueArc, valueArcClassName)}
        arcPercentage={valuePercentage}
        radius={radius(valueStrokeWidth || strokeWidth)}
        strokeWidth={valueStrokeWidth || strokeWidth}
        reverse={reverse}
      />
    </svg>
  );
});
