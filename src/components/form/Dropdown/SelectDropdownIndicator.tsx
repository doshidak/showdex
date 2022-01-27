import * as React from 'react';
import cx from 'classnames';
import type { DropdownIndicatorProps, GroupBase } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectDropdownIndicator = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  isFocused,
  innerProps,
  children,
}: DropdownIndicatorProps<Option, Multi, Group>): JSX.Element => (
  <div
    className={cx(
      styles.indicator,
      styles.dropdownIndicator,
      isFocused && styles.focused,
      className,
    )}
    {...innerProps}
  >
    {children || <i className="fa fa-chevron-down" />}
  </div>
);

/* eslint-enable @typescript-eslint/indent */
