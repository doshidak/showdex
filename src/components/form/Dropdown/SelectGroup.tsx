import * as React from 'react';
import cx from 'classnames';
import { type GroupBase, type GroupProps } from 'react-select';
import { type DropdownOption } from './Dropdown';
// import { type SelectProps } from './SelectContainer';
import styles from './Dropdown.module.scss';

/*
export type SelectGroupProps<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
> = Modify<GroupProps<Option, Multi, Group>, {
  selectProps?: SelectProps<Option, Multi, Group>;
}>;
*/

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
      className={cx(styles.optionItem, styles.group, className)}
      {...innerProps}
    >
      <Heading
        {...headingProps}
        theme={theme}
        selectProps={selectProps}
        cx={null}
        getClassNames={null}
        getStyles={null}
      >
        {label}
      </Heading>
    </div>

    {children}
  </>
);

/* eslint-enable @typescript-eslint/indent */
