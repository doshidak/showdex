import * as React from 'react';
import { Field } from 'react-final-form';
import cx from 'classnames';
import { Segmented, Switch } from '@showdex/components/form';
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
}: ShowdexSettingsPaneProps): JSX.Element => (
  <div
    className={cx(styles.settingsGroup, className)}
    style={style}
  >
    <div className={styles.settingsGroupTitle}>
      Showdex
    </div>

    <div className={styles.settingsGroupFields}>
      <Field<ShowdexSettings['forcedColorScheme']>
        name="forcedColorScheme"
        component={Segmented}
        className={styles.field}
        label="Color Theme"
        labelPosition={inBattle ? 'top' : 'left'}
        options={[{
          label: 'Showdown',
          tooltip: (
            <div className={styles.tooltipContent}>
              Matches Showdown's graphics theme.
            </div>
          ),
          value: 'showdown',
        }, {
          label: 'Light',
          tooltip: (
            <div className={styles.tooltipContent}>
              Forces a light theme for everything Showdex,
              regardless of Showdown's graphics theme.
            </div>
          ),
          value: 'light',
        }, {
          label: 'Dark',
          tooltip: (
            <div className={styles.tooltipContent}>
              Forces a dark theme for everything Showdex,
              regardless of Showdown's graphics theme.
            </div>
          ),
          value: 'dark',
        }]}
      />

      {/* congrats you found a secret setting! coming soon tho */}
      {
        __DEV__ &&
        <Field<ShowdexSettings['developerMode']>
          name="developerMode"
          component={Switch}
          className={cx(styles.field, styles.switchField)}
          label="Developer Mode"
          tooltip={(
            <div className={styles.tooltipContent}>
              <em>This is a planned feature.</em>
              <br />
              <em>If you're a geek, stay tuned!</em>
            </div>
          )}
          readOnly
          format={() => false}
        />
      }

      {
        special &&
        <>
          <div className={styles.settingsGroupTitle}>
            Special
          </div>

          <Field<ShowdexSettings['glassyTerrain']>
            name="glassyTerrain"
            component={Switch}
            className={cx(styles.field, styles.switchField)}
            label="I'm Feeling Glassy"
            tooltip={(
              <div className={styles.tooltipContent}>
                Tastefully applies a slight background blur to all Showdex panels,
                including the Calcdex <strong>Battle Overlay</strong>, if enabled.
                <br />
                <br />
                Note that this is a CPU-intensive graphics setting &amp; may cause
                unpleasant stuttering on lower-spec machines.
                <br />
                <br />
                Enable at your own risk!
              </div>
            )}
          />
        </>
      }
    </div>
  </div>
);
