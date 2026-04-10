import * as React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import cx from 'classnames';
import styles from './BaseTextField.module.scss';

export type TextFieldElement = HTMLInputElement | HTMLTextAreaElement;
export type TextFieldValue = string | number;

export interface CommonTextFieldProps<
  FieldValue extends TextFieldValue = string,
  T extends TextFieldElement = HTMLInputElement,
> extends FieldRenderProps<FieldValue, T> {
  tabIndex?: number;
  label?: string;
  hint?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}

export interface BaseTextFieldProps<
  FieldValue extends TextFieldValue = string,
> extends CommonTextFieldProps<FieldValue, HTMLInputElement> {
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  min?: number;
  max?: number;
  step?: number;
  monospace?: boolean;
  hideLabel?: boolean;
}

export const BaseTextField = React.forwardRef<HTMLInputElement, BaseTextFieldProps>(<
  FieldValue extends TextFieldValue = string,
>({
  labelClassName,
  labelStyle,
  inputClassName,
  inputStyle,
  tabIndex = 0,
  label,
  hint,
  min,
  max,
  step,
  autoFocus = false,
  autoComplete = 'off',
  monospace = true,
  hideLabel = false,
  input,
  meta: _meta,
  disabled = false,
}: BaseTextFieldProps<FieldValue>, forwardedRef: React.ForwardedRef<HTMLInputElement>): React.JSX.Element => {
  const inputId = input?.name ? `field-${input.name}` : undefined;

  return (
    <>
      {
        (!hideLabel && !!label) &&
        <label
          htmlFor={inputId}
          className={cx(styles.label, labelClassName)}
          style={labelStyle}
        >
          {label}
        </label>
      }

      <input
        ref={forwardedRef}
        id={inputId}
        type={input?.type ?? 'text'}
        name={input?.name}
        value={String(input?.value ?? '')}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        placeholder={hint}
        disabled={disabled}
        aria-label={!label ? hint : undefined}
        onChange={(e) => input?.onChange?.(e.target.value as FieldValue & string)}
        onFocus={input?.onFocus}
        onBlur={input?.onBlur}
        className={cx(
          styles.input,
          monospace && styles.monospace,
          inputClassName,
        )}
        style={inputStyle}
        tabIndex={disabled ? -1 : tabIndex}
        min={min}
        max={max}
        step={step}
      />
    </>
  );
});
