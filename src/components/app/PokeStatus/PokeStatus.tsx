import * as React from 'react';
import cx from 'classnames';
import { PokemonStatusAbbreviations } from '@showdex/consts/pokemon';
import { useColorScheme } from '@showdex/redux/store';
import styles from './PokeStatus.module.scss';

export interface PokeStatusProps {
  className?: string;
  style?: React.CSSProperties;
  status?: Showdown.PokemonStatus | '';
  fainted?: boolean;
}

export const PokeStatus = ({
  className,
  style,
  status,
  fainted,
}: PokeStatusProps): JSX.Element => {
  const colorScheme = useColorScheme();

  if (!fainted && !Object.keys(PokemonStatusAbbreviations).includes(status)) {
    return null;
  }

  return (
    <span
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        !fainted && styles[status],
        fainted && styles.fnt,
        className,
      )}
      style={style}
    >
      {fainted ? 'RIP' : PokemonStatusAbbreviations[status]}
    </span>
  );
};
