import * as React from 'react';
import cx from 'classnames';
import { ToggleButton } from '@showdex/components/ui';
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
   * Disables the individual option, not all options.
   *
   * @since 1.0.3
   */
  disabled?: boolean;
}

export interface SegmentedProps<
  TValue extends TextFieldValue = string,
> extends FieldRenderProps<TValue, HTMLDivElement> {
  className?: string;
  style?: React.CSSProperties;
  fieldClassName?: string;
  labelClassName?: string;
  optionsClassName?: string;
  optionClassName?: string;
  label?: string;
  labelPosition?: 'top' | 'right' | 'bottom' | 'left';
  options?: SegmentedOption<TValue>[];
  disabled?: boolean;
}

/* eslint-disable @typescript-eslint/indent */

export const Segmented = React.forwardRef<HTMLDivElement, SegmentedProps>(<
  TValue extends TextFieldValue = string,
>({
  className,
  style,
  fieldClassName,
  labelClassName,
  optionsClassName,
  optionClassName,
  label,
  labelPosition = 'left',
  options,
  input,
  disabled,
}: SegmentedProps<TValue>, forwardedRef: React.ForwardedRef<HTMLDivElement>): JSX.Element => {
  const colorScheme = useColorScheme();

  return (
    <div
      ref={forwardedRef}
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
          {options?.filter?.((o) => !!o?.value).map((option) => {
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

            const selected = !!input?.value && input.value === optionValue;

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
                disabled={disabled || optionDisabled}
                onPress={() => input?.onChange?.(optionValue)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

/* eslint-enable @typescript-eslint/indent */
