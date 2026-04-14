import * as React from 'react';
import { defaultCoordinates, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import cx from 'classnames';
import { type CommonButtonProps } from '@showdex/components/ui';
import { type CommonToggleFieldProps } from './Switch';
import styles from './Switch.module.scss';

export interface SwitchHandleProps extends Omit<CommonButtonProps, 'tabIndex'> {
  className?: string;
  style?: React.CSSProperties;
  draggingClassName?: string;
  draggingStyle?: React.CSSProperties;

  /**
   * Only used for accessibility purposes (`aria`).
   *
   * * Should be passed from the parent `Switch` component.
   *
   * @since 1.0.3
   */
  label?: string;

  input?: CommonToggleFieldProps['input'];
  enabledX?: number;
  readOnly?: boolean;
}

export const SwitchHandle = ({
  className,
  style,
  draggingClassName,
  draggingStyle,
  label = 'Switch Handle',
  input,
  enabledX = 0,
  readOnly = false,
  disabled = false,
  onClick,
  onPress,
  ...props
}: SwitchHandleProps): React.JSX.Element => {
  const ref = React.useRef<HTMLButtonElement>(null);

  const handleClick = onClick ?? onPress;
  const interactive = typeof handleClick === 'function' && !readOnly && !disabled;

  const {
    setNodeRef,
    attributes,
    listeners,
    transform = defaultCoordinates,
    isDragging,
  } = useDraggable({
    id: `Switch:${input?.name || '???'}:SwitchHandle:Draggable`,
    attributes: { tabIndex: -1 },
    disabled: readOnly || disabled,
  });

  React.useImperativeHandle(
    setNodeRef,
    () => ref.current,
  );

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label || `${input?.name} Switch Handle`.trim()}
      {...props}
      className={cx(
        styles.handle,
        readOnly && styles.readOnly,
        isDragging && styles.dragging,
        isDragging && draggingClassName,
        className,
      )}
      style={{
        ...style,
        ...(isDragging ? draggingStyle : {}),
        transform: [
          style?.transform,
          isDragging && draggingStyle?.transform,
          CSS.Translate.toString({
            x: Math.min((input?.value ? enabledX : 0) + (transform?.x || 0), enabledX),
            y: 0,
            scaleX: 1,
            scaleY: 1,
          }),
        ].filter(Boolean).join(', ') || undefined,
      }}
      {...attributes}
      {...listeners}
      onClick={interactive ? handleClick : undefined}
    />
  );
};
