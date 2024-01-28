import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { format } from 'date-fns';
import { Segmented, Switch } from '@showdex/components/form';
import { ShowdexPresetsBundles } from '@showdex/consts/app';
import { GenLabels } from '@showdex/consts/dex';
import { type ShowdexCalcdexSettings, type ShowdexSettings } from '@showdex/interfaces/app';
import { getGenfulFormat, parseBattleFormat } from '@showdex/utils/dex';
import styles from './SettingsPane.module.scss';

export interface PresetsSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  value?: ShowdexSettings;
  inBattle?: boolean;
}

/**
 * Presets settings section, as part of the great Showdex settings reorganization of v1.2.3.
 *
 * @since 1.2.3
 */
export const PresetsSettingsPane = ({
  className,
  style,
  value,
  inBattle,
}: PresetsSettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        {t('pane.sections.primary.presets', 'Sets')}
      </div>

      <div className={styles.settingsGroupFields}>
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
            !value?.calcdex?.downloadSmogonPresets
              && !value?.calcdex?.downloadRandomsPresets
              && !value?.calcdex?.downloadUsageStats
          )}
        />

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
            ...value?.calcdex,
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
      </div>
    </div>
  );
};
