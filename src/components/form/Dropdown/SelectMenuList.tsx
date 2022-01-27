import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, MenuListProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectMenuList = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  innerRef,
  className,
  maxHeight,
  isMulti,
  innerProps,
  children,
}: MenuListProps<Option, Multi, Group>): JSX.Element => (
  <div
    ref={innerRef}
    className={cx(
      styles.menuList,
      isMulti && styles.multi,
      className,
    )}
    style={{ maxHeight }}
    {...innerProps}
  >
    {children}
  </div>
);

/* eslint-enable @typescript-eslint/indent */
