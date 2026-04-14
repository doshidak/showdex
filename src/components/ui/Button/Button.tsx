import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/redux/store';
import { type TooltipProps, Tooltip } from '../Tooltip';
import {
  type BaseButtonProps,
  type ButtonElement,
  BaseButton,
} from './BaseButton';
import styles from './Button.module.scss';

export interface ButtonProps extends BaseButtonProps {
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  forceColorScheme?: Showdown.ColorScheme;
  label?: string;
  hideLabel?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
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

export const Button = React.forwardRef<ButtonElement, ButtonProps>(({
  className,
  labelClassName,
  labelStyle,
  forceColorScheme,
  label,
  hideLabel,
  prefix,
  suffix,
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
}: ButtonProps, forwardedRef: React.ForwardedRef<ButtonElement>): React.JSX.Element => {
  const ref = React.useRef<ButtonElement>(null);

  const currentColorScheme = useColorScheme();
  const colorScheme = forceColorScheme || currentColorScheme;

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
  );

  const childrenLabel = typeof children === 'string' && !!children && !label;

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
        {!childrenLabel && childrenFirst && children}

        {prefix}

        {
          ((!!label || childrenLabel) && !hideLabel) &&
          <span
            className={cx(styles.label, labelClassName)}
            style={labelStyle}
          >
            {label || childrenLabel}
          </span>
        }

        {suffix}

        {!childrenLabel && !childrenFirst && children}
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
