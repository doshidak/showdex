import * as React from 'react';
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
}: ShowdownSettingsPaneProps): JSX.Element => (
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
        label="Auto-Accept Team Sheets"
        tooltip={(
          <div className={styles.tooltipContent}>
            Enabling this will automatically accept Open Team Sheet requests,
            which are typical of VGC formats.
          </div>
        )}
      />
    </div>
  </div>
);
