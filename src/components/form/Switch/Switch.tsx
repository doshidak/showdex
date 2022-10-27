import * as React from 'react';
import { useSwitch } from '@react-aria/switch';
import { VisuallyHidden } from '@react-aria/visually-hidden';
import { useToggleState } from '@react-stately/toggle';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  createSnapModifier,
  restrictToHorizontalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import cx from 'classnames';
import { Tooltip } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import type { AriaSwitchProps } from '@react-types/switch';
import type { FieldRenderProps } from 'react-final-form';
import type { DragEndEvent, DragMoveEvent } from '@dnd-kit/core';
import { SwitchHandle } from './SwitchHandle';
import { SwitchTrack } from './SwitchTrack';
import styles from './Switch.module.scss';

/* eslint-disable @typescript-eslint/indent */

export type SwitchAriaProps = Omit<AriaSwitchProps,
  | 'defaultSelected'
  | 'isDisabled'
  | 'isReadOnly'
  | 'isSelected'
>;

/* eslint-enable @typescript-eslint/indent */

export interface CommonToggleFieldProps<
  FieldValue = boolean,
  T extends HTMLElement = HTMLInputElement,
> extends SwitchAriaProps, FieldRenderProps<FieldValue, T> {
  tabIndex?: number;
  readOnly?: boolean;
  disabled?: boolean;
}

export interface SwitchProps<
  FieldValue = boolean,
  T extends HTMLElement = HTMLInputElement,
> extends CommonToggleFieldProps<FieldValue, T> {
  className?: string;
  style?: React.CSSProperties;
  fieldClassName?: string;
  fieldStyle?: React.CSSProperties;
  trackClassName?: string;
  trackStyle?: React.CSSProperties;
  handleClassName?: string;
  handleStyle?: React.CSSProperties;
  handleDraggingClassName?: string;
  handleDraggingStyle?: React.CSSProperties;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  label?: string;
  tooltip?: React.ReactNode;
  hideLabel?: boolean;
  autoFocus?: boolean;

  /**
   * Width of the switch itself, not including any icons/labels (these are outside the switch on the right).
   *
   * @default 60
   * @since 1.0.3
   */
  width?: number;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({
  className,
  style,
  fieldClassName,
  fieldStyle,
  trackClassName,
  trackStyle,
  handleClassName,
  handleStyle,
  handleDraggingClassName,
  handleDraggingStyle,
  labelClassName,
  labelStyle,
  tabIndex = 0,
  label,
  tooltip,
  hideLabel,
  autoFocus,
  width = 50,
  input,
  meta,
  readOnly,
  disabled,
  ...props
}: SwitchProps, forwardedRef): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<HTMLInputElement>(null);

  const ariaProps: AriaSwitchProps = {
    ...props,
    'aria-label': label || `${input?.name || 'Switch'} Switch`,
    name: input?.name,
    value: input?.value?.toString?.(),
    isSelected: input?.value,
    autoFocus,
    isReadOnly: readOnly,
    isDisabled: disabled,
    onChange: input?.onChange,
    onFocus: input?.onFocus,
    onBlur: input?.onBlur,
  };

  const toggleState = useToggleState(ariaProps);
  const { inputProps } = useSwitch(ariaProps, toggleState, ref);

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
    [ref],
  );

  const hasLabel = !hideLabel && !!label;

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
  );

  const [enabledX, setEnabledX] = React.useState(width / 2);

  const handleDragMove = (event: DragMoveEvent) => {
    const { rect: track } = event?.over || {};

    if (!track?.width || !track.height) {
      return;
    }

    const x = track.width - track.height;

    if (enabledX !== x) {
      setEnabledX(x);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event || {};

    if (typeof delta?.x !== 'number' || !enabledX) {
      return;
    }

    const threshold = Math.floor(enabledX / 2);

    if (threshold < 0) {
      return;
    }

    input?.onChange?.(delta.x >= threshold);
  };

  const colorScheme = useColorScheme();

  return (
    <>
      <div
        ref={containerRef}
        className={cx(
          styles.container,
          !!colorScheme && styles[colorScheme],
          className,
        )}
        style={style}
      >
        <label
          className={cx(
            styles.field,
            meta?.active && styles.active,
            !!input?.value && styles.selected,
            readOnly && styles.readOnly,
            disabled && styles.disabled,
            fieldClassName,
          )}
          style={fieldStyle}
        >
          <VisuallyHidden
            elementType="span"
            isFocusable={false}
          >
            <input
              ref={ref}
              {...inputProps}
              tabIndex={disabled ? -1 : tabIndex}
            />
          </VisuallyHidden>

          <DndContext
            id={`Switch:${input?.name || '???'}:DndContext`}
            sensors={sensors}
            modifiers={[
              createSnapModifier(Math.round(width / 2)),
              restrictToHorizontalAxis,
              restrictToParentElement,
            ]}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <SwitchTrack
              className={trackClassName}
              style={trackStyle}
              name={input?.name}
              width={width}
              input={input}
            >
              <SwitchHandle
                className={handleClassName}
                style={handleStyle}
                draggingClassName={handleDraggingClassName}
                draggingStyle={handleDraggingStyle}
                label={`Switch Handle for ${input?.name || 'input'} field`}
                input={input}
                enabledX={enabledX}
                readOnly={readOnly}
                disabled={disabled}
              />
            </SwitchTrack>
          </DndContext>

          {
            hasLabel &&
            <span
              className={cx(
                styles.label,
                labelClassName,
              )}
              style={labelStyle}
            >
              {label}
            </span>
          }
        </label>
      </div>

      <Tooltip
        reference={containerRef}
        content={tooltip}
        offset={[0, 10]}
        delay={[1000, 150]}
        trigger="mouseenter"
        touch={['hold', 500]}
        disabled={!tooltip || disabled}
      />
    </>
  );
});
