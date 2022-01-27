import * as React from 'react';
import Select from 'react-select';
import Creatable from 'react-select/creatable';
import cx from 'classnames';
import type { FieldInputProps, FieldRenderProps } from 'react-final-form';
import type { SelectInstance } from 'react-select';
import type {
  CreatableComponent,
  SelectComponent,
  SelectCustomProps,
  SelectProps,
} from './SelectContainer';
import { SelectClearIndicator } from './SelectClearIndicator';
import { SelectContainer } from './SelectContainer';
import { SelectControl } from './SelectControl';
import { SelectDropdownIndicator } from './SelectDropdownIndicator';
import { SelectIndicatorsContainer } from './SelectIndicatorsContainer';
import { SelectIndicatorSeparator } from './SelectIndicatorSeparator';
import { SelectInput } from './SelectInput';
import { SelectMenu } from './SelectMenu';
import { SelectMenuList } from './SelectMenuList';
import { SelectMultiValue } from './SelectMultiValue';
import { SelectMultiValueRemove } from './SelectMultiValueRemove';
import { SelectOption } from './SelectOption';
import { SelectNotice } from './SelectNotice';
import { SelectPlaceholder } from './SelectPlaceholder';
import { SelectSingleValue } from './SelectSingleValue';
import { SelectValueContainer } from './SelectValueContainer';
import styles from './Dropdown.module.scss';

export type DropdownSingleValue = string | number;
export type DropdownMultiValue = DropdownSingleValue[];
export type DropdownValue = DropdownSingleValue | DropdownMultiValue;

export interface DropdownOption {
  label?: string;
  value?: DropdownSingleValue;
}

export type DropdownFieldSingleInput = FieldInputProps<DropdownSingleValue, HTMLInputElement>;
export type DropdownFieldMultiInput = FieldInputProps<DropdownMultiValue, HTMLInputElement>;

export interface DropdownProps extends FieldRenderProps<DropdownValue, HTMLInputElement>, Omit<SelectCustomProps, 'active'> {
  className?: string;
  style?: React.CSSProperties;
  tabIndex?: number;
  'aria-label'?: string;
  hint?: string;
  options?: DropdownOption[];
  components?: SelectProps['components'];
  loadingMessage?: string;
  noOptionsMessage?: string;
  searchable?: boolean;
  clearable?: boolean;
  clearOnEsc?: boolean;
  creatable?: boolean;
  multi?: boolean;
  minMenuHeight?: number;
  maxMenuHeight?: number;
  openMenuOnPress?: boolean;
  openMenuOnFocus?: boolean;
  hideSelections?: boolean;
  autoFocus?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

/* eslint-disable react/prop-types */

export const Dropdown = React.forwardRef<SelectInstance, DropdownProps>(({
  className,
  style,
  tabIndex = 0,
  'aria-label': ariaLabel,
  hint,
  options,
  components,
  loadingMessage = 'Loading...',
  noOptionsMessage = 'No Options',
  searchable = true,
  clearable = true,
  clearOnEsc = true,
  creatable,
  multi,
  openMenuOnPress = true,
  openMenuOnFocus,
  minMenuHeight = 140,
  maxMenuHeight = 176,
  hideSelections,
  autoFocus,
  loading,
  input,
  meta,
  disabled,
}: DropdownProps, forwardedRef): JSX.Element => {
  const ref = React.useRef<SelectInstance>(null);
  const Component = creatable ? Creatable as CreatableComponent : Select as SelectComponent;

  React.useImperativeHandle(forwardedRef, () => ref.current, [ref]);

  const [valueOption, setValueOption] = React.useState<DropdownOption | DropdownOption[]>(null);

  React.useEffect(() => {
    if (!input?.value) {
      return setValueOption(null);
    }

    let val = multi ?
      options.filter((o) => (input as DropdownFieldMultiInput).value?.includes?.(o?.value)) :
      options.find((o) => o?.value === (input as DropdownFieldSingleInput).value);

    if (!val && input?.value && creatable) {
      const newValue = Array.isArray(input.value) ? input.value[0] : input.value;
      const newOption = { label: newValue.toString(), value: newValue };

      val = multi ? [newOption] : newOption;
    }

    setValueOption(val);
  }, [creatable, options, multi, input]);

  const hasValue = Array.isArray(valueOption) ? !!valueOption.length : !!valueOption;
  // const hasError = hasError<DropdownValue>(meta) && hasValue;

  const handleChange = (newValue: DropdownOption | DropdownOption[]) => {
    if (!multi) {
      const option = Array.isArray(newValue) ? newValue[0] : newValue;

      return input?.onChange?.(option?.value);
    }

    if (!Array.isArray(newValue)) {
      return input?.onChange?.([]);
    }

    const parsedValue = newValue.map((o) => o?.value).filter((v) => !!v);

    return input?.onChange?.(parsedValue);
  };

  return (
    <Component
      ref={ref}
      instanceId={`Dropdown:${creatable ? 'Creatable' : 'Select'}-${input?.name || '???'}`}
      classNamePrefix="select"
      containerClassName={cx(
        styles.container,
        hasValue && styles.hasValue,
        meta?.active && styles.active,
        disabled && styles.disabled,
        className,
      )}
      containerStyle={style}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : tabIndex}
      placeholder={hint}
      options={options}
      value={valueOption}
      active={meta?.active}
      components={{
        ClearIndicator: SelectClearIndicator,
        Control: SelectControl,
        DropdownIndicator: SelectDropdownIndicator,
        IndicatorsContainer: SelectIndicatorsContainer,
        IndicatorSeparator: SelectIndicatorSeparator,
        Input: SelectInput,
        LoadingMessage: SelectNotice,
        Menu: SelectMenu,
        MenuList: SelectMenuList,
        MultiValue: SelectMultiValue,
        MultiValueRemove: SelectMultiValueRemove,
        Option: SelectOption,
        NoOptionsMessage: SelectNotice,
        Placeholder: SelectPlaceholder,
        SingleValue: SelectSingleValue,
        SelectContainer,
        ValueContainer: SelectValueContainer,
        ...components,
      }}
      loadingMessage={() => loadingMessage}
      noOptionsMessage={() => noOptionsMessage}
      autoFocus={autoFocus}
      tabSelectsValue={false}
      escapeClearsValue={clearable && clearOnEsc}
      hideSelectedOptions={hideSelections}
      minMenuHeight={minMenuHeight}
      maxMenuHeight={maxMenuHeight}
      openMenuOnClick={openMenuOnPress}
      openMenuOnFocus={openMenuOnFocus}
      closeMenuOnSelect={!multi}
      isSearchable={searchable}
      isClearable={clearable}
      isMulti={multi}
      isLoading={loading}
      isDisabled={disabled}
      onChange={handleChange}
      onFocus={input?.onFocus}
      onBlur={input?.onBlur}
    />
  );
});

/* eslint-enable react/prop-types */
