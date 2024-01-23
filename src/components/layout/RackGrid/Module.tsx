import * as React from 'react';
import { type AnimatedProps, animated } from '@react-spring/web';
import cx from 'classnames';
import styles from './Module.module.scss';

export interface ModuleProps extends Omit<React.ComponentPropsWithRef<'div'>, 'style'> {
  className?: string;
  style?: AnimatedProps<{ style: React.CSSProperties; }>['style'];
  w?: number;
  h?: number;
  sizeManually?: boolean;
  children: React.ReactNode;
}

/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

export const Module = React.forwardRef<HTMLDivElement, ModuleProps>(({
  className,
  style,
  w = 1,
  h = 1,
  sizeManually,
  children,
  ...props
}: ModuleProps, forwardedRef): JSX.Element => (
  <animated.div
    ref={forwardedRef}
    {...props}
    className={cx(styles.container, className)}
    style={{
      ...style,
      ...(!sizeManually && { gridArea: `span ${h} / span ${w}` }),
    }}
  >
    {children}
  </animated.div>
));
