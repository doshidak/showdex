import * as React from 'react';
import cx from 'classnames';
import { type BaseButtonProps, type ButtonElement, BaseButton } from '@showdex/components/ui';
import { useColorScheme, useColorTheme } from '@showdex/redux/store';
import styles from './GradientButton.module.scss';

export const GradientButton = React.forwardRef<ButtonElement, BaseButtonProps>(({
  className,
  children,
  ...props
}: BaseButtonProps, forwardedRef): JSX.Element => {
  const colorScheme = useColorScheme();
  const colorTheme = useColorTheme();

  return (
    <BaseButton
      ref={forwardedRef}
      {...props}
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        !!colorTheme && styles[colorTheme],
        className,
      )}
    >
      {children}
    </BaseButton>
  );
});
