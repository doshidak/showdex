import * as React from 'react';
import { animated, useSpring } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import cx from 'classnames';
import {
  type BaseButtonProps,
  type ButtonElement,
  BaseButtonScaleConfig,
  BaseButtonSpringConfig,
} from './BaseButton';
import styles from './BaseButton.module.scss';

export interface DraggableBaseButtonProps extends BaseButtonProps {
  nativeProps?: Omit<React.HTMLAttributes<ButtonElement>, 'dangerouslySetInnerHTML'>;
}

export const DraggableBaseButton = React.forwardRef<ButtonElement, DraggableBaseButtonProps>(({
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
  onClick,
  onPress,
  onHover,
  onContextMenu,
  ...props
}: DraggableBaseButtonProps, forwardedRef: React.ForwardedRef<ButtonElement>): React.JSX.Element => {
  const elementType = display === 'inline' ? 'button' : 'div';
  const ref = React.useRef<ButtonElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
  );

  const handleClick = onClick ?? onPress;

  const [{ scale }, springApi] = useSpring(() => ({
    scale: initScale,
    config: BaseButtonSpringConfig,
  }));

  const {
    onClick: nativeOnClick,
    onMouseDown,
    onMouseUp,
    onPointerDown,
    onPointerUp,
    onKeyDown,
    onKeyUp,
    onDragStart: _onDragStart,
    onDragEnd: _onDragEnd,
    onDrag: _onDrag,
    ...remainingNativeProps
  } = nativeProps || {};

  const bindGestures = useGesture({
    onClick: ({ event }) => (nativeOnClick ?? handleClick)?.(event as unknown as React.MouseEvent<ButtonElement>),

    onMouseDown: ({ event }) => {
      void springApi.start({ scale: activeScale });
      onMouseDown?.(event as unknown as React.MouseEvent<ButtonElement>);
    },

    onMouseUp: ({ event }) => {
      void springApi.start({ scale: initScale });
      onMouseUp?.(event as unknown as React.MouseEvent<ButtonElement>);
    },

    onPointerDown: ({ event }) => {
      void springApi.start({ scale: activeScale });
      onPointerDown?.(event as unknown as React.PointerEvent<ButtonElement>);
    },

    onPointerUp: ({ event }) => {
      void springApi.start({ scale: initScale });
      onPointerUp?.(event as unknown as React.PointerEvent<ButtonElement>);
    },

    onKeyDown: ({ event }) => {
      void springApi.start({ scale: activeScale });
      onKeyDown?.(event as unknown as React.KeyboardEvent<ButtonElement>);
    },

    onKeyUp: ({ event }) => {
      void springApi.start({ scale: initScale });
      onKeyUp?.(event as unknown as React.KeyboardEvent<ButtonElement>);
    },

    onHover: (event) => {
      onHover?.(event);

      if (hoverScale === initScale) {
        return;
      }

      void springApi.start({ scale: event?.hovering ? hoverScale : activeScale });
    },
  }, {
    eventOptions: { passive: true },
    enabled: !disabled,
    drag: { preventDefault: false, filterTaps: true },
  });

  const Component = animated[elementType];

  return (
    <Component
      ref={ref}
      type={elementType === 'button' ? 'button' : undefined}
      role={elementType === 'div' ? 'button' : undefined}
      {...props}
      {...remainingNativeProps}
      {...bindGestures()}
      tabIndex={disabled ? -1 : tabIndex}
      disabled={elementType === 'button' ? disabled : undefined}
      aria-disabled={elementType === 'div' && disabled ? true : undefined}
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
