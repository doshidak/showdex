import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { Switch } from '@showdex/components/form';
import { type ShowdexHonkdexSettings } from '@showdex/interfaces/app';
import styles from './SettingsPane.module.scss';

export interface HonkdexSettingsPaneProps {
  className?: string;
  style?: React.CSSProperties;
}

export const HonkdexSettingsPane = ({
  className,
  style,
}: HonkdexSettingsPaneProps): JSX.Element => {
  const { t } = useTranslation('settings');

  return (
    <div
      className={cx(styles.settingsGroup, className)}
      style={style}
    >
      <div className={styles.settingsGroupTitle}>
        {t('pane.sections.primary.honkdex')}
      </div>

      <div className={styles.settingsGroupFields}>
        <Field<ShowdexHonkdexSettings['visuallyEnabled']>
          name="honkdex.visuallyEnabled"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('honkdex.visuallyEnabled.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="honkdex.visuallyEnabled.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexHonkdexSettings['showAllFormats']>
          name="honkdex.showAllFormats"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('honkdex.showAllFormats.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="honkdex.showAllFormats.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexHonkdexSettings['alwaysEditTypes']>
          name="honkdex.alwaysEditTypes"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('honkdex.alwaysEditTypes.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="honkdex.alwaysEditTypes.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexHonkdexSettings['alwaysEditMoves']>
          name="honkdex.alwaysEditMoves"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('honkdex.alwaysEditMoves.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="honkdex.alwaysEditMoves.tooltip"
              parent="div"
              className={styles.tooltipContent}
              shouldUnescape
            />
          )}
        />

        <Field<ShowdexHonkdexSettings['alwaysShowGenetics']>
          name="honkdex.alwaysShowGenetics"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label={t('honkdex.alwaysShowGenetics.label') as React.ReactNode}
          tooltip={(
            <Trans
              t={t}
              i18nKey="honkdex.alwaysShowGenetics.tooltip"
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
