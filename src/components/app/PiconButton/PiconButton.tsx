import * as React from 'react';
import cx from 'classnames';
import {
  type BaseButtonProps,
  type ButtonElement,
  type DraggableBaseButtonProps,
  type TooltipProps,
  BaseButton,
  DraggableBaseButton,
  Tooltip,
} from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import { type PiconProps, Picon } from '../Picon';
import styles from './PiconButton.module.scss';

export interface PiconButtonProps extends BaseButtonProps {
  piconClassName?: string;
  piconStyle?: React.CSSProperties;
  pokemon?: PiconProps['pokemon'];
  facingLeft?: PiconProps['facingLeft'];
  tooltip?: React.ReactNode;
  tooltipPlacement?: TooltipProps['placement'];
  tooltipOffset?: TooltipProps['offset'];
  tooltipDelay?: TooltipProps['delay'];
  tooltipTrigger?: TooltipProps['trigger'];
  tooltipTouch?: TooltipProps['touch'];
  tooltipDisabled?: boolean;
  shadow?: boolean;
  draggable?: boolean;
  nativeProps?: DraggableBaseButtonProps['nativeProps'];
}

/* eslint-disable react/prop-types -- this rule can't handle props from extended interfaces apparently lmaoo */

export const PiconButton = React.forwardRef<ButtonElement, PiconButtonProps>(({
  className,
  piconClassName,
  piconStyle,
  pokemon,
  facingLeft,
  tooltip,
  tooltipPlacement = 'auto',
  tooltipOffset = [0, 5],
  tooltipDelay = [150, 50],
  tooltipTrigger = 'mouseenter',
  tooltipTouch = ['hold', 500],
  tooltipDisabled,
  hoverScale = 1,
  activeScale = 0.95,
  shadow,
  draggable,
  nativeProps,
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
  const ButtonComponent = draggable ? DraggableBaseButton : BaseButton;

  return (
    <>
      <ButtonComponent
        ref={ref}
        {...props}
        {...(draggable && { nativeProps })}
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
      </ButtonComponent>

      <Tooltip
        reference={ref.current}
        content={tooltip}
        placement={tooltipPlacement}
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
