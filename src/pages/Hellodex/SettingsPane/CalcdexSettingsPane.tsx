import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { Segmented, Switch } from '@showdex/components/form';
import { type ShowdexCalcdexSettings, type ShowdexSettings } from '@showdex/interfaces/app';
import styles from './SettingsPane.module.scss';

export interface CalcdexSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  value?: ShowdexSettings;
  inBattle?: boolean;
}

/**
 * Calcdex settings section, as part of the great Showdex settings reorganization of v1.2.3.
 *
 * @since 1.2.3
 */
export const CalcdexSettingsPane = ({
  className,
  style,
  value,
  inBattle,
}: CalcdexSettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        {t('pane.sections.primary.calcdex', 'Calcdex')}
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
          disabled={value?.calcdex?.openAs === 'overlay'}
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
          format={(v) => (value?.calcdex?.openAs === 'overlay' ? 'never' : v)}
          disabled={value?.calcdex?.openAs === 'overlay'}
        />

        <div className={styles.settingsGroupTitle}>
          {t('pane.sections.secondary.behavior', 'Behavior')}
        </div>

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
          format={(v) => (value?.calcdex?.openAs === 'overlay' ? false : v)}
          disabled={value?.calcdex?.openAs === 'overlay'}
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
          format={(v) => (!value?.calcdex?.downloadUsageStats ? false : v)}
          disabled={!value?.calcdex?.downloadUsageStats}
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
          format={(v) => (!value?.calcdex?.showMatchupTooltip ? false : v)}
          disabled={!value?.calcdex?.showMatchupTooltip}
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

        <div className={styles.settingsGroupTitle}>
          {t('pane.sections.secondary.interface', 'Interface')}
        </div>

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
            disabled: option === 'base' && value?.calcdex?.showBaseStats === 'never',
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
            disabled: option === 'base' && value?.calcdex?.showBaseStats === 'never',
          }))}
          multi
          unique
          parse={(v) => ({
            ...value?.calcdex?.lockGeneticsVisibility,
            p1: v,
            p2: v,
            p3: v,
            p4: v,
          })}
          format={(v) => [...(v?.p1 || [])]}
        />

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
          format={(v) => (!value?.calcdex?.showMatchupTooltip ? false : v)}
          disabled={!value?.calcdex?.showMatchupTooltip}
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
      </div>
    </div>
  );
};
