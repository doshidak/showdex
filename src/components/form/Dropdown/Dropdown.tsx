import * as React from 'react';
import Select, { type SelectInstance } from 'react-select';
import Creatable from 'react-select/creatable';
import { type FieldInputProps, type FieldRenderProps } from 'react-final-form';
import useDebouncy from 'use-debouncy/lib/fn';
import cx from 'classnames';
import { Tooltip } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import { createAliasFilter } from './createAliasFilter';
import { SelectClearIndicator } from './SelectClearIndicator';
import {
  type CreatableComponent,
  type SelectComponent,
  type SelectCustomProps,
  type SelectProps,
  SelectContainer,
} from './SelectContainer';
import { SelectControl } from './SelectControl';
import { SelectDropdownIndicator } from './SelectDropdownIndicator';
import { SelectGroup } from './SelectGroup';
import { SelectGroupHeading } from './SelectGroupHeading';
import { SelectIndicatorsContainer } from './SelectIndicatorsContainer';
import { SelectIndicatorSeparator } from './SelectIndicatorSeparator';
import { SelectInput } from './SelectInput';
import { SelectLoadingIndicator } from './SelectLoadingIndicator';
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

export interface DropdownOption<
  TValue extends DropdownSingleValue = DropdownSingleValue,
> {
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  label?: React.ReactNode;
  rightLabel?: React.ReactNode;
  subLabel?: React.ReactNode;
  value?: TValue;
  options?: DropdownOption<TValue>[];
  disabled?: boolean;
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
  filterOption?: SelectProps['filterOption'];
  searchable?: boolean;
  clearable?: boolean;
  clearOnEsc?: boolean;
  creatable?: boolean;
  multi?: boolean;
  menuPlacement?: SelectProps['menuPlacement'];
  openMenuOnPress?: boolean;
  openMenuOnFocus?: boolean;
  scrollMenuIntoView?: boolean;
  captureMenuScroll?: boolean;
  minMenuHeight?: number;
  maxMenuHeight?: number;
  tabSelectsValue?: boolean;
  hideSelections?: boolean;
  autoFocus?: boolean;
  highlight?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/* eslint-disable react/prop-types */

export const Dropdown = React.forwardRef<SelectInstance, DropdownProps>(({
  className,
  style,
  tabIndex = 0,
  'aria-label': ariaLabel,
  hint,
  tooltip,
  optionTooltip,
  optionTooltipProps,
  optionTooltipDelay = 500,
  options,
  components,
  loadingMessage = 'Loading...',
  noOptionsMessage = 'No Options',
  filterOption,
  searchable = true,
  clearable = true,
  clearOnEsc,
  creatable,
  multi,
  menuPlacement = 'auto',
  openMenuOnPress = true,
  openMenuOnFocus = true,
  scrollMenuIntoView = true,
  captureMenuScroll = false, // do not remove false; Select's default is true
  minMenuHeight = 80,
  maxMenuHeight = 208,
  tabSelectsValue = true,
  hideSelections,
  autoFocus,
  highlight,
  loading,
  input,
  meta,
  disabled,
  onContextMenu,
}: DropdownProps, forwardedRef): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<SelectInstance>(null);
  const colorScheme = useColorScheme();

  const Component = creatable
    ? Creatable as CreatableComponent
    : Select as SelectComponent;

  // see ValueField for an explanation as to why we track active internally, instead of using react-final-form
  const [active, setActive] = React.useState<boolean>(meta?.active ?? false);

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
  );

  const [valueOption, setValueOption] = React.useState<DropdownOption | DropdownOption[]>(null);

  React.useEffect(() => {
    if (!input?.value) {
      return setValueOption(null);
    }

    const flatOptions = options
      .flatMap((option) => (option?.options ? option.options : option));

    let val = multi
      ? flatOptions.filter((o) => (input as DropdownFieldMultiInput).value?.includes?.(o?.value))
      : flatOptions.find((o) => o?.value === (input as DropdownFieldSingleInput).value);

    if (!val && input?.value && creatable) {
      const newValue = Array.isArray(input.value) ? input.value[0] : input.value;
      const newOption = { label: newValue.toString(), value: newValue };

      val = multi ? [newOption] : newOption;
    }

    setValueOption(val);
  }, [
    creatable,
    input,
    multi,
    options,
  ]);

  // keeps track of whether the user has recently entered something into the input field
  // (when an optionTooltip is present, not having this would cause stuttering while typing)
  const [filtering, setFiltering] = React.useState(false);
  const timeoutFiltering = useDebouncy(() => setFiltering(false), optionTooltipDelay);

  React.useEffect(() => {
    if (!optionTooltip || !filtering) {
      return;
    }

    timeoutFiltering();
  }, [
    filtering,
    optionTooltip,
    timeoutFiltering,
  ]);

  // update (2024/01/16): do the same thing for the scrollState (so that tooltips don't fly off the screen LOL)
  const scrollState = React.useState(false);
  const timeoutScrolling = useDebouncy(() => scrollState[1](false), optionTooltipDelay);

  React.useEffect(() => {
    if (!optionTooltip || !scrollState[0]) {
      return;
    }

    timeoutScrolling();
  }, [
    optionTooltip,
    scrollState,
    timeoutScrolling,
  ]);

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

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (typeof meta?.active !== 'boolean') {
      setActive(true);
    }

    input?.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (typeof meta?.active !== 'boolean') {
      setActive(false);
    }

    input?.onBlur?.(e);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={cx(
          styles.container,
          !!colorScheme && styles[colorScheme],
        )}
        onContextMenu={onContextMenu || ((e) => {
          e?.preventDefault();
          e?.stopPropagation();
        })}
      >
        <Component
          ref={ref}
          instanceId={`Dropdown:${creatable ? 'Creatable' : 'Select'}:${input?.name || '???'}`}
          classNamePrefix="select"
          containerClassName={cx(
            styles.selectContainer,
            hasValue && styles.hasValue,
            (meta?.active || active) && styles.active,
            highlight && styles.highlight,
            disabled && styles.disabled,
            className,
          )}
          containerStyle={style}
          aria-label={ariaLabel}
          tabIndex={disabled ? -1 : tabIndex}
          placeholder={hint}
          filtering={filtering}
          scrollState={scrollState}
          optionTooltip={optionTooltip}
          optionTooltipProps={optionTooltipProps}
          optionTooltipDelay={optionTooltipDelay}
          options={options}
          filterOption={filterOption || createAliasFilter()}
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
            LoadingIndicator: SelectLoadingIndicator,
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
          menuPosition="absolute"
          menuPlacement={menuPlacement}
          openMenuOnClick={openMenuOnPress}
          openMenuOnFocus={openMenuOnFocus}
          menuShouldScrollIntoView={scrollMenuIntoView}
          captureMenuScroll={captureMenuScroll}
          minMenuHeight={minMenuHeight}
          maxMenuHeight={maxMenuHeight}
          closeMenuOnSelect={!multi}
          isSearchable={searchable}
          isClearable={clearable}
          isMulti={multi}
          isLoading={loading}
          isDisabled={disabled}
          onInputChange={() => setFiltering(true)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <Tooltip
        reference={containerRef}
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
