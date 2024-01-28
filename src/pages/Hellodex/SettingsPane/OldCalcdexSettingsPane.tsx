import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { format } from 'date-fns';
import { Segmented, Switch, TextField } from '@showdex/components/form';
import { ShowdexPresetsBundles } from '@showdex/consts/app/presets';
import { GenLabels } from '@showdex/consts/dex';
import { type ShowdexCalcdexSettings } from '@showdex/interfaces/app';
import { getGenfulFormat, parseBattleFormat } from '@showdex/utils/dex';
import styles from './SettingsPane.module.scss';

export interface OldCalcdexSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  value?: ShowdexCalcdexSettings;
  inBattle?: boolean;
}

export const OldCalcdexSettingsPane = ({
  className,
  style,
  value,
  inBattle,
}: OldCalcdexSettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        {t('pane.sections.primary.calcdex')}
      </div>

      <div className={styles.settingsGroupFields}>
        <Field<ShowdexCalcdexSettings['openOnStart']>
          name="calcdex.openOnStart"
          component={Segmented}
          className={cx(
            styles.field,
            !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.openOnStart.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'playing',
            'spectating',
            'always',
            'never',
          ].map((option) => ({
            label: t(`calcdex.openOnStart.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.openOnStart.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
        />

        <Field<ShowdexCalcdexSettings['openAs']>
          name="calcdex.openAs"
          component={Segmented}
          className={cx(
            styles.field,
            !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.openAs.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'panel',
            'overlay',
            'showdown',
          ].map((option) => ({
            label: t(`calcdex.openAs.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.openAs.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
        />

        <div className={styles.settingsGroupTitle}>
          {t('pane.sections.secondary.panel')}
        </div>

        <Field<ShowdexCalcdexSettings['openOnPanel']>
          name="calcdex.openOnPanel"
          component={Segmented}
          className={cx(
            styles.field,
            !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.openOnPanel.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'left',
            'right',
            'showdown',
          ].map((option) => ({
            label: t(`calcdex.openOnPanel.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.openOnPanel.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
          disabled={value?.openAs === 'overlay'}
        />

        <Field<ShowdexCalcdexSettings['closeOn']>
          name="calcdex.closeOn"
          component={Segmented}
          className={cx(
            styles.field,
            !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.closeOn.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'battle-end',
            'battle-tab',
            'never',
          ].map((option) => ({
            label: t(`calcdex.closeOn.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.closeOn.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
          format={(v) => (value?.openAs === 'overlay' ? 'never' : v)}
          disabled={value?.openAs === 'overlay'}
        />

        <Field<ShowdexCalcdexSettings['destroyOnClose']>
          name="calcdex.destroyOnClose"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.destroyOnClose.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.destroyOnClose.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
          format={(v) => (value?.openAs === 'overlay' ? false : v)}
          disabled={value?.openAs === 'overlay'}
        />

        <div className={styles.settingsGroupTitle}>
          {t('pane.sections.secondary.presets')}
        </div>

        <Field<ShowdexCalcdexSettings, HTMLDivElement, ('smogon' | 'randoms' | 'usage')[]>
          name="calcdex"
          component={Segmented}
          className={cx(
            styles.field,
            !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.downloadPresets.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'smogon',
            'randoms',
            'usage',
          ].map((option) => ({
            label: t(`calcdex.downloadPresets.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.downloadPresets.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
          multi
          unique
          parse={(v) => ({
            ...value,
            downloadSmogonPresets: !!v?.includes('smogon'),
            downloadRandomsPresets: !!v?.includes('randoms'),
            downloadUsageStats: !!v?.includes('usage'),
          })}
          format={(v) => ([
            v?.downloadSmogonPresets && 'smogon',
            v?.downloadRandomsPresets && 'randoms',
            v?.downloadUsageStats && 'usage',
          ] as ('smogon' | 'randoms' | 'usage')[]).filter(Boolean)}
        />

        <Field<ShowdexCalcdexSettings['maxPresetAge'], HTMLDivElement, number>
          name="calcdex.maxPresetAge"
          component={Segmented}
          className={cx(
            styles.field,
            !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.maxPresetAge.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            1,
            3,
            7,
            30,
            0, // never
          ].map((count) => ({
            label: t(`calcdex.maxPresetAge.options.${count ? '$count.label_interval' : '0.label'}`, count ? {
              postProcess: 'interval',
              count,
            } : undefined),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.maxPresetAge.options.${count ? '$count' : '0'}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                count={count || undefined}
                shouldUnescape
              />
            ),
            value: count,
          }))}
          disabled={(
            !value?.downloadSmogonPresets
              && !value?.downloadRandomsPresets
              && !value?.downloadUsageStats
          )}
        />

        <Field<ShowdexCalcdexSettings['includeTeambuilder']>
          name="calcdex.includeTeambuilder"
          component={Segmented}
          className={cx(
            styles.field,
            !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.includeTeambuilder.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'teams',
            'boxes',
            'always',
            'never',
          ].map((option) => ({
            label: t(`calcdex.includeTeambuilder.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.includeTeambuilder.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
        />

        <Field<ShowdexCalcdexSettings['includePresetsBundles']>
          name="calcdex.includePresetsBundles"
          component={Segmented}
          className={cx(
            styles.field,
            !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.includePresetsBundles.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={ShowdexPresetsBundles?.filter((b) => !!b?.id && b.tag === 'presets').map((bundle) => ({
            label: bundle.label || bundle.name,
            tooltip: bundle.gen && bundle.format ? (
              <div className={styles.tooltipContent}>
                Gen {bundle.gen} &bull; {GenLabels[bundle.gen]?.label}{' '}
                {parseBattleFormat(getGenfulFormat(bundle.gen, bundle.format)).label}
                <br />
                <strong>{bundle.name}</strong>
                {
                  !!bundle.author &&
                  <>
                    <br />
                    <Trans
                      t={t}
                      i18nKey="calcdex.includePresetsBundles.tooltip.author"
                      values={{ name: bundle.author }}
                      shouldUnescape
                    />
                  </>
                }

                {
                  !!bundle.description &&
                  <>
                    <br />
                    <br />
                    {bundle.description}
                  </>
                }

                {
                  !!bundle.updated &&
                  <>
                    <br />
                    <br />
                    <Trans
                      t={t}
                      i18nKey="calcdex.includePresetsBundles.tooltip.updated"
                      values={{ date: format(new Date(bundle.updated || bundle.created), 'PP') }}
                      shouldUnescape
                    />
                  </>
                }
              </div>
            ) : null,
            value: bundle.id,
            disabled: bundle.disabled,
          }))}
          multi
          unique
        />

        <Field<ShowdexCalcdexSettings['includeOtherMetaPresets']>
          name="calcdex.includeOtherMetaPresets"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.includeOtherMetaPresets.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.includeOtherMetaPresets.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
              values={{ year: new Date().getFullYear() }}
            />
          )}
        />

        <Field<ShowdexCalcdexSettings['prioritizeUsageStats']>
          name="calcdex.prioritizeUsageStats"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.prioritizeUsageStats.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.prioritizeUsageStats.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
          format={(v) => (!value?.downloadUsageStats ? false : v)}
          disabled={!value?.downloadUsageStats}
        />

        <Field<ShowdexCalcdexSettings['autoImportTeamSheets']>
          name="calcdex.autoImportTeamSheets"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.autoImportTeamSheets.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.autoImportTeamSheets.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
              components={{ code: <code /> }}
            />
          )}
        />

        {/* <Field<ShowdexCalcdexSettings['autoExportOpponent']>
          name="calcdex.autoExportOpponent"
          component={Switch}
          className={styles.field}
          label="Auto-Export Opponent's Team"
          tooltip={(
            <div className={styles.tooltipContent}>
              <em>
                This is a planned feature.
                <br />
                Stay tuned!
              </em>
            </div>
          )}
          readOnly
          format={() => false}
        /> */}

        <div className={styles.settingsGroupTitle}>
          {t('pane.sections.secondary.interface')}
        </div>

        <Field<ShowdexCalcdexSettings['authPosition']>
          name="calcdex.authPosition"
          component={Segmented}
          className={cx(
            styles.field,
            // !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.authPosition.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'top',
            'bottom',
            'auto',
          ].map((option) => ({
            label: t(`calcdex.authPosition.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.authPosition.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
        />

        <Field<ShowdexCalcdexSettings['defaultAutoSelect'], HTMLDivElement, ('auth' | 'player')[]>
          name="calcdex.defaultAutoSelect"
          component={Segmented}
          className={cx(
            styles.field,
            // !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.defaultAutoSelect.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'auth',
            'player',
          ].map((option) => ({
            label: t(`calcdex.defaultAutoSelect.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.defaultAutoSelect.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
          multi
          unique
          parse={(v) => ({
            auth: !!v?.includes('auth'),
            p1: !!v?.includes('player'),
            p2: !!v?.includes('player'),
            p3: !!v?.includes('player'),
            p4: !!v?.includes('player'),
          })}
          format={(v) => ([
            v?.auth && 'auth',
            (v?.p1 || v?.p2 || v?.p3 || v?.p4) && 'player',
          ].filter(Boolean) as ('auth' | 'player')[])}
        />

        <Field<ShowdexCalcdexSettings['lockGeneticsVisibility']['auth']>
          name="calcdex.lockGeneticsVisibility.auth"
          component={Segmented}
          className={styles.field}
          label={t('calcdex.lockAuthGenetics.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'base',
            'iv',
            'ev',
          ].map((option) => ({
            labelStyle: option !== 'base' ? { textTransform: 'none' } : undefined,
            label: t(`calcdex.lockAuthGenetics.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.lockAuthGenetics.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
            disabled: option === 'base' && value?.showBaseStats === 'never',
          }))}
          multi
          unique
        />

        <Field<ShowdexCalcdexSettings['lockGeneticsVisibility'], HTMLDivElement, ShowdexCalcdexSettings['lockGeneticsVisibility']['p1']>
          name="calcdex.lockGeneticsVisibility"
          component={Segmented}
          className={styles.field}
          label={t('calcdex.lockPlayerGenetics.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'base',
            'iv',
            'ev',
          ].map((option) => ({
            labelStyle: option !== 'base' ? { textTransform: 'none' } : undefined,
            label: t(`calcdex.lockPlayerGenetics.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.lockPlayerGenetics.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
            disabled: option === 'base' && value?.showBaseStats === 'never',
          }))}
          multi
          unique
          parse={(v) => ({
            ...value?.lockGeneticsVisibility,
            p1: v,
            p2: v,
            p3: v,
            p4: v,
          })}
          format={(v) => [...(v?.p1 || [])]}
        />

        <Field<ShowdexCalcdexSettings['showPlayerRatings']>
          name="calcdex.showPlayerRatings"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.showPlayerRatings.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.showPlayerRatings.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexCalcdexSettings['openSmogonPage']>
          name="calcdex.openSmogonPage"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.openSmogonPage.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.openSmogonPage.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexCalcdexSettings['showNicknames']>
          name="calcdex.showNicknames"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.showNicknames.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.showNicknames.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
              components={{ ndash: <span>&ndash;</span> }}
            />
          )}
        />

        <Field<ShowdexCalcdexSettings['forceNonVolatile']>
          name="calcdex.forceNonVolatile"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.forceNonVolatile.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.forceNonVolatile.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexCalcdexSettings['showSpreadsFirst']>
          name="calcdex.showSpreadsFirst"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.showSpreadsFirst.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.showSpreadsFirst.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexCalcdexSettings['defaultAutoMoves'], HTMLInputElement, boolean>
          name="calcdex.defaultAutoMoves"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.defaultAutoMoves.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.defaultAutoMoves.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
          parse={(v) => ({
            auth: false,
            p1: v,
            p2: v,
            p3: v,
            p4: v,
          })}
          format={(va) => Object.values(va || {}).some((v) => !!v)}
        />

        <Field<ShowdexCalcdexSettings['enableQuickEditor']>
          name="calcdex.enableQuickEditor"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.enableQuickEditor.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.enableQuickEditor.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexCalcdexSettings['showNonDamageRanges']>
          name="calcdex.showNonDamageRanges"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.showNonDamageRanges.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.showNonDamageRanges.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexCalcdexSettings, HTMLDivElement, ('ui' | 'field' | 'ability' | 'item' | 'move' | 'matchup')[]>
          name="calcdex"
          component={Segmented}
          className={cx(
            styles.field,
            !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.showTooltips.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'ui',
            'ability',
            'item',
            'move',
            'matchup',
            'field',
          ].map((option) => ({
            label: t(`calcdex.showTooltips.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.showTooltips.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
            break: option === 'matchup' && inBattle,
          }))}
          multi
          unique
          parse={(v) => ({
            ...value,
            showUiTooltips: !!v?.includes('ui'),
            showFieldTooltips: !!v?.includes('field'),
            showAbilityTooltip: !!v?.includes('ability'),
            showItemTooltip: !!v?.includes('item'),
            showMoveTooltip: !!v?.includes('move'),
            showMatchupTooltip: !!v?.includes('matchup'),
          })}
          format={(v) => ([
            v?.showUiTooltips && 'ui',
            v?.showFieldTooltips && 'field',
            v?.showAbilityTooltip && 'ability',
            v?.showItemTooltip && 'item',
            v?.showMoveTooltip && 'move',
            v?.showMatchupTooltip && 'matchup',
          ].filter(Boolean) as ('ui' | 'field' | 'ability' | 'item' | 'move' | 'matchup')[])}
        />

        <div className={styles.settingsGroupTitle}>
          {t('pane.sections.secondary.matchup_other')}
        </div>

        <Field<ShowdexCalcdexSettings['prettifyMatchupDescription']>
          name="calcdex.prettifyMatchupDescription"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.prettifyMatchupDescription.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.prettifyMatchupDescription.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
          format={(v) => (!value?.showMatchupTooltip ? false : v)}
          disabled={!value?.showMatchupTooltip}
        />

        <Field<ShowdexCalcdexSettings['copyMatchupDescription']>
          name="calcdex.copyMatchupDescription"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.copyMatchupDescription.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.copyMatchupDescription.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
          format={(v) => (!value?.showMatchupTooltip ? false : v)}
          disabled={!value?.showMatchupTooltip}
        />

        <Field<ShowdexCalcdexSettings['showMatchupDamageAmounts']>
          name="calcdex.showMatchupDamageAmounts"
          component={Segmented}
          className={cx(
            styles.field,
            // !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.showMatchupDamageAmounts.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'always',
            'nfe',
            'never',
          ].map((option) => ({
            label: t(`calcdex.showMatchupDamageAmounts.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.showMatchupDamageAmounts.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
          format={(v) => (!value?.showMatchupTooltip ? 'never' : v)}
          disabled={!value?.showMatchupTooltip}
        />

        <Field<ShowdexCalcdexSettings['formatMatchupDamageAmounts']>
          name="calcdex.formatMatchupDamageAmounts"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.formatMatchupDamageAmounts.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.formatMatchupDamageAmounts.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
          format={(v) => (
            !value?.showMatchupTooltip
              || value?.showMatchupDamageAmounts === 'never'
              ? false
              : v
          )}
          disabled={(
            !value?.showMatchupTooltip
              || value?.showMatchupDamageAmounts === 'never'
          )}
        />

        <div className={styles.settingsGroupTitle}>
          {t('pane.sections.secondary.advanced')}
        </div>

        <Field<ShowdexCalcdexSettings['editPokemonTypes']>
          name="calcdex.editPokemonTypes"
          component={Segmented}
          className={cx(
            styles.field,
            // !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.editPokemonTypes.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'always',
            'meta',
            'never',
          ].map((option) => ({
            labelStyle: option === 'meta' ? { textTransform: 'none' } : undefined,
            label: t(`calcdex.editPokemonTypes.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.editPokemonTypes.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
        />

        <Field<ShowdexCalcdexSettings['showMoveEditor']>
          name="calcdex.showMoveEditor"
          component={Segmented}
          className={cx(
            styles.field,
            // !inBattle && styles.singleColumn,
          )}
          label={t('calcdex.showMoveEditor.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'always',
            'meta',
            'never',
          ].map((option) => ({
            labelStyle: option === 'meta' ? { textTransform: 'none' } : undefined,
            label: t(`calcdex.showMoveEditor.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.showMoveEditor.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
        />

        <Field<ShowdexCalcdexSettings['allowIllegalSpreads']>
          name="calcdex.allowIllegalSpreads"
          component={Segmented}
          className={styles.field}
          label={t('calcdex.allowIllegalSpreads.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'always',
            'meta',
            'never',
          ].map((option) => ({
            labelStyle: option === 'meta' ? { textTransform: 'none' } : undefined,
            label: t(`calcdex.allowIllegalSpreads.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.allowIllegalSpreads.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
        />

        <Field<ShowdexCalcdexSettings['showBaseStats']>
          name="calcdex.showBaseStats"
          component={Segmented}
          className={styles.field}
          label={t('calcdex.showBaseStats.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'always',
            'meta',
            'never',
          ].map((option) => ({
            labelStyle: option === 'meta' ? { textTransform: 'none' } : undefined,
            label: t(`calcdex.showBaseStats.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`calcdex.showBaseStats.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
        />

        <Field<ShowdexCalcdexSettings['resetDirtyBoosts']>
          name="calcdex.resetDirtyBoosts"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.resetDirtyBoosts.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.resetDirtyBoosts.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexCalcdexSettings['showLegacyEvs']>
          name="calcdex.showLegacyEvs"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.showLegacyEvs.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.showLegacyEvs.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexCalcdexSettings['lockUsedTera']>
          name="calcdex.lockUsedTera"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.lockUsedTera.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.lockUsedTera.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexCalcdexSettings['showAllOptions']>
          name="calcdex.showAllOptions"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('calcdex.showAllOptions.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="calcdex.showAllOptions.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <div
          className={cx(
            styles.field,
            styles.customField,
            !inBattle && styles.singleColumn,
          )}
        >
          <div className={cx(styles.customFieldLabel, styles.bottom)}>
            {t('calcdex.nhkoLabels.label')}
          </div>

          <div
            className={cx(
              styles.customFieldRow,
              inBattle && styles.centered,
            )}
          >
            {Array(4).fill(null).map((_, i) => (
              <Field<ShowdexCalcdexSettings['nhkoLabels'][typeof i]>
                key={`SettingsPane:Field:TextField:nhkoLabel:${i}`}
                name={`calcdex.nhkoLabels[${i}]`}
                component={TextField}
                className={cx(
                  styles.customFieldInput,
                  styles.textField,
                  styles.nhkoLabelField,
                )}
                style={[4, 7].includes(value?.nhkoColors?.[i]?.length) ? {
                  color: value.nhkoColors[i],
                } : undefined}
                inputClassName={styles.textFieldInput}
                aria-label={`Custom Label for ${i + 1}HKO`}
                hint={`${i + 1}HKO`}
                tooltip={`${i + 1}HKO`}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={10}
                // monospace={false}
                parse={(v) => v?.replace(/[^A-Z 0-9]/i, '')}
              />
            ))}
          </div>
        </div>

        <div
          className={cx(
            styles.field,
            styles.customField,
            !inBattle && styles.singleColumn,
          )}
        >
          <div className={cx(styles.customFieldLabel, styles.bottom)}>
            {t('calcdex.nhkoColors.label')}
          </div>

          <div
            className={cx(
              styles.customFieldRow,
              inBattle && styles.centered,
            )}
          >
            {Array(inBattle ? 3 : 5).fill(null).map((_, i) => (
              <Field<ShowdexCalcdexSettings['nhkoColors'][typeof i]>
                key={`SettingsPane:Field:TextField:nhkoColor:${i}`}
                name={`calcdex.nhkoColors[${i}]`}
                component={TextField}
                className={cx(
                  styles.customFieldInput,
                  styles.textField,
                  styles.nhkoColorField,
                )}
                style={[4, 7].includes(value?.nhkoColors?.[i]?.length) ? {
                  color: value.nhkoColors[i],
                } : undefined}
                inputClassName={styles.textFieldInput}
                aria-label={`Custom Color for ${i === 4 ? '5+' : i + 1}HKO`}
                hint={`${i === 4 ? '5+' : i + 1}HKO`}
                tooltip={`${i === 4 ? '5+' : i + 1}HKO`}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={7}
                parse={(v) => (
                  (v?.startsWith('#') ? v : `#${v}`)
                    .toUpperCase()
                    .replace(/[^#0-9A-F]/g, '')
                )}
                format={(v) => v?.replace(/#/g, '').slice(0, 6)}
              />
            ))}
          </div>

          {/** @todo clean this up; use CSS for handling inBattle overflow instead of this dumb af copy paste */}
          {
            inBattle &&
            <div className={cx(styles.customFieldRow, styles.centered)}>
              {Array(2).fill(null).map((_, i) => (
                <Field<ShowdexCalcdexSettings['nhkoColors'][typeof i]>
                  key={`SettingsPane:Field:TextField:nhkoColor:${i + 3}`}
                  name={`calcdex.nhkoColors[${i + 3}]`}
                  component={TextField}
                  className={cx(
                    styles.customFieldInput,
                    styles.textField,
                    styles.nhkoColorField,
                  )}
                  style={[4, 7].includes(value?.nhkoColors?.[i + 3]?.length) ? {
                    color: value.nhkoColors[i + 3],
                  } : undefined}
                  inputClassName={styles.textFieldInput}
                  aria-label={`Custom Color for ${i === 0 ? '4' : '5+'}HKO`}
                  hint={`${i === 0 ? '4' : '5+'}HKO`}
                  tooltip={`${i === 0 ? '4' : '5+'}HKO`}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={7}
                  parse={(v) => (
                    (v?.startsWith('#') ? v : `#${v}`)
                      .toUpperCase()
                      .replace(/[^#0-9A-F]/g, '')
                  )}
                  format={(v) => v?.replace(/#/g, '').slice(0, 6)}
                />
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
};
