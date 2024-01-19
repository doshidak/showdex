import * as React from 'react';
import { type GroupBase, type OptionProps } from 'react-select';
import useDebouncy from 'use-debouncy/lib/effect';
import cx from 'classnames';
import { Tooltip } from '@showdex/components/ui';
import { type DropdownOption } from './Dropdown';
import { type SelectProps } from './SelectContainer';
import styles from './Dropdown.module.scss';

export type SelectOptionProps<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
> = Modify<OptionProps<Option, Multi, Group>, {
  selectProps: SelectProps<Option, Multi, Group>;
}>;

/* eslint-disable @typescript-eslint/indent */

export const SelectOption = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  innerRef,
  className,
  data,
  isFocused,
  isSelected,
  isDisabled,
  innerProps,
  // selectProps,
  selectProps: {
    filtering,
    scrollState,
    optionTooltip: OptionTooltip,
    optionTooltipProps,
    optionTooltipDelay,
  } = {},
  children,
}: SelectOptionProps<Option, Multi, Group>): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(
    innerRef,
    () => containerRef.current,
  );

  // const tooltip = React.useMemo(
  //   () => selectProps?.optionTooltip?.(data),
  //   [data, selectProps],
  // );

  // conditionally render the Tippy, otherwise, would cause insane lag when opening
  // due to each option's Tippy content rendering (even if not visible!)
  const [tooltipVisible, setTooltipVisible] = React.useState(false);

  React.useEffect(() => {
    const shouldNotUpdate = tooltipVisible
      || optionTooltipProps?.hidden
      || filtering
      || !OptionTooltip
      || !data?.value
      || !isFocused;

    if (shouldNotUpdate) {
      return;
    }

    setTooltipVisible(true);
  }, [
    data,
    filtering,
    isFocused,
    OptionTooltip,
    optionTooltipProps?.hidden,
    tooltipVisible,
  ]);

  // keep track of our own focused state to emulate the Tippy's delay prop
  const [focused, setFocused] = React.useState(isFocused);

  // debounce focused from false -> true @ 1000 ms (i.e., 1000 in delay [1000, 0])
  useDebouncy(() => {
    if (!isFocused || scrollState?.[0]) {
      return;
    }

    setFocused(true);
  }, optionTooltipDelay, [
    isFocused,
    scrollState,
  ]);

  // immediately update focused from true -> false (i.e., 0 in delay [1000, 0])
  React.useEffect(() => {
    if (isFocused && !scrollState?.[0]) {
      return;
    }

    setFocused(false);
  }, [
    isFocused,
    scrollState,
  ]);

  // const tooltipContent = React.useMemo(
  //   () => (tooltipVisible ? selectProps?.optionTooltip?.(data) : null),
  //   [data, selectProps, tooltipVisible],
  // );

  // const tooltipContent = React.useCallback(() => (OptionTooltip ? (
  //   <OptionTooltip
  //     // {...optionTooltipProps}
  //     {...data}
  //   />
  // ) : null), [
  //   data,
  //   // isFocused,
  //   OptionTooltip,
  //   // optionTooltipProps,
  // ]);

  // const [tooltipVisible, setTooltipVisible] = React.useState(false);

  // useDebouncy(() => {
  //   setTooltipVisible(!!tooltip && isFocused);
  // }, 1000, [
  //   isFocused,
  //   tooltip,
  // ]);

  return (
    <>
      <div
        ref={containerRef}
        className={cx(
          styles.option,
          styles.optionItem,
          isFocused && styles.focused,
          isSelected && styles.selected,
          (isDisabled || data?.disabled) && styles.disabled,
          className,
        )}
        {...innerProps}
      >
        {
          !!data?.label &&
          <div className={styles.optionRow}>
            <div
              className={cx(styles.optionLabel, data.labelClassName)}
              style={data.labelStyle}
            >
              {data.label}
            </div>

            {
              !!data?.rightLabel &&
              <div className={styles.optionRightLabel}>
                {data.rightLabel}
              </div>
            }
          </div>
        }

        {
          !!data?.subLabel &&
          <div className={styles.optionSubLabel}>
            {data.subLabel}
          </div>
        }

        {!data?.label && !data?.subLabel && children}
      </div>

      {
        tooltipVisible &&
        <Tooltip
          reference={containerRef}
          content={(
            <OptionTooltip
              {...optionTooltipProps}
              {...data}
            />
          )}
          placement="right"
          offset={[0, 10]}
          visible={focused}
          derender={!data?.value || optionTooltipProps?.hidden || filtering || scrollState?.[0]}
          disabled={isDisabled}
        />
      }
    </>
  );
};

/* eslint-enable @typescript-eslint/indent */
