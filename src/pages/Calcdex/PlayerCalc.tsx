import * as React from 'react';
import cx from 'classnames';
import { Picon } from '@showdex/components/app';
import { upsizeArray } from '@showdex/utils/core';
// import { serializePokemon } from '@showdex/utils/debug';
import { PokeCalc } from './PokeCalc';
import styles from './PlayerCalc.module.scss';

interface PlayerCalcProps {
  className?: string;
  style?: React.CSSProperties;
  player?: Showdown.Side;
  tooltips?: Showdown.BattleTooltips;
  defaultName?: string;
}

export const PlayerCalc = ({
  className,
  style,
  player,
  tooltips,
  defaultName = 'p1',
}: PlayerCalcProps): JSX.Element => {
  // probs not something worth rendering anyway
  if (!Array.isArray(player?.pokemon)) {
    return null;
  }

  const {
    name,
    rating,
    active,
    pokemon,
  } = player;

  return (
    <div
      className={cx(styles.container, className)}
      style={style}
    >
      <div className={styles.playerBar}>
        <div className={styles.username}>
          {name || defaultName}

          {
            !!rating &&
            <>
              <br />
              <span style={{ fontSize: 8 }}>
                <span style={{ opacity: 0.5 }}>
                  ELO{' '}
                </span>
                {rating}
              </span>
            </>
          }
        </div>

        <div className={styles.teamList}>
          {upsizeArray(pokemon, 6, null).map((mon, i) => (
            <Picon
              key={`Picon-${mon?.ident || `${defaultName}:${i}`}`}
              className={cx(
                styles.picon,
                !!active?.[0]?.ident && mon?.ident === active[0].ident && styles.active,
                mon?.fainted && styles.fainted,
              )}
              pokemon={mon || 'pokeball'}
            />
          ))}
        </div>
      </div>

      <PokeCalc
        style={{ paddingTop: 15 }}
        pokemon={active?.[0]}
        tooltips={tooltips}
      />

      {/* <pre>active: {serializePokemon(active?.[0], true)}</pre> */}
    </div>
  );
};
