import * as React from 'react';
import cx from 'classnames';
import {
  BattleInfo,
  FieldCalc,
  PlayerCalc,
  useCalcdexContext,
  useCalcdexSize,
} from '@showdex/components/calc';
import { BuildInfo } from '@showdex/components/debug';
import { Scrollable } from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import styles from './Honkdex.module.scss';

export const Honkdex = (): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useCalcdexSize(containerRef);

  const colorScheme = useColorScheme();
  const { state } = useCalcdexContext();

  const {
    playerKey,
    opponentKey,
    switchPlayers,
  } = state;

  const topKey = switchPlayers ? opponentKey : playerKey;
  const bottomKey = topKey === playerKey ? opponentKey : playerKey;

  return (
    <div
      ref={containerRef}
      className={cx(
        'showdex-module',
        styles.container,
        !!colorScheme && styles[colorScheme],
      )}
    >
      <Scrollable className={styles.content}>
        <BuildInfo
          position="top-right"
        />

        <BattleInfo
          className={styles.battleInfo}
        />

        <PlayerCalc
          className={styles.playerCalc}
          position="top"
          playerKey={topKey}
          defaultName="Side A"
        />

        <FieldCalc
          className={styles.fieldCalc}
          playerKey={topKey}
          opponentKey={bottomKey}
        />

        <PlayerCalc
          className={styles.opponentCalc}
          position="bottom"
          playerKey={bottomKey}
          defaultName="Side B"
        />
      </Scrollable>
    </div>
  );
};
