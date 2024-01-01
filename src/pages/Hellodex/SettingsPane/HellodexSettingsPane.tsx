import * as React from 'react';
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
}: HellodexSettingsPaneProps): JSX.Element => (
  <div
    className={cx(styles.settingsGroup, className)}
    style={style}
  >
    <div className={styles.settingsGroupTitle}>
      Hellodex
    </div>

    <div className={styles.settingsGroupFields}>
      <Field<ShowdexHellodexSettings['openOnStart']>
        name="hellodex.openOnStart"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label="Open When Showdown Starts"
        tooltip={(
          <div className={styles.tooltipContent}>
            <em>
              This is actually a planned feature!
              <br />
              If you're like wtf how would I access these settings again after
              disabling this, the answer is...
              <br />
              Stay tuned!
            </em>
          </div>
        )}
        readOnly
      />

      <Field<ShowdexHellodexSettings['focusRoomsRoom']>
        name="hellodex.focusRoomsRoom"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label="Show Chatrooms Panel"
        tooltip={(
          <div className={styles.tooltipContent}>
            Miss the default chatrooms panel when Showdown first starts?
            Disabling this won't auto-focus the Hellodex tab.
            <br />
            <br />
            This does not affect <em>Single Panel</em> users.
          </div>
        )}
      />

      <Field<ShowdexHellodexSettings['showBattleRecord']>
        name="hellodex.showBattleRecord"
        component={Switch}
        className={cx(styles.field, styles.switchField)}
        label="Show Win/Loss Counter"
        tooltip={(
          <div className={styles.tooltipContent}>
            Displays a Win/Loss counter in the Hellodex for <em>funsies</em>.
            <br />
            <br />
            Only records games that you've played (i.e., ignores spectating games).
            Recorded amounts don't persist between sessions; i.e., will reset back to 0W-0L
            as soon as you refresh the page.
          </div>
        )}
      />

      {
        special &&
        <>
          <div className={styles.settingsGroupTitle}>
            Special
          </div>

          <Field<ShowdexHellodexSettings['showDonateButton']>
            name="hellodex.showDonateButton"
            component={Switch}
            className={cx(styles.field, styles.switchField)}
            label="Show Donate Button"
            tooltip={(
              <div className={styles.tooltipContent}>
                Shows the donate button in the Hellodex.
                <br />
                <br />
                If you're seeing this, you're either very special to us or you're a 1337 hax0r.
                Either way, feel free to turn this off.
              </div>
            )}
          />
        </>
      }
    </div>
  </div>
);
