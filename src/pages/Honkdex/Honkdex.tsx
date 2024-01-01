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
import { type CalcdexBattleState } from '@showdex/interfaces/calc';
import { useColorScheme, useGlassyTerrain } from '@showdex/redux/store';
import styles from './Honkdex.module.scss';

export interface HonkdexProps {
  openHonkdexInstance?: (instanceId?: string, initState?: Partial<CalcdexBattleState>) => void;
}

export const Honkdex = ({
  openHonkdexInstance,
}: HonkdexProps): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useCalcdexSize(containerRef);

  const colorScheme = useColorScheme();
  const glassyTerrain = useGlassyTerrain();
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
        glassyTerrain && styles.glassy,
      )}
    >
      <Scrollable className={styles.content}>
        <BuildInfo
          position="top-right"
        />

        <BattleInfo
          className={styles.battleInfo}
          openHonkdexInstance={openHonkdexInstance}
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
