import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, NoticeProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectNotice = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  innerProps,
  children,
}: NoticeProps<Option, Multi, Group>): JSX.Element => (
  <div
    className={cx(
      styles.notice,
      className,
    )}
    {...innerProps}
  >
    {children}
  </div>
);

/* eslint-enable @typescript-eslint/indent */
