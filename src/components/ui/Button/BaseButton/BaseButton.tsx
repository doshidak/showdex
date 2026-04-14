import * as React from 'react';
import { type AnimatedProps, animated, useSpring } from '@react-spring/web';
import { type Handler as GestureHandler, useGesture } from '@use-gesture/react';
import cx from 'classnames';
import styles from './BaseButton.module.scss';

export type ButtonElement = HTMLButtonElement & HTMLDivElement;
export type ButtonElementType = Extract<React.ElementType, 'button' | 'div'>;

export interface CommonButtonProps extends React.AriaAttributes {
  className?: string;
  style?: React.CSSProperties;

  /**
   * `'inline'` renders `<button>`, `'block'` renders `<div>`.
   *
   * @default
   * ```ts
   * 'inline'
   * ```
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
   * Click handler. Takes precedence over `onPress` if both are provided.
   *
   * @since 0.1.0
   */
  onClick?: React.MouseEventHandler<ButtonElement>;

  /**
   * Alias for `onClick`. Exists for legacy RN-style compat.
   * Ignored if `onClick` is also provided.
   *
   * @since 1.2.0
   */
  onPress?: React.MouseEventHandler<ButtonElement>;

  /**
   * Optional callback to trigger when the user invokes the context menu.
   *
   * @since 1.2.3
   */
  onContextMenu?: (event: React.MouseEvent<ButtonElement>) => void;
}

export interface BaseButtonProps extends Omit<CommonButtonProps, 'style'> {
  style?: AnimatedProps<{ style: React.CSSProperties; }>['style'];
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

export const BaseButton = React.forwardRef<ButtonElement, BaseButtonProps>(({
  className,
  style,
  display = 'inline',
  tabIndex = 0,
  initScale = BaseButtonScaleConfig.init,
  hoverScale = BaseButtonScaleConfig.hover,
  activeScale = BaseButtonScaleConfig.active,
  disabled,
  children,
  onClick,
  onPress,
  onHover,
  onContextMenu,
  ...props
}: BaseButtonProps, forwardedRef: React.ForwardedRef<ButtonElement>): React.JSX.Element => {
  const elementType = display === 'inline' ? 'button' : 'div';
  const ref = React.useRef<ButtonElement>(null);

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

      void springApi.start({
        scale: event?.hovering ? hoverScale : activeScale,
      });
    },
  }, {
    target: ref,
    eventOptions: { passive: true },
    enabled: !disabled,
  });

  const Component = animated[elementType];
  const handleClick = (!disabled && (onClick || onPress)) || null;

  return (
    <Component
      ref={ref}
      {...props}
      tabIndex={disabled ? -1 : tabIndex}
      className={cx(
        styles.container,
        disabled && styles.disabled,
        className,
      )}
      {...(elementType === 'button' ? {
        ...(typeof disabled === 'boolean' && { disabled }),
      } : {
        role: 'button',
        ...(typeof disabled === 'boolean' && { 'aria-disabled': disabled }),
      })}
      style={{ ...style, scale }}
      {...(typeof handleClick === 'function' && { onClick: handleClick })}
      {...(typeof onContextMenu === 'function' && { onContextMenu })}
    >
      {children}
    </Component>
  );
});
