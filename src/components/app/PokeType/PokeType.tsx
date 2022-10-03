import * as React from 'react';
import cx from 'classnames';
import { PokemonTypeAbbreviations } from '@showdex/consts/pokemon';
import { useColorScheme } from '@showdex/redux/store';
import styles from './PokeType.module.scss';

export interface PokeTypeProps {
  className?: string;
  style?: React.CSSProperties;
  type?: Showdown.TypeName;
  reverseColorScheme?: boolean;
}

export const PokeType = ({
  className,
  style,
  type,
  reverseColorScheme,
}: PokeTypeProps): JSX.Element => {
  const currentColorScheme = useColorScheme();

  const colorScheme = currentColorScheme
    ? reverseColorScheme
      ? currentColorScheme === 'dark'
        ? 'light'
        : 'dark'
      : currentColorScheme
    : null;

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
      {PokemonTypeAbbreviations[type || '???']}
    </span>
  );
};
