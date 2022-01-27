import * as React from 'react';
import cx from 'classnames';
import type { ControlProps, GroupBase } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectControl = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  innerRef,
  className,
  hasValue,
  menuIsOpen,
  isFocused,
  isDisabled,
  innerProps,
  children,
}: ControlProps<Option, Multi, Group>): JSX.Element => (
  <div
    ref={innerRef}
    className={cx(
      styles.control,
      !hasValue && styles.empty,
      menuIsOpen && styles.menuOpen,
      isFocused && styles.focused,
      isDisabled && styles.disabled,
      className,
    )}
    {...innerProps}
  >
    {children}
  </div>
);

/* eslint-enable @typescript-eslint/indent */
