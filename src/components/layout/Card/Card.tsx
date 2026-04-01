/**
 * @file `Card.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import cx from 'classnames';
import styles from './Card.module.scss';

export interface CardProps {
  className?: string;
  style?: React.CSSProperties;
  hideBackground?: boolean; // specifically the color (otherwise, kinda hard to override via className's)
  children?: React.ReactNode;
}

/**
 * Not a full-fledged card layout component, but just the styled outside container part LOL
 *
 * @since 1.3.0
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  className,
  style,
  hideBackground,
  children,
}, forwardedRef): React.JSX.Element => (
  <div
    ref={forwardedRef}
    className={cx(
      styles.container,
      !hideBackground && styles.withBackground,
      className,
    )}
    style={style}
    data-showdex-layout="card"
  >
    {children}
  </div>
));

Card.displayName = 'Card';
