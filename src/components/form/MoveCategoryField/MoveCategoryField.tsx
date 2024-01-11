import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { type FieldRenderProps } from 'react-final-form';
import cx from 'classnames';
import { type GenerationNum } from '@smogon/calc';
import { useSandwich } from '@showdex/components/layout';
import {
  type ButtonElement,
  type TooltipProps,
  // Button,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { PokemonBoostNames } from '@showdex/consts/dex';
import { type CalcdexMoveOverride } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { detectGenFromFormat } from '@showdex/utils/dex';
import {
  type MoveCategoryFieldLabel,
  findCategoryLabel,
  MoveCategoryFieldDefaultLabels,
} from './findCategoryLabel';
import styles from './MoveCategoryField.module.scss';

export interface MoveCategoryFieldProps extends FieldRenderProps<CalcdexMoveOverride, ButtonElement> {
  className?: string;
  style?: React.CSSProperties;
  tabIndex?: number;
  ariaLabel?: string;
  labels?: MoveCategoryFieldLabel[];
  tooltipPlacement?: TooltipProps['placement'];
  format?: string | GenerationNum;
  readOnly?: boolean;
  disabled?: boolean;
}

export const MoveCategoryField = React.forwardRef<ButtonElement, MoveCategoryFieldProps>(({
  className,
  style,
  tabIndex = 0,
  ariaLabel,
  labels = [],
  tooltipPlacement = 'top',
  input,
  readOnly,
  format,
  disabled,
}: MoveCategoryFieldProps, forwardedRef): JSX.Element => {
  const containerRef = React.useRef<ButtonElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => containerRef.current,
  );

  const {
    id: optionsId,
    active: optionsVisible,
    requestOpen: requestOptionsOpen,
    notifyClose: notifyOptionsClose,
  } = useSandwich();

  const { t } = useTranslation('pokedex');
  const colorScheme = useColorScheme();

  const label = React.useMemo(() => findCategoryLabel(
    input?.value?.category === 'Status' ? 'status' : input?.value?.offensiveStat,
    input?.value?.defensiveStat,
    ...labels,
  ), [
    input?.value?.category,
    input?.value?.defensiveStat,
    input?.value?.offensiveStat,
    labels,
  ]);

  const key = `MoveCategoryField:${input?.name || optionsId || '???'}`;
  const gen = detectGenFromFormat(format);

  return (
    <Tooltip
      className={styles.tooltipContainer}
      content={(
        <div
          className={cx(
            styles.tooltip,
            !!colorScheme && styles[colorScheme],
          )}
        >
          <div className={styles.statPresets}>
            {MoveCategoryFieldDefaultLabels.map(([
              atk,
              def,
              presetLabel,
            ]) => {
              if (atk === 'status') {
                return null;
              }

              const active = input?.value?.offensiveStat === atk
                && input?.value?.defensiveStat === def;

              return (
                <ToggleButton
                  key={`${key}:ToggleButton:StatPreset:${atk}:${def}:${formatId(presetLabel)}`}
                  className={styles.statPresetOption}
                  label={t(`pokedex:categories.${formatId(presetLabel)}.1`, presetLabel)}
                  primary
                  active={active}
                  activeScale={active ? 0.98 : undefined}
                  forceColorScheme={colorScheme === 'light' ? 'dark' : 'light'}
                  onPress={() => input?.onChange?.({
                    offensiveStat: atk,
                    defensiveStat: def,
                  })}
                />
              );
            })}
          </div>

          <div className={styles.statSections}>
            <div className={cx(styles.statSectionTitle, styles.top)}>
              {t('pokedex:headers.offense')}
            </div>

            <div className={styles.statSectionOptions}>
              {PokemonBoostNames.map((name) => {
                if (gen === 1 && name === 'spd') {
                  return null;
                }

                const stat = gen === 1 && name === 'spa' ? 'spc' : name;
                const statLabel = t(`pokedex:stats.${formatId(stat)}.1`, stat.toUpperCase());

                return (
                  <ToggleButton
                    key={`${key}:ToggleButton:Offense:${name}`}
                    className={styles.statSectionOption}
                    label={statLabel}
                    primary
                    active={input?.value?.offensiveStat === name}
                    activeScale={input?.value?.offensiveStat === name ? 0.98 : undefined}
                    forceColorScheme={colorScheme === 'light' ? 'dark' : 'light'}
                    onPress={() => input?.onChange?.({
                      offensiveStat: name,
                    })}
                  />
                );
              })}
            </div>

            <div className={cx(styles.vsLabel, styles.vertical)}>
              vs
            </div>

            <div className={styles.statSectionOptions}>
              {PokemonBoostNames.map((name) => {
                if (gen === 1 && name === 'spa') {
                  return null;
                }

                const stat = gen === 1 && name === 'spd' ? 'spc' : name;
                const statLabel = t(`pokedex:stats.${formatId(stat)}.1`, stat.toUpperCase());

                return (
                  <ToggleButton
                    key={`${key}:ToggleButton:Defense:${name}`}
                    className={styles.statSectionOption}
                    label={statLabel}
                    primary
                    active={input?.value?.defensiveStat === name}
                    activeScale={input?.value?.defensiveStat === name ? 0.98 : undefined}
                    forceColorScheme={colorScheme === 'light' ? 'dark' : 'light'}
                    onPress={() => input?.onChange?.({
                      defensiveStat: name,
                    })}
                  />
                );
              })}
            </div>

            <div className={cx(styles.statSectionTitle, styles.bottom)}>
              {t('pokedex:headers.defense')}
            </div>
          </div>
        </div>
      )}
      visible={optionsVisible}
      interactive
      placement={tooltipPlacement}
      offset={[0, 10]}
      disabled={readOnly || disabled}
      onClickOutside={notifyOptionsClose}
    >
      <ToggleButton
        ref={containerRef}
        className={cx(
          styles.container,
          !!colorScheme && styles[colorScheme],
          readOnly && styles.readOnly,
          disabled && styles.disabled,
          className,
        )}
        style={style}
        // display="block"
        label={ariaLabel}
        hideLabel
        tabIndex={readOnly || disabled ? -1 : tabIndex}
        primary={input?.value?.category !== 'Status'}
        hoverScale={1}
        onPress={optionsVisible ? notifyOptionsClose : requestOptionsOpen}
      >
        {t(`pokedex:categories.${formatId(label?.[2])}.1`, '') || (
          <>
            <div>
              {t('pokedex:stats.' + (
                gen === 1 && input?.value?.offensiveStat === 'spa'
                  ? 'spc'
                  : (input?.value?.offensiveStat || '')
              ) + '.1', '') || <>&mdash;</>}
            </div>
            <div className={cx(styles.vsLabel, styles.horizontal)}>
              vs
            </div>
            <div>
              {t('pokedex:stats.' + (
                gen === 1 && input?.value?.defensiveStat === 'spd'
                  ? 'spc'
                  : (input?.value?.defensiveStat || '')
              ) + '.1', '') || <>&mdash;</>}
            </div>
          </>
        )}
      </ToggleButton>
    </Tooltip>
  );
});
