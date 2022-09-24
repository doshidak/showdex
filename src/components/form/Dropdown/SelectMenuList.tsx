import * as React from 'react';
import cx from 'classnames';
import { Scrollable } from '@showdex/components/ui';
import type { GroupBase, MenuListProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

export type SelectMenuListProps<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
> = Modify<MenuListProps<Option, Multi, Group>, {
  innerProps?: Omit<JSX.IntrinsicElements['div'], 'ref'>;
}>;

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
}: SelectMenuListProps<Option, Multi, Group>): JSX.Element => (
  <Scrollable
    scrollRef={innerRef}
    className={cx(
      styles.menuList,
      isMulti && styles.multi,
      className,
    )}
    style={{ maxHeight }}
    {...innerProps}
  >
    {children}
  </Scrollable>
);

/* eslint-enable @typescript-eslint/indent */
