import type { CommonPropsAndClassName, GroupBase } from 'react-select';
import type { DropdownOption } from './Dropdown';

// source (from react-select v5.1.0, as of 2021/10/05):
// https://github.com/JedWatson/react-select/blob/master/packages/react-select/src/utils.ts#L74-L108

type CommonProps<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
  AdditionalProps,
> = Partial<CommonPropsAndClassName<Option, Multi, Group>> & AdditionalProps;

type RetVal<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
  AdditionalProps,
> = Omit<AdditionalProps, keyof CommonPropsAndClassName<Option, Multi, Group>>;

/* eslint-disable @typescript-eslint/indent */

export const clearCommonProps = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
  AdditionalProps,
>({
  className,
  clearValue,
  cx,
  getStyles,
  getValue,
  hasValue,
  isMulti,
  isRtl,
  options,
  selectOption,
  selectProps,
  setValue,
  theme,
  ...innerProps
}: CommonProps<Option, Multi, Group, AdditionalProps>): RetVal<Option, Multi, Group, AdditionalProps> => ({
  ...innerProps,
});
