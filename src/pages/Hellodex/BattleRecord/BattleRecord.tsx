import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { useBattleRecord, useColorScheme, useGlassyTerrain } from '@showdex/redux/store';
import styles from './BattleRecord.module.scss';

export interface BattleRecordProps {
  className?: string;
  style?: React.CSSProperties;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const BattleRecord = ({
  className,
  style,
  onContextMenu,
}: BattleRecordProps): JSX.Element => {
  const { t } = useTranslation('hellodex');
  const colorScheme = useColorScheme();
  const glassyTerrain = useGlassyTerrain();
  const battleRecord = useBattleRecord();

  const {
    wins: currentWins = 0,
    losses: currentLosses = 0,
  } = battleRecord || {};

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        glassyTerrain && styles.glassy,
        className,
      )}
      style={style}
      onContextMenu={onContextMenu}
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
          {t('battleRecord.wins')}
        </div>

        <div className={styles.recordSeparator} />

        <div className={cx(styles.recordLabel, styles.loss)}>
          {t('battleRecord.losses')}
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
