import * as React from 'react';
import cx from 'classnames';
import type { BaseButtonProps, ButtonElement, ButtonElementType } from './BaseButton';
import { BaseButton } from './BaseButton';
import styles from './Button.module.scss';

interface ButtonProps<
  T extends ButtonElementType = 'button',
> extends Omit<BaseButtonProps<T>, 'children'> {
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  label?: string;
  absoluteHover?: boolean;
}

/* eslint-disable @typescript-eslint/indent -- this rule is broken af. see Issue #1824 in the typescript-eslint GitHub repo. */
/* eslint-disable react/prop-types */

export const Button = React.forwardRef<ButtonElement, ButtonProps>(<
  T extends ButtonElementType = 'button',
>({
  className,
  labelClassName,
  labelStyle,
  label,
  absoluteHover,
  disabled,
  ...props
}: ButtonProps<T>, forwardedRef: React.ForwardedRef<ButtonElement>): JSX.Element => (
  <BaseButton
    ref={forwardedRef}
    {...props}
    className={cx(
      styles.container,
      absoluteHover && styles.absoluteHover,
      disabled && styles.disabled,
      className,
    )}
    aria-label={label}
    disabled={disabled}
  >
    <label
      className={cx(styles.label, labelClassName)}
      style={labelStyle}
    >
      {label}
    </label>
  </BaseButton>
));

/* eslint-enable react/prop-types */
/* eslint-enable @typescript-eslint/indent */
