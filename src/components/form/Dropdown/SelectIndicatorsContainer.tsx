import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, IndicatorsContainerProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectIndicatorsContainer = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  innerProps,
  isMulti,
  children,
}: IndicatorsContainerProps<Option, Multi, Group>): JSX.Element => (
  <div
    className={cx(
      styles.indicatorsContainer,
      isMulti && styles.multi,
      className,
    )}
    {...innerProps}
  >
    {children}
  </div>
);

/* eslint-enable @typescript-eslint/indent */
