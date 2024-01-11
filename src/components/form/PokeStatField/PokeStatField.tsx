import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { type FieldRenderProps } from 'react-final-form';
import cx from 'classnames';
import { type GenerationNum } from '@smogon/calc';
import { useSandwich } from '@showdex/components/layout';
import {
  type ButtonElement,
  type TooltipProps,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { PokemonStatNames } from '@showdex/consts/dex';
import { useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { detectGenFromFormat, detectLegacyGen } from '@showdex/utils/dex';
import { determineColorScheme } from '@showdex/utils/ui';
import styles from './PokeStatField.module.scss';

export interface PokeStatFieldProps extends FieldRenderProps<Showdown.StatName, ButtonElement> {
  className?: string;
  style?: React.CSSProperties;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  tabIndex?: number;
  label?: string;
  defaultLabel?: string;
  override?: string;
  headerPrefix?: React.ReactNode;
  headerSuffix?: React.ReactNode;
  tooltipPlacement?: TooltipProps['placement'];
  format?: string | GenerationNum;
  omitHpStat?: boolean;
  clearable?: boolean;
  highlightLabel?: boolean;
  toggleActive?: boolean;
  absoluteHover?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}

export const PokeStatField = React.forwardRef<ButtonElement, PokeStatFieldProps>(({
  className,
  style,
  labelClassName,
  labelStyle,
  tabIndex = 0,
  label,
  defaultLabel = '???',
  override,
  headerPrefix,
  headerSuffix,
  tooltipPlacement = 'top',
  format,
  omitHpStat,
  clearable,
  highlightLabel,
  input,
  toggleActive,
  absoluteHover,
  readOnly,
  disabled,
}, forwardedRef): JSX.Element => {
  const containerRef = React.useRef<ButtonElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => containerRef.current,
  );

  const { t } = useTranslation('pokedex');
  const colorScheme = useColorScheme();
  const reversedColorScheme = determineColorScheme(colorScheme, true);

  const gen = detectGenFromFormat(format);
  const legacy = detectLegacyGen(format);

  const {
    id: optionsId,
    active: optionsVisible,
    requestOpen: requestOptionsOpen,
    notifyClose: notifyOptionsClose,
  } = useSandwich();

  const toggleOptions = optionsVisible ? notifyOptionsClose : requestOptionsOpen;

  const handleChange = (
    value: Showdown.StatName,
  ) => {
    const shouldChangeValue = !!value
      && typeof input?.onChange === 'function'
      && (clearable || value !== input.value)
      && (!omitHpStat || value !== 'hp');

    if (shouldChangeValue) {
      input.onChange(value === input.value ? null : value);
    }

    notifyOptionsClose();
  };

  return (
    <Tooltip
      className={styles.optionsTooltip}
      content={readOnly || disabled ? null : (
        <div
          className={cx(
            styles.optionsContainer,
            !!reversedColorScheme && styles[reversedColorScheme],
          )}
        >
          {
            (!!headerPrefix || !!label || !!headerSuffix) &&
            <div className={styles.header}>
              {headerPrefix}

              {
                !!label &&
                <div
                  className={cx(
                    styles.label,
                    highlightLabel && styles.highlight,
                    labelClassName,
                  )}
                  style={labelStyle}
                >
                  {label}
                </div>
              }

              {headerSuffix}
            </div>
          }

          <div className={styles.options}>
            {PokemonStatNames.map((stat) => {
              if ((legacy && stat === 'spd') || (omitHpStat && stat === 'hp')) {
                return null;
              }

              const active = input?.value === stat;
              const statName = (gen === 1 && stat === 'spa' && 'spc') || stat;
              const statLabel = t(`stats.${formatId(statName)}.1`);

              return (
                <ToggleButton
                  key={`PokeStatField:${input?.name || optionsId}:Options:${stat}`}
                  className={styles.optionButton}
                  aria-label={`Select the ${stat.toUpperCase()} Stat`}
                  label={statLabel}
                  primary
                  active={active}
                  activeScale={active ? 0.98 : undefined}
                  forceColorScheme={reversedColorScheme}
                  onPress={() => handleChange(stat)}
                />
              );
            })}
          </div>
        </div>
      )}
      visible={optionsVisible}
      interactive
      placement={tooltipPlacement}
      offset={[0, 10]}
      onClickOutside={notifyOptionsClose}
    >
      <ToggleButton
        ref={containerRef}
        className={cx(
          styles.container,
          readOnly && styles.readOnly,
          className,
        )}
        style={style}
        aria-label={label}
        tabIndex={readOnly || disabled ? -1 : tabIndex}
        label={override || t(`stats.${formatId(input?.value)}.1`, input?.value || '') || defaultLabel}
        absoluteHover={absoluteHover}
        active={toggleActive}
        hoverScale={1}
        onPress={toggleOptions}
      />
    </Tooltip>
  );
});
