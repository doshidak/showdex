import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/redux/store';
import { type ButtonElement, type ButtonProps, Button } from '../Button';
import styles from './ToggleButton.module.scss';

export interface ToggleButtonProps extends Omit<ButtonProps, 'display'> {
  activeClassName?: string;
  forceColorScheme?: Showdown.ColorScheme;
  primary?: boolean;
  active?: boolean;
}

export const ToggleButton = React.forwardRef<ButtonElement, ToggleButtonProps>(({
  className,
  activeClassName,
  labelClassName,
  forceColorScheme,
  absoluteHover,
  primary,
  active,
  hoverScale = 1,
  children,
  ...props
}: ToggleButtonProps, forwardedRef): JSX.Element => {
  const currentColorScheme = useColorScheme();
  const colorScheme = forceColorScheme || currentColorScheme;

  return (
    <Button
      ref={forwardedRef}
      {...props}
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        primary && styles.primary,
        active && styles.active,
        className,
        active && activeClassName,
      )}
      labelClassName={cx(
        styles.label,
        labelClassName,
      )}
      forceColorScheme={forceColorScheme}
      display="inline"
      absoluteHover={!primary && absoluteHover}
      hoverScale={hoverScale}
    >
      {children}
    </Button>
  );
});
