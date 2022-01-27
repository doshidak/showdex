import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, ValueContainerProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import type { SelectProps } from './SelectContainer';
import styles from './Dropdown.module.scss';

export type SelectValueContainerProps<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
> = Modify<ValueContainerProps<Option, Multi, Group>, {
  selectProps: SelectProps<Option, Multi, Group>;
}>;

/* eslint-disable @typescript-eslint/indent */

export const SelectValueContainer = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  hasValue,
  isMulti,
  innerProps,
  selectProps: {
    active = false,
  } = {},
  children,
}: SelectValueContainerProps<Option, Multi, Group>): JSX.Element => (
  <div
    className={cx(
      styles.valueContainer,
      active && styles.active,
      hasValue && styles.hasValue,
      className,
    )}
    {...innerProps}
  >
    <div
      className={cx(
        styles.value,
        !isMulti && styles.single,
        isMulti && styles.multi,
      )}
    >
      {children}
    </div>
  </div>
);

/* eslint-enable @typescript-eslint/indent */
