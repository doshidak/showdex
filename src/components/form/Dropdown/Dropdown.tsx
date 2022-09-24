import * as React from 'react';
import Select from 'react-select';
import Creatable from 'react-select/creatable';
import cx from 'classnames';
import { Tooltip } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
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
import { SelectGroup } from './SelectGroup';
import { SelectGroupHeading } from './SelectGroupHeading';
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
  subLabel?: React.ReactNode;
  value?: DropdownSingleValue;
  options?: DropdownOption[];
}

export type DropdownFieldSingleInput = FieldInputProps<DropdownSingleValue, HTMLInputElement>;
export type DropdownFieldMultiInput = FieldInputProps<DropdownMultiValue, HTMLInputElement>;

export interface DropdownProps extends FieldRenderProps<DropdownValue, HTMLInputElement>, Omit<SelectCustomProps, 'active'> {
  className?: string;
  style?: React.CSSProperties;
  tabIndex?: number;
  'aria-label'?: string;
  hint?: string;
  tooltip?: React.ReactNode;
  options?: DropdownOption[];
  components?: SelectProps['components'];
  loadingMessage?: string;
  noOptionsMessage?: string;
  searchable?: boolean;
  clearable?: boolean;
  clearOnEsc?: boolean;
  creatable?: boolean;
  multi?: boolean;
  openMenuOnPress?: boolean;
  openMenuOnFocus?: boolean;
  minMenuHeight?: number;
  maxMenuHeight?: number;
  tabSelectsValue?: boolean;
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
  tooltip,
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
  minMenuHeight = 50,
  maxMenuHeight = 137,
  tabSelectsValue = true,
  hideSelections,
  autoFocus,
  loading,
  input,
  meta,
  disabled,
}: DropdownProps, forwardedRef): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<SelectInstance>(null);
  const colorScheme = useColorScheme();

  const Component = creatable ? Creatable as CreatableComponent : Select as SelectComponent;

  // see ValueField for an explanation as to why we track active internally, instead of using react-final-form
  const [active, setActive] = React.useState<boolean>(false);

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
    [ref],
  );

  const [valueOption, setValueOption] = React.useState<DropdownOption | DropdownOption[]>(null);

  React.useEffect(() => {
    if (!input?.value) {
      return setValueOption(null);
    }

    const flatOptions = options.flatMap((option) => (option?.options ? option.options : option));

    let val = multi ?
      flatOptions.filter((o) => (input as DropdownFieldMultiInput).value?.includes?.(o?.value)) :
      flatOptions.find((o) => o?.value === (input as DropdownFieldSingleInput).value);

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
    <>
      <div
        ref={containerRef}
        className={cx(
          styles.container,
          !!colorScheme && styles[colorScheme],
        )}
      >
        <Component
          ref={ref}
          instanceId={`Dropdown:${creatable ? 'Creatable' : 'Select'}-${input?.name || '???'}`}
          classNamePrefix="select"
          containerClassName={cx(
            styles.selectContainer,
            hasValue && styles.hasValue,
            (meta?.active || active) && styles.active,
            disabled && styles.disabled,
            className,
          )}
          containerStyle={style}
          aria-label={ariaLabel}
          tabIndex={disabled ? -1 : tabIndex}
          placeholder={hint}
          options={options}
          value={valueOption}
          active={meta?.active || active}
          components={{
            ClearIndicator: SelectClearIndicator,
            Control: SelectControl,
            DropdownIndicator: SelectDropdownIndicator,
            Group: SelectGroup,
            GroupHeading: SelectGroupHeading,
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
          tabSelectsValue={tabSelectsValue}
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
          onFocus={(e) => {
            if (!meta) {
              setActive(true);
            }

            input?.onFocus?.(e);
          }}
          onBlur={() => {
            if (!meta) {
              setActive(false);
            }

            input?.onBlur?.();
          }}
        />
      </div>

      <Tooltip
        reference={containerRef.current}
        content={tooltip}
        // offset={[0, 15]}
        // delay={[500, 1000]}
        // trigger="mouseenter"
        // touch="hold"
        visible={(meta?.active || active) && !!tooltip}
        disabled={!tooltip || disabled}
      />
    </>
  );
});

/* eslint-enable react/prop-types */
