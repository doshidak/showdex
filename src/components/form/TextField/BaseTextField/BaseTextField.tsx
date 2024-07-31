import * as React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { type AriaTextFieldProps } from '@react-types/textfield';
import { type TextFieldAria as TextFieldAriaInterface, useTextField } from '@react-aria/textfield';
import cx from 'classnames';
// import { useTextFieldHandle } from './useTextFieldHandle';
import styles from './BaseTextField.module.scss';

export type TextFieldElement = HTMLInputElement | HTMLTextAreaElement;
export type TextFieldValue = string | number;

export type TextFieldAria<
  T extends TextFieldElement = HTMLInputElement,
> = Modify<TextFieldAriaInterface, {
  inputProps: Omit<React.DetailedHTMLProps<T extends HTMLInputElement ? React.InputHTMLAttributes<T> : React.TextareaHTMLAttributes<T>, T>, 'dangerouslySetInnerHTML'>;
  labelProps: Omit<React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>, 'dangerouslySetInnerHTML'>;
}>;

export interface CommonTextFieldProps<
  FieldValue extends TextFieldValue = string,
  T extends TextFieldElement = HTMLInputElement,
> extends Omit<AriaTextFieldProps, 'placeholder' | 'isDisabled'>, FieldRenderProps<FieldValue, T> {
  tabIndex?: number;
  hint?: string;
  disabled?: boolean;
}

export interface BaseTextFieldProps<
  FieldValue extends TextFieldValue = string,
> extends CommonTextFieldProps<FieldValue, HTMLInputElement> {
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  monospace?: boolean;
  hideLabel?: boolean;
}

/* eslint-disable @typescript-eslint/indent -- this rule is broken af. see Issue #1824 in the typescript-eslint GitHub repo. */
/* eslint-disable react/prop-types -- this rule is tripping balls rn, probably because of all the generics lmao. */

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
  meta,
  disabled = false,
  ...props
}: BaseTextFieldProps<FieldValue>, forwardedRef: React.ForwardedRef<HTMLInputElement>): JSX.Element => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { labelProps, inputProps } = useTextField({
    ...props,
    inputElementType: 'input',
    type: input?.type,
    name: input?.name,
    label,
    placeholder: hint,
    value: String(input?.value),
    autoFocus,
    autoComplete,
    isDisabled: disabled,
    onChange: input?.onChange,
    onFocus: input?.onFocus,
    onBlur: input?.onBlur,
  }, inputRef) as TextFieldAria;

  // useTextFieldHandle(inputRef, forwardedRef, input);

  React.useImperativeHandle(
    forwardedRef,
    () => inputRef.current,
  );

  return (
    <>
      {
        (!hideLabel && !!label) &&
        <label
          {...labelProps}
          className={cx(
            styles.label,
            labelClassName,
          )}
          style={labelStyle}
        >
          {label}
        </label>
      }

      <input
        ref={inputRef}
        {...inputProps}
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

/* eslint-enable react/prop-types */
/* eslint-enable @typescript-eslint/indent */
