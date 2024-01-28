import * as React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import cx from 'classnames';
import { useColorScheme } from '@showdex/redux/store';
import { determineColorScheme } from '@showdex/utils/ui';
import { type BaseTextFieldProps, BaseTextField } from '../TextField';
import styles from './ValueField.module.scss';

export interface ValueFieldProps extends BaseTextFieldProps<number> {
  className?: string;
  style?: React.CSSProperties;

  /**
   * Fallback value for when the input is blurred with an empty string.
   *
   * * Also used as the fallback value for the internal `inputValue` state,
   *   should `input.value` be falsy upon initial mount.
   * * If not provided (default), the input value will be set to the last valid value,
   *   which is stored in the `input.value` prop.
   *
   * @since 0.1.3
   */
  fallbackValue?: number;

  /**
   * Kinda like the native `step` prop, but for when the user is holding down the `SHIFT` key.
   *
   * * If unspecified (default), this behavior will be disabled.
   *
   * @since 0.1.3
   */
  shiftStep?: number;

  /**
   * Whether to loop to the `max` value when `min` is reached.
   *
   * * As implied, `min` and `max` props are required for this to work.
   *
   * @default false
   * @since 0.1.3
   */
  loop?: boolean;

  /**
   * Whether to only apply the `loop` prop when changing the values via hotkeys.
   *
   * * Useful for looping the value when the user is using hotkeys (which +/-'s the `step` value, hence the name),
   *   but clamping to the `min` and `max` values when entering a value.
   *   - For example, if the `min` is `0`, `max` is `100` and both `loop` & `loopStepsOnly` are `true`,
   *     when the user enters in `'999'`, the value will become `100` instead of `0`
   *     (which is the behavior when `loopStepsOnly` is `false` [default]).
   *   - Continuing the above example, assuming the `step` is `1` (default), when the value is `100` and
   *     the user hits the `up` key, the value will become `0` (same behavior when `loop` is `true` and `loopStepsOnly` is `false`).
   *
   * @default false
   * @since 1.0.1
   */
  loopStepsOnly?: boolean;

  /**
   * Whether to clear the displayed value when the input is focused.
   *
   * * If `true`, blurring with an empty value will revert the displayed value back to its original value.
   *
   * @default false
   * @since 1.0.1
   */
  clearOnFocus?: boolean;

  /**
   * Whether to use an absolutely-positioned pseudo-element
   * for indicating the input's hover/active state.
   *
   * * If `true`, padding and hover/active states are applied to the pseudo-element.
   * * If `false` (default), padding and hover/active states are applied to the container.
   *
   * @default false
   * @since 0.1.0
   */
  absoluteHover?: boolean;

  /**
   * Whether to reverse the detected color scheme.
   *
   * * Primarily useful for rendering this in a `Tooltip` where the color schemes are typically reversed.
   *
   * @default false
   * @since 1.1.6
   */
  reverseColorScheme?: boolean;

  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/* eslint-disable @typescript-eslint/indent -- this rule is broken af. see Issue #1824 in the typescript-eslint GitHub repo. */

export const ValueField = React.forwardRef<HTMLInputElement, ValueFieldProps>(({
  className,
  style,
  inputClassName,
  fallbackValue,
  min,
  max,
  step = 1,
  shiftStep,
  loop,
  loopStepsOnly,
  clearOnFocus,
  absoluteHover,
  reverseColorScheme,
  input,
  disabled,
  onContextMenu,
  ...props
}: ValueFieldProps, forwardedRef): JSX.Element => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => inputRef.current,
  );

  // grab the color scheme for applying the theme
  const currentColorScheme = useColorScheme();
  const colorScheme = determineColorScheme(currentColorScheme, reverseColorScheme);

  // although react-final-form has meta.active,
  // we're keeping track of the focus state ourselves in case we don't wrap this in a Field
  // (i.e., we're not using react-final-form, but rather, rendering ValueField directly)
  const [active, setActive] = React.useState<boolean>(false);

  // this is only a visual value, so that we don't forcibly change the user's value as they're typing it
  const [inputValue, setInputValue] = React.useState<string>((
    typeof !!(input?.value || fallbackValue) === 'number'
      && String(input?.value || fallbackValue)
  ) || '');

  // type number fields don't do a good job preventing users from typing in non-numeric characters
  // (like '.' and 'e') nor does it enforce the `min` and `max` values if typed in manually.
  // hence, we use a regular 'ol type text field and control the value ourselves. yay!
  const handleChange = React.useCallback((
    value: string | number,
    viaHotkeys?: boolean,
  ) => {
    let strValue = String(value);

    // show empty strings in the input field, but don't update final-form's value
    if (!strValue) {
      setInputValue('');

      return;
    }

    // remove a manually entered-in minus if min is specified and non-negative
    if (strValue === '-' && typeof min === 'number' && min >= 0) {
      strValue = '';
    }

    // remove any non-numeric characters
    // (except for the leading negative, if present at this point)
    strValue = strValue.replace(/(?!^-)[^\d]/g, '');

    // again, at this point, if we have an empty string, show it, but don't let final-form know
    if (!strValue) {
      setInputValue('');

      return;
    }

    // convert the strValue to a number and clamp it if min/max props are specified
    // (and if all hell breaks loose during this conversion [i.e., NaN], default to 0)
    let numValue = Number(strValue) || 0;

    if (typeof min === 'number') {
      numValue = loop
        && (!loopStepsOnly || viaHotkeys)
        && typeof max === 'number'
        && max > min
        && numValue < min
        ? max
        : Math.max(min, numValue);
    }

    if (typeof max === 'number') {
      numValue = loop
        && (!loopStepsOnly || viaHotkeys)
        && typeof min === 'number'
        && min < max
        && numValue > max
        ? min
        : Math.min(numValue, max);
    }

    // finally, update the visual value and let final-form know
    setInputValue(numValue.toString());
    input?.onChange?.(numValue);
  }, [
    input,
    loop,
    loopStepsOnly,
    max,
    min,
  ]);

  const handleFocus = React.useCallback((e?: React.FocusEvent<HTMLInputElement>) => {
    // clear the displayed value if one is present
    if (clearOnFocus) {
      handleChange('');
    }

    setActive(true);
    input?.onFocus?.(e);
  }, [
    clearOnFocus,
    handleChange,
    input,
  ]);

  const handleBlur = React.useCallback((e?: React.FocusEvent<HTMLInputElement>) => {
    const strValue = (e?.target?.value || (clearOnFocus ? '' : fallbackValue))?.toString();

    if (typeof strValue === 'string' && strValue !== inputValue) {
      handleChange(strValue);
    }

    setActive(false);
    input?.onBlur?.(e);
  }, [
    clearOnFocus,
    fallbackValue,
    handleChange,
    input,
    inputValue,
  ]);

  // since we're not using a type number input cause it sucks ass,
  // emulate the keyboard controls that it natively provides
  const hotkeysRef = useHotkeys<HTMLInputElement>([
    typeof step === 'number' && 'up',
    typeof shiftStep === 'number' && 'shift+up',
    typeof step === 'number' && 'down',
    typeof shiftStep === 'number' && 'shift+down',
    'esc',
    'enter',
  ].filter(Boolean).join(', '), (e, handler) => {
    // prevent the cursor from moving, particularly when holding shift
    e?.preventDefault?.();

    const currentValue = Number(input?.value ?? inputValue) || 0;

    switch (handler.key) {
      case 'up': {
        handleChange(
          currentValue + Math.abs(step),
          true,
        );

        break;
      }

      case 'shift+up': {
        handleChange(
          currentValue + Math.abs(shiftStep),
          true,
        );

        break;
      }

      case 'down': {
        handleChange(
          currentValue - Math.abs(step),
          true,
        );

        break;
      }

      case 'shift+down': {
        handleChange(
          currentValue - Math.abs(shiftStep),
          true,
        );

        break;
      }

      case 'esc':
      case 'enter': {
        // this will also invoke handleBlur() since the input's onBlur() will fire
        inputRef.current?.blur?.();

        break;
      }

      default: {
        break;
      }
    }
  }, {
    enabled: !disabled,
    enableOnTags: active ? ['INPUT'] : undefined,
  }, [
    active,
    input?.value,
    inputValue,
    step,
    shiftStep,
  ]);

  React.useImperativeHandle(
    hotkeysRef,
    () => inputRef.current,
  );

  // handle updates in final-form's input.value
  React.useEffect(() => {
    if (typeof input?.value !== 'number' || Number.isNaN(input.value)) {
      return void setInputValue('');
    }

    const value = String(input.value);

    if (active || !value || value === inputValue) {
      return;
    }

    setInputValue(value);
  }, [
    active,
    input?.value,
    inputValue,
  ]);

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
      onContextMenu={onContextMenu || ((e) => {
        e?.preventDefault();
        e?.stopPropagation();
      })}
    >
      <BaseTextField
        ref={inputRef}
        {...props}
        inputClassName={cx(
          styles.input,
          inputClassName,
        )}
        input={{
          // type: 'number',
          value: inputValue,
          onChange: handleChange,
          onFocus: handleFocus,
          onBlur: handleBlur,
        }}
        disabled={disabled}
      />
    </div>
  );
});

/* eslint-enable @typescript-eslint/indent */
