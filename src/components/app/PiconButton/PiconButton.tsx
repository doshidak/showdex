import * as React from 'react';
import cx from 'classnames';
import { Picon } from '@showdex/components/app';
import { BaseButton, Tooltip } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import type { PiconProps } from '@showdex/components/app';
import type { BaseButtonProps, ButtonElement, TooltipProps } from '@showdex/components/ui';
import styles from './PiconButton.module.scss';

export interface PiconButtonProps extends BaseButtonProps {
  piconClassName?: string;
  piconStyle?: React.CSSProperties;
  pokemon?: PiconProps['pokemon'];
  facingLeft?: PiconProps['facingLeft'];
  tooltip?: React.ReactNode;
  tooltipOffset?: TooltipProps['offset'];
  tooltipDelay?: TooltipProps['delay'];
  tooltipTrigger?: TooltipProps['trigger'];
  tooltipTouch?: TooltipProps['touch'];
  tooltipDisabled?: boolean;
  shadow?: boolean;
}

/* eslint-disable react/prop-types -- this rule can't handle props from extended interfaces apparently lmaoo */

export const PiconButton = React.forwardRef<ButtonElement, PiconButtonProps>(({
  className,
  piconClassName,
  piconStyle,
  pokemon,
  facingLeft,
  tooltip,
  tooltipOffset = [0, 5],
  tooltipDelay = [150, 50],
  tooltipTrigger = 'mouseenter',
  tooltipTouch = ['hold', 500],
  tooltipDisabled,
  hoverScale = 1,
  activeScale = 0.95,
  shadow,
  disabled,
  children,
  ...props
}: PiconButtonProps, forwardedRef: React.ForwardedRef<ButtonElement>): JSX.Element => {
  const ref = React.useRef<ButtonElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
  );

  const colorScheme = useColorScheme();

  return (
    <>
      <BaseButton
        ref={ref}
        {...props}
        className={cx(
          styles.container,
          shadow && styles.shadow,
          !!colorScheme && styles[colorScheme],
          className,
        )}
        hoverScale={hoverScale}
        activeScale={activeScale}
        disabled={disabled}
      >
        <Picon
          className={cx(
            styles.picon,
            piconClassName,
          )}
          style={piconStyle}
          pokemon={pokemon}
          facingLeft={facingLeft}
        />

        {children}
      </BaseButton>

      <Tooltip
        reference={ref.current}
        content={tooltip}
        offset={tooltipOffset}
        delay={tooltipDelay}
        trigger={tooltipTrigger}
        touch={tooltipTouch}
        disabled={!tooltip || tooltipDisabled || disabled}
      />
    </>
  );
});

/* eslint-enable react/prop-types */
