import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, IndicatorSeparatorProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectIndicatorSeparator = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  isDisabled,
  innerProps,
}: IndicatorSeparatorProps<Option, Multi, Group>): JSX.Element => (
  <span
    className={cx(
      styles.indicatorSeparator,
      isDisabled && styles.disabled,
      className,
    )}
    {...innerProps}
  />
);

/* eslint-enable @typescript-eslint/indent */
