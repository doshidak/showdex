import * as React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import cx from 'classnames';
import { useSandwich } from '@showdex/components/layout';
import {
  type ButtonElement,
  type TooltipProps,
  // Button,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { PokemonBoostNames } from '@showdex/consts/dex';
import { type CalcdexMoveOverride, useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { useUserAgent } from '@showdex/utils/hooks';
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
  readOnly?: boolean;
  disabled?: boolean;
}

export const MoveCategoryField = React.forwardRef<ButtonElement, MoveCategoryFieldProps>(({
  className,
  style,
  tabIndex = 0,
  ariaLabel,
  labels = [],
  tooltipPlacement = 'top-start',
  input,
  readOnly,
  disabled,
}: MoveCategoryFieldProps, forwardedRef): JSX.Element => {
  const containerRef = React.useRef<ButtonElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => containerRef.current,
  );

  // ... ok I'll address this tooltip issue next time ... LOL
  const userAgent = useUserAgent();
  const nonMacOS = !['macos', 'ios'].includes(formatId(userAgent?.os?.name));

  const {
    id: optionsId,
    active: optionsVisible,
    requestOpen: requestOptionsOpen,
    notifyClose: notifyOptionsClose,
  } = useSandwich();

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
                  label={presetLabel}
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
              Offense
            </div>

            <div className={styles.statSectionOptions}>
              {PokemonBoostNames.map((stat) => (
                <ToggleButton
                  key={`${key}:ToggleButton:Offense:${stat}`}
                  className={styles.statSectionOption}
                  label={stat.toUpperCase()}
                  primary
                  active={input?.value?.offensiveStat === stat}
                  activeScale={input?.value?.offensiveStat === stat ? 0.98 : undefined}
                  forceColorScheme={colorScheme === 'light' ? 'dark' : 'light'}
                  onPress={() => input?.onChange?.({
                    offensiveStat: stat,
                  })}
                />
              ))}
            </div>

            <div className={cx(styles.vsLabel, styles.vertical)}>
              vs
            </div>

            <div className={styles.statSectionOptions}>
              {PokemonBoostNames.map((stat) => (
                <ToggleButton
                  key={`${key}:ToggleButton:Defense:${stat}`}
                  className={styles.statSectionOption}
                  label={stat.toUpperCase()}
                  primary
                  active={input?.value?.defensiveStat === stat}
                  activeScale={input?.value?.defensiveStat === stat ? 0.98 : undefined}
                  forceColorScheme={colorScheme === 'light' ? 'dark' : 'light'}
                  onPress={() => input?.onChange?.({
                    defensiveStat: stat,
                  })}
                />
              ))}
            </div>

            <div className={cx(styles.statSectionTitle, styles.bottom)}>
              Defense
            </div>
          </div>
        </div>
      )}
      visible={optionsVisible}
      interactive
      popperOptions={nonMacOS ? { strategy: 'fixed' } : undefined}
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
        {label?.[2] || (
          <>
            <div>{input?.value?.offensiveStat || <>&mdash;</>}</div>
            <div className={cx(styles.vsLabel, styles.horizontal)}>
              vs
            </div>
            <div>{input?.value?.defensiveStat || <>&mdash;</>}</div>
          </>
        )}
      </ToggleButton>
    </Tooltip>
  );
});
