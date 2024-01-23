import * as React from 'react';
import { type AriaButtonProps } from '@react-types/button';
import { type ButtonAria as ButtonAriaInterface, useButton } from '@react-aria/button';
import { type AnimatedProps, animated, useSpring } from '@react-spring/web';
import { type Handler as GestureHandler, useGesture } from '@use-gesture/react';
import cx from 'classnames';
import styles from './BaseButton.module.scss';

export type ButtonElement = HTMLButtonElement & HTMLDivElement;
export type ButtonElementType = Extract<React.ElementType, 'button' | 'div'>;

export interface ButtonAria<
  T extends HTMLButtonElement = ButtonElement,
> extends Omit<ButtonAriaInterface<T>, 'buttonProps'> {
  buttonProps: Omit<React.HTMLAttributes<T>, 'dangerouslySetInnerHTML'>;
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
   * @since 0.1.0
   */
  display?: 'inline' | 'block';

  /**
   * Tab index of the button.
   *
   * * Set the value to `-1` to disable button focusing.
   *
   * @default 0
   * @since 0.1.0
   */
  tabIndex?: number;

  /**
   * Whether the button is disabled.
   *
   * @default false
   * @since 0.1.0
   */
  disabled?: boolean;

  /**
   * Optional callback to trigger when the user invokes the context menu.
   *
   * @since 1.2.3
   */
  onContextMenu?: (event: React.MouseEvent<ButtonElement>) => void;
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
  onHover?: GestureHandler<'hover', PointerEvent>;
}

export type SpringConfig = Record<string, unknown>;
export type SpringProps = Record<string, unknown>;

export const BaseButtonSpringConfig: SpringConfig = {
  mass: 1,
  tension: 200,
  friction: 8,
};

export const BaseButtonScaleConfig: Record<'init' | 'hover' | 'active', number> = {
  init: 1,
  hover: 1.025,
  active: 0.95,
};

/* eslint-disable react/prop-types -- this rule is hard tripping rn */

export const BaseButton = React.forwardRef<ButtonElement, BaseButtonProps>(<
  T extends ButtonElementType = 'button',
>({
  className,
  style,
  display = 'inline',
  tabIndex = 0,
  initScale = BaseButtonScaleConfig.init,
  hoverScale = BaseButtonScaleConfig.hover,
  activeScale = BaseButtonScaleConfig.active,
  disabled,
  children,
  onHover,
  onContextMenu,
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
    config: BaseButtonSpringConfig,
  }));

  useGesture({
    onDrag: ({ active }) => (
      activeScale !== initScale
        ? springApi.start({ scale: active ? activeScale : initScale })
        : null
    ),

    onHover: (event) => {
      onHover?.(event);

      if (hoverScale === initScale) {
        return;
      }

      springApi.start({
        scale: event?.hovering ? hoverScale : activeScale,
      });
    },
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
      onContextMenu={onContextMenu}
    >
      {children}
    </Component>
  );
});

/* eslint-enable react/prop-types */
/* eslint-enable @typescript-eslint/indent */
