import * as React from 'react';
import cx from 'classnames';
import { PokemonTypeShortAbbreviations, PokemonTypeAbbreviations } from '@showdex/consts/pokemon';
import { useColorScheme } from '@showdex/redux/store';
import styles from './PokeType.module.scss';

export interface PokeTypeProps {
  className?: string;
  style?: React.CSSProperties;
  type?: Showdown.TypeName;
  defaultLabel?: string;
  reverseColorScheme?: boolean;
  shorterAbbreviations?: boolean;
  highlight?: boolean;
}

export const PokeType = ({
  className,
  style,
  type,
  defaultLabel,
  reverseColorScheme,
  shorterAbbreviations,
  highlight = true,
}: PokeTypeProps): JSX.Element => {
  const currentColorScheme = useColorScheme();
  const colorScheme = (!reverseColorScheme && currentColorScheme)
    || (reverseColorScheme && currentColorScheme === 'light' && 'dark')
    || (reverseColorScheme && currentColorScheme === 'dark' && 'light')
    || null;

  const abbreviations = shorterAbbreviations
    ? PokemonTypeShortAbbreviations
    : PokemonTypeAbbreviations;

  return (
    <span
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        // (!type || type === '???') && styles['type-unknown'],
        !!type && type !== '???' && styles[`type-${type.toLowerCase()}`],
        shorterAbbreviations && styles.shorter,
        highlight && styles.highlight,
        className,
      )}
      style={style}
    >
      {((!type || type === '???') && defaultLabel) || abbreviations[type || '???']}
    </span>
  );
};
