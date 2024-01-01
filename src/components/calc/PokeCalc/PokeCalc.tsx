import * as React from 'react';
import cx from 'classnames';
import { useCalcdexContext } from '../CalcdexContext';
import { PokeInfo } from '../PokeInfo';
import { PokeMoves } from '../PokeMoves';
import { PokeStats } from '../PokeStats';
import styles from './PokeCalc.module.scss';

export interface PokeCalcProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PokeCalc = ({
  className,
  style,
}: PokeCalcProps): JSX.Element => {
  const { state } = useCalcdexContext();
  const { containerSize } = state;

  return (
    <div
      className={cx(
        styles.container,
        ['lg', 'xl'].includes(containerSize) && styles.thicc,
        // containerSize === 'xl' && styles.veryThicc,
        className,
      )}
      style={style}
    >
      {/* name, types, level, HP, status, set, ability, nature, item */}
      <PokeInfo
        className={styles.info}
      />

      <div className={styles.tablesContainer}>
        {/* moves (duh) */}
        <PokeMoves
          className={styles.moves}
        />

        {/* IVs, EVs, calculated stats, boosts */}
        <PokeStats
          className={styles.stats}
        />
      </div>
    </div>
  );
};
