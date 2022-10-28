import * as React from 'react';
import cx from 'classnames';
import { ToggleButton, Tooltip } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/app';
import type { FieldRenderProps } from 'react-final-form';
import type { TextFieldValue } from '@showdex/components/form';
import styles from './Segmented.module.scss';

export interface SegmentedOption<TValue extends TextFieldValue = string> {
  /**
   * If not provided, `value` will be used for the key, then `label`.
   *
   * @since 1.0.3
   */
  key?: string;

  className?: string;
  style?: React.CSSProperties;

  label: string;
  tooltip?: React.ReactNode;
  value: TValue;

  /**
   * Whether to not render this option at all.
   *
   * @since 1.0.3
   */
  hidden?: boolean;

  /**
   * Disables the individual option, not all options.
   *
   * @since 1.0.3
   */
  disabled?: boolean;
}

export interface SegmentedProps<
  TValue extends TextFieldValue = string,
  Multi extends boolean = false,
> extends FieldRenderProps<Multi extends true ? TValue[] : TValue, HTMLDivElement> {
  className?: string;
  style?: React.CSSProperties;
  fieldClassName?: string;
  labelClassName?: string;
  optionsClassName?: string;
  optionClassName?: string;
  label?: string;
  labelPosition?: 'top' | 'right' | 'bottom' | 'left';

  /**
   * Component-wide tooltip.
   *
   * * Opens when the user hovers over the container, including all of the `options`.
   * * Might be more useful to set the `tooltip` for each individual `SegmentedOption`.
   *
   * @since 1.0.3
   */
  tooltip?: React.ReactNode;

  options?: SegmentedOption<TValue>[];
  multi?: Multi;
  disabled?: boolean;
}

/* eslint-disable @typescript-eslint/indent */

export const Segmented = React.forwardRef<HTMLDivElement, SegmentedProps>(<
  TValue extends TextFieldValue = string,
  Multi extends boolean = false,
>({
  className,
  style,
  fieldClassName,
  labelClassName,
  optionsClassName,
  optionClassName,
  label,
  labelPosition = 'left',
  tooltip,
  options,
  multi,
  input,
  disabled,
}: SegmentedProps<TValue, Multi>, forwardedRef: React.ForwardedRef<HTMLDivElement>): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => containerRef.current,
  );

  const colorScheme = useColorScheme();

  const handleChange = (value: TValue) => {
    if (typeof input?.onChange !== 'function') {
      return;
    }

    if (!multi) {
      input.onChange(value);

      return;
    }

    const values = [...((input?.value as TValue[]) || [])];
    const valueIndex = values.findIndex((v) => v === value);

    // "toggle off" if the value does exist or "toggle on" if it doesn't
    if (valueIndex > -1) {
      values.splice(valueIndex, 1);
    } else {
      values.push(value);
    }

    input.onChange(values);
  };

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
        <div
          className={cx(
            styles.field,
            !!label && (labelPosition === 'top' || labelPosition === 'bottom') && styles.column,
            !!label && (labelPosition === 'right' || labelPosition === 'bottom') && styles.reverse,
            disabled && styles.disabled,
            fieldClassName,
          )}
        >
          {
            !!label &&
            <label
              className={cx(
                styles.label,
                labelClassName,
              )}
            >
              {label}
            </label>
          }

          <div
            className={cx(
              styles.options,
              optionsClassName,
            )}
          >
            {options?.filter?.((o) => !!o?.value && !o.hidden).map((option) => {
              const {
                key: optionKey,
                className: classNameFromOption,
                style: styleFromOption,
                label: optionLabel,
                tooltip: optionTooltip,
                value: optionValue,
                disabled: optionDisabled,
              } = option;

              const rawKey = optionKey || String(option.value) || option.label;
              const key = formatId(rawKey);

              // not checking with !!input?.value in case input.value is purposefully some falsy value,
              // like 0 or `''` (empty string)
              const selected = 'value' in (input || {})
                && (
                  (!multi && (input.value as TValue) === optionValue)
                    || (multi && ((input.value as TValue[])?.includes(optionValue)))
                );

              return (
                <ToggleButton
                  key={`Segmented:${input?.name || '???'}:ToggleButton:${key}`}
                  className={cx(
                    styles.option,
                    selected && styles.selected,
                    optionClassName,
                    classNameFromOption,
                  )}
                  style={styleFromOption}
                  label={optionLabel}
                  tooltip={optionTooltip}
                  primary
                  active={selected}
                  hoverScale={selected ? 1 : undefined}
                  activeScale={selected ? 0.98 : undefined}
                  disabled={disabled || optionDisabled}
                  onPress={() => {
                    if (!selected) {
                      handleChange(optionValue);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <Tooltip
        reference={containerRef}
        content={tooltip}
        offset={[0, 10]}
        delay={[1000, 50]}
        trigger="mouseenter"
        touch={['hold', 500]}
        disabled={disabled || !tooltip}
      />
    </>
  );
});

/* eslint-enable @typescript-eslint/indent */
