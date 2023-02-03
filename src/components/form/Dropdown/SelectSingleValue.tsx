import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, SingleValueProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import type { SelectProps } from './SelectContainer';
import styles from './Dropdown.module.scss';

export type SelectSingleValueProps<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
> = Modify<SingleValueProps<Option, Multi, Group>, {
  selectProps: SelectProps<Option, Multi, Group>;
}>;

/* eslint-disable @typescript-eslint/indent */

export const SelectSingleValue = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  data,
  isDisabled,
  innerProps,
  // selectProps,
  children,
}: SelectSingleValueProps<Option, Multi, Group>): JSX.Element => (
  <div
    className={cx(
      styles.singleValue,
      isDisabled && styles.disabled,
      data?.labelClassName,
      className,
    )}
    style={data?.labelStyle}
    {...innerProps}
  >
    {children || data?.label}
  </div>
);

/* eslint-disable @typescript-eslint/indent */
