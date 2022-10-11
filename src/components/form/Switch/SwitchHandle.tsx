import * as React from 'react';
import { useButton } from '@react-aria/button';
import { defaultCoordinates, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import cx from 'classnames';
import type { ButtonAria, CommonButtonProps } from '@showdex/components/ui';
import type { CommonToggleFieldProps } from './Switch';
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
  onPress,
  ...props
}: SwitchHandleProps): JSX.Element => {
  const ref = React.useRef<HTMLButtonElement>(null);

  const { buttonProps } = useButton({
    'aria-label': label || `${input?.name} Switch Handle`.trim(),
    ...props,
    children: label,
    isDisabled: disabled,
    onPress,
  }, ref) as ButtonAria<HTMLButtonElement>;

  const ariaButtonProps = React.useMemo(() => {
    const output = { ...buttonProps };

    Object.keys(output).filter((k) => /^on/.test(k)).forEach((key) => {
      delete output[key];
    });

    return output;
  }, [buttonProps]);

  const interactive = typeof onPress === 'function' && !readOnly && !disabled;

  // hacky workaround to get the onPress handler to fire alongside dnd-kit
  // for more info, see `isVirtualClick()` implementation in:
  // https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/interactions/src/usePress.ts#L249
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (
    event,
  ) => (interactive ? buttonProps?.onClick?.({
    ...event,

    nativeEvent: {
      ...event.nativeEvent,

      // makes this a "virtual" click, which react-aria will go ahead and fire the onPress handler
      detail: 0,
    },

    preventDefault: () => event.preventDefault(),
    stopPropagation: () => event.stopPropagation(),
  }) : null);

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
      {...ariaButtonProps}
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
            // x: Math.max(transform?.x || 0, 0),
            // x: (input?.value ? enabledX : 0) + (transform?.x || 0),
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
