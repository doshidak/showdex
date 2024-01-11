import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { Switch } from '@showdex/components/form';
import { type ShowdexHellodexSettings } from '@showdex/interfaces/app';
import styles from './SettingsPane.module.scss';

export interface HellodexSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
  special?: boolean;
}

export const HellodexSettingsPane = ({
  className,
  style,
  special,
}: HellodexSettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        {t('pane.sections.primary.hellodex')}
      </div>

      <div className={styles.settingsGroupFields}>
        <Field<ShowdexHellodexSettings['openOnStart']>
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

        {
          special &&
          <>
            <div className={styles.settingsGroupTitle}>
              {t('pane.sections.secondary.special')}
            </div>

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
