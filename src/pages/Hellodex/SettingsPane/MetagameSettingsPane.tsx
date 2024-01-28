import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { Segmented, Switch } from '@showdex/components/form';
import { type ShowdexCalcdexSettings, type ShowdexSettings } from '@showdex/interfaces/app';
import styles from './SettingsPane.module.scss';

export interface MetagameSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  value?: ShowdexSettings;
  inBattle?: boolean;
}

/**
 * Metagame settings section, as part of the great Showdex settings reorganization of v1.2.3.
 *
 * @since 1.2.3
 */
export const MetagameSettingsPane = ({
  className,
  style,
  value,
  inBattle,
}: MetagameSettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        {t('pane.sections.primary.metagame', 'OM & LC Support')}
      </div>

      <div className={styles.settingsGroupFields}>
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
          format={(v) => (!value?.calcdex?.showMatchupTooltip ? 'never' : v)}
          disabled={!value?.calcdex?.showMatchupTooltip}
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
            !value?.calcdex?.showMatchupTooltip
              || value?.calcdex?.showMatchupDamageAmounts === 'never'
              ? false
              : v
          )}
          disabled={(
            !value?.calcdex?.showMatchupTooltip
              || value?.calcdex?.showMatchupDamageAmounts === 'never'
          )}
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
      </div>
    </div>
  );
};
