import * as React from 'react';
import cx from 'classnames';
import type { ClearIndicatorProps, GroupBase } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectClearIndicator = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  isFocused,
  innerProps,
  children,
}: ClearIndicatorProps<Option, Multi, Group>): JSX.Element => (
  <div
    className={cx(
      styles.indicator,
      styles.clearIndicator,
      isFocused && styles.focused,
      className,
    )}
    {...innerProps}
  >
    {children || <i className="fa fa-close" />}
  </div>
);

/* eslint-enable @typescript-eslint/indent */
