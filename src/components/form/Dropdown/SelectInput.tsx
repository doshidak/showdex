import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, InputProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import type { SelectProps } from './SelectContainer';
import { clearCommonProps } from './clearCommonProps';
import styles from './Dropdown.module.scss';

export type SelectInputProps<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
> = Modify<Omit<InputProps<Option, Multi, Group>, 'dangerouslySetInnerHTML'>, {
  selectProps: SelectProps<Option, Multi, Group>;
}>;

/* eslint-disable @typescript-eslint/indent */

export const SelectInput = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  value = '',
  isMulti,
  hasValue,
  selectProps, // unused
  ...props
}: SelectInputProps<Option, Multi, Group>): JSX.Element => {
  const {
    innerRef,
    inputClassName,
    isHidden,
    isDisabled,
    ...innerProps
  } = clearCommonProps(props);

  return (
    <div
      className={cx(
        styles.inputContainer,
        isDisabled && styles.disabled,
        className,
      )}
      data-value={value}
    >
      <input
        ref={innerRef}
        className={cx(
          styles.input,
          isMulti && styles.multi,
          hasValue && styles.hasValue,
          isHidden && styles.hidden,
          inputClassName,
        )}
        inputMode="none" // don't show the virtual keyboard on mobile
        value={value}
        disabled={isDisabled}
        {...innerProps}
      />
    </div>
  );
};

/* eslint-enable @typescript-eslint/indent */
