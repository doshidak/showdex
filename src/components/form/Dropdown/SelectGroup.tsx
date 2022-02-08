import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, GroupProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectGroup = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  Heading,
  headingProps,
  label,
  theme,
  innerProps,
  selectProps,
  children,
}: GroupProps<Option, Multi, Group>): JSX.Element => (
  <>
    <div
      className={cx(styles.group, styles.optionItem, className)}
      {...innerProps}
    >
      <Heading
        {...headingProps}
        theme={theme}
        selectProps={selectProps}
        cx={null}
        getStyles={null}
      >
        {label}
      </Heading>
    </div>
    {children}
  </>
);

/* eslint-enable @typescript-eslint/indent */
