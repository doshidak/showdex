import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, GroupHeadingProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import { clearCommonProps } from './clearCommonProps';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectGroupHeading = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  ...props
}: GroupHeadingProps<Option, Multi, Group>): JSX.Element => {
  const {
    data, // unused
    ...innerProps
  } = clearCommonProps(props);

  return (
    <div
      className={cx(styles.groupHeading, className)}
      {...innerProps}
    />
  );
};
