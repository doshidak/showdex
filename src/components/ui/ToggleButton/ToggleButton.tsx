import * as React from 'react';
import cx from 'classnames';
import { Button } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import type { ButtonElement, ButtonProps } from '@showdex/components/ui';
import styles from './ToggleButton.module.scss';

export interface ToggleButtonProps extends Omit<ButtonProps, 'display'> {
  activeClassName?: string;
  primary?: boolean;
  active?: boolean;
}

export const ToggleButton = React.forwardRef<ButtonElement, ToggleButtonProps>(({
  className,
  activeClassName,
  // labelClassName,
  absoluteHover,
  primary,
  active,
  hoverScale = 1.015,
  ...props
}: ToggleButtonProps, forwardedRef): JSX.Element => {
  const colorScheme = useColorScheme();

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
      // labelClassName={cx(
      //   styles.label,
      //   labelClassName,
      // )}
      display="inline"
      absoluteHover={!primary && absoluteHover}
      hoverScale={hoverScale}
    />
  );
});
