import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { Switch } from '@showdex/components/form';
import { type ShowdexShowdownSettings } from '@showdex/interfaces/app';
import styles from './SettingsPane.module.scss';

export interface ShowdownSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ShowdownSettingsPane = ({
  className,
  style,
}: ShowdownSettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        Showdown
      </div>

      <div className={styles.settingsGroupFields}>
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
      </div>
    </div>
  );
};
