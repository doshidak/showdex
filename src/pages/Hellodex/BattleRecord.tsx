import * as React from 'react';
import cx from 'classnames';
import { useBattleRecord, useColorScheme } from '@showdex/redux/store';
import styles from './BattleRecord.module.scss';

export interface BattleRecordProps {
  className?: string;
  style?: React.CSSProperties;
}

export const BattleRecord = ({
  className,
  style,
}: BattleRecordProps): JSX.Element => {
  const battleRecord = useBattleRecord();
  const colorScheme = useColorScheme();

  const {
    wins: currentWins = 0,
    losses: currentLosses = 0,
  } = battleRecord || {};

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div className={styles.records}>
        <div
          className={cx(
            styles.recordValue,
            currentWins === 0 && styles.zero,
          )}
        >
          {currentWins}
        </div>
        <div className={cx(styles.recordLabel, styles.win)}>
          W
        </div>

        <div className={styles.recordSeparator} />

        <div className={cx(styles.recordLabel, styles.loss)}>
          L
        </div>
        <div
          className={cx(
            styles.recordValue,
            currentLosses === 0 && styles.zero,
          )}
        >
          {currentLosses}
        </div>
      </div>
    </div>
  );
};
