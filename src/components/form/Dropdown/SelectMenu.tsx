import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, MenuProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectMenu = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  innerRef,
  className,
  placement,
  innerProps,
  children,
}: MenuProps<Option, Multi, Group>): JSX.Element => (
  <div
    ref={innerRef}
    className={cx(
      styles.menu,
      placement === 'top' && styles.placementTop,
      placement === 'bottom' && styles.placementBottom,
      className,
    )}
    {...innerProps}
  >
    {children}
  </div>
);

/* eslint-enable @typescript-eslint/indent */
