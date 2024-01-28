import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDebouncyFn } from 'use-debouncy';
import cx from 'classnames';
import { formatDistanceToNow } from 'date-fns';
import { type GenerationNum } from '@smogon/calc';
import {
  createAliasFilter,
  Dropdown,
  GenField,
  InlineField,
} from '@showdex/components/form';
import { ToggleButton } from '@showdex/components/ui';
import { type CalcdexBattleState, CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';
import { useColorScheme, useHonkdexSettings } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { buildFormatOptions, determineColorScheme } from '@showdex/utils/ui';
import { useCalcdexContext } from '../CalcdexContext';
import styles from './BattleInfo.module.scss';

export interface BattleInfoProps {
  className?: string;
  style?: React.CSSProperties;
  onRequestHonkdex?: (instanceId?: string, initState?: Partial<CalcdexBattleState>) => void;
}

const l = logger('@showdex/components/calc/BattleInfo');

export const BattleInfo = ({
  className,
  style,
  onRequestHonkdex,
}: BattleInfoProps): JSX.Element => {
  const { t } = useTranslation('honkdex');
  const colorScheme = useColorScheme();
  const reversedColorScheme = determineColorScheme(colorScheme, true);

  const {
    state,
    saving,
    updateBattle,
    saveHonk,
  } = useCalcdexContext();

  const honkdexSettings = useHonkdexSettings();

  const {
    operatingMode,
    battleId,
    name,
    defaultName,
    gen,
    format,
    cached,
  } = state || {};

  const genLocked = React.useMemo(
    () => AllPlayerKeys.some((key) => !!state[key]?.pokemon?.length),
    [state],
  );

  const saved = !!cached && !saving?.[0];

  // quick 'n dirty baby lessgo LOL
  const savedAgo = React.useMemo<string>(() => {
    if (!cached) {
      return null;
    }

    const raw = formatDistanceToNow(cached)?.replace('about ', '');
    const [, distGroup, unitGroup] = /([.,\d]+)?\s+([a-z]+[^s])s?$/i.exec(raw) || [];

    if (!distGroup || !unitGroup) {
      return raw;
    }

    const distValue = parseInt(distGroup, 10) || 0;
    const distUnit = formatId(unitGroup);

    if (!distValue || !distUnit) {
      return raw;
    }

    const distUnitLabel = t(`common:time.${distUnit}`, { count: distValue });

    if (!distUnitLabel) {
      return raw;
    }

    return `${distValue} ${distUnitLabel}`;
  }, [
    cached,
    t,
  ]);

  const formatOptions = React.useMemo(() => buildFormatOptions(
    gen,
    {
      currentFormat: format,
      showAll: honkdexSettings?.showAllFormats,
      translateHeader: (v) => t(`pokedex:headers.${formatId(v)}`, v),
    },
  ), [
    format,
    gen,
    honkdexSettings?.showAllFormats,
    t,
  ]);

  const formatOptionsFilter = React.useMemo(
    () => createAliasFilter(t('pokedex:formatAliases', { returnObjects: true })),
    [t],
  );

  // used for the honk name, so it doesn't lag when you type fast af
  const debouncyUpdate = useDebouncyFn(updateBattle, 1000);

  const handleGenChange = (
    value: GenerationNum,
  ) => {
    if (genLocked) {
      return void onRequestHonkdex?.(null, { gen: value });
    }

    updateBattle({
      gen: value,
    }, `${l.scope}:${battleId}:handleGenChange()`);
  };

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <GenField
        optionClassName={cx(
          styles.genOptionButton,
          !!reversedColorScheme && styles[reversedColorScheme],
          genLocked && styles.genLocked,
        )}
        optionLabelClassName={styles.label}
        label={t('battle.gen.aria') as React.ReactNode}
        tooltipPrefix={genLocked ? (
          <div
            className={cx(
              styles.genWarning,
              !!reversedColorScheme && styles[reversedColorScheme],
            )}
          >
            <div className={styles.description}>
              <i className="fa fa-exclamation-circle" />
              <Trans
                t={t}
                i18nKey="battle.gen.locked"
                shouldUnescape
              />
            </div>
          </div>
        ) : null}
        input={{
          name: `${l.scope}:${battleId}:Gen`,
          value: gen,
          onChange: handleGenChange,
        }}
        readOnly={genLocked && typeof onRequestHonkdex !== 'function'}
      />

      <div className={styles.honkInfo}>
        <InlineField
          className={styles.honkName}
          hint={defaultName || t('battle.name.hint') as React.ReactNode}
          input={{
            name: `${l.scope}:${battleId}:Name`,
            value: name,
            onChange: (value: string) => debouncyUpdate({
              name: value,
            }, `${l.scope}:Dropdown~Format:input.onChange()`),
          }}
        />

        <div className={styles.honkProps}>
          <Dropdown
            aria-label={t('battle.format.aria') as React.ReactNode}
            hint="???"
            input={{
              name: `${l.scope}:${battleId}:Format`,
              value: format,
              onChange: (value: string) => updateBattle({
                format: value,
              }, `${l.scope}:Dropdown~Format:input.onChange()`),
            }}
            options={formatOptions}
            noOptionsMessage={t('battle.format.empty') as React.ReactNode}
            filterOption={formatOptionsFilter}
            clearable={false}
            disabled={operatingMode !== 'standalone'}
          />

          <ToggleButton
            className={cx(
              styles.toggleButton,
              styles.honkStatus,
              saved && styles.saved,
            )}
            label={(
              saving?.[0]
                ? t('battle.save.saving')
                : (cached || 0) > 0
                  ? Date.now() - cached < (60 * 1000) || formatId(savedAgo)?.startsWith('lessthan') // fucc it
                    ? t('battle.save.savedRecently')
                    : t('battle.save.savedAgo', { ago: savedAgo })
                  : t('battle.save.unsaved')
            ).trim()}
            absoluteHover
            active={saving?.[0]}
            disabled={operatingMode !== 'standalone' || saving?.[0] || !name}
            onPress={saveHonk}
          />
        </div>
      </div>
    </div>
  );
};
