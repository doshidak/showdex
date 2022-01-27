import * as React from 'react';
import type { GroupBase, MultiValueRemoveProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectMultiValueRemove = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  innerProps,
  children,
}: MultiValueRemoveProps<Option, Multi, Group>): JSX.Element => (
  <div
    className={styles.remove}
    {...innerProps}
  >
    {children || <i className="fa fa-close" />}
  </div>
);

/* eslint-disable @typescript-eslint/indent */
