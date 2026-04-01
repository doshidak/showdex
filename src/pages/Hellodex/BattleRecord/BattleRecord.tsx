/**
 * @file `BattleRecord.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.0.6
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import {
  useBattleRecord,
  useColorScheme,
  useColorTheme,
  useGlassyTerrain,
} from '@showdex/redux/store';
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
}: BattleRecordProps): React.JSX.Element => {
  const { t } = useTranslation('hellodex');
  const colorScheme = useColorScheme();
  const colorTheme = useColorTheme();
  const glassyTerrain = useGlassyTerrain();
  const battleRecord = useBattleRecord();

  const { wins, losses } = battleRecord || {};
  const currentWins = wins?.length || 0;
  const currentLosses = losses?.length || 0;

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        !!colorTheme && styles[colorTheme],
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
            !currentWins && styles.zero,
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
            !currentLosses && styles.zero,
          )}
        >
          {currentLosses}
        </div>
      </div>
    </div>
  );
};
