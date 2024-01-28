import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { format } from 'date-fns';
import { Segmented, Switch, TextField } from '@showdex/components/form';
import { ShowdexLocaleBundles } from '@showdex/consts/app';
import { type ShowdexCalcdexSettings, type ShowdexHellodexSettings, type ShowdexSettings } from '@showdex/interfaces/app';
import styles from './SettingsPane.module.scss';

export interface GeneralSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  value?: ShowdexSettings;
  inBattle?: boolean;
  special?: boolean;
}

/**
 * General settings section, as part of the great Showdex settings reorganization of v1.2.3.
 *
 * @since 1.2.3
 */
export const GeneralSettingsPane = ({
  className,
  style,
  value,
  inBattle,
  special,
}: GeneralSettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        {t('pane.sections.primary.general', 'General')}
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

        <Field<ShowdexHellodexSettings['focusRoomsRoom']>
          name="hellodex.focusRoomsRoom"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('hellodex.focusRoomsRoom.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="hellodex.focusRoomsRoom.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexHellodexSettings['showBattleRecord']>
          name="hellodex.showBattleRecord"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('hellodex.showBattleRecord.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="hellodex.showBattleRecord.tooltip"
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
                style={[4, 7].includes(value?.calcdex?.nhkoColors?.[i]?.length) ? {
                  color: value.calcdex.nhkoColors[i],
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
                style={[4, 7].includes(value?.calcdex?.nhkoColors?.[i]?.length) ? {
                  color: value.calcdex.nhkoColors[i],
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
                  style={[4, 7].includes(value?.calcdex?.nhkoColors?.[i + 3]?.length) ? {
                    color: value.calcdex.nhkoColors[i + 3],
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

        {/* <Field<ShowdexHellodexSettings['openOnStart']>
          name="hellodex.openOnStart"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('hellodex.openOnStart.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="hellodex.openOnStart.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
          readOnly
        /> */}

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

            <Field<ShowdexHellodexSettings['showDonateButton']>
              name="hellodex.showDonateButton"
              component={Switch}
              className={cx(styles.field, styles.switchField)}
              label={t('hellodex.showDonateButton.label') as React.ReactNode}
              tooltip={(
                <Trans
                  t={t}
                  i18nKey="hellodex.showDonateButton.tooltip"
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
