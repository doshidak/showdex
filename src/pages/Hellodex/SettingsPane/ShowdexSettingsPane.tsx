import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { format } from 'date-fns';
import { Segmented, Switch } from '@showdex/components/form';
import { ShowdexLocaleBundles } from '@showdex/consts/app';
import { type ShowdexSettings } from '@showdex/interfaces/app';
import styles from './SettingsPane.module.scss';

export interface ShowdexSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  inBattle?: boolean;
  special?: boolean;
}

export const ShowdexSettingsPane = ({
  className,
  style,
  inBattle,
  special,
}: ShowdexSettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        {t('pane.sections.primary.showdex')}
      </div>

      <div className={styles.settingsGroupFields}>
        <Field<ShowdexSettings['locale']>
          name="locale"
          component={Segmented}
          className={cx(
            styles.field,
            // !inBattle && styles.singleColumn,
          )}
          label={t('showdex.locale.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={ShowdexLocaleBundles?.filter((b) => !!b?.id && b.tag === 'locale').map((bundle) => ({
            label: bundle.label || bundle.name,
            tooltip: (
              <div className={styles.tooltipContent}>
                {bundle.name === '(i18n)' ? (
                  <Trans
                    t={t}
                    i18nKey={`showdex.locale.options.${bundle.locale}.name`}
                    parent="strong"
                    shouldUnescape
                  />
                ) : <strong>{bundle.name}</strong>}

                {
                  !!bundle.author &&
                  <>
                    <br />
                    <Trans
                      t={t}
                      i18nKey="showdex.locale.tooltip.author"
                      shouldUnescape
                      values={{ name: bundle.author }}
                    />
                  </>
                }

                {
                  !!bundle.description &&
                  <>
                    <br />
                    <br />
                    {bundle.description === '(i18n)' ? (
                      <Trans
                        t={t}
                        i18nKey={`showdex.locale.options.${bundle.locale}.description`}
                        shouldUnescape
                        components={{
                          code: <code />,
                          ndash: <span>&ndash;</span>,
                        }}
                      />
                    ) : bundle.description}
                  </>
                }

                {
                  !!bundle.updated &&
                  <>
                    <br />
                    <br />
                    <Trans
                      t={t}
                      i18nKey="showdex.locale.tooltip.updated"
                      shouldUnescape
                      values={{ date: format(new Date(bundle.updated || bundle.created), 'PP') }}
                    />
                  </>
                }
              </div>
            ),
            value: bundle.locale,
            disabled: bundle.disabled,
          }))}
        />

        <Field<ShowdexSettings['forcedColorScheme']>
          name="forcedColorScheme"
          component={Segmented}
          className={styles.field}
          label={t('showdex.forcedColorScheme.label') as React.ReactNode}
          labelPosition={inBattle ? 'top' : 'left'}
          options={[
            'showdown',
            'light',
            'dark',
          ].map((option) => ({
            label: t(`showdex.forcedColorScheme.options.${option}.label`),
            tooltip: (
              <Trans
                t={t}
                i18nKey={`showdex.forcedColorScheme.options.${option}.tooltip`}
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            ),
            value: option,
          }))}
        />

        {/* congrats you found a secret setting! coming soon tho */}
        {
          __DEV__ &&
          <Field<ShowdexSettings['developerMode']>
            name="developerMode"
            component={Switch}
            className={cx(styles.field, styles.switchField)}
            label={t('showdex.developerMode.label') as React.ReactNode}
            tooltip={(
              <Trans
                t={t}
                i18nKey="showdex.developerMode.tooltip"
                parent="div"
                className={styles.tooltipContent}
                shouldUnescape
              />
            )}
            readOnly
            format={() => false}
          />
        }

        {
          special &&
          <>
            <div className={styles.settingsGroupTitle}>
              {t('pane.sections.secondary.special')}
            </div>

            <Field<ShowdexSettings['glassyTerrain']>
              name="glassyTerrain"
              component={Switch}
              className={cx(styles.field, styles.switchField)}
              label={t('showdex.glassyTerrain.label') as React.ReactNode}
              tooltip={(
                <Trans
                  t={t}
                  i18nKey="showdex.glassyTerrain.tooltip"
                  parent="div"
                  className={styles.tooltipContent}
                  shouldUnescape
                />
              )}
            />
          </>
        }
      </div>
    </div>
  );
};
