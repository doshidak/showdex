import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, PlaceholderProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import type { SelectProps } from './SelectContainer';
import styles from './Dropdown.module.scss';

export type SelectPlaceholderProps<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
> = Modify<PlaceholderProps<Option, Multi, Group>, {
  selectProps: SelectProps<Option, Multi, Group>;
}>;

/* eslint-disable @typescript-eslint/indent */

export const SelectPlaceholder = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  isMulti,
  innerProps,
  // selectProps,
  children,
}: SelectPlaceholderProps<Option, Multi, Group>): JSX.Element => (
  <div
    className={cx(
      styles.placeholder,
      isMulti && styles.multi,
      className,
    )}
    {...innerProps}
  >
    {children}
  </div>
);

/* eslint-enable @typescript-eslint/indent */
