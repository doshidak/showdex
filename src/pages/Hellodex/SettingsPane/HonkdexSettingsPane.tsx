import * as React from 'react';
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
}: HonkdexSettingsPaneProps): JSX.Element => (
  <div
    className={cx(styles.settingsGroup, className)}
    style={style}
  >
    <div className={styles.settingsGroupTitle}>
      Honkdex
    </div>

    <div className={styles.settingsGroupFields}>
      <Field<ShowdexHonkdexSettings['visuallyEnabled']>
        name="honkdex.visuallyEnabled"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label="Enable the Honk"
        tooltip={(
          <div className={styles.tooltipContent}>
            Enables the <em>Honkdex</em>, an out-of-battle Calcdex.
            You can view &amp; edit previously saved calcs (called <em>honks</em>)
            within the Hellodex.
            <br />
            <br />
            Disabling this will only hide the Honkdex feature &amp; any saved honks
            will remain in your browser's storage for Showdown.
          </div>
        )}
      />

      <Field<ShowdexHonkdexSettings['showAllFormats']>
        name="honkdex.showAllFormats"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label="Include Randoms & Customs"
        tooltip={(
          <div className={styles.tooltipContent}>
            Allows Randoms &amp; Customs formats, if applicable for the current gen,
            to appear in the format dropdown list.
          </div>
        )}
      />

      <Field<ShowdexHonkdexSettings['alwaysEditTypes']>
        name="honkdex.alwaysEditTypes"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label="Always Edit Types"
        tooltip={(
          <div className={styles.tooltipContent}>
            Allows Pok&eacute;mon types to be editable in the Honkdex,
            regardless of the selected format.
            <br />
            <br />
            Disabling this will revert to the configured Calcdex behavior,
            as specified by the <em>Edit Types</em> setting.
          </div>
        )}
      />

      <Field<ShowdexHonkdexSettings['alwaysEditMoves']>
        name="honkdex.alwaysEditMoves"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label="Always Edit Moves"
        tooltip={(
          <div className={styles.tooltipContent}>
            Allows acces to the move editor in the Pok&eacute;mon's moves table,
            regardless of the selected format.
            <br />
            <br />
            Disabling this will revert to the configured Calcdex behavior,
            as specified by the <em>Edit Moves</em> setting.
          </div>
        )}
      />

      <Field<ShowdexHonkdexSettings['alwaysShowGenetics']>
        name="honkdex.alwaysShowGenetics"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label="Always Show Stats"
        tooltip={(
          <div className={styles.tooltipContent}>
            Always shows the base stats, EVs &amp; IVs in the Pok&eacute;mon's
            stats table. EVs may be still hidden in legacy gens, unless the{' '}
            <em>Show EVs in Legacy Gens</em> Calcdex setting is enabled.
            <br />
            <br />
            Disabling this will revert to the configured Calcdex behaviors,
            as specified by the <em>Show My Pok&eacute;mon's</em> &amp;{' '}
            <em>Show Opponent's</em> settings.
          </div>
        )}
      />
    </div>
  </div>
);
