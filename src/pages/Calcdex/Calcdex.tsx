import * as React from 'react';
import cx from 'classnames';
import { printBuildInfo } from '@showdex/utils/debug';
import { PlayerCalc } from './PlayerCalc';
import { StageCalc } from './StageCalc';
import styles from './Calcdex.module.scss';

interface CalcdexProps {
  battle?: Showdown.Battle;
  tooltips?: Showdown.BattleTooltips;
}

export const Calcdex = ({
  battle,
  tooltips,
}: CalcdexProps): JSX.Element => {
  if (!battle) {
    return null;
  }

  return (
    <div className={cx('showdex-module', styles.container)}>
      <div className={styles.content}>
        <div className={styles.buildInfo}>
          {printBuildInfo()}
        </div>

        <PlayerCalc
          player={battle?.p1}
          tooltips={tooltips}
          defaultName="Player 1"
        />

        <StageCalc
          style={{ marginTop: 30 }}
          battle={battle}
        />

        <PlayerCalc
          style={{ marginTop: 30 }}
          player={battle?.p2}
          tooltips={tooltips}
          defaultName="Player 2"
        />
      </div>
    </div>
  );
};
