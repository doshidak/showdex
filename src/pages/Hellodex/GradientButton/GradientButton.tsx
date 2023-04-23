import * as React from 'react';
import cx from 'classnames';
import { BaseButton } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import type { BaseButtonProps, ButtonElement } from '@showdex/components/ui';
import styles from './GradientButton.module.scss';

export const GradientButton = React.forwardRef<ButtonElement, BaseButtonProps>(({
  className,
  children,
  ...props
}: BaseButtonProps, forwardedRef): JSX.Element => {
  const colorScheme = useColorScheme();

  return (
    <BaseButton
      ref={forwardedRef}
      {...props}
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
    >
      {children}
    </BaseButton>
  );
});
