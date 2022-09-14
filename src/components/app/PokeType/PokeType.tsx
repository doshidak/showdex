import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/redux/store';
import styles from './PokeType.module.scss';

export interface PokeTypeProps {
  className?: string;
  style?: React.CSSProperties;
  type?: Showdown.TypeName;
}

const abbrevs: Record<Showdown.TypeName, string> = {
  Normal: 'NORMAL',
  Fighting: 'FIGHT',
  Flying: 'FLYING',
  Poison: 'POISON',
  Ground: 'GROUND',
  Rock: 'ROCK',
  Bug: 'BUG',
  Ghost: 'GHOST',
  Steel: 'STEEL',
  Fire: 'FIRE',
  Water: 'WATER',
  Grass: 'GRASS',
  Electric: 'ELECTR',
  Psychic: 'PSYCH',
  Ice: 'ICE',
  Dragon: 'DRAGON',
  Dark: 'DARK',
  Fairy: 'FAIRY',
  '???': '???',
};

export const PokeType = ({
  className,
  style,
  type,
}: PokeTypeProps): JSX.Element => {
  const colorScheme = useColorScheme();

  return (
    <span
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        !!type && type !== '???' && styles[`type-${type.toLowerCase()}`],
        className,
      )}
      style={style}
    >
      {abbrevs[type || '???']}
    </span>
  );
};
