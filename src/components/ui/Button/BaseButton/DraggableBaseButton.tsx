import * as React from 'react';
import { useButton } from '@react-aria/button';
import { animated, useSpring } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import cx from 'classnames';
import {
  type BaseButtonProps,
  type ButtonAria,
  type ButtonElement,
  type ButtonElementType,
  BaseButtonScaleConfig,
  BaseButtonSpringConfig,
} from './BaseButton';
import styles from './BaseButton.module.scss';

export interface DraggableBaseButtonProps<
  T extends ButtonElementType = 'button',
> extends BaseButtonProps<T> {
  nativeProps?: Omit<React.HTMLAttributes<ButtonElement>, 'dangerouslySetInnerHTML'>;
}

/* eslint-disable @typescript-eslint/indent */

export const DraggableBaseButton = React.forwardRef<ButtonElement, DraggableBaseButtonProps>(<
  T extends ButtonElementType = 'button',
>({
  className,
  style,
  display = 'inline',
  tabIndex = 0,
  initScale = BaseButtonScaleConfig.init,
  hoverScale = BaseButtonScaleConfig.hover,
  activeScale = BaseButtonScaleConfig.active,
  nativeProps,
  disabled,
  children,
  onHover,
  onContextMenu,
  ...props
}: DraggableBaseButtonProps<T>, forwardedRef: React.ForwardedRef<ButtonElement>): JSX.Element => {
  const elementType = display === 'inline' ? 'button' : 'div';
  const ref = React.useRef<ButtonElement>(null);

  const { buttonProps } = useButton({
    ...props,
    elementType,
    isDisabled: disabled,
  }, ref) as ButtonAria<ButtonElement>;

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
  );

  const [{ scale }, springApi] = useSpring(() => ({
    scale: initScale,
    config: BaseButtonSpringConfig,
  }));

  const {
    onClick,
    onMouseDown,
    onMouseUp,
    onPointerDown,
    onPointerUp,
    onKeyDown,
    onKeyUp,
    onDragStart,
    onDragEnd,
    onDrag,
    ...remainingNativeProps
  } = nativeProps || {};

  const bindGestures = useGesture({
    onClick: ({ event }) => onClick?.(event as unknown as React.MouseEvent<ButtonElement>),

    onMouseDown: ({ event }) => {
      springApi.start({ scale: activeScale });
      onMouseDown?.(event as unknown as React.MouseEvent<ButtonElement>);
    },

    onMouseUp: ({ event }) => {
      springApi.start({ scale: initScale });
      onMouseUp?.(event as unknown as React.MouseEvent<ButtonElement>);
    },

    onPointerDown: ({ event }) => {
      springApi.start({ scale: activeScale });
      onPointerDown?.(event as unknown as React.PointerEvent<ButtonElement>);
    },

    onPointerUp: ({ event }) => {
      springApi.start({ scale: initScale });
      onPointerUp?.(event as unknown as React.PointerEvent<ButtonElement>);
    },

    onKeyDown: ({ event }) => {
      springApi.start({ scale: activeScale });
      onKeyDown?.(event as unknown as React.KeyboardEvent<ButtonElement>);
    },

    onKeyUp: ({ event }) => {
      springApi.start({ scale: initScale });
      onKeyUp?.(event as unknown as React.KeyboardEvent<ButtonElement>);
    },

    /*
    onDragStart: ({ event }) => onDragStart?.(event as unknown as React.DragEvent<ButtonElement>),
    onDragEnd: ({ event }) => onDragEnd?.(event as unknown as React.DragEvent<ButtonElement>),

    onDrag: ({ active, event }) => {
      if (activeScale !== initScale) {
        springApi.start({ scale: active ? activeScale : initScale });
      }

      onDrag?.(event as unknown as React.DragEvent<ButtonElement>);
    },
    */

    onHover: (event) => {
      onHover?.(event);

      if (hoverScale === initScale) {
        return;
      }

      springApi.start({ scale: event?.hovering ? hoverScale : activeScale });
    },
  }, {
    // target: ref,
    eventOptions: { passive: true },
    enabled: !disabled,
    drag: { preventDefault: false, filterTaps: true },
    // hover: { preventDefault: true, filterTaps: true },
  });

  const Component = animated[elementType];

  return (
    <Component
      ref={ref}
      {...buttonProps}
      {...remainingNativeProps}
      {...bindGestures()}
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

/* eslint-enable @typescript-eslint/indent */
