import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/components/app';
import { BaseTextField } from '@showdex/components/form';
import type { BaseTextFieldProps } from '@showdex/components/form';
import styles from './ValueField.module.scss';

export interface ValueFieldProps extends BaseTextFieldProps<number> {
  className?: string;
  style?: React.CSSProperties;
  absoluteHover?: boolean;
}

/* eslint-disable @typescript-eslint/indent -- this rule is broken af. see Issue #1824 in the typescript-eslint GitHub repo. */
/* eslint-disable react/prop-types */

export const ValueField = React.forwardRef<HTMLInputElement, ValueFieldProps>(({
  className,
  style,
  inputClassName,
  absoluteHover,
  input,
  disabled,
  ...props
}: ValueFieldProps, forwardedRef): JSX.Element => {
  const colorScheme = useColorScheme();

  // although react-final-form has meta.active,
  // we're keeping track of the focus state ourselves in case we don't wrap this in a Field
  // (i.e., we're not using react-final-form, but rather, rendering ValueField directly)
  const [active, setActive] = React.useState<boolean>(false);

  // this is only a visual value, so that we don't forcibly change the user's value as they're typing it
  const [inputValue, setInputValue] = React.useState<string>(input?.value?.toString());

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        absoluteHover && styles.absoluteHover,
        active && styles.active,
        disabled && styles.disabled,
        className,
      )}
      style={style}
    >
      <BaseTextField
        ref={forwardedRef}
        {...props}
        inputClassName={cx(
          styles.input,
          inputClassName,
        )}
        input={{
          type: 'number',
          value: inputValue,

          onChange: (value: string) => {
            // always accept the user's input to show immediate UI feedback
            // (will be reverted to the form's value in onBlur() should this value be invalid)
            setInputValue(value);

            const parsedValue = value?.replace?.(/[^\d\.-]/g, '');
            const num = Number(parsedValue);

            if (Number.isNaN(num)) {
              return;
            }

            input?.onChange?.(num);
          },

          onFocus: () => {
            setActive(true);
            input?.onFocus?.();
          },

          onBlur: () => {
            setActive(false);
            input?.onBlur?.();

            // if the inputValue doesn't match input.value, revert it back to the form's value
            // (should they match, the user has entered in a valid value)
            const strValue = input?.value?.toString();

            if (inputValue !== strValue) {
              setInputValue(strValue);
            }
          },
        }}
        disabled={disabled}
      />
    </div>
  );
});

/* eslint-enable react/prop-types */
/* eslint-enable @typescript-eslint/indent */
