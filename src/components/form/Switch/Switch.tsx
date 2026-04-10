import * as React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import {
  type DragEndEvent,
  type DragMoveEvent,
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
import { SwitchHandle } from './SwitchHandle';
import { SwitchTrack } from './SwitchTrack';
import styles from './Switch.module.scss';

export interface CommonToggleFieldProps<
  FieldValue = boolean,
  T extends HTMLElement = HTMLInputElement,
> extends FieldRenderProps<FieldValue, T> {
  tabIndex?: number;
  readOnly?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
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

// visually hidden styles (replaces @react-aria/visually-hidden)
const visuallyHiddenStyle: React.CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  margin: '0 -1px -1px 0',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  width: 1,
  whiteSpace: 'nowrap',
};

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
  'aria-label': ariaLabel,
}: SwitchProps, forwardedRef): React.JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<HTMLInputElement>(null);

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
          <span style={visuallyHiddenStyle}>
            <input
              ref={ref}
              type="checkbox"
              role="switch"
              name={input?.name}
              checked={!!input?.value}
              autoFocus={autoFocus}
              disabled={disabled}
              readOnly={readOnly}
              aria-label={ariaLabel || label || `${input?.name || 'Switch'} Switch`}
              tabIndex={disabled ? -1 : tabIndex}
              onChange={(e) => input?.onChange?.(e.target.checked)}
              onFocus={input?.onFocus}
              onBlur={input?.onBlur}
            />
          </span>

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
              className={cx(styles.label, labelClassName)}
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
