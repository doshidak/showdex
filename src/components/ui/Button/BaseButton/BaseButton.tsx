import * as React from 'react';
import { type AriaButtonProps } from '@react-types/button';
import { type ButtonAria as ButtonAriaInterface, useButton } from '@react-aria/button';
import { type AnimatedProps, animated, useSpring } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import cx from 'classnames';
import styles from './BaseButton.module.scss';

export type ButtonElement = HTMLButtonElement & HTMLDivElement;
export type ButtonElementType = Extract<React.ElementType, 'button' | 'div'>;

export interface ButtonAria<
  T extends HTMLButtonElement = ButtonElement,
> extends Omit<ButtonAriaInterface<T>, 'buttonProps'> {
  buttonProps: React.HTMLAttributes<T>;
}

export interface CommonButtonProps<
  T extends ButtonElementType = 'button',
> extends Omit<AriaButtonProps<T>, 'elementType' | 'isDisabled'> {
  className?: string;
  style?: React.CSSProperties;

  /**
   * `'inline'` renders `<button>`, `'block'` renders `<div>`.
   *
   * @default 'inline'
   */
  display?: 'inline' | 'block';

  /**
   * Tab index of the button.
   *
   * * Set the value to `-1` to disable button focusing.
   *
   * @default 0
   */
  tabIndex?: number;

  /**
   * Whether the button is disabled.
   *
   * @default false
   */
  disabled?: boolean;

  /**
   * Optional callback to trigger when the user invokes the context menu.
   */
  // onContextMenu?: (event: TriggerEvent) => void;
}

/* eslint-disable @typescript-eslint/indent -- this rule is broken af. see Issue #1824 in the typescript-eslint GitHub repo. */

export interface BaseButtonProps<
  T extends ButtonElementType = 'button',
> extends Omit<CommonButtonProps<T>, 'style'> {
  style?: AnimatedProps<CommonButtonProps<T>>['style'];

  initScale?: number;
  hoverScale?: number;
  activeScale?: number;

  children?: React.ReactNode;
}

export type SpringConfig = Record<string, unknown>;
export type SpringProps = Record<string, unknown>;

const springConfig: SpringConfig = {
  mass: 1,
  tension: 200,
  friction: 8,
};

/* eslint-disable react/prop-types -- this rule is hard tripping rn */

export const BaseButton = React.forwardRef<ButtonElement, BaseButtonProps>(<
  T extends ButtonElementType = 'button',
>({
  className,
  style,
  display = 'inline',
  tabIndex = 0,
  initScale = 1,
  hoverScale = 1.025,
  activeScale = 0.95,
  disabled,
  children,
  ...props
}: BaseButtonProps<T>, forwardedRef: React.ForwardedRef<ButtonElement>): JSX.Element => {
  const elementType = display === 'inline' ? 'button' : 'div';
  const ref = React.useRef<ButtonElement>(null);

  const { buttonProps } = useButton({
    ...props,
    elementType,
    isDisabled: disabled,
    // children,
  }, ref) as ButtonAria<ButtonElement>;

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
  );

  const [{ scale }, springApi] = useSpring(() => ({
    scale: initScale,
    config: springConfig,
  }));

  useGesture({
    onDrag: ({ active }) => (activeScale !== initScale ? springApi.start({ scale: active ? activeScale : initScale }) : null),
    onHover: ({ hovering }) => (hoverScale !== initScale ? springApi.start({ scale: hovering ? hoverScale : initScale }) : null),
  }, {
    target: ref,
    eventOptions: { passive: true },
    enabled: !disabled,
    // drag: { preventDefault: true, filterTaps: true },
    // hover: { preventDefault: true, filterTaps: true },
  });

  const Component = animated[elementType];

  return (
    <Component
      ref={ref}
      {...buttonProps}
      tabIndex={disabled ? -1 : tabIndex}
      className={cx(
        styles.container,
        disabled && styles.disabled,
        className,
      )}
      style={{ ...style, scale }}
    >
      {children}
    </Component>
  );
});

/* eslint-enable react/prop-types */
/* eslint-enable @typescript-eslint/indent */
