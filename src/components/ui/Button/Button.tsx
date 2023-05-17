import * as React from 'react';
import cx from 'classnames';
import { Tooltip } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import type { TooltipProps } from '@showdex/components/ui';
import type { BaseButtonProps, ButtonElement, ButtonElementType } from './BaseButton';
import { BaseButton } from './BaseButton';
import styles from './Button.module.scss';

export interface ButtonProps<
  T extends ButtonElementType = 'button',
> extends BaseButtonProps<T> {
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  label?: string;
  tooltip?: React.ReactNode;
  tooltipPlacement?: TooltipProps['placement'];
  tooltipOffset?: TooltipProps['offset'];
  tooltipDelay?: TooltipProps['delay'];
  tooltipTrigger?: TooltipProps['trigger'];
  tooltipTouch?: TooltipProps['touch'];
  tooltipDisabled?: boolean;
  highlight?: boolean;
  absoluteHover?: boolean;
  childrenFirst?: boolean;
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
  tooltip,
  tooltipPlacement = 'top',
  tooltipOffset = [0, 10],
  tooltipDelay = [1000, 50],
  tooltipTrigger = 'mouseenter',
  tooltipTouch = ['hold', 500],
  tooltipDisabled,
  highlight,
  absoluteHover,
  childrenFirst,
  disabled,
  children,
  ...props
}: ButtonProps<T>, forwardedRef: React.ForwardedRef<ButtonElement>): JSX.Element => {
  const ref = React.useRef<ButtonElement>(null);
  const colorScheme = useColorScheme();

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
  );

  return (
    <>
      <BaseButton
        ref={ref}
        {...props}
        className={cx(
          styles.container,
          !!colorScheme && styles[colorScheme],
          highlight && styles.highlight,
          absoluteHover && styles.absoluteHover,
          disabled && styles.disabled,
          className,
        )}
        aria-label={label}
        disabled={disabled}
      >
        {childrenFirst && children}

        {
          !!label &&
          <label
            className={cx(styles.label, labelClassName)}
            style={labelStyle}
          >
            {label}
          </label>
        }

        {!childrenFirst && children}
      </BaseButton>

      <Tooltip
        reference={ref}
        content={tooltip}
        placement={tooltipPlacement}
        offset={tooltipOffset}
        delay={tooltipDelay}
        trigger={tooltipTrigger}
        touch={tooltipTouch}
        disabled={disabled || tooltipDisabled || !tooltip}
      />
    </>
  );
});

/* eslint-enable react/prop-types */
/* eslint-enable @typescript-eslint/indent */
