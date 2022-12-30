import * as React from 'react';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import { PokeInfo } from './PokeInfo';
import { PokeMoves } from './PokeMoves';
import { PokeStats } from './PokeStats';
import styles from './PokeCalc.module.scss';

interface PokeCalcProps {
  className?: string;
  style?: React.CSSProperties;
  containerSize?: ElementSizeLabel;
}

export const PokeCalc = ({
  className,
  style,
  containerSize,
}: PokeCalcProps): JSX.Element => (
  <div
    className={className}
    style={style}
  >
    {/* name, types, level, HP, status, set, ability, nature, item */}
    <PokeInfo
      containerSize={containerSize}
    />

    {/* moves (duh) */}
    <PokeMoves
      className={styles.moves}
      containerSize={containerSize}
    />

    {/* IVs, EVs, calculated stats, boosts */}
    <PokeStats
      className={styles.stats}
      containerSize={containerSize}
    />
  </div>
);
