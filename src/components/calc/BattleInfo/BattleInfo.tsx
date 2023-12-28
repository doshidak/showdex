import * as React from 'react';
import { useDebouncyFn } from 'use-debouncy';
import cx from 'classnames';
import { formatDistanceToNow } from 'date-fns';
import { type GenerationNum } from '@smogon/calc';
import { BattleGenOptionTooltip } from '@showdex/components/app';
import { Dropdown, InlineField } from '@showdex/components/form';
import { useColorScheme } from '@showdex/redux/store';
import { logger } from '@showdex/utils/debug';
import { buildFormatOptions, buildGenOptions } from '@showdex/utils/ui';
import { useCalcdexContext } from '../CalcdexContext';
import styles from './BattleInfo.module.scss';

export interface BattleInfoProps {
  className?: string;
  style?: React.CSSProperties;
}

const genOptions = buildGenOptions();
const l = logger('@showdex/components/calc/BattleInfo');

export const BattleInfo = ({
  className,
  style,
}: BattleInfoProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const {
    state,
    // settings,
    saving,
    updateBattle,
  } = useCalcdexContext();

  const {
    containerSize,
    operatingMode,
    battleId,
    name,
    gen,
    format,
    cached,
  } = state || {};

  const formatOptions = React.useMemo(
    () => buildFormatOptions(gen),
    [gen],
  );

  // used for the honk name, so it doesn't lag when you type fast af
  const debouncyUpdate = useDebouncyFn(updateBattle, 1000);

  return (
    <div
      className={cx(
        styles.container,
        containerSize === 'xs' && styles.verySmol,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div>
        <div className={styles.labelContainer}>
          <div className={styles.dropdownLabel}>
            Gen
            {
              !!gen &&
              <>
                {' '}{gen}
              </>
            }
          </div>
        </div>

        <Dropdown
          aria-label="Generation Selector"
          hint="???"
          optionTooltip={BattleGenOptionTooltip}
          input={{
            name: `BattleInfo:${battleId}:Gen`,
            value: gen,
            onChange: (value: GenerationNum) => updateBattle({
              gen: value,
            }, `${l.scope}:Dropdown~Gen:input.onChange()`),
          }}
          options={genOptions}
          noOptionsMessage="No Generations"
          clearable={false}
          disabled={operatingMode !== 'standalone'}
        />
      </div>

      <div>
        <div className={styles.labelContainer}>
          <div className={styles.dropdownLabel}>
            Format
          </div>

          {/*
            !legacy &&
            <ToggleButton
              className={styles.toggleButton}
              label={gameType}
              tooltip={(
                <div className={styles.tooltipContent}>
                  Switch to{' '}
                  <strong>{gameType === 'Singles' ? 'Doubles' : 'Singles'}</strong>
                </div>
              )}
              tooltipDisabled={!settings?.showUiTooltips}
              absoluteHover
              disabled={operatingMode !== 'standalone'}
              onPress={() => updateBattle({
                gameType: gameType === 'Singles' ? 'Doubles' : 'Singles',
              }, `${l.scope}:ToggleButton~GameType:onPress()`)}
            />
          */}
        </div>

        <Dropdown
          aria-label="Battle Format Selector"
          hint="???"
          input={{
            name: `BattleInfo:${battleId}:Format`,
            value: format,
            onChange: (value: string) => updateBattle({
              format: value,
            }, `${l.scope}:Dropdown~Format:input.onChange()`),
          }}
          options={formatOptions}
          noOptionsMessage="No Formats"
          clearable={false}
          disabled={operatingMode !== 'standalone'}
        />
      </div>

      <div className={styles.honkInfo}>
        <InlineField
          className={styles.honkName}
          hint="give this nice honk a nice name"
          input={{
            name: `${l.scope}:Dropdown~Name`,
            value: name,
            onChange: (value: string) => debouncyUpdate({
              name: value,
            }, `${l.scope}:Dropdown~Format:input.onChange()`),
          }}
        />

        {
          (!!cached || saving?.[0]) &&
          <div
            className={cx(
              styles.honkStatus,
              !saving?.[0] && styles.saved,
            )}
          >
            {(
              saving?.[0]
                ? 'saving...'
                : Date.now() - cached < (30 * 1000)
                  ? 'saved just now'
                  : `saved ${formatDistanceToNow(cached, { addSuffix: true })?.replace('about ', '')}`
            ).trim()}
          </div>
        }
      </div>
    </div>
  );
};
