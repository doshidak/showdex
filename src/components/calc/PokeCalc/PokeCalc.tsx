import * as React from 'react';
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
}: PokeCalcProps): JSX.Element => (
  <div
    className={className}
    style={style}
  >
    {/* name, types, level, HP, status, set, ability, nature, item */}
    <PokeInfo />

    {/* moves (duh) */}
    <PokeMoves
      className={styles.moves}
    />

    {/* IVs, EVs, calculated stats, boosts */}
    <PokeStats
      className={styles.stats}
    />
  </div>
);
