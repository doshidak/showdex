import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { Segmented, Switch } from '@showdex/components/form';
import { type ShowdexCalcdexSettings, type ShowdexShowdownSettings } from '@showdex/interfaces/app';
import styles from './SettingsPane.module.scss';

export interface AutoFeaturesSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  inBattle?: boolean;
}

/**
 * Auto features settings section, as part of the great Showdex settings reorganization of v1.2.3.
 *
 * @since 1.2.3
 */
export const AutoFeaturesSettingsPane = ({
  className,
  style,
  inBattle,
}: AutoFeaturesSettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        {t('pane.sections.primary.autoFeatures', 'Auto Features')}
      </div>

      <div className={styles.settingsGroupFields}>
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
          format={(val) => Object.values(val || {}).some((v) => !!v)}
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

        <Field<ShowdexShowdownSettings['autoAcceptSheets']>
          name="showdown.autoAcceptSheets"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('showdown.autoAcceptSheets.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="showdown.autoAcceptSheets.tooltip"
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
      </div>
    </div>
  );
};
