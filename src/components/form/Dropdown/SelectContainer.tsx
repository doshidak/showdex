import * as React from 'react';
import cx from 'classnames';
import {
  type ContainerProps,
  type GroupBase,
  type Props,
  type SelectInstance,
} from 'react-select';
import { type CreatableProps as SelectCreatableProps } from 'react-select/creatable';
import { type DropdownOption, type DropdownSingleValue } from './Dropdown';
import styles from './Dropdown.module.scss';

export interface SelectCustomProps {
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  filtering?: boolean;
  active?: boolean;
  scrollState?: [scrolling: boolean, setScrolling: React.Dispatch<React.SetStateAction<boolean>>];
  optionTooltip?: (props: SelectOptionTooltipProps) => JSX.Element;
  optionTooltipProps?: SelectOptionTooltipProps;
  optionTooltipDelay?: number;
}

export interface SelectOptionTooltipProps<
  TValue extends DropdownSingleValue = DropdownSingleValue,
> extends DropdownOption<TValue> {
  hidden?: boolean;
}

export type SelectProps<
  Option extends DropdownOption = DropdownOption,
  Multi extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> = Props<Option, Multi, Group> & SelectCustomProps;

export type SelectComponent = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>(props: SelectProps<Option, Multi, Group> & React.RefAttributes<SelectInstance<Option, Multi, Group>>) => React.ReactElement;

export type CreatableProps<
  Option extends DropdownOption = DropdownOption,
  Multi extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> = SelectCreatableProps<Option, Multi, Group> & SelectCustomProps;

export type CreatableComponent = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>(props: CreatableProps<Option, Multi, Group> & React.RefAttributes<SelectInstance<Option, Multi, Group>>) => React.ReactElement;

export type SelectContainerProps<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
> = Modify<ContainerProps<Option, Multi, Group>, {
  selectProps: SelectProps<Option, Multi, Group>;
}>;

/* eslint-disable @typescript-eslint/indent */

export const SelectContainer = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  isRtl,
  isMulti,
  isDisabled,
  innerProps,
  selectProps: {
    containerClassName,
    containerStyle,
  } = {},
  children,
}: SelectContainerProps<Option, Multi, Group>): JSX.Element => (
  <div
    className={cx(
      containerClassName,
      isRtl && styles.rtl,
      isMulti && styles.multi,
      isDisabled && styles.disabled,
      className,
    )}
    style={containerStyle}
    {...innerProps}
  >
    {children}
  </div>
);

/* eslint-enable @typescript-eslint/indent */
