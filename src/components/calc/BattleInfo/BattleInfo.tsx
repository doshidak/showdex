/**
 * @file `BattleInfo.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.2.0
 */

import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDebouncyFn } from 'use-debouncy';
import cx from 'classnames';
import { type GenerationNum } from '@smogon/calc';
import {
  createAliasFilter,
  Dropdown,
  GenField,
  InlineField,
} from '@showdex/components/form';
import { Card } from '@showdex/components/layout';
import { ToggleButton } from '@showdex/components/ui';
import { CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';
import { useCalcdexDuplicator, useColorScheme, useHonkdexSettings } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { buildFormatOptions, determineColorScheme } from '@showdex/utils/ui';
import { useCalcdexContext } from '../CalcdexContext';
import { useDurationFormatter } from './useDurationFormatter';
import styles from './BattleInfo.module.scss';

export interface BattleInfoProps {
  className?: string;
  style?: React.CSSProperties;
  onRequestHonkdex?: (instanceId?: string, gen?: GenerationNum, format?: string) => void;
  onLeaveRoom?: () => void;
}

const l = logger('@showdex/components/calc/BattleInfo');

export const BattleInfo = ({
  className,
  style,
  onRequestHonkdex,
  onLeaveRoom,
}: BattleInfoProps): JSX.Element => {
  const { t } = useTranslation('honkdex');
  const colorScheme = useColorScheme();
  const reversedColorScheme = determineColorScheme(colorScheme, true);
  // const colorTheme = useColorTheme();

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
    notes,
    cached,
  } = state || {};

  const genLocked = React.useMemo(
    () => AllPlayerKeys.some((key) => !!state[key]?.pokemon?.length),
    [state],
  );

  const saved = !!cached && !saving?.[0];

  const formatDuration = useDurationFormatter();
  const savedAgo = React.useMemo(() => formatDuration(cached), [cached, formatDuration]);
  const saveLabel = React.useMemo(() => (
    saving?.[0]
      ? t('battle.save.saving')
      : cached > 0
        ? Date.now() - cached < (60 * 1000) || formatId(savedAgo)?.startsWith('lessthan') // fucc it
          ? t('battle.save.savedRecently')
          : t('battle.save.savedAgo', { ago: savedAgo })
        : t('battle.save.unsaved')
  ).trim(), [
    cached,
    savedAgo,
    saving,
    t,
  ]);

  const dupeCalcdex = useCalcdexDuplicator();
  const dupeHonk = React.useCallback(() => {
    // admittedly this is very hacky but yolo 2 lazy 2 make that thunky thunk rn
    const returnRef = { battleId: null as string };

    dupeCalcdex({
      scope: `${l.scope}:${battleId}:dupeHonk()`,
      battleId,
      returnRef,
    });

    onRequestHonkdex?.(returnRef?.battleId);
  }, [
    battleId,
    dupeCalcdex,
    onRequestHonkdex,
  ]);

  const formatOptions = React.useMemo(() => buildFormatOptions(gen, {
    currentFormat: format,
    showAll: honkdexSettings?.showAllFormats,
    translateHeader: (v, d) => t(`pokedex:headers.${formatId(v)}`, { ...d, defaultValue: v }),
  }), [
    format,
    gen,
    honkdexSettings?.showAllFormats,
    t,
  ]);

  const formatOptionsFilter = React.useMemo(
    () => createAliasFilter(t('pokedex:formatAliases', { returnObjects: true }) as Record<string, string>),
    [t],
  );

  // used for the honk name, so it doesn't lag when you type fast af
  const debouncyUpdate = useDebouncyFn(updateBattle, 1000);

  const handleGenChange = React.useCallback((
    value: GenerationNum,
  ) => {
    if (genLocked) {
      return void onRequestHonkdex?.(null, value);
    }

    updateBattle({
      gen: value,
    }, `${l.scope}:${battleId}:handleGenChange()`);
  }, [
    battleId,
    genLocked,
    onRequestHonkdex,
    updateBattle,
  ]);

  return (
    <Card
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
            }, `${l.scope}:${battleId}:Name~InlineField:input.onChange()`),
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
              }, `${l.scope}:${battleId}:Format~Dropdown:input.onChange()`),
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
            label={saveLabel}
            absoluteHover
            active={saving?.[0]}
            disabled={operatingMode !== 'standalone' || saving?.[0] || !name}
            onPress={saveHonk}
          />

          <ToggleButton
            className={styles.toggleButton}
            active={notes?.pre?.visible}
            absoluteHover
            disabled={operatingMode !== 'standalone' || saving?.[0]}
            onPress={() => void updateBattle({
              notes: { pre: { visible: !notes?.pre?.visible } },
            }, `${l.scope}:${battleId}:Notes:Pre:Visible~ToggleButton:onPress()`)}
          >
            <span>{t('common:products.note_one', 'Note')}</span>
            <i className="fa fa-arrow-up" />
          </ToggleButton>

          <ToggleButton
            className={styles.toggleButton}
            active={notes?.post?.visible}
            absoluteHover
            disabled={operatingMode !== 'standalone' || saving?.[0]}
            onPress={() => void updateBattle({
              notes: { post: { visible: !notes?.post?.visible } },
            }, `${l.scope}:${battleId}:Notes:Post:Visible~ToggleButton:onPress()`)}
          >
            <i className="fa fa-arrow-down" />
            <span>{t('common:products.note_one', 'Note')}</span>
          </ToggleButton>

          <ToggleButton
            className={styles.toggleButton}
            label={t('battle.dupe.label', 'Dupe')}
            tooltip={(
              <Trans
                t={t}
                i18nKey="battle.dupe.tooltip"
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            )}
            absoluteHover
            disabled={operatingMode !== 'standalone' || saving?.[0]}
            onPress={dupeHonk}
          />

          <ToggleButton
            className={styles.toggleButton}
            absoluteHover
            onPress={onLeaveRoom}
          >
            <i className="fa fa-close" />
            <span>{t('battle.close.label', 'Close')}</span>
          </ToggleButton>
        </div>
      </div>
    </Card>
  );
};
